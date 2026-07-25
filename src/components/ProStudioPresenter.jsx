import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Play, Pause, RotateCcw,
  Pencil, Palette, Circle, Trash2, Timer, Settings,
  CheckCircle2, XCircle, Lightbulb, Sparkles, Monitor,
  Smartphone, Square, Tv, Camera, Maximize2, Volume2, VolumeX,
  ZoomIn, ZoomOut, Plus, Minus, HelpCircle, Hash, SlidersHorizontal
} from 'lucide-react';
import { renderMathInHtmlString, formatExplanationLayout } from '../lib/ai';
import { getQuestionPyq } from '../lib/mockEngine';

/* ─────────────────────────────────────────────────────────
   PERSISTENCE FOR MCQ STUDIO CREATOR SETTINGS
───────────────────────────────────────────────────────── */
const STUDIO_SETTINGS_KEY = 'mcqkash-studio-settings-v1';

const AESTHETIC_MODES = [
  { id: 'beam', name: 'Dual Orbit Beam' },
  { id: 'cyber', name: 'Cyber Neon Multi-Hue (Dark)' },
  { id: 'pulse', name: 'Pulsing Radiant Halo' },
  { id: 'chroma', name: 'Liquid Shine Stream' },
  { id: 'stardust', name: 'Stardust Diamond Shimmer' },
  { id: 'photon', name: 'Quantum Electric Photon' },
  { id: 'luxe', name: 'Studio Luxe Glass (Static)' },
];

const loadSavedStudioSettings = () => {
  try {
    const saved = localStorage.getItem(STUDIO_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        themeKey: parsed.themeKey || localStorage.getItem('civilskash-theme') || 'midnight',
        aspectRatio: ['16:9', '9:16', '1:1', '4:3', '3:2', 'fit'].includes(parsed.aspectRatio) ? parsed.aspectRatio : '16:9',
        soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
        contentScale: typeof parsed.contentScale === 'number' ? parsed.contentScale : 1.0,
        timerPreset: typeof parsed.timerPreset === 'number' ? parsed.timerPreset : 30,
        maxQuestionsLimit: typeof parsed.maxQuestionsLimit === 'number' ? parsed.maxQuestionsLimit : null,
        aestheticStyle: ['beam', 'cyber', 'pulse', 'chroma', 'stardust', 'photon', 'luxe'].includes(parsed.aestheticStyle) ? parsed.aestheticStyle : 'beam',
      };
    }
  } catch (e) {
    // Ignore error
  }
  return {
    themeKey: localStorage.getItem('civilskash-theme') || 'midnight',
    aspectRatio: '16:9',
    soundEnabled: true,
    contentScale: 1.0,
    timerPreset: 30,
    maxQuestionsLimit: null,
    aestheticStyle: 'beam',
  };
};

const getAestheticStyles = (mode, theme) => {
  const isLight = theme.type === 'app' && (theme.id === 'sepia' || theme.id === 'light');
  const accent = theme.accent || '#f59e0b';
  const explAccent = theme.explAccent || theme.accent || '#3b82f6';
  const tagText = theme.tagText || theme.accent || '#fbbf24';

  switch (mode) {
    case 'cyber':
      // NON-Theme-Sensitive: Ultra-vibrant RGB Cyberpunk Neon for Dark Theme Recording! (Clean, Crisp Cyber Laser)
      return {
        boxShadow: `0 28px 90px -10px rgba(0, 0, 0, 0.95), 0 0 45px rgba(0, 240, 255, 0.45), 0 0 85px rgba(255, 0, 127, 0.3)`,
        borderTrackBg: `linear-gradient(135deg, rgba(0, 240, 255, 0.35), rgba(255, 0, 127, 0.35))`,
        beamBg: `conic-gradient(from 0deg at 50% 50%, #00f0ff 0deg, #ff007f 90deg, #7000ff 180deg, #00ff88 270deg, #00f0ff 360deg)`,
        beamAnim: `studioBorderRotate 8.5s linear infinite, studioCyberHue 12s linear infinite`,
        beamFilter: `drop-shadow(0 0 10px #00f0ff) drop-shadow(0 0 16px #ff007f)`,
        progressBar: {
          height: '2.5px',
          background: `linear-gradient(90deg, #ff007f 0%, #00f0ff 50%, #00ff88 100%)`,
          boxShadow: `0 0 10px rgba(0, 240, 255, 0.6)`,
          animation: `studioCyberHue 12s linear infinite`,
        }
      };

    case 'pulse':
      // RADIANT HALO (Luminous 4-Corner Pulsing Halo & Polished Specular Progress Bar)
      return {
        boxShadow: `0 30px 90px -10px rgba(0, 0, 0, 0.9), 0 0 65px ${accent}60, 0 0 35px ${explAccent}45`,
        borderTrackBg: `linear-gradient(135deg, ${accent}35, ${explAccent}35)`,
        beamBg: `radial-gradient(circle at 0% 0%, ${accent}dd 0%, ${explAccent}66 30%, transparent 60%),
                 radial-gradient(circle at 100% 0%, ${explAccent}dd 0%, ${accent}66 30%, transparent 60%),
                 radial-gradient(circle at 100% 100%, ${accent}dd 0%, ${explAccent}66 30%, transparent 60%),
                 radial-gradient(circle at 0% 100%, ${explAccent}dd 0%, ${accent}66 30%, transparent 60%)`,
        beamAnim: `studioHaloRadiance 4.5s ease-in-out infinite`,
        beamFilter: `drop-shadow(0 0 14px ${accent}) drop-shadow(0 0 6px #ffffff)`,
        progressBar: {
          height: '2.5px',
          background: `linear-gradient(90deg, ${accent} 0%, ${explAccent} 50%, #ffffff 100%)`,
          animation: `studioHaloProgressPulse 4.5s ease-in-out infinite`,
        }
      };

    case 'chroma':
      // LIQUID SHINE STREAM (Traveling High-Gloss Metallic Shine Arc & Serene Progress Glow)
      return {
        boxShadow: `0 28px 80px -10px rgba(0, 0, 0, 0.8), 0 0 50px ${accent}45, 0 0 30px ${tagText}35`,
        borderTrackBg: isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)',
        beamBg: `conic-gradient(from 0deg at 50% 50%,
          transparent 0deg, transparent 60deg,
          ${accent}33 90deg, ${explAccent}aa 140deg, ${accent} 170deg, #ffffff 178deg, #ffffff 180deg, ${accent} 182deg,
          transparent 240deg, transparent 360deg)`,
        beamAnim: `studioBorderRotate 12s linear infinite`,
        beamFilter: `drop-shadow(0 0 10px ${accent}) drop-shadow(0 0 5px #ffffff)`,
        progressBar: {
          height: '2.5px',
          background: `linear-gradient(90deg, ${accent} 0%, ${explAccent} 50%, #ffffff 100%)`,
          boxShadow: `0 0 10px ${accent}aa, 0 0 4px #ffffff`,
          animation: `studioLiquidShineGlow 6.5s ease-in-out infinite`,
        }
      };

    case 'stardust':
      // STARDUST DIAMOND SHIMMER (45° Diagonal Metallic Sheen Sweep)
      return {
        boxShadow: `0 28px 85px -10px rgba(0, 0, 0, 0.85), 0 0 50px ${accent}50, 0 0 25px ${explAccent}35`,
        borderTrackBg: isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)',
        beamBg: `linear-gradient(135deg,
          transparent 0%,
          ${accent}22 35%,
          ${accent} 48%,
          #ffffff 50%,
          ${explAccent} 52%,
          ${accent}22 65%,
          transparent 100%)`,
        beamAnim: `studioDiagonalShimmer 6.5s ease-in-out infinite alternate`,
        beamFilter: `drop-shadow(0 0 12px ${accent}) drop-shadow(0 0 6px #ffffff)`,
        progressBar: {
          height: '2.5px',
          background: `linear-gradient(135deg, ${accent} 0%, ${explAccent} 50%, #ffffff 100%)`,
          boxShadow: `0 0 12px ${accent}88, 0 0 4px #ffffff`,
          animation: `studioDiagonalShimmer 6.5s ease-in-out infinite alternate`,
        }
      };



    case 'photon':
      // QUANTUM ELECTRIC PHOTON STREAM (Interacting Photon Sparks & Synced Photon Spark Line)
      return {
        boxShadow: `0 28px 90px -10px rgba(0, 0, 0, 0.92), 0 0 50px ${accent}55, 0 0 30px ${explAccent}40`,
        borderTrackBg: `linear-gradient(135deg, ${accent}35, ${explAccent}35)`,
        beamBg: `conic-gradient(from 0deg at 50% 50%,
          ${accent} 0deg, transparent 40deg,
          ${explAccent} 75deg, #ffffff 90deg, ${explAccent} 105deg, transparent 150deg,
          ${tagText} 190deg, transparent 230deg,
          ${accent} 270deg, #ffffff 285deg, transparent 330deg,
          ${accent} 360deg)`,
        beamAnim: `studioBorderRotate 7.5s linear infinite, studioPhotonFlicker 3s ease-in-out infinite alternate`,
        beamFilter: `drop-shadow(0 0 12px ${accent}) drop-shadow(0 0 16px ${explAccent}) drop-shadow(0 0 4px #ffffff)`,
        progressBar: {
          height: '3px',
          background: `linear-gradient(90deg, ${accent} 0%, ${explAccent} 40%, #ffffff 50%, ${tagText} 70%, ${accent} 100%)`,
          boxShadow: `0 0 14px ${accent}, 0 0 8px ${explAccent}, 0 0 4px #ffffff`,
          animation: `studioPhotonFlicker 2.5s ease-in-out infinite alternate`,
        }
      };

    case 'luxe':
      // STUDIO LUXE GLASS (STATIC — Zero Motion, Specular Glass Bevel & Theme Accent Header Bar)
      return {
        boxShadow: `0 30px 90px -10px rgba(0, 0, 0, 0.95), inset 0 1px 1.5px rgba(255, 255, 255, 0.35), inset 0 -2px 5px rgba(0, 0, 0, 0.8), 0 0 30px ${accent}25`,
        borderTrackBg: `linear-gradient(135deg, ${accent}88 0%, rgba(255, 255, 255, 0.18) 35%, ${explAccent || accent}44 70%, rgba(0, 0, 0, 0.85) 100%)`,
        beamBg: `radial-gradient(ellipse at 50% 0%, ${accent}55 0%, transparent 60%)`,
        beamAnim: `none`,
        beamFilter: `none`,
        progressBar: {
          height: '2.5px',
          background: `linear-gradient(90deg, ${accent} 0%, ${explAccent || accent} 70%, #ffffff 100%)`,
          boxShadow: `0 0 10px ${accent}cc, 0 1px 3px rgba(0,0,0,0.5)`,
          animation: `none`,
        }
      };

    case 'beam':
    default:
      // DUAL ORBIT BEAM (Precision Dual Traveling Laser Arc — Smooth 16s Orbit)
      return {
        boxShadow: `0 28px 70px -10px rgba(0, 0, 0, 0.85), 0 0 36px ${accent}45`,
        borderTrackBg: isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)',
        beamBg: `conic-gradient(from 0deg at 50% 50%,
          transparent 0deg, transparent 95deg,
          ${accent}15 110deg, ${accent}60 138deg, ${accent} 165deg, #ffffff 176deg, rgba(255,255,255,0.95) 179deg,
          transparent 180deg, transparent 275deg,
          ${accent}15 290deg, ${accent}60 318deg, ${accent} 345deg, #ffffff 356deg, rgba(255,255,255,0.95) 359deg,
          transparent 360deg)`,
        beamAnim: `studioBorderRotate 16s linear infinite`,
        beamFilter: `drop-shadow(0 0 6px ${accent})`,
        progressBar: {
          height: '2.5px',
          background: `linear-gradient(90deg, ${accent}77 0%, ${accent} 100%)`,
          boxShadow: `0 0 10px ${accent}, 0 0 4px ${accent}`,
        }
      };
  }
};

