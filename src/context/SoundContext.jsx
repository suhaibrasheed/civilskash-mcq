import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SoundContext = createContext(null);

export function SoundProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('mcq_sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [hapticEnabled, setHapticEnabled] = useState(() => {
    const saved = localStorage.getItem('mcq_haptic_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('mcq_sound_enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('mcq_haptic_enabled', JSON.stringify(hapticEnabled));
  }, [hapticEnabled]);

  // Web Audio API Context
  const audioCtxRef = React.useRef(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const playOscillator = useCallback((type, frequency, duration, volume = 0.1) => {
    if (!soundEnabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, [soundEnabled]);

  const vibrate = useCallback((pattern) => {
    if (hapticEnabled && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Vibrate not supported or blocked
      }
    }
  }, [hapticEnabled]);

  const playCorrect = useCallback(() => {
    playOscillator('sine', 800, 0.1, 0.2);
    vibrate(50);
  }, [playOscillator, vibrate]);

  const playWrong = useCallback(() => {
    playOscillator('triangle', 150, 0.15, 0.2);
    vibrate([50, 50, 50]);
  }, [playOscillator, vibrate]);

  const playTick = useCallback(() => {
    playOscillator('sine', 600, 0.05, 0.1);
    vibrate(15);
  }, [playOscillator, vibrate]);

  const playVictory = useCallback(() => {
    if (!soundEnabled) { vibrate([100, 50, 100, 50, 200]); return; }
    initAudio();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const playChord = (freqs, startTime, duration) => {
      freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    };

    const now = ctx.currentTime;
    playChord([523.25, 659.25, 783.99], now, 0.4); // C major chord
    playChord([659.25, 783.99, 1046.50], now + 0.3, 0.6); // E minor higher
    vibrate([100, 50, 100, 50, 200]);
  }, [soundEnabled, vibrate]);

  const playShatter = useCallback(() => {
    if (!soundEnabled) { vibrate([150, 100, 200, 100, 300]); return; }
    initAudio();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    vibrate([150, 100, 200, 100, 300]);
  }, [soundEnabled, vibrate]);

  return (
    <SoundContext.Provider value={{
      soundEnabled, setSoundEnabled,
      hapticEnabled, setHapticEnabled,
      playCorrect, playWrong, playVictory, playShatter, playTick
    }}>
      {children}
    </SoundContext.Provider>
  );
}

export const useSound = () => useContext(SoundContext);