/* ─────────────────────────────────────────────────────────
   "SOUNDESTIC" ACOUSTIC WEB AUDIO SYNTHESIZER SUITE
   - 100% Cross-Device & Browser Compatible (iOS Safari, Android, Mac/Windows)
───────────────────────────────────────────────────────── */
const getAudioCtx = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch (e) {
    return null;
  }
};

const playTimerTick = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.045, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch (e) {
    // Ignore audio context errors
  }
};

const playTimerComplete = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    // Loud & Glorious 2-Second Broadcast Studio Alert (Punchy A5 Ping + Loud D Major Chord)
    const alertNotes = [
      { freq: 880.00, time: 0,    duration: 0.40, gain: 0.28 }, // A5 High Crisp Alert Ping
      { freq: 587.33, time: 0.15, duration: 2.00, gain: 0.35 }, // D5 Loud Fundamental (2s Ring-out)
      { freq: 739.99, time: 0.15, duration: 2.00, gain: 0.26 }, // F#5 Warm Major 3rd
      { freq: 440.00, time: 0.15, duration: 2.00, gain: 0.24 }, // A4 Low Resonant Body
    ];

    alertNotes.forEach((n) => {
      const startTime = ctx.currentTime + n.time;

      // Primary Loud Sine Fundamental
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(n.freq, startTime);

      gain1.gain.setValueAtTime(n.gain, startTime);
      gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + n.duration);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(startTime);
      osc1.stop(startTime + n.duration);

      // Punchy Triangle Overtone for Loud Broadcast Clarity
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(n.freq * 1.5, startTime);

      gain2.gain.setValueAtTime(n.gain * 0.32, startTime);
      gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + n.duration * 0.7);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(startTime);
      osc2.stop(startTime + n.duration * 0.7);
    });
  } catch (e) {
    // Ignore audio context errors
  }
};

const playOptionClickSound = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(920, ctx.currentTime + 0.038);

    gain.gain.setValueAtTime(0.055, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.042);
  } catch (e) {
    // Ignore audio context errors
  }
};

const playWaitingSuspenseSound = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const pulses = [
      { time: 0, freq: 140 },
      { time: 0.45, freq: 175 }
    ];

    pulses.forEach(p => {
      const startTime = ctx.currentTime + p.time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(p.freq * 1.1, startTime + 0.14);

      gain.gain.setValueAtTime(0.04, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.18);
    });
  } catch (e) {
    // Ignore
  }
};

const playVictorySound = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    // Calm, Soothing & Peaceful Acoustic Victory Resonance (F4 -> A4 -> C5)
    const notes = [
      { freq: 349.23, time: 0,    duration: 1.5, gain: 0.045 }, // F4 (Warm Root)
      { freq: 440.00, time: 0.16, duration: 1.6, gain: 0.050 }, // A4 (Peaceful Major 3rd)
      { freq: 523.25, time: 0.32, duration: 1.9, gain: 0.055 }, // C5 (Serene Perfect 5th)
    ];

    notes.forEach((note) => {
      const startTime = ctx.currentTime + note.time;

      // Pure Soft Sine Wave Fundamental
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(note.freq, startTime);

      gain1.gain.setValueAtTime(note.gain, startTime);
      gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + note.duration);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(startTime);
      osc1.stop(startTime + note.duration);

      // Gentle Octave Sub-Warmth
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(note.freq * 0.5, startTime);

      gain2.gain.setValueAtTime(note.gain * 0.25, startTime);
      gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + note.duration * 0.75);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(startTime);
      osc2.stop(startTime + note.duration * 0.75);
    });
  } catch (e) {
    // Ignore
  }
};

const playDefeatSound = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    // Soundestic Warm Velvet Resonance — Gentle Minor 7th Warmth (Ab3 -> F3)
    const notes = [
      { freq: 207.65, time: 0,    duration: 0.85, gain: 0.05 }, // Ab3
      { freq: 174.61, time: 0.14, duration: 0.95, gain: 0.055 }, // F3
    ];

    notes.forEach((note) => {
      const startTime = ctx.currentTime + note.time;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(note.freq, startTime);

      gain1.gain.setValueAtTime(note.gain, startTime);
      gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + note.duration);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(startTime);
      osc1.stop(startTime + note.duration);

      // Soft Sub-Warmth Triangle Harmonic
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(note.freq * 0.5, startTime);

      gain2.gain.setValueAtTime(note.gain * 0.25, startTime);
      gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + note.duration * 0.8);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(startTime);
      osc2.stop(startTime + note.duration * 0.8);
    });
  } catch (e) {
    // Ignore
  }
};

/* ─────────────────────────────────────────────────────────
   THEME SYSTEM WITH PERFECT HIGH-CONTRAST & PRO READABILITY
───────────────────────────────────────────────────────── */

const STUDIO_THEMES = {
  midnight: {
    id: 'midnight',
    label: 'Midnight Sapphire',
    type: 'studio',
    bg: '#050b14',
    border: 'rgba(56,189,248,0.35)',
    accent: '#38bdf8',
    proCapsuleBg: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
    proCapsuleText: '#ffffff',
    qText: '#f0f9ff',
    bodyText: '#bae6fd',
    mutedText: 'rgba(186,230,253,0.45)',
    optionBg: 'rgba(12,25,48,0.75)',
    optionBorder: 'rgba(56,189,248,0.18)',
    optionHoverBg: 'rgba(56,189,248,0.07)',
    optionHoverBorder: 'rgba(56,189,248,0.38)',
    correctBg: 'rgba(16,185,129,0.15)',
    correctBorder: 'rgba(52,211,153,0.75)',
    correctText: '#6ee7b7',
    correctGlow: '0 0 24px rgba(16,185,129,0.25)',
    wrongBg: 'rgba(239,68,68,0.12)',
    wrongBorder: 'rgba(248,113,113,0.65)',
    wrongText: '#fca5a5',
    mutedOptionBg: 'rgba(5,11,20,0.5)',
    mutedOptionBorder: 'rgba(56,189,248,0.06)',
    explBg: 'rgba(56,189,248,0.08)',
    explBorder: 'rgba(56,189,248,0.28)',
    explAccent: '#38bdf8',
    explText: '#7dd3fc',
    tagBg: 'rgba(56,189,248,0.1)',
    tagBorder: 'rgba(56,189,248,0.3)',
    tagText: '#38bdf8',
    bubbleBg: 'rgba(12,25,48,0.9)',
    bubbleBorder: 'rgba(56,189,248,0.2)',
    bubbleText: 'rgba(186,230,253,0.6)',
    toolbarBg: 'rgba(8,18,34,0.95)',
    toolbarBorder: 'rgba(56,189,248,0.28)',
    toolbarIcon: 'rgba(186,230,253,0.55)',
    toolbarIconActive: '#38bdf8',
    toolbarIconActiveBg: 'rgba(56,189,248,0.14)',
  },
  violet: {
    id: 'violet',
    label: 'Violet Haze',
    type: 'studio',
    bg: '#0a071a',
    border: 'rgba(167,139,250,0.35)',
    accent: '#c084fc',
    proCapsuleBg: 'linear-gradient(135deg, #c084fc 0%, #9333ea 100%)',
    proCapsuleText: '#0a071a',
    qText: '#ede9fe',
    bodyText: '#c4b5fd',
    mutedText: 'rgba(196,181,253,0.45)',
    optionBg: 'rgba(46,16,101,0.4)',
    optionBorder: 'rgba(109,40,217,0.28)',
    optionHoverBg: 'rgba(192,132,252,0.07)',
    optionHoverBorder: 'rgba(192,132,252,0.38)',
    correctBg: 'rgba(16,185,129,0.15)',
    correctBorder: 'rgba(52,211,153,0.75)',
    correctText: '#6ee7b7',
    correctGlow: '0 0 24px rgba(16,185,129,0.25)',
    wrongBg: 'rgba(239,68,68,0.12)',
    wrongBorder: 'rgba(248,113,113,0.65)',
    wrongText: '#fca5a5',
    mutedOptionBg: 'rgba(10,7,26,0.5)',
    mutedOptionBorder: 'rgba(109,40,217,0.1)',
    explBg: 'rgba(192,132,252,0.08)',
    explBorder: 'rgba(192,132,252,0.28)',
    explAccent: '#c084fc',
    explText: '#e9d5ff',
    tagBg: 'rgba(192,132,252,0.1)',
    tagBorder: 'rgba(167,139,250,0.3)',
    tagText: '#c084fc',
    bubbleBg: 'rgba(46,16,101,0.7)',
    bubbleBorder: 'rgba(109,40,217,0.35)',
    bubbleText: 'rgba(196,181,253,0.6)',
    toolbarBg: 'rgba(16,12,35,0.95)',
    toolbarBorder: 'rgba(167,139,250,0.3)',
    toolbarIcon: 'rgba(196,181,253,0.6)',
    toolbarIconActive: '#c084fc',
    toolbarIconActiveBg: 'rgba(192,132,252,0.14)',
  },
  teal: {
    id: 'teal',
    label: 'Cyber Teal',
    type: 'studio',
    bg: '#040f12',
    border: 'rgba(45,212,191,0.35)',
    accent: '#2dd4bf',
    proCapsuleBg: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)',
    proCapsuleText: '#040f12',
    qText: '#f0fdfa',
    bodyText: '#99f6e4',
    mutedText: 'rgba(153,246,228,0.45)',
    optionBg: 'rgba(6,29,34,0.7)',
    optionBorder: 'rgba(20,184,166,0.18)',
    optionHoverBg: 'rgba(20,184,166,0.07)',
    optionHoverBorder: 'rgba(45,212,191,0.38)',
    correctBg: 'rgba(16,185,129,0.15)',
    correctBorder: 'rgba(52,211,153,0.75)',
    correctText: '#6ee7b7',
    correctGlow: '0 0 24px rgba(16,185,129,0.25)',
    wrongBg: 'rgba(239,68,68,0.12)',
    wrongBorder: 'rgba(248,113,113,0.65)',
    wrongText: '#fca5a5',
    mutedOptionBg: 'rgba(4,15,18,0.5)',
    mutedOptionBorder: 'rgba(20,184,166,0.06)',
    explBg: 'rgba(45,212,191,0.08)',
    explBorder: 'rgba(45,212,191,0.28)',
    explAccent: '#2dd4bf',
    explText: '#99f6e4',
    tagBg: 'rgba(20,184,166,0.1)',
    tagBorder: 'rgba(45,212,191,0.3)',
    tagText: '#2dd4bf',
    bubbleBg: 'rgba(6,29,34,0.85)',
    bubbleBorder: 'rgba(20,184,166,0.2)',
    bubbleText: 'rgba(153,246,228,0.6)',
    toolbarBg: 'rgba(7,22,26,0.95)',
    toolbarBorder: 'rgba(45,212,191,0.28)',
    toolbarIcon: 'rgba(153,246,228,0.55)',
    toolbarIconActive: '#2dd4bf',
    toolbarIconActiveBg: 'rgba(20,184,166,0.14)',
  },
  ember: {
    id: 'ember',
    label: 'Ember',
    type: 'studio',
    bg: '#0f0500',
    border: 'rgba(251,113,44,0.35)',
    accent: '#fb7228',
    proCapsuleBg: 'linear-gradient(135deg, #fb7228 0%, #c2410c 100%)',
    proCapsuleText: '#ffffff',
    qText: '#fff7ed',
    bodyText: '#fed7aa',
    mutedText: 'rgba(254,215,170,0.45)',
    optionBg: 'rgba(30,10,0,0.7)',
    optionBorder: 'rgba(251,113,44,0.18)',
    optionHoverBg: 'rgba(251,113,44,0.07)',
    optionHoverBorder: 'rgba(251,113,44,0.38)',
    correctBg: 'rgba(16,185,129,0.15)',
    correctBorder: 'rgba(52,211,153,0.75)',
    correctText: '#6ee7b7',
    correctGlow: '0 0 24px rgba(16,185,129,0.25)',
    wrongBg: 'rgba(239,68,68,0.12)',
    wrongBorder: 'rgba(248,113,113,0.65)',
    wrongText: '#fca5a5',
    mutedOptionBg: 'rgba(15,5,0,0.5)',
    mutedOptionBorder: 'rgba(251,113,44,0.06)',
    explBg: 'rgba(251,113,44,0.08)',
    explBorder: 'rgba(251,113,44,0.28)',
    explAccent: '#fb7228',
    explText: '#ffedd5',
    tagBg: 'rgba(251,113,44,0.1)',
    tagBorder: 'rgba(251,113,44,0.3)',
    tagText: '#fb7228',
    bubbleBg: 'rgba(30,10,0,0.9)',
    bubbleBorder: 'rgba(251,113,44,0.2)',
    bubbleText: 'rgba(254,215,170,0.6)',
    toolbarBg: 'rgba(22,9,2,0.95)',
    toolbarBorder: 'rgba(251,113,44,0.28)',
    toolbarIcon: 'rgba(254,215,170,0.55)',
    toolbarIconActive: '#fb7228',
    toolbarIconActiveBg: 'rgba(251,113,44,0.14)',
  },
};

const getAppThemeColors = (themeId) => {
  const map = {
    dark: {
      id: 'dark',
      label: 'Dark',
      type: 'app',
      bg: '#060b17',
      border: 'rgba(251,191,36,0.3)',
      accent: '#fbbf24',
      proCapsuleBg: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
      proCapsuleText: '#060b17',
      qText: '#f0f4ff',
      bodyText: '#8899bb',
      mutedText: 'rgba(136,153,187,0.45)',
      optionBg: 'rgba(13,21,38,0.8)',
      optionBorder: 'rgba(255,255,255,0.09)',
      optionHoverBg: 'rgba(251,191,36,0.05)',
      optionHoverBorder: 'rgba(251,191,36,0.25)',
      correctBg: 'rgba(16,185,129,0.14)',
      correctBorder: 'rgba(52,211,153,0.65)',
      correctText: '#6ee7b7',
      correctGlow: '0 0 20px rgba(16,185,129,0.22)',
      wrongBg: 'rgba(239,68,68,0.12)',
      wrongBorder: 'rgba(248,113,113,0.55)',
      wrongText: '#fca5a5',
      mutedOptionBg: 'rgba(6,11,23,0.4)',
      mutedOptionBorder: 'rgba(255,255,255,0.04)',
      explBg: 'rgba(251,191,36,0.08)',
      explBorder: 'rgba(251,191,36,0.25)',
      explAccent: '#fbbf24',
      explText: '#f0f4ff',
      tagBg: 'rgba(251,191,36,0.08)',
      tagBorder: 'rgba(251,191,36,0.22)',
      tagText: '#fbbf24',
      bubbleBg: 'rgba(13,21,38,0.9)',
      bubbleBorder: 'rgba(255,255,255,0.08)',
      bubbleText: 'rgba(136,153,187,0.6)',
      toolbarBg: 'rgba(10,16,30,0.95)',
      toolbarBorder: 'rgba(255,255,255,0.1)',
      toolbarIcon: 'rgba(136,153,187,0.6)',
      toolbarIconActive: '#fbbf24',
      toolbarIconActiveBg: 'rgba(251,191,36,0.12)',
    },
    sepia: {
      id: 'sepia',
      label: 'Sepia',
      type: 'app',
      bg: '#f5ecd7',
      border: 'rgba(180,83,9,0.3)',
      accent: '#b45309',
      proCapsuleBg: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
      proCapsuleText: '#ffffff', // Crisp white text on dark amber capsule!
      qText: '#261708',
      bodyText: '#3d2610',
      mutedText: 'rgba(107,78,40,0.65)',
      optionBg: 'rgba(253,247,237,0.92)',
      optionBorder: 'rgba(216,200,168,0.85)',
      optionHoverBg: 'rgba(180,83,9,0.06)',
      optionHoverBorder: 'rgba(180,83,9,0.3)',
      correctBg: 'rgba(16,185,129,0.12)',
      correctBorder: 'rgba(4,120,87,0.65)',
      correctText: '#065f46',
      correctGlow: '0 0 16px rgba(16,185,129,0.14)',
      wrongBg: 'rgba(190,18,60,0.09)',
      wrongBorder: 'rgba(190,18,60,0.45)',
      wrongText: '#9f1239',
      mutedOptionBg: 'rgba(245,236,215,0.5)',
      mutedOptionBorder: 'rgba(216,200,168,0.4)',
      explBg: 'rgba(180,83,9,0.08)',
      explBorder: 'rgba(180,83,9,0.3)',
      explAccent: '#92400e',
      explText: '#261708',
      tagBg: 'rgba(180,83,9,0.08)',
      tagBorder: 'rgba(180,83,9,0.3)',
      tagText: '#92400e',
      bubbleBg: '#fbf4e8',
      bubbleBorder: 'rgba(216,200,168,0.9)',
      bubbleText: 'rgba(107,78,40,0.8)',
      toolbarBg: 'rgba(245,236,215,0.96)',
      toolbarBorder: 'rgba(216,200,168,0.9)',
      toolbarIcon: 'rgba(107,78,40,0.7)',
      toolbarIconActive: '#92400e',
      toolbarIconActiveBg: 'rgba(180,83,9,0.12)',
    },
    light: {
      id: 'light',
      label: 'Light',
      type: 'app',
      bg: '#f1f5f9',
      border: 'rgba(37,99,235,0.3)',
      accent: '#2563eb',
      proCapsuleBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      proCapsuleText: '#ffffff', // Crisp white text on royal blue capsule!
      qText: '#0f172a',
      bodyText: '#1e293b',
      mutedText: 'rgba(71,85,105,0.65)',
      optionBg: 'rgba(255,255,255,0.95)',
      optionBorder: 'rgba(203,213,225,0.9)',
      optionHoverBg: 'rgba(37,99,235,0.05)',
      optionHoverBorder: 'rgba(37,99,235,0.35)',
      correctBg: 'rgba(16,185,129,0.1)',
      correctBorder: 'rgba(4,120,87,0.6)',
      correctText: '#065f46',
      correctGlow: '0 0 16px rgba(16,185,129,0.14)',
      wrongBg: 'rgba(239,68,68,0.08)',
      wrongBorder: 'rgba(220,38,38,0.45)',
      wrongText: '#991b1b',
      mutedOptionBg: 'rgba(241,245,249,0.5)',
      mutedOptionBorder: 'rgba(203,213,225,0.5)',
      explBg: 'rgba(37,99,235,0.06)',
      explBorder: 'rgba(37,99,235,0.25)',
      explAccent: '#1d4ed8',
      explText: '#0f172a',
      tagBg: 'rgba(37,99,235,0.08)',
      tagBorder: 'rgba(37,99,235,0.25)',
      tagText: '#1d4ed8',
      bubbleBg: '#ffffff',
      bubbleBorder: 'rgba(203,213,225,1)',
      bubbleText: 'rgba(71,85,105,0.8)',
      toolbarBg: 'rgba(255,255,255,0.96)',
      toolbarBorder: 'rgba(203,213,225,1)',
      toolbarIcon: 'rgba(71,85,105,0.7)',
      toolbarIconActive: '#1d4ed8',
      toolbarIconActiveBg: 'rgba(37,99,235,0.12)',
    },
  };
  return map[themeId] || map.dark;
};

const ALL_THEMES = [
  { key: 'midnight', ...STUDIO_THEMES.midnight },
  { key: 'violet', ...STUDIO_THEMES.violet },
  { key: 'teal', ...STUDIO_THEMES.teal },
  { key: 'ember', ...STUDIO_THEMES.ember },
  { key: 'dark', ...getAppThemeColors('dark') },
  { key: 'sepia', ...getAppThemeColors('sepia') },
  { key: 'light', ...getAppThemeColors('light') },
];

const TIMER_PRESETS = [5, 10, 15, 30, 45, 60, 90];

/* ─────────────────────────────────────────────────────────
   REFINED 3D SPHERICAL DIFFICULTY DOT COMPONENT (22px PERFECT HEIGHT)
───────────────────────────────────────────────────────── */
function Difficulty3DDot({ difficulty, theme }) {
  const d = String(difficulty || 'unmarked').toLowerCase();
  let dotBg, glowColor;

  if (d === 'hard') {
    dotBg = 'radial-gradient(circle at 35% 35%, #ff7b92 0%, #f43f5e 50%, #9f1239 100%)';
    glowColor = 'rgba(244, 63, 94, 0.65)';
  } else if (d === 'medium') {
    dotBg = 'radial-gradient(circle at 35% 35%, #93c5fd 0%, #3b82f6 50%, #1e40af 100%)';
    glowColor = 'rgba(59, 130, 246, 0.65)';
  } else if (d === 'easy') {
    dotBg = 'radial-gradient(circle at 35% 35%, #6ee7b7 0%, #10b981 50%, #065f46 100%)';
    glowColor = 'rgba(16, 185, 129, 0.65)';
  } else {
    dotBg = 'radial-gradient(circle at 35% 35%, #cbd5e1 0%, #64748b 50%, #334155 100%)';
    glowColor = 'rgba(100, 116, 139, 0.45)';
  }

  return (
    <div
      title={`Difficulty: ${difficulty || 'Standard'}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '22px', height: '22px', borderRadius: '50%',
        padding: '1.5px',
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${theme.optionBorder}`,
        boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'relative', width: '17px', height: '17px', borderRadius: '50%',
      }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: dotBg,
          boxShadow: `0 0 10px ${glowColor}, inset -2px -2px 5px rgba(0,0,0,0.45)`,
        }} />
        <div style={{
          position: 'absolute', top: '2.5px', left: '2.5px',
          width: '4.5px', height: '4.5px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.92)',
          filter: 'blur(0.2px)',
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STUDIO MCQ SLIDE — KBC-Style Suspense & Dynamic Zoom Support
───────────────────────────────────────────────────────── */
function StudioMcqSlide({ question, theme, contentScale = 1.0, soundEnabled = true }) {
  const [selectedId, setSelectedId] = useState(null);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'thinking' | 'revealed' | 'expl_revealed'
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    setSelectedId(null);
    setPhase('idle');
    setHoveredId(null);
  }, [question?.id]);

  // Keyboard shortcut listener for selecting options A, B, C, D, E or 1, 2, 3, 4, 5
  useEffect(() => {
    if (!question) return;
    const handleOptionKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      if (selectedId || phase !== 'idle') return;

      const key = e.key.toLowerCase();
      const keyMap = {
        'a': 0, '1': 0,
        'b': 1, '2': 1,
        'c': 2, '3': 2,
        'd': 3, '4': 3,
        'e': 4, '5': 4,
      };

      const optIdx = keyMap[key];
      if (optIdx !== undefined && question.options?.[optIdx]) {
        handleOptionClick(question.options[optIdx].id);
      }
    };

    window.addEventListener('keydown', handleOptionKey);
    return () => window.removeEventListener('keydown', handleOptionKey);
  }, [question, selectedId, phase]);

  if (!question) return null;

  const pyqVal = getQuestionPyq(question);
  const tags = (question.tags || []).filter(
    t => !t.startsWith('PYQ: ') && t.toLowerCase() !== '#pro' && t !== 'Pro'
  );

  // In-place image expansion toggle
  const handleContainerClick = (e) => {
    if (e.target && e.target.tagName === 'IMG') {
      e.stopPropagation();
      e.target.classList.toggle('expanded-studio-img');
    }
  };

  const handleOptionClick = (optId) => {
    if (selectedId || phase !== 'idle') return;
    setSelectedId(optId);
    setPhase('thinking');

    // 1. Play Option Click Sound & Start Calming Waiting Suspense
    if (soundEnabled) {
      playOptionClickSound();
      playWaitingSuspenseSound();
    }

    const isCorrect = optId === question.correctId;

    // Ideal Game-show suspense reveal timing (1.7s suspense):
    setTimeout(() => {
      setPhase('revealed');

      // 2. Play Victory or Defeat Sound on Reveal
      if (soundEnabled) {
        if (isCorrect) {
          playVictorySound();
        } else {
          playDefeatSound();
        }
      }

      setTimeout(() => {
        setPhase('expl_revealed');
      }, 900);
    }, 1700);
  };

  const questionHtml = renderMathInHtmlString(question.question || '');

  return (
    <div
      onClick={handleContainerClick}
      style={{
        display: 'flex', flexDirection: 'column', gap: `${20 * contentScale}px`,
        width: '100%', transition: 'all 0.2s ease-out',
      }}
    >
      {(question.imageUrl || question.image) && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
          <img
            src={question.imageUrl || question.image}
            alt="Question Diagram"
            className="studio-img"
          />
        </div>
      )}

      {/* Tags Row with 3D Spherical Difficulty Dot (No Text) */}
      {(question.difficulty || pyqVal || tags.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          {question.difficulty && (
            <Difficulty3DDot difficulty={question.difficulty} theme={theme} />
          )}
          {pyqVal && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontSize: `${11 * contentScale}px`, fontWeight: 800, letterSpacing: '0.04em',
              padding: '5px 13px', borderRadius: '999px',
              background: theme.tagBg, border: `1.5px solid ${theme.tagBorder}`,
              color: theme.tagText,
              boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            }}>
              <Sparkles size={Math.round(11 * contentScale)} style={{ fill: 'currentColor', opacity: 0.9 }} />
              {pyqVal}
            </span>
          )}
          {tags.slice(0, 3).map(t => (
            <span key={t} style={{
              display: 'inline-flex', alignItems: 'center',
              fontSize: `${11 * contentScale}px`, fontWeight: 700, letterSpacing: '0.03em',
              padding: '4.5px 12px', borderRadius: '999px',
              background: theme.type === 'app' && (theme.id === 'sepia' || theme.id === 'light')
                ? 'rgba(0,0,0,0.06)'
                : 'rgba(255,255,255,0.08)',
              border: `1px solid ${theme.optionBorder}`,
              color: theme.qText,
              opacity: 0.9,
            }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Question Text */}
      <div
        dangerouslySetInnerHTML={{ __html: questionHtml }}
        style={{
          fontSize: `clamp(${16 * contentScale}px, ${2.2 * contentScale}vw, ${24 * contentScale}px)`,
          fontWeight: 700,
          lineHeight: 1.6,
          color: theme.qText,
          letterSpacing: '-0.01em',
        }}
      />

      {/* Options Stack with KBC-Style Pop Suspense */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${9 * contentScale}px` }}>
        {question.options?.map((opt, idx) => {
          const isCorrect = opt.id === question.correctId;
          const isSelected = opt.id === selectedId;
          const isHovered = opt.id === hoveredId;
          const labels = ['A', 'B', 'C', 'D', 'E'];

          let bg = theme.optionBg;
          let border = theme.optionBorder;
          let color = theme.bodyText;
          let shadow = 'none';
          let opacity = 1;
          let bubbleBg = theme.bubbleBg;
          let bubbleBorder = theme.bubbleBorder;
          let bubbleColor = theme.bubbleText;
          let isThinking = phase === 'thinking' && isSelected;
          let isRevealed = phase === 'revealed' || phase === 'expl_revealed';

          if (isThinking) {
            bg = theme.tagBg || `${theme.accent}18`;
            border = theme.accent;
            color = theme.qText;
            shadow = `0 0 32px ${theme.accent}55, 0 4px 20px ${theme.accent}30`;
            bubbleBg = theme.proCapsuleBg || theme.accent;
            bubbleBorder = theme.accent;
            bubbleColor = theme.proCapsuleText || '#ffffff';
          } else if (isRevealed) {
            if (isCorrect) {
              bg = theme.correctBg;
              border = theme.correctBorder;
              color = theme.correctText;
              shadow = theme.correctGlow;
              bubbleBg = '#059669';
              bubbleBorder = '#059669';
              bubbleColor = '#fff';
            } else if (isSelected && !isCorrect) {
              bg = theme.wrongBg;
              border = theme.wrongBorder;
              color = theme.wrongText;
              bubbleBg = '#dc2626';
              bubbleBorder = '#dc2626';
              bubbleColor = '#fff';
            } else {
              bg = theme.mutedOptionBg;
              border = theme.mutedOptionBorder;
              opacity = 0.35;
            }
          } else if (isHovered && phase === 'idle') {
            bg = theme.optionHoverBg;
            border = theme.optionHoverBorder;
          }

          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{
                opacity,
                y: 0,
                scale: isThinking ? [1, 1.04, 1.015, 1.035, 1.01, 1] : 1,
              }}
              transition={
                isThinking
                  ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' }
                  : { duration: 0.22, delay: idx * 0.03 }
              }
              onClick={() => handleOptionClick(opt.id)}
              onMouseEnter={() => phase === 'idle' && setHoveredId(opt.id)}
              onMouseLeave={() => setHoveredId(null)}
              disabled={phase !== 'idle'}
              style={{
                display: 'flex', alignItems: 'center', gap: `${14 * contentScale}px`,
                padding: `${12 * contentScale}px ${18 * contentScale}px`, borderRadius: '15px',
                background: bg, border: `1.5px solid ${border}`,
                color, boxShadow: shadow,
                cursor: phase === 'idle' ? 'pointer' : 'default',
                textAlign: 'left', width: '100%',
                transition: isThinking ? 'box-shadow 0.3s ease, border-color 0.3s ease' : 'all 0.25s ease',
              }}
            >
              <span style={{
                width: `${32 * contentScale}px`, height: `${32 * contentScale}px`, borderRadius: '11px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: bubbleBg, border: `1px solid ${bubbleBorder}`,
                color: bubbleColor,
                fontSize: `${13 * contentScale}px`, fontWeight: 800,
                transition: 'all 0.25s ease',
                boxShadow: isThinking ? `0 0 14px ${theme.accent}80` : 'none',
              }}>
                {opt.label || labels[idx] || String.fromCharCode(65 + idx)}
              </span>

              <span
                style={{ flex: 1, fontSize: `${15 * contentScale}px`, fontWeight: 500, lineHeight: 1.5 }}
                dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(opt.text || '') }}
              />

              {/* Status Icons for Answer Reveal */}
              {isRevealed && isCorrect && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 450 }}>
                  <CheckCircle2 size={Math.round(20 * contentScale)} style={{ color: '#34d399', flexShrink: 0 }} />
                </motion.div>
              )}
              {isRevealed && isSelected && !isCorrect && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 450 }}>
                  <XCircle size={Math.round(20 * contentScale)} style={{ color: '#f87171', flexShrink: 0 }} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Explanation Sequence Panel */}
      {question.explanation && (phase === 'expl_revealed' || phase === 'revealed') && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 14, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 14, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden', marginTop: '6px' }}
          >
            <div style={{
              padding: `${15 * contentScale}px ${18 * contentScale}px`, borderRadius: '16px',
              background: theme.explBg,
              border: `1px solid ${theme.explBorder}`,
              borderLeft: `4px solid ${theme.explAccent}`,
              boxShadow: `0 12px 36px rgba(0,0,0,0.18)`,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                color: theme.explAccent, fontSize: `${12 * contentScale}px`, fontWeight: 800,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Lightbulb size={Math.round(16 * contentScale)} />
                  <span>Explanation</span>
                </div>
              </div>

              <div
                className="mcq-explanation-content"
                dangerouslySetInnerHTML={{
                  __html: formatExplanationLayout(
                    renderMathInHtmlString(question.explanation)
                  ).replace(/autoplay=1/g, 'autoplay=0')
                }}
                style={{
                  fontSize: `${14.5 * contentScale}px`,
                  lineHeight: 1.7,
                  color: theme.explText,
                  '--color-text': theme.explText,
                  '--color-primary': theme.accent.startsWith('#')
                    ? hexToRgbComponents(theme.accent)
                    : theme.accent,
                }}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function hexToRgbComponents(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

/* ─────────────────────────────────────────────────────────
   MAIN PRESENTER COMPONENT
───────────────────────────────────────────────────────── */
export default function ProStudioPresenter({ questions = [], onClose }) {
  const savedSettings = useRef(loadSavedStudioSettings()).current;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [themeKey, setThemeKey] = useState(savedSettings.themeKey);
  const [aspectRatio, setAspectRatio] = useState(savedSettings.aspectRatio); // '16:9' | '9:16' | 'fit'
  const [soundEnabled, setSoundEnabled] = useState(savedSettings.soundEnabled);
  const [contentScale, setContentScale] = useState(savedSettings.contentScale); // Font / Content Zoom factor (0.8 - 1.35)
  const [maxQuestionsLimit, setMaxQuestionsLimit] = useState(null); // Defaults to current active filter size
  const [showNavDrawer, setShowNavDrawer] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [aestheticStyle, setAestheticStyle] = useState(savedSettings.aestheticStyle || 'beam');
  const [aestheticToast, setAestheticToast] = useState(null);
  const toastTimerRef = useRef(null);

  const cycleAestheticStyle = () => {
    const ids = AESTHETIC_MODES.map(m => m.id);
    const nextIdx = (ids.indexOf(aestheticStyle) + 1) % ids.length;
    const nextMode = AESTHETIC_MODES[nextIdx];
    setAestheticStyle(nextMode.id);

    setAestheticToast(nextMode);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setAestheticToast(null);
    }, 2200);
  };

  // Jump and Limit Form States
  const [jumpInputValue, setJumpInputValue] = useState('');
  const [limitInputValue, setLimitInputValue] = useState('');

  // Timer (Countdown only in seconds, e.g., 30s)
  const [timerPreset, setTimerPreset] = useState(savedSettings.timerPreset);
  const [timerCount, setTimerCount] = useState(savedSettings.timerPreset);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showTimerPicker, setShowTimerPicker] = useState(false);

  // Drawing / Laser
  const scrollContainerRef = useRef(null);
  const [activeTool, setActiveTool] = useState('none'); // 'none' | 'laser' | 'pen'
  const canvasRef = useRef(null);
  const pathsRef = useRef([]);
  const currentPathRef = useRef([]);
  const laserRef = useRef(null);
  const laserTrailRef = useRef([]);
  const laserIsPointerDownRef = useRef(false);
  const animFrameRef = useRef(null);
  const [isDrawingState, setIsDrawingState] = useState(false);

  // Reset scroll to top on question change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentIndex]);

  const theme = ALL_THEMES.find(t => t.key === themeKey) || ALL_THEMES[0];
  const currentAesthetic = getAestheticStyles(aestheticStyle, theme);

  // Active Questions subset based on user total question limit
  const activeQuestions = React.useMemo(() => {
    if (maxQuestionsLimit && maxQuestionsLimit > 0 && maxQuestionsLimit < questions.length) {
      return questions.slice(0, maxQuestionsLimit);
    }
    return questions;
  }, [questions, maxQuestionsLimit]);

  const totalCount = activeQuestions.length;
  const currentQuestion = activeQuestions[currentIndex] || activeQuestions[0] || null;

  // Auto-bound currentIndex if questions limit changes
  useEffect(() => {
    if (currentIndex >= totalCount && totalCount > 0) {
      setCurrentIndex(Math.max(0, totalCount - 1));
    }
  }, [totalCount, currentIndex]);

  // Sync inline jump input with current question index
  useEffect(() => {
    setJumpInputValue(String(currentIndex + 1));
  }, [currentIndex]);

  // Sync inline limit input with active limit / total available questions
  useEffect(() => {
    setLimitInputValue(String(maxQuestionsLimit || questions.length));
  }, [maxQuestionsLimit, questions.length]);

  const handleJumpSubmitInline = () => {
    const val = parseInt(jumpInputValue, 10);
    if (!isNaN(val) && val >= 1 && val <= totalCount) {
      setCurrentIndex(val - 1);
    } else {
      setJumpInputValue(String(currentIndex + 1));
    }
  };

  const handleLimitSubmitInline = () => {
    const val = parseInt(limitInputValue, 10);
    if (!isNaN(val) && val >= 1) {
      const capped = Math.min(val, questions.length);
      setMaxQuestionsLimit(capped >= questions.length ? null : capped);
      setLimitInputValue(String(capped >= questions.length ? questions.length : capped));
    } else {
      setLimitInputValue(String(maxQuestionsLimit || questions.length));
    }
  };

  // Persist MCQ Studio settings to localStorage automatically
  useEffect(() => {
    try {
      localStorage.setItem(STUDIO_SETTINGS_KEY, JSON.stringify({
        themeKey,
        aspectRatio,
        soundEnabled,
        contentScale,
        timerPreset,
        maxQuestionsLimit,
      }));
    } catch (e) {
      // Ignore
    }
  }, [themeKey, aspectRatio, soundEnabled, contentScale, timerPreset, maxQuestionsLimit]);

  // Zoom handlers
  const zoomIn = () => setContentScale(s => Math.min(1.35, Number((s + 0.08).toFixed(2))));
  const zoomOut = () => setContentScale(s => Math.max(0.8, Number((s - 0.08).toFixed(2))));

  // Aspect Ratio 1-Click Cycle Handler (16:9 -> 9:16 -> 1:1 -> 4:3 -> 3:2 -> fit -> 16:9)
  const toggleAspectRatio = () => {
    const ratios = ['16:9', '9:16', '1:1', '4:3', '3:2', 'fit'];
    setAspectRatio(prev => {
      const currIdx = ratios.indexOf(prev);
      const nextIdx = currIdx >= 0 ? (currIdx + 1) % ratios.length : 0;
      return ratios[nextIdx];
    });
  };

  // Studio Theme 1-Click Cycle Handler
  const cycleTheme = () => {
    const keys = ALL_THEMES.map(t => t.key);
    const currIdx = keys.indexOf(themeKey);
    const nextKey = keys[(currIdx + 1) % keys.length];
    setThemeKey(nextKey);
  };

  // Strict Background Scroll Lock
  useEffect(() => {
    const scrollY = window.scrollY;
    const origOverflow = document.body.style.overflow;
    const origPosition = document.body.style.position;
    const origWidth = document.body.style.width;
    const origTop = document.body.style.top;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollY}px`;

    return () => {
      document.body.style.overflow = origOverflow;
      document.body.style.position = origPosition;
      document.body.style.width = origWidth;
      document.body.style.top = origTop;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Timer logic with audio ticks & completion chime chord
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setTimerCount(prev => {
        if (prev <= 1) {
          setTimerRunning(false);
          if (soundEnabled) playTimerComplete();
          return 0;
        }
        if (soundEnabled) playTimerTick();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning, soundEnabled]);

  const resetTimer = () => { setTimerRunning(false); setTimerCount(timerPreset); };
  const setPreset = (s) => { setTimerPreset(s); setTimerCount(s); setTimerRunning(false); setShowTimerPicker(false); };
  const adjustTimerPreset = (delta) => {
    setTimerPreset(prev => {
      const updated = Math.max(1, Math.min(300, prev + delta));
      setTimerCount(updated);
      setTimerRunning(false);
      return updated;
    });
  };
  const setCustomTimerPreset = (val) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1) {
      const valid = Math.min(300, num);
      setTimerPreset(valid);
      setTimerCount(valid);
      setTimerRunning(false);
    }
  };

  // Timer display click logic: Starts if paused/stopped, pauses if running, restarts from preset if 0!
  const handleTimerClick = () => {
    if (timerCount === 0) {
      setTimerCount(timerPreset);
      setTimerRunning(true);
    } else {
      setTimerRunning(r => !r);
    }
  };

  /* ─────────────────────────────────────────────────────────
     PIXEL-PERFECT RETINA DISPLAY CANVAS SCALING & REDRAW
  ───────────────────────────────────────────────────────── */
  const fitCanvas = () => {
    const c = canvasRef.current; if (!c) return;
    // Cap devicePixelRatio to 2 to prevent excessive GPU VRAM / memory allocation
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
    c.style.width = `${window.innerWidth}px`;
    c.style.height = `${window.innerHeight}px`;
    redraw();
  };

  useEffect(() => {
    fitCanvas();
    window.addEventListener('resize', fitCanvas);
    return () => window.removeEventListener('resize', fitCanvas);
  }, []);

  // Global Pointer Tracking & Vanishing Laser Trail Writer
  useEffect(() => {
    if (activeTool !== 'laser') {
      laserTrailRef.current = [];
      return;
    }

    const handlePointerDown = (e) => {
      laserIsPointerDownRef.current = true;
      laserRef.current = { x: e.clientX, y: e.clientY };
      laserTrailRef.current.push({ x: e.clientX, y: e.clientY, time: Date.now() });
    };

    const handleGlobalPointerMove = (e) => {
      laserRef.current = { x: e.clientX, y: e.clientY };
      if (laserIsPointerDownRef.current) {
        laserTrailRef.current.push({ x: e.clientX, y: e.clientY, time: Date.now() });
      }
    };

    const handlePointerUp = () => {
      laserIsPointerDownRef.current = false;
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeTool]);

  // Continuous animation frame loop while Laser is active or trailing ink exists
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      redraw();
      if (activeTool === 'laser' || laserTrailRef.current.length > 0) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    if (activeTool === 'laser' || laserTrailRef.current.length > 0) {
      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      redraw();
    }

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeTool, themeKey]);

  useEffect(() => { clearCanvas(); }, [currentIndex]);
  useEffect(() => { redraw(); }, [themeKey, activeTool]);

  const redraw = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.scale(dpr, dpr);

    // 1. Draw Pen Annotations (Persistent drawings)
    pathsRef.current.forEach(path => {
      if (!path.points || path.points.length < 1) return;
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = path.color || theme.accent;
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    // 2. Draw Sleek Long-Tail "Comet" Vanishing Laser Trail (1.3s Duration)
    const LASER_LIFETIME = 1300; // 1.3s duration
    const now = Date.now();
    laserTrailRef.current = laserTrailRef.current.filter(pt => (now - pt.time) < LASER_LIFETIME);
    const trail = laserTrailRef.current;

    if (trail.length > 1) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const N = trail.length;
      for (let i = 1; i < N; i++) {
        const p1 = trail[i - 1];
        const p2 = trail[i];
        
        // Age factor (0 at newest, 1 at oldest)
        const age = now - p2.time;
        const ageAlpha = Math.max(0, 1 - age / LASER_LIFETIME);
        
        // Position ratio along trail (1 at head, 0 at tail tip)
        const posRatio = i / N;
        
        // Tapering width: Bulbous at head (~11px), tapering gracefully along the long tail
        const taperWidth = Math.max(1.2, 11 * Math.pow(posRatio, 0.85) * Math.sqrt(ageAlpha));
        const combinedAlpha = ageAlpha * (0.3 + 0.7 * Math.pow(posRatio, 0.7));

        // Smooth quadratic curve midpoint interpolation
        ctx.beginPath();
        if (i === 1) {
          ctx.moveTo(p1.x, p1.y);
        } else {
          const prevMidX = (trail[i - 2].x + p1.x) / 2;
          const prevMidY = (trail[i - 2].y + p1.y) / 2;
          ctx.moveTo(prevMidX, prevMidY);
        }
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);

        // Outer Plasma Fluid Arc Segment
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = taperWidth;
        ctx.shadowColor = theme.accent;
        ctx.shadowBlur = 14 * ageAlpha;
        ctx.globalAlpha = combinedAlpha;
        ctx.stroke();

        // Inner Specular White Core Segment
        if (posRatio > 0.2 && taperWidth > 2.0) {
          ctx.beginPath();
          if (i === 1) {
            ctx.moveTo(p1.x, p1.y);
          } else {
            const prevMidX = (trail[i - 2].x + p1.x) / 2;
            const prevMidY = (trail[i - 2].y + p1.y) / 2;
            ctx.moveTo(prevMidX, prevMidY);
          }
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = taperWidth * 0.4;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 6 * ageAlpha;
          ctx.globalAlpha = combinedAlpha * 0.85;
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 3. Draw Luminous Organic Head Nucleus
    if (activeTool === 'laser' && laserRef.current) {
      const { x, y } = laserRef.current;
      ctx.save();

      // Outer radial plasma halo
      const radGlow = ctx.createRadialGradient(x, y, 0, x, y, 28);
      radGlow.addColorStop(0, `${theme.accent}ee`);
      radGlow.addColorStop(0.45, `${theme.accent}55`);
      radGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fillStyle = radGlow;
      ctx.fill();

      // Bulbous organic head
      ctx.beginPath();
      ctx.arc(x, y, 8.5, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent;
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = 22;
      ctx.fill();

      // Hot white nucleus
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.fill();

      ctx.restore();
    }
  };

  const clearCanvas = () => { pathsRef.current = []; currentPathRef.current = []; laserTrailRef.current = []; redraw(); };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (showTimerPicker || showNavDrawer || showInfoModal) {
        if (e.code === 'Escape') {
          setShowTimerPicker(false);
          setShowNavDrawer(false);
          setShowInfoModal(false);
        }
        return;
      }
      if (e.code === 'ArrowRight' || e.code === 'Space') { e.preventDefault(); setCurrentIndex(i => Math.min(i + 1, totalCount - 1)); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); setCurrentIndex(i => Math.max(i - 1, 0)); }
      else if (e.code === 'ArrowDown') { e.preventDefault(); scrollContainerRef.current?.scrollBy({ top: 140, behavior: 'smooth' }); }
      else if (e.code === 'ArrowUp') { e.preventDefault(); scrollContainerRef.current?.scrollBy({ top: -140, behavior: 'smooth' }); }
      else if (e.code === 'PageDown') { e.preventDefault(); scrollContainerRef.current?.scrollBy({ top: 320, behavior: 'smooth' }); }
      else if (e.code === 'PageUp') { e.preventDefault(); scrollContainerRef.current?.scrollBy({ top: -320, behavior: 'smooth' }); }
      else if (e.key === 'l' || e.key === 'L') setActiveTool(t => t === 'laser' ? 'none' : 'laser');
      else if (e.key === 'p' || e.key === 'P') setActiveTool(t => t === 'pen' ? 'none' : 'pen');
      else if (e.key === 'x' || e.key === 'X') clearCanvas();
      else if (e.key === 't' || e.key === 'T') handleTimerClick();
      else if (e.key === '+' || e.key === '=') zoomIn();
      else if (e.key === '-') zoomOut();
      else if (e.code === 'Escape') { if (activeTool !== 'none') setActiveTool('none'); else onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTool, totalCount, showTimerPicker, showNavDrawer, showInfoModal, timerCount, timerPreset, timerRunning]);

  const onPointerDown = (e) => {
    if (activeTool === 'none') return;
    if (activeTool === 'laser') return; // Laser pointer is non-blocking global cursor spotlight

    e.preventDefault();
    e.stopPropagation();
    if (e.target.setPointerCapture) {
      try { e.target.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }

    setIsDrawingState(true);
    currentPathRef.current = [{ x: e.clientX, y: e.clientY }];
    pathsRef.current = [...pathsRef.current, { color: theme.accent, points: currentPathRef.current }];
    redraw();
  };

  const onPointerMove = (e) => {
    if (activeTool !== 'pen' || !isDrawingState) return;
    e.preventDefault();
    e.stopPropagation();

    currentPathRef.current.push({ x: e.clientX, y: e.clientY });
    redraw();
  };

  const onPointerUp = (e) => {
    if (activeTool !== 'pen') return;
    if (e && e.target.releasePointerCapture) {
      try { e.target.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    if (!isDrawingState) return;
    setIsDrawingState(false);
    currentPathRef.current = [];
  };

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(jumpInputValue, 10);
    if (!isNaN(val) && val >= 1 && val <= totalCount) {
      setCurrentIndex(val - 1);
      setShowNavDrawer(false);
    }
  };

  const handleLimitSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(limitInputValue, 10);
    if (!isNaN(val) && val >= 1) {
      const targetLimit = val >= questions.length ? null : val;
      setMaxQuestionsLimit(targetLimit);
      setShowNavDrawer(false);
    }
  };

  if (!currentQuestion) return null;

  const isPenActive = activeTool === 'pen';
  const isLaserActive = activeTool === 'laser';
  const timerDone = timerCount === 0;

  // Ultra-Compact Slender Toolbar Button (100% Unified Color Language & Styling)
  const TBtn = ({ icon: Icon, active, onClick, title }) => (
    <button onClick={onClick} title={title} style={{
      width: 32, height: 32, borderRadius: '999px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? theme.toolbarIconActiveBg : 'rgba(255, 255, 255, 0.05)',
      border: active ? `1px solid ${theme.toolbarIconActive}50` : `1px solid ${theme.toolbarBorder}`,
      color: active ? theme.toolbarIconActive : theme.toolbarIcon,
      cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s ease',
    }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = `${theme.toolbarIconActive}18`;
          e.currentTarget.style.borderColor = `${theme.toolbarIconActive}35`;
          e.currentTarget.style.color = theme.toolbarIconActive;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = theme.toolbarBorder;
          e.currentTarget.style.color = theme.toolbarIcon;
        }
      }}
    >
      <Icon size={15} />
    </button>
  );

  // Aspect Ratio container sizing — 6 Popular Video Formats!
  const getContainerStyle = () => {
    switch (aspectRatio) {
      case '16:9':
        return {
          width: '98vw',
          maxWidth: '1440px',
          aspectRatio: '16 / 9',
          maxHeight: 'calc(100vh - 65px)',
        };
      case '9:16':
        return {
          width: '94vw',
          maxWidth: '440px',
          aspectRatio: '9 / 16',
          maxHeight: 'calc(100vh - 70px)',
        };
      case '1:1':
        return {
          width: '94vw',
          maxWidth: '720px',
          aspectRatio: '1 / 1',
          maxHeight: 'calc(100vh - 70px)',
        };
      case '4:3':
        return {
          width: '96vw',
          maxWidth: '1060px',
          aspectRatio: '4 / 3',
          maxHeight: 'calc(100vh - 65px)',
        };
      case '3:2':
        return {
          width: '97vw',
          maxWidth: '1180px',
          aspectRatio: '3 / 2',
          maxHeight: 'calc(100vh - 65px)',
        };
      case 'fit':
      default:
        return {
          width: '98vw',
          maxWidth: '1360px',
          height: '100%',
          maxHeight: 'calc(100vh - 65px)',
        };
    }
  };

  return (
    <div
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: theme.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.4s ease',
        overflow: 'hidden',
        padding: '6px 12px',
        gap: '6px',
        userSelect: activeTool !== 'none' ? 'none' : 'auto',
        WebkitUserSelect: activeTool !== 'none' ? 'none' : 'auto',
      }}
    >
      {/* ── Canvas overlay (zIndex: 300 when active, lower than toolbar zIndex: 400!) ── */}
      <canvas ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'fixed', inset: 0,
          zIndex: isPenActive ? 300 : (isLaserActive ? 250 : 100),
          pointerEvents: (isPenActive || isLaserActive) ? 'auto' : 'none',
          cursor: isLaserActive ? 'none' : (isPenActive ? 'crosshair' : 'default'),
          touchAction: (isPenActive || isLaserActive) ? 'none' : 'auto',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      />

      {/* ── 1. STUDIO CARD WITH DYNAMIC AESTHETIC BORDER & GLOW ── */}
      <motion.div
        layout
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        style={{
          position: 'relative', zIndex: 200,
          display: 'flex', flexDirection: 'column',
          borderRadius: '26px',
          padding: '2.5px', // Refined 2.5px border track
          background: currentAesthetic.borderTrackBg,
          boxShadow: currentAesthetic.boxShadow,
          overflow: 'hidden', // Clips 360 beam strictly to 26px rounded border perimeter!
          ...getContainerStyle(),
        }}
      >
        {/* Dynamic Animated Traveling Border Beam Line */}
        <div style={{
          position: 'absolute',
          top: '-100%', left: '-100%',
          width: '300%', height: '300%',
          background: currentAesthetic.beamBg,
          animation: currentAesthetic.beamAnim,
          filter: currentAesthetic.beamFilter,
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* Inner Card Surface */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          borderRadius: '24px',
          background: theme.bg,
          overflow: 'hidden',
        }}>
          {/* Floating Sleek Glassmorphic Top Deck Header Bar (Absolute Top 0 with Rounded Corner Insets) */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '56px',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px',
            zIndex: 50,
            background: theme.type === 'app' && (theme.id === 'sepia' || theme.id === 'light')
              ? 'rgba(255,255,255,0.48)'
              : 'rgba(0,0,0,0.38)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderBottom: 'none',
            pointerEvents: 'none',
          }}>
            {/* Official MCQKash PRO Branding Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', pointerEvents: 'auto' }}>
              <span style={{ fontSize: '19.5px', fontWeight: 900, letterSpacing: '-0.02em', color: theme.qText }}>
                MCQ<span style={{ color: theme.accent }}>Kash</span>
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 900, letterSpacing: '0.12em',
                padding: '3px 10px', borderRadius: '999px',
                background: theme.proCapsuleBg || `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}ee 100%)`,
                color: theme.proCapsuleText || '#ffffff',
                textTransform: 'uppercase',
                boxShadow: `0 2px 10px ${theme.accent}50`,
              }}>
                PRO
              </span>
            </div>

            {/* Premium Glassmorphic Timer Badge: [ ⏱ 30s ⚙ ] */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                height: '28px', minHeight: '28px', maxHeight: '28px',
                padding: '0 10px', borderRadius: '999px',
                background: timerDone
                  ? 'rgba(239,68,68,0.2)'
                  : (timerRunning
                    ? `linear-gradient(135deg, ${theme.accent}22 0%, ${theme.accent}10 100%)`
                    : (theme.type === 'app' && (theme.id === 'sepia' || theme.id === 'light') ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)')),
                border: `1px solid ${timerDone ? '#f87171' : (timerRunning ? theme.accent : (theme.type === 'app' && (theme.id === 'sepia' || theme.id === 'light') ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.16)'))}`,
                color: timerDone ? '#f87171' : theme.qText,
                boxShadow: timerDone
                  ? '0 0 14px rgba(239,68,68,0.35)'
                  : (timerRunning ? `0 0 12px ${theme.accent}30` : '0 2px 8px rgba(0,0,0,0.08)'),
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                transition: 'all 0.25s ease',
                animation: timerDone ? 'timerPulse 1s ease-in-out infinite' : 'none',
              }}>
                {/* Clicking time digits toggles Start / Pause / Restart */}
                <button
                  onClick={handleTimerClick}
                  className="mcq-tag-btn"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    cursor: 'pointer', background: 'none', border: 'none', color: 'inherit',
                    padding: 0, minHeight: 0, height: 'auto',
                  }}
                  title={timerCount === 0 ? 'Click to restart timer' : (timerRunning ? 'Click to pause timer' : 'Click to start timer')}
                >
                  <Timer size={13} style={{ animation: timerRunning ? 'timerSpin 3s linear infinite' : 'none', flexShrink: 0, color: theme.accent }} />
                  <span style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.03em', lineHeight: 1 }}>
                    {timerCount}s
                  </span>
                </button>

                {/* Settings Icon opens Timer Config Popover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTimerPicker(p => !p);
                  }}
                  className="mcq-tag-btn"
                  style={{
                    cursor: 'pointer', background: 'none', border: 'none',
                    color: 'inherit', display: 'inline-flex', padding: 0, opacity: 0.8,
                    transition: 'transform 0.25s ease, opacity 0.2s ease',
                    marginLeft: '2px', minHeight: 0, height: 'auto',
                  }}
                  title="Timer Settings"
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'rotate(45deg)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
                >
                  <Settings size={13} />
                </button>
              </div>

              {/* Quick Timer Setup Popover (Right-Pinned Popover to fit mobile perfectly) */}
              <AnimatePresence>
                {showTimerPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    style={{
                      position: 'absolute',
                      top: '36px',
                      right: 0,
                      left: 'auto',
                      background: theme.type === 'app' && (theme.id === 'sepia' || theme.id === 'light')
                        ? '#ffffff'
                        : theme.toolbarBg,
                      border: `1.5px solid ${theme.toolbarBorder}`,
                      borderRadius: '16px', padding: '12px',
                      display: 'flex', flexDirection: 'column', gap: '10px',
                      width: '270px',
                      maxWidth: 'calc(100vw - 32px)', zIndex: 1000,
                      boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                    }}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 800, color: theme.toolbarIcon, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Countdown Presets
                    </div>

                    {/* Preset grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                      {TIMER_PRESETS.map(s => (
                        <button
                          key={s}
                          onClick={() => setPreset(s)}
                          className="mcq-tag-btn"
                          style={{
                            padding: '6px 0', borderRadius: '8px', textAlign: 'center',
                            fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                            minHeight: 0,
                            background: timerPreset === s ? theme.toolbarIconActiveBg : 'rgba(0,0,0,0.04)',
                            border: timerPreset === s ? `1px solid ${theme.toolbarIconActive}50` : '1px solid transparent',
                            color: timerPreset === s ? theme.toolbarIconActive : theme.toolbarIcon,
                          }}
                        >
                          {s}s
                        </button>
                      ))}
                    </div>

                    {/* Quick Add / Subtract */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => adjustTimerPreset(-5)}
                        className="mcq-tag-btn"
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
                          padding: '6px 0', borderRadius: '8px', background: 'rgba(0,0,0,0.04)', minHeight: 0,
                          border: '1px solid transparent', color: theme.toolbarIcon, fontSize: '10.5px', fontWeight: 700, cursor: 'pointer'
                        }}
                        title="Subtract 5s from preset & count"
                      >
                        <Minus size={9} />5s
                      </button>
                      <button
                        onClick={() => adjustTimerPreset(-2)}
                        className="mcq-tag-btn"
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
                          padding: '6px 0', borderRadius: '8px', background: 'rgba(0,0,0,0.04)', minHeight: 0,
                          border: '1px solid transparent', color: theme.toolbarIcon, fontSize: '10.5px', fontWeight: 700, cursor: 'pointer'
                        }}
                        title="Subtract 2s from preset & count"
                      >
                        <Minus size={9} />2s
                      </button>
                      <button
                        onClick={() => adjustTimerPreset(2)}
                        className="mcq-tag-btn"
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
                          padding: '6px 0', borderRadius: '8px', background: 'rgba(0,0,0,0.04)', minHeight: 0,
                          border: '1px solid transparent', color: theme.toolbarIcon, fontSize: '10.5px', fontWeight: 700, cursor: 'pointer'
                        }}
                        title="Add 2s to preset & count"
                      >
                        <Plus size={9} />2s
                      </button>
                      <button
                        onClick={() => adjustTimerPreset(5)}
                        className="mcq-tag-btn"
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
                          padding: '6px 0', borderRadius: '8px', background: 'rgba(0,0,0,0.04)', minHeight: 0,
                          border: '1px solid transparent', color: theme.toolbarIcon, fontSize: '10.5px', fontWeight: 700, cursor: 'pointer'
                        }}
                        title="Add 5s to preset & count"
                      >
                        <Plus size={9} />5s
                      </button>
                    </div>

                    {/* Direct Custom Seconds Input Field */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '5px 8px', borderRadius: '8px',
                      background: 'rgba(0,0,0,0.03)', border: `1px solid ${theme.toolbarBorder}`,
                    }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: theme.toolbarIcon }}>Custom Time:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <input
                          type="number"
                          min="1"
                          max="300"
                          value={timerPreset}
                          onChange={(e) => setCustomTimerPreset(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          style={{
                            width: '42px', padding: '2px 4px', borderRadius: '5px',
                            background: 'rgba(0,0,0,0.08)', border: `1px solid ${theme.toolbarBorder}`,
                            color: theme.toolbarIconActive, fontSize: '11px', fontWeight: 800,
                            fontFamily: 'monospace', textAlign: 'center', outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: theme.toolbarIcon }}>sec</span>
                      </div>
                    </div>

                    {/* Timer Actions: Reset & Sound Toggle */}
                    <div style={{ display: 'flex', gap: '6px', paddingTop: '6px', borderTop: `1px solid ${theme.toolbarBorder}` }}>
                      <button
                        onClick={resetTimer}
                        className="mcq-tag-btn"
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          padding: '6px', borderRadius: '8px', background: 'rgba(0,0,0,0.04)', minHeight: 0,
                          border: '1px solid transparent', color: theme.toolbarIcon, fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                        }}
                        title="Reset timer to preset"
                      >
                        <RotateCcw size={11} /> Reset
                      </button>

                      <button
                        onClick={() => setSoundEnabled(s => !s)}
                        className="mcq-tag-btn"
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          padding: '6px', borderRadius: '8px', minHeight: 0,
                          background: soundEnabled ? theme.toolbarIconActiveBg : 'rgba(0,0,0,0.04)',
                          border: soundEnabled ? `1px solid ${theme.toolbarIconActive}40` : '1px solid transparent',
                          color: soundEnabled ? theme.toolbarIconActive : theme.toolbarIcon,
                          fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                        }}
                        title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
                      >
                        {soundEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />}
                        {soundEnabled ? 'Sound On' : 'Muted'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dynamic Aesthetic Progress Bar along bottom edge of top header */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: currentAesthetic.progressBar.height || '2.5px',
              background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden',
              zIndex: 60,
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  borderRadius: '0 2px 2px 0',
                  '--current-progress': `${((currentIndex + 1) / totalCount) * 100}%`,
                  ...currentAesthetic.progressBar,
                }}
              />
            </div>
          </div>

          {/* Scrollable Slide Content */}
          <div
            ref={scrollContainerRef}
            className="studio-scroll"
            style={{
              flex: 1, overflowY: 'auto',
              padding: '60px 24px 20px 24px',
              pointerEvents: isPenActive ? 'none' : 'auto',
              scrollbarWidth: 'none',
            }}
          >
            <style>{`
              ::selection {
                background: ${theme.accent} !important;
                color: ${theme.proCapsuleText || '#ffffff'} !important;
                text-shadow: 0 1px 2px rgba(0,0,0,0.4) !important;
              }
              ::-moz-selection {
                background: ${theme.accent} !important;
                color: ${theme.proCapsuleText || '#ffffff'} !important;
                text-shadow: 0 1px 2px rgba(0,0,0,0.4) !important;
              }
              .studio-scroll::-webkit-scrollbar { display: none; }
              @keyframes timerPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
              @keyframes timerSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes studioBorderRotate {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes studioCyberHue {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
              }
              @keyframes studioBreathingSync {
                0% { opacity: 0.45; filter: drop-shadow(0 0 4px ${theme.accent}30); }
                100% { opacity: 0.95; filter: drop-shadow(0 0 10px ${theme.accent}77); }
              }
              @keyframes studioHaloRadiance {
                0% { opacity: 0.45; filter: drop-shadow(0 0 6px ${theme.accent}66); }
                50% { opacity: 1.0; filter: drop-shadow(0 0 16px ${theme.accent}) drop-shadow(0 0 8px ${theme.explAccent}) drop-shadow(0 0 4px #ffffff); }
                100% { opacity: 0.45; filter: drop-shadow(0 0 6px ${theme.accent}66); }
              }
              @keyframes studioHaloProgressPulse {
                0% { box-shadow: 0 0 5px ${theme.accent}66; filter: brightness(0.9); }
                50% { box-shadow: 0 0 18px ${theme.accent}, 0 0 10px ${theme.explAccent}, 0 0 4px #ffffff; filter: brightness(1.35); }
                100% { box-shadow: 0 0 5px ${theme.accent}66; filter: brightness(0.9); }
              }
              @keyframes studioPhotonFlicker {
                0% { filter: brightness(0.85) drop-shadow(0 0 6px ${theme.accent}); opacity: 0.7; }
                100% { filter: brightness(1.3) drop-shadow(0 0 16px ${theme.explAccent}) drop-shadow(0 0 6px #ffffff); opacity: 1.0; }
              }
              @keyframes studioLiquidShineGlow {
                0% { filter: brightness(0.88) drop-shadow(0 0 4px ${theme.accent}66); opacity: 0.8; }
                50% { filter: brightness(1.3) drop-shadow(0 0 14px ${theme.accent}) drop-shadow(0 0 6px #ffffff); opacity: 1.0; }
                100% { filter: brightness(0.88) drop-shadow(0 0 4px ${theme.accent}66); opacity: 0.8; }
              }
              @keyframes studioWaveSweep {
                0% { transform: translateX(-25%); }
                100% { transform: translateX(25%); }
              }
              @keyframes studioDiagonalShimmer {
                0% { transform: translate(-30%, -30%) scale(1.1); }
                100% { transform: translate(30%, 30%) scale(1.1); }
              }
              .mcq-explanation-content p, .studio-expl-content p { margin-bottom: 8px; }
              .mcq-explanation-content ul, .studio-expl-content ul, .mcq-explanation-content ol, .studio-expl-content ol { padding-left: 20px; margin-bottom: 8px; }
              .mcq-explanation-content li, .studio-expl-content li { margin-bottom: 4px; }
              .mcq-explanation-content strong, .studio-expl-content strong { font-weight: 700; color: ${theme.explAccent}; }
              .mcq-explanation-content em, .studio-expl-content em { font-style: italic; opacity: 0.85; }
              
              /* Ultra-Sleek Theme-Sensitive Data Table & Wrapper Override for MCQ Studio */
              .nk-mentor-table-wrapper {
                background: transparent !important;
                border: 1px solid ${theme.optionBorder} !important;
                border-radius: 14px !important;
                box-shadow: 0 4px 20px rgba(0,0,0,0.18) !important;
                margin: 14px 0 !important;
                overflow: hidden !important;
              }
              .nk-mentor-table-wrapper table, .nk-mentor-table, table {
                width: 100% !important;
                border-collapse: separate !important;
                border-spacing: 0 !important;
                margin: 0 !important;
                background: transparent !important;
              }
              .nk-mentor-table th, table th, th {
                background: ${theme.tagBg || `${theme.accent}15`} !important;
                color: ${theme.accent} !important;
                font-weight: 800 !important;
                padding: 11px 16px !important;
                text-align: left !important;
                border-bottom: 1.5px solid ${theme.optionBorder} !important;
                font-size: 13px !important;
                letter-spacing: 0.05em !important;
                text-transform: uppercase !important;
              }
              .nk-mentor-table td, table td, td {
                padding: 10px 16px !important;
                color: ${theme.qText} !important;
                border-bottom: 1px solid ${theme.optionBorder} !important;
                font-size: 13.5px !important;
                font-weight: 500 !important;
                background: ${theme.optionBg} !important;
              }
              .mcq-explanation-content tr:nth-child(even) td, .studio-expl-content tr:nth-child(even) td, tr:nth-child(even) td {
                background: ${theme.type === 'app' && (theme.id === 'sepia' || theme.id === 'light') ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.035)'} !important;
              }
              .nk-mentor-table tr:hover td, table tr:hover td, tr:hover td {
                background: ${theme.optionHoverBg} !important;
                color: ${theme.accent} !important;
              }
              .nk-mentor-table tr:last-child td, table tr:last-child td, tr:last-child td {
                border-bottom: none !important;
              }

              .mcq-explanation-content img, .studio-expl-content img, .studio-img, img { max-width: 100%; max-height: 240px; object-fit: contain; border-radius: 12px; margin: 8px 0; cursor: zoom-in; transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
              .mcq-explanation-content img.expanded-studio-img, .studio-expl-content img.expanded-studio-img, .studio-img.expanded-studio-img, img.expanded-studio-img { max-height: 600px !important; width: 100% !important; cursor: zoom-out !important; border-radius: 16px !important; box-shadow: 0 12px 36px rgba(0,0,0,0.35) !important; }
              .mcq-explanation-content h4, .studio-expl-content h4, .mcq-explanation-content h5, .studio-expl-content h5 { color: ${theme.explAccent}; font-weight: 700; margin: 8px 0 4px; }
            `}</style>
            <StudioMcqSlide key={currentQuestion.id} question={currentQuestion} theme={theme} contentScale={contentScale} soundEnabled={soundEnabled} />
          </div>
        </div>
      </motion.div>

      <div 
        className="no-scrollbar"
        style={{
          position: 'relative', zIndex: 400,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
          gap: '4px',
          padding: '4px 12px', borderRadius: '999px',
          maxWidth: '96vw',
          background: theme.toolbarBg,
          border: `1.5px solid ${theme.toolbarBorder}`,
          boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)`,
          backdropFilter: 'blur(20px)',
          flexShrink: 0,
          whiteSpace: 'nowrap',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {/* Navigation & Direct-Editable Question Jump & Deck Limit Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'relative' }}>
          <TBtn icon={ChevronLeft} onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))} title="Previous Question (←)" />
          
          {/* Direct-Editable Counter Pill: [ Input: 47 ] / [ Input: 156 ] */}
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: '3px 8px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${theme.toolbarBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              transition: 'all 0.15s ease',
            }}
          >
            {/* 1. Directly Editable Current Question Number */}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={jumpInputValue}
              onChange={(e) => setJumpInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              onFocus={(e) => e.target.select()}
              onBlur={handleJumpSubmitInline}
              style={{
                width: `${Math.max(20, String(jumpInputValue).length * 8 + 6)}px`,
                background: 'transparent', border: 'none', outline: 'none',
                color: theme.toolbarIconActive, fontWeight: 900, fontSize: '11.5px',
                fontFamily: 'monospace', textAlign: 'center', cursor: 'text',
                padding: '1px 0',
              }}
              title="Click & type question number to jump (Press Enter or click outside)"
            />

            <span style={{ opacity: 0.35, fontSize: '10.5px', color: theme.toolbarIcon }}>/</span>

            {/* 2. Directly Editable Total Question Limit */}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={limitInputValue}
              onChange={(e) => setLimitInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              onFocus={(e) => e.target.select()}
              onBlur={handleLimitSubmitInline}
              style={{
                width: `${Math.max(24, String(limitInputValue).length * 8 + 6)}px`,
                background: 'transparent', border: 'none', outline: 'none',
                color: theme.toolbarIcon, fontWeight: 800, fontSize: '11.5px',
                fontFamily: 'monospace', textAlign: 'center', cursor: 'text',
                padding: '1px 0',
              }}
              title={`Click & type total questions limit for this deck (Max: ${questions.length}) (Press Enter or click outside)`}
            />

            {/* Quick Menu Settings Icon */}
            <button
              onClick={() => setShowNavDrawer(p => !p)}
              title="Quick presets & navigation drawer"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: theme.toolbarIcon, opacity: 0.6, padding: '1px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: '1px', transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
            >
              <SlidersHorizontal size={11} />
            </button>
          </div>

          <TBtn icon={ChevronRight} onClick={() => setCurrentIndex(i => Math.min(i + 1, totalCount - 1))} title="Next Question (→)" />

          {/* End Navigation & Counter Group */}
        </div>

        {/* Zoom / Font Size Controls (- / + ONLY) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <TBtn icon={ZoomOut} onClick={zoomOut} title="Decrease Text Size (-)" />
          <TBtn icon={ZoomIn} onClick={zoomIn} title="Increase Text Size (+)" />
        </div>

        {/* Aspect Ratio 1-Click Cycle Button (16:9 -> 9:16 -> 1:1 -> 4:3 -> 3:2 -> fit -> 16:9) */}
        <button
          onClick={toggleAspectRatio}
          title={`Aspect Ratio: ${aspectRatio} (Click to cycle: 16:9, 9:16, 1:1, 4:3, 3:2, Fit)`}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            height: '32px', padding: '0 10px', borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${theme.toolbarBorder}`,
            color: theme.toolbarIcon,
            fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = `${theme.toolbarIconActive}20`;
            e.currentTarget.style.borderColor = `${theme.toolbarIconActive}40`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = theme.toolbarBorder;
          }}
        >
          {aspectRatio === '16:9' && <Monitor size={14} />}
          {aspectRatio === '9:16' && <Smartphone size={14} />}
          {aspectRatio === '1:1' && <Square size={14} />}
          {aspectRatio === '4:3' && <Tv size={14} />}
          {aspectRatio === '3:2' && <Camera size={14} />}
          {aspectRatio === 'fit' && <Maximize2 size={14} />}
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {aspectRatio === 'fit' ? 'Fit' : aspectRatio}
          </span>
        </button>

        {/* Canvas Annotation Tools (Laser / Pen / Clear) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <TBtn icon={Circle} active={activeTool === 'laser'} onClick={() => setActiveTool(t => t === 'laser' ? 'none' : 'laser')} title="Laser Pointer (L)" />
          <TBtn icon={Pencil} active={activeTool === 'pen'} onClick={() => setActiveTool(t => t === 'pen' ? 'none' : 'pen')} title="Pen Annotation (D)" />
          <TBtn icon={Trash2} onClick={clearCanvas} title="Clear Drawing (C)" />
        </div>

        {/* 1-Click Studio Theme Switcher */}
        <TBtn
          icon={Palette}
          onClick={cycleTheme}
          title={`Theme: ${theme.label} (Click to cycle themes)`}
        />

        {/* 1-Click Aesthetic Style Switcher */}
        <TBtn
          icon={Sparkles}
          onClick={cycleAestheticStyle}
          title={`Studio Aesthetic: ${AESTHETIC_MODES.find(m => m.id === aestheticStyle)?.name || 'Dual Orbit Beam'} (Click to cycle card aesthetics)`}
        />

        {/* Info & Keyboard Shortcuts Button */}
        <TBtn icon={HelpCircle} active={showInfoModal} onClick={() => setShowInfoModal(p => !p)} title="Keyboard Shortcuts & Studio Controls" />

        {/* Exit Presenter Studio */}
        <TBtn icon={X} onClick={onClose} title="Exit Studio (Esc)" />
      </div>

      {/* ── TOP-LEVEL HIGH-ZINDEX POPOVER PORTALS (Zero CSS Overflow Clipping!) ── */}
      {/* 0. AESTHETIC STYLE TOAST NOTIFICATION */}
      <AnimatePresence>
        {aestheticToast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: '76px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '999px',
              background: theme.toolbarBg,
              border: `1.5px solid ${theme.toolbarBorder}`,
              color: theme.toolbarIconActive,
              boxShadow: `0 14px 35px rgba(0,0,0,0.65), 0 0 20px ${theme.accent}33`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              pointerEvents: 'none',
            }}
          >
            <Sparkles size={15} style={{ color: theme.accent }} />
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
              Studio Aesthetic: <span style={{ color: theme.accent }}>{aestheticToast.name}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. DUAL-MODE JUMP TO QUESTION & SESSION LIMIT POPOVER */}
      <AnimatePresence>
        {showNavDrawer && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{
              position: 'fixed',
              bottom: '72px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: theme.toolbarBg,
              border: `1.5px solid ${theme.toolbarBorder}`,
              borderRadius: '22px', padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '14px',
              width: 'calc(100vw - 28px)',
              maxWidth: '330px', zIndex: 999999,
              boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            {/* 1. Jump to Question Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 800, color: theme.toolbarIconActive, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  <Hash size={12} />
                  <span>Jump to Question (1–{totalCount})</span>
                </div>
                <button onClick={() => setShowNavDrawer(false)} style={{ background: 'none', border: 'none', color: theme.toolbarIcon, cursor: 'pointer', opacity: 0.7 }}>
                  <X size={13} />
                </button>
              </div>

              <form onSubmit={handleJumpSubmit} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  min="1"
                  max={totalCount}
                  placeholder={`Current: ${currentIndex + 1}`}
                  value={jumpInputValue}
                  onChange={e => setJumpInputValue(e.target.value)}
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${theme.toolbarBorder}`,
                    color: theme.qText, fontSize: '12px', fontWeight: 700,
                    outline: 'none', fontFamily: 'monospace',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '6px 12px', borderRadius: '8px',
                    background: theme.toolbarIconActiveBg,
                    border: `1px solid ${theme.toolbarIconActive}50`,
                    color: theme.toolbarIconActive,
                    fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  Jump
                </button>
              </form>

              {/* Quick Jump Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {Array.from(new Set([1, Math.round(totalCount * 0.25), Math.round(totalCount * 0.5), Math.round(totalCount * 0.75), totalCount]))
                  .filter(n => n >= 1 && n <= totalCount)
                  .sort((a, b) => a - b)
                  .map(num => (
                    <button
                      key={num}
                      onClick={() => {
                        setCurrentIndex(num - 1);
                        setShowNavDrawer(false);
                      }}
                      style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, cursor: 'pointer',
                        background: currentIndex + 1 === num ? theme.toolbarIconActiveBg : 'rgba(255,255,255,0.05)',
                        border: currentIndex + 1 === num ? `1px solid ${theme.toolbarIconActive}50` : '1px solid transparent',
                        color: currentIndex + 1 === num ? theme.toolbarIconActive : theme.toolbarIcon,
                      }}
                    >
                      Q{num}
                    </button>
                  ))}
              </div>
            </div>

            <div style={{ height: 1, background: theme.toolbarBorder, opacity: 0.4 }} />

            {/* 2. Total Session Question Limit Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 800, color: theme.toolbarIcon, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  <SlidersHorizontal size={12} />
                  <span>Studio Deck Limit ({questions.length} Total)</span>
                </div>
              </div>

              <form onSubmit={handleLimitSubmit} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  min="1"
                  max={questions.length}
                  placeholder={`Max: ${questions.length}`}
                  value={limitInputValue}
                  onChange={e => setLimitInputValue(e.target.value)}
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${theme.toolbarBorder}`,
                    color: theme.qText, fontSize: '12px', fontWeight: 700,
                    outline: 'none', fontFamily: 'monospace',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '6px 12px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.08)',
                    border: `1px solid ${theme.toolbarBorder}`,
                    color: theme.qText,
                    fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  Apply
                </button>
              </form>

              {/* Preset Limit Chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                {[5, 10, 20, 30, 50, 100].map(num => (
                  num < questions.length && (
                    <button
                      key={num}
                      onClick={() => {
                        setMaxQuestionsLimit(num);
                        setShowNavDrawer(false);
                      }}
                      style={{
                        padding: '5px 0', borderRadius: '6px', fontSize: '10px', fontWeight: 800, cursor: 'pointer', textAlign: 'center',
                        background: maxQuestionsLimit === num ? theme.toolbarIconActiveBg : 'rgba(255,255,255,0.04)',
                        border: maxQuestionsLimit === num ? `1px solid ${theme.toolbarIconActive}50` : '1px solid transparent',
                        color: maxQuestionsLimit === num ? theme.toolbarIconActive : theme.toolbarIcon,
                      }}
                    >
                      {num} Qs
                    </button>
                  )
                ))}
                <button
                  onClick={() => { setMaxQuestionsLimit(null); setShowNavDrawer(false); }}
                  style={{
                    padding: '5px 0', borderRadius: '6px', fontSize: '10px', fontWeight: 800, cursor: 'pointer', textAlign: 'center',
                    gridColumn: (questions.length <= 100 ? 'span 2' : 'span 3'),
                    background: maxQuestionsLimit === null ? theme.toolbarIconActiveBg : 'rgba(255,255,255,0.05)',
                    border: maxQuestionsLimit === null ? `1px solid ${theme.toolbarIconActive}50` : '1px solid transparent',
                    color: maxQuestionsLimit === null ? theme.toolbarIconActive : theme.toolbarIcon,
                  }}
                >
                  All ({questions.length})
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. INFO & KEYBOARD SHORTCUTS POPOVER */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{
              position: 'fixed',
              bottom: '72px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: theme.toolbarBg,
              border: `1.5px solid ${theme.toolbarBorder}`,
              borderRadius: '22px', padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '10px',
              width: 'calc(100vw - 28px)',
              maxWidth: '310px', zIndex: 999999,
              boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.toolbarBorder}`, paddingBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: theme.qText, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Presenter Controls & Shortcuts
              </span>
              <button onClick={() => setShowInfoModal(false)} style={{ background: 'none', border: 'none', color: theme.toolbarIcon, cursor: 'pointer' }}>
                <X size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '12px', color: theme.bodyText }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Select Option A, B, C, D</span>
                <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>A / B / C / D or 1 - 4</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Next / Prev Question</span>
                <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>← / → / Space</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Scroll Card Up / Down</span>
                <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>↑ / ↓</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Vanishing Laser Ink</span>
                <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>L</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Pen Annotation</span>
                <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>P</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Clear Drawings</span>
                <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>X</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Start / Pause Timer</span>
                <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>T</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Zoom Text</span>
                <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>+ / -</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Exit Studio</span>
                <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>Esc</kbd>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
