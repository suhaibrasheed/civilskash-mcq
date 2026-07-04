import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Flame, X, ShieldAlert, Zap, TrendingUp, Gem, Snowflake, CheckCircle, Skull, AlertTriangle, Lock, Shield, ShieldCheck, Info, ChevronDown } from 'lucide-react';
import { useEconomy } from '../context/EconomyContext';
import { useTheme } from '../context/ThemeContext';
import { useSound } from '../context/SoundContext';
import UniversalModal from './UniversalModal';
import confetti from 'canvas-confetti';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend } from 'chart.js';
import { getCoinHistory } from '../lib/db';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export function formatKC(amount) {
  if (amount === undefined || amount === null) return '0';
  if (amount >= 1000000) return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (amount >= 1000) return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return amount.toString();
}

export function KashCoinIcon({ className = "w-5 h-5", glow = true }) {
  const { theme } = useTheme();
  const rawId = React.useId();
  const coinId = rawId.replace(/:/g, '');
  const bodyGradientId = `kc-body-${coinId}`;
  const rimGradientId = `kc-rim-${coinId}`;
  const innerGradientId = `kc-inner-${coinId}`;
  const shineGradientId = `kc-shine-${coinId}`;
  const bevelGradientId = `kc-bevel-${coinId}`;
  const themePalette = {
    light: {
      glow: 'drop-shadow(0 2px 4px rgba(120,53,15,0.22)) drop-shadow(0 0 8px rgba(245,158,11,0.28))',
      face1: '#FFF7BF',
      face2: '#FACC15',
      face3: '#F59E0B',
      face4: '#C66A08',
      rim1: '#FFF5B8',
      rim2: '#F8C316',
      rim3: '#C56507',
      kMain: '#9A4207',
      kShadow: '#5B2405',
      kLight: '#FFEBA6',
    },
    dark: {
      glow: 'drop-shadow(0 2px 6px rgba(0,0,0,0.38)) drop-shadow(0 0 13px rgba(251,191,36,0.48))',
      face1: '#FFF4B0',
      face2: '#FBBF24',
      face3: '#EA8A06',
      face4: '#9A4A0A',
      rim1: '#FFF0A3',
      rim2: '#EAB308',
      rim3: '#92400E',
      kMain: '#7A2E06',
      kShadow: '#2F1202',
      kLight: '#FFF0B8',
    },
    sepia: {
      glow: 'drop-shadow(0 2px 5px rgba(83,45,10,0.28)) drop-shadow(0 0 8px rgba(180,83,9,0.25))',
      face1: '#FFE8A6',
      face2: '#DDAA30',
      face3: '#C47A18',
      face4: '#8A4612',
      rim1: '#FFF0BA',
      rim2: '#D69B2B',
      rim3: '#9A5416',
      kMain: '#7B3A12',
      kShadow: '#321504',
      kLight: '#FFE7A1',
    },
  };
  const palette = themePalette[theme] || themePalette.light;

  const kMonogramPath = "M21.4 20.2H27.5V29.7L36.2 20.2H43.0L32.6 31.4L43.4 43.8H36.1L27.5 33.9V43.8H21.4V20.2Z";

  return (
    <svg
      viewBox="0 0 64 64"
      className={`${className} select-none pointer-events-none flex-shrink-0`}
      style={glow ? { filter: palette.glow } : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={bodyGradientId} cx="34%" cy="27%" r="72%" fx="30%" fy="22%">
          <stop offset="0%" stopColor={palette.face1} />
          <stop offset="34%" stopColor={palette.face2} />
          <stop offset="68%" stopColor={palette.face3} />
          <stop offset="100%" stopColor={palette.face4} />
        </radialGradient>
        <linearGradient id={rimGradientId} x1="14" y1="8" x2="52" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={palette.rim1} />
          <stop offset="42%" stopColor={palette.rim2} />
          <stop offset="100%" stopColor={palette.rim3} />
        </linearGradient>
        <linearGradient id={innerGradientId} x1="19" y1="17" x2="46" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={palette.rim1} stopOpacity="0.92" />
          <stop offset="50%" stopColor={palette.face2} stopOpacity="0.2" />
          <stop offset="100%" stopColor={palette.face4} stopOpacity="0.42" />
        </linearGradient>
        <linearGradient id={shineGradientId} x1="18" y1="12" x2="43" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={bevelGradientId} x1="17" y1="16" x2="48" y2="49" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.62" />
          <stop offset="46%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="100%" stopColor="#431407" stopOpacity="0.28" />
        </linearGradient>
      </defs>

      <circle cx="32" cy="32.9" r="28.8" fill="#5B2106" opacity="0.24" />
      <circle cx="32" cy="32" r="30" fill={`url(#${rimGradientId})`} />
      <circle cx="32" cy="32" r="27" fill="#7C2D12" opacity="0.28" />
      <circle cx="32" cy="32" r="26.3" fill={`url(#${bodyGradientId})`} />
      <circle cx="32" cy="32" r="22.3" fill="none" stroke={`url(#${innerGradientId})`} strokeWidth="3.1" />
      <circle cx="32" cy="32" r="28.4" fill="none" stroke={palette.kLight} strokeWidth="1.05" opacity="0.78" />
      <circle cx="32" cy="32" r="18.2" fill="none" stroke="#FFF8CF" strokeWidth="0.8" opacity={theme === 'dark' ? 0.34 : 0.5} />
      <circle cx="32" cy="32" r="25.2" fill={`url(#${bevelGradientId})`} opacity="0.44" />
      <path
        d="M15.7 26.6C19.5 16.2 28.1 11.2 39.4 12.5C35.2 14.5 31.4 17.1 28.1 20.2C24.9 23.4 22.3 27.1 20.2 31.4C18.1 30.3 16.7 28.7 15.7 26.6Z"
        fill={`url(#${shineGradientId})`}
      />
      <path d={kMonogramPath} fill={palette.kShadow} opacity="0.42" transform="translate(1.05 1.2)" />
      <path d={kMonogramPath} fill={palette.kLight} opacity="0.55" transform="translate(-0.75 -0.85)" />
      <path d={kMonogramPath} fill={palette.kMain} opacity="0.98" />
      <path d={kMonogramPath} fill="none" stroke={palette.kLight} strokeWidth="0.7" strokeLinejoin="round" opacity="0.36" />
    </svg>
  );
}

export function KashCoinDisplay({ amount, className = "", iconClassName = "w-[1.15em] h-[1.15em]", glow = true }) {
  const { theme } = useTheme();
  const [displayAmount, setDisplayAmount] = useState(amount || 0);
  const amountStyles = {
    light: { color: '#14224A', textShadow: '0 10px 24px rgba(13,27,62,0.14)' },
    dark: { color: '#FBBF24', textShadow: '0 0 14px rgba(251,191,36,0.34), 0 1px 1px rgba(0,0,0,0.35)' },
    sepia: { color: '#7C3A12', textShadow: '0 7px 18px rgba(124,58,18,0.16)' },
  };

  useEffect(() => {
    if (amount === undefined || amount === null) return;
    const targetAmount = amount;
    if (targetAmount === displayAmount) return;

    const duration = 2500;
    const startTime = performance.now();
    const startAmount = displayAmount;
    const diff = targetAmount - startAmount;

    let reqId;
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayAmount(Math.round(startAmount + diff * easeOut));
      if (progress < 1) {
        reqId = requestAnimationFrame(animate);
      } else {
        setDisplayAmount(targetAmount);
      }
    };
    reqId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqId);
  }, [amount]);

  return (
    <div className={`inline-flex items-center gap-1.5 align-middle ${className}`}>
      <span
        className="font-black tracking-tight tabular-nums leading-none"
        style={amountStyles[theme] || amountStyles.light}
      >
        {formatKC(displayAmount)}
      </span>
      <KashCoinIcon className={iconClassName} glow={glow} />
    </div>
  );
}

export function StreakModal({ isOpen, onClose }) {
  const { economy, placeStreakBet, calculateFreezeCost, buyStreakFreeze, checkVaultMaturities, claimVaultYield, breakVault, confirmFailure } = useEconomy();
  const { theme } = useTheme();
  const { playVictory, playShatter } = useSound();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stakeAmount, setStakeAmount] = useState(10);
  const [stakeDuration, setStakeDuration] = useState(7);
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState(null);
  const [doubleDownOffer, setDoubleDownOffer] = useState(null);
  const [breakVaultWarn, setBreakVaultWarn] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (checkVaultMaturities) checkVaultMaturities(); // Sync DB state when opened
      const interval = setInterval(() => {
        if (checkVaultMaturities) checkVaultMaturities();
      }, 30000); // Check every 30s
      return () => {
        document.body.style.overflow = 'unset';
        clearInterval(interval);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, checkVaultMaturities]);

  if (!economy) return null;

  const betOptions = [

    { days: 7, returnPercent: 10, multiplier: 0.1 },
    { days: 15, returnPercent: 20, multiplier: 0.2 },
    { days: 30, returnPercent: 50, multiplier: 0.5 },
    { days: 60, returnPercent: 100, multiplier: 1.0 },
    { days: 90, returnPercent: 200, multiplier: 2.0 },
  ];

  const handleBet = async () => {
    if (!user) {
      onClose();
      navigate('/signin', { state: { message: "Sign up to solve FREE Mock Tests and MCQs, and start analyzing your performance!" } });
      return;
    }
    setError(null);
    const opt = betOptions.find(o => o.days === stakeDuration);
    if (!opt) return;

    if (stakeAmount < 1 || isNaN(stakeAmount)) {
      setError("Please enter a valid stake amount (Min 1 KC).");
      return;
    }
    if (stakeAmount > economy.kash_coins_balance) {
      setError("Insufficient KC balance in Treasury!");
      return;
    }

    const success = await placeStreakBet(stakeAmount, opt.days, opt.multiplier);
    if (success) {
      setError(null);
      setStakeAmount(10); // Reset
    }
  };

  const handleClaim = async (pledgeId, reward) => {
    playVictory();

    // Massive confetti explosion
    const duration = 6000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10B981', '#F59E0B', '#FBBF24'],
        zIndex: 999999
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10B981', '#F59E0B', '#FBBF24'],
        zIndex: 999999
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());

    await claimVaultYield(pledgeId);

    // Show double down after 3s
    setTimeout(() => {
      setDoubleDownOffer(reward);
    }, 3000);
  };

  const executeDoubleDown = async () => {
    await placeStreakBet(doubleDownOffer, 30, 1.5); // 30 days @ 150%
    setDoubleDownOffer(null);
  };

  const activePledges = economy.active_pledges || [];
  const vaultThemes = {
    light: {
      cardBg: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(248,250,255,0.98) 100%)',
      cardBorder: 'rgba(16,185,129,0.22)',
      cardShadow: '0 16px 40px rgba(13,27,62,0.08), 0 0 0 1px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
      iconBg: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.06) 100%)',
      iconBorder: 'rgba(16,185,129,0.24)',
      title: 'var(--color-text)',
      muted: 'var(--color-text-muted)',
      divider: 'linear-gradient(180deg, transparent, rgba(90,106,138,0.22), transparent)',
      line: 'linear-gradient(90deg, rgba(16,185,129,0.18), rgba(90,106,138,0.14), rgba(16,185,129,0.1))',
      progressTrack: 'rgba(13,27,62,0.08)',
      progressBorder: 'rgba(13,27,62,0.05)',
    },
    dark: {
      cardBg: 'linear-gradient(135deg, #0a1612 0%, #060e0b 100%)',
      cardBorder: 'rgba(16,185,129,0.25)',
      cardShadow: '0 0 0 1px rgba(16,185,129,0.08), 0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
      iconBg: 'linear-gradient(135deg, #0f2920 0%, #0a1f17 100%)',
      iconBorder: 'rgba(16,185,129,0.2)',
      title: '#ffffff',
      muted: '#6b7280',
      divider: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.12), transparent)',
      line: 'linear-gradient(90deg, rgba(16,185,129,0.15), rgba(255,255,255,0.06), rgba(16,185,129,0.05))',
      progressTrack: 'rgba(0,0,0,0.5)',
      progressBorder: 'rgba(255,255,255,0.04)',
    },
    sepia: {
      cardBg: 'linear-gradient(135deg, rgba(253,246,236,0.98) 0%, rgba(250,240,225,0.96) 100%)',
      cardBorder: 'rgba(101,107,68,0.28)',
      cardShadow: '0 16px 38px rgba(44,30,16,0.1), 0 0 0 1px rgba(101,107,68,0.1), inset 0 1px 0 rgba(255,255,255,0.62)',
      iconBg: 'linear-gradient(135deg, rgba(101,107,68,0.14) 0%, rgba(180,83,9,0.06) 100%)',
      iconBorder: 'rgba(101,107,68,0.25)',
      title: 'var(--color-text)',
      muted: 'var(--color-text-muted)',
      divider: 'linear-gradient(180deg, transparent, rgba(124,99,71,0.24), transparent)',
      line: 'linear-gradient(90deg, rgba(101,107,68,0.18), rgba(124,99,71,0.14), rgba(180,83,9,0.1))',
      progressTrack: 'rgba(44,30,16,0.1)',
      progressBorder: 'rgba(44,30,16,0.06)',
    },
  };
  const vaultTheme = vaultThemes[theme] || vaultThemes.light;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] overflow-y-auto overflow-x-hidden custom-scrollbar flex items-start sm:items-center justify-center p-0 sm:p-6 backdrop-blur-md bg-theme-bg/90"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="w-full min-h-screen sm:min-h-0 sm:max-h-[90vh] sm:max-w-md md:max-w-4xl flex flex-col bg-theme-surface border-0 ring-1 ring-theme-border/20 sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative sm:overflow-hidden"
          >
            {/* Header */}
            <div className="shrink-0 p-6 bg-gradient-to-b from-theme-primary/10 to-transparent flex items-start justify-between relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-theme-primary via-theme-accent to-theme-primary opacity-50" />
              <div>
                <h2 className="text-2xl font-black flex items-center gap-2 text-theme-text italic tracking-tighter">
                  <Flame className="text-theme-primary fill-theme-primary animate-pulse" size={24} />
                  Streak Vault
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted mt-1 opacity-60">High-Stake Discipline Protocol</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full bg-theme-bg/50 hover:bg-theme-bg border border-theme-border/50 transition-all">
                <X size={18} className="text-theme-muted" />
              </button>
            </div>

            <div className="flex-1 sm:overflow-y-auto sm:custom-scrollbar p-6 sm:p-8 pt-0 flex flex-col md:grid md:grid-cols-2 md:gap-10">

              {/* Left Column: Economy Controls */}
              <div className="flex flex-col">
                {/* Massive Centered Streak */}
                <div className="flex flex-col items-center justify-center py-6 mb-8 bg-gradient-to-b from-theme-bg/40 to-theme-bg/10 rounded-3xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.15)] border-t border-theme-border/40 ring-1 ring-black/5 dark:ring-white/5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                  <div className="flex items-center justify-center gap-5">
                    <h1 className="text-8xl font-black text-theme-text tracking-tighter drop-shadow-2xl">
                      {economy.current_streak_days}
                    </h1>
                    <div className="relative">
                      <div className="relative z-10 w-20 h-20 flex items-center justify-center">
                        {/* Steady, Slow Glow Pulse */}
                        <div className={`absolute inset-0 blur-3xl rounded-full opacity-30 animate-[pulse_4s_ease-in-out_infinite] ${economy.available_streak_freezes > 0 ? 'bg-cyan-500' : 'bg-theme-primary'}`} />

                        <Flame
                          className={`relative z-10 transition-all duration-1000 ${economy.available_streak_freezes > 0
                            ? 'text-cyan-400 fill-cyan-400/10 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                            : 'text-theme-primary fill-theme-primary/10 drop-shadow-[0_0_20px_rgb(var(--color-primary)/0.4)]'
                            }`}
                          size={64}
                          strokeWidth={2}
                        />
                      </div>
                    </div>
                  </div>
                  <p className={`text-[11px] font-black uppercase tracking-[0.5em] mt-3 ${economy.available_streak_freezes > 0 ? 'text-blue-400/80 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]' : 'text-theme-primary/80'}`}>
                    {economy.available_streak_freezes > 0 ? 'Streak Protected' : 'Days Streak Active'}
                  </p>
                  {/* Clean Unified Streak Freeze Row inside the Streak Tile (no nested border container) */}
                  <div className="w-full px-6 mt-6 pt-5 border-t border-theme-border/20 flex flex-col gap-4">
                    {/* Row 1: Title & Status badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Snowflake size={16} className={economy.available_streak_freezes > 0 ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" : "text-theme-muted/40"} />
                        <span className="text-xs font-black uppercase text-theme-text tracking-wider truncate">Streak Freeze</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === 'freeze' ? null : 'freeze'); }}
                          className={`p-1 rounded-full transition-all shrink-0 ${activeTooltip === 'freeze' ? 'text-cyan-400 bg-cyan-500/10' : 'text-theme-muted/40 hover:text-cyan-400 hover:bg-cyan-500/5'}`}
                          aria-label="Streak Freeze Information"
                        >
                          <Info size={13} />
                        </button>
                      </div>

                      <div className="shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          economy.available_streak_freezes > 0 
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                            : 'bg-white/[0.04] text-theme-muted border border-white/10'
                        }`}>
                          {economy.available_streak_freezes || 0} Available
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Action Button */}
                    <button
                      onClick={() => {
                        if (!user) {
                          onClose();
                          navigate('/signin', { state: { message: "Sign up to solve FREE Mock Tests and MCQs, and start analyzing your performance!" } });
                          return;
                        }
                        buyStreakFreeze();
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600/10 to-cyan-400/10 text-cyan-400 hover:from-cyan-600/20 hover:to-cyan-400/20 border border-cyan-500/30 transition-all text-xs font-black uppercase tracking-wider active:scale-98 shadow-sm flex items-center justify-center gap-2"
                    >
                      Buy Streak Freeze (-{formatKC(calculateFreezeCost())} KC)
                    </button>

                    <AnimatePresence initial={false}>
                      {activeTooltip === 'freeze' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden text-[11px] text-theme-muted font-medium leading-relaxed bg-cyan-500/[0.04] border border-cyan-500/15 p-3 rounded-xl flex flex-col gap-1.5 text-left"
                        >
                          <span className="text-cyan-400 font-bold tracking-wider uppercase text-[10px]">Streak Freeze Protocol:</span>
                          <span>Automatically freezes your streak on missed login days. Staked assets in active vaults remain fully safe. Can be purchased with KashCoins from your Liquid Treasury.</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>



                {/* Treasury Balance */}
                <div className="bg-gradient-to-r from-theme-bg to-theme-bg/40 rounded-2xl p-5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.15)] border-t border-theme-border/40 ring-1 ring-black/5 dark:ring-white/5 flex items-center justify-between mb-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted mb-0.5">Liquid Treasury</span>
                    <KashCoinDisplay amount={economy.kash_coins_balance} className="text-2xl" />
                  </div>
                  <Zap size={20} className="text-theme-muted/30" />
                </div>

              </div>

              {/* Right Column: Staking & Active Vaults Section */}
              <div className="flex flex-col mt-8 md:mt-0">
                {/* Staking Form */}
                <div className="bg-gradient-to-b from-theme-surface/60 to-theme-surface/20 border border-theme-primary/20 shadow-xl backdrop-blur-md rounded-[2rem] p-6 mb-8 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-sm text-theme-text uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp size={16} className="text-emerald-500" />
                      New Staking Contract
                    </h3>
                    <button
                      onClick={() => setShowInfo(!showInfo)}
                      className="p-1 rounded-full hover:bg-theme-border/30 transition-colors"
                    >
                      <ShieldAlert size={16} className="text-theme-muted" />
                    </button>
                  </div>

                  <AnimatePresence>
                    {showInfo && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-6"
                      >
                        <p className="text-[11px] text-theme-muted font-medium leading-relaxed bg-theme-primary/5 border-theme-primary/20 p-4 rounded-2xl border italic">
                          Lock KC into the vault. Maintain your daily streak. If you fail, the vault is liquidated. Success grants principal + bonus yield.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-5">
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-500 text-[10px] font-black uppercase tracking-widest text-center"
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-theme-muted tracking-widest px-1">Stake (KC)</label>
                        <input
                          type="number" value={stakeAmount}
                          onChange={(e) => { setError(null); setStakeAmount(Number(e.target.value)); }}
                          className="w-full h-12 border border-theme-border/60 focus:border-theme-primary/60 rounded-xl px-4 text-theme-text font-black text-sm focus:outline-none transition-all placeholder:text-theme-muted/30"
                          style={{
                            backgroundColor: 'rgba(var(--color-bg-rgb), 0.5)',
                            color: 'var(--color-text)'
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-theme-muted tracking-widest px-1">Tenure</label>
                        <div className="relative">
                          <select
                            value={stakeDuration}
                            onChange={(e) => { setError(null); setStakeDuration(Number(e.target.value)); }}
                            className="w-full h-12 border border-theme-border/60 focus:border-theme-primary/60 rounded-xl px-4 pr-10 text-theme-text font-black text-sm focus:outline-none cursor-pointer appearance-none"
                            style={{
                              backgroundColor: 'rgba(var(--color-bg-rgb), 0.5)',
                              color: 'var(--color-text)'
                            }}
                          >
                            {betOptions.map(opt => (
                              <option key={opt.days} value={opt.days} style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                                {opt.isTest ? opt.label : `${opt.days} Days`} (+{opt.returnPercent}%)
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-theme-muted/60">
                            <ChevronDown size={16} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleBet}
                      className="w-full py-3.5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                    >
                      Initialize Vault
                    </button>
                  </div>
                </div>

                {activePledges.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-black text-[10px] text-theme-muted uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                      <Gem size={12} className="text-theme-primary" />
                      Active Vault Contracts ({activePledges.length})
                    </h3>
                    <div className="space-y-3 pr-2">
                      {activePledges.map((pledge) => {
                        const start = new Date(pledge.pledge_start_date);
                        const now = new Date();
                        const diffTime = Math.abs(now - start);
                        const durationMs = pledge.pledge_duration_days * 24 * 60 * 60 * 1000;
                        const progress = Math.min(100, (diffTime / durationMs) * 100);
                        const remainingMs = Math.max(0, durationMs - diffTime);
                        
                        let remainingLabel = "";
                        if (remainingMs > 1000 * 60 * 60 * 24) {
                          remainingLabel = `${Math.ceil(remainingMs / (1000 * 60 * 60 * 24))} DAYS LEFT`;
                        } else if (remainingMs > 1000 * 60 * 60) {
                          remainingLabel = `${Math.ceil(remainingMs / (1000 * 60 * 60))} HOURS LEFT`;
                        } else {
                          remainingLabel = `${Math.ceil(remainingMs / (1000 * 60))} MIN LEFT`;
                        }
                        const expectedReward = Math.floor(pledge.pledged_amount * (1 + pledge.reward_multiplier));

                        if (pledge.status === 'LIQUIDATED') {
                          const isDark = theme === 'dark';
                          const isSepia = theme === 'sepia';
                          const redBg = isDark 
                            ? 'linear-gradient(135deg, rgba(28, 10, 10, 0.95) 0%, rgba(15, 5, 5, 0.98) 100%)'
                            : isSepia 
                            ? 'linear-gradient(135deg, rgba(253, 240, 240, 0.98) 0%, rgba(245, 225, 225, 0.96) 100%)'
                            : 'linear-gradient(135deg, rgba(254, 242, 242, 0.96) 0%, rgba(253, 226, 226, 0.98) 100%)';
                          const redBorder = isDark ? 'rgba(220, 38, 38, 0.35)' : 'rgba(239, 68, 68, 0.3)';
                          const redGlow = isDark ? '0 12px 30px rgba(220, 38, 38, 0.15)' : '0 12px 30px rgba(239, 68, 68, 0.08)';

                          return (
                            <div 
                              key={pledge.id} 
                              className="relative overflow-hidden group rounded-[2rem] p-5 border-2 transition-all duration-300" 
                              style={{ 
                                background: redBg, 
                                borderColor: redBorder, 
                                boxShadow: `${redGlow}, ${vaultTheme.cardShadow}` 
                              }}
                            >
                              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDEiLz4KPHBhdGggZD0iTTAgMEw4IDhNOCAwTDAgOCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iMC4wNSIvPgo8L3N2Zz4=')] opacity-50 pointer-events-none mix-blend-overlay" />
                              <div className="absolute top-0 left-0 h-full w-1.5 bg-gradient-to-b from-red-500 to-red-700 shadow-[2px_0_12px_rgba(239,68,68,0.5)]" />
                              <div className="flex justify-between items-center relative z-10">
                                <div className="flex-1 pr-4">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <Skull size={18} className="text-red-500 animate-pulse" />
                                    <span className="font-black text-sm tracking-tight" style={{ color: vaultTheme.title }}>
                                      Vault Shattered
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[13px] font-black text-red-600 dark:text-red-400 tracking-tight leading-tight">
                                    <span>You lost {pledge.pledged_amount}</span>
                                    <KashCoinIcon className="w-3.5 h-3.5" glow={false} />
                                  </div>
                                  <div className="text-[10px] text-red-400/80 dark:text-red-500/50 font-bold uppercase tracking-wider mt-0.5">
                                    You couldn't keep Streak
                                  </div>
                                </div>
                                <button
                                  onClick={() => { playShatter(); confirmFailure(pledge.id); }}
                                  className="flex flex-col items-center justify-center px-4 sm:px-5 py-3 rounded-2xl bg-red-950/20 hover:bg-red-950/40 text-red-500 dark:text-red-400 border border-red-500/20 hover:border-red-500/40 text-[10px] font-black uppercase tracking-[0.2em] leading-tight transition-all active:scale-95 shrink-0"
                                >
                                  <span>Confirm</span>
                                  <span>Failure</span>
                                </button>
                              </div>
                            </div>
                          );
                        }

                        const isMature = pledge.status === 'MATURE' || (pledge.status === 'ACTIVE' && diffTime >= durationMs);

                        if (isMature) {
                          return (
                            <div key={pledge.id} className="relative overflow-hidden group rounded-[2rem] p-5 border" style={{ background: vaultTheme.cardBg, borderColor: 'rgba(16,185,129,0.4)', boxShadow: `0 0 40px rgba(16,185,129,0.15), ${vaultTheme.cardShadow}` }}>
                              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-amber-500/10 pointer-events-none" />
                              <div className="absolute top-0 left-0 h-full w-1.5 bg-gradient-to-b from-amber-400 to-emerald-400 shadow-[2px_0_15px_rgba(16,185,129,0.4)]" />
                              <div className="flex justify-between items-center relative z-10">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle size={18} className="text-emerald-500 dark:text-emerald-400" />
                                    <span className="font-black text-sm tracking-tight" style={{ color: vaultTheme.title }}>Vault Matured</span>
                                  </div>
                                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Yield ready for collection</div>
                                </div>
                                <button
                                  onClick={() => handleClaim(pledge.id, expectedReward)}
                                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 text-white shadow-lg hover:shadow-emerald-500/30 text-[10px] font-black uppercase tracking-widest transition-all animate-bounce"
                                >
                                  Claim {expectedReward} KC
                                </button>
                              </div>
                            </div>
                          );
                        }

                        // ACTIVE state — Premium compact vault card
                        return (
                          <div
                            key={pledge.id}
                            className="relative overflow-hidden rounded-2xl mb-3"
                            style={{
                              background: vaultTheme.cardBg,
                              border: `1px solid ${vaultTheme.cardBorder}`,
                              boxShadow: vaultTheme.cardShadow,
                            }}
                          >
                            {/* Top green glow edge */}
                            <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, #10b981 40%, #34d399 60%, transparent)' }} />
                            {/* Left accent bar */}
                            <div className="absolute top-0 left-0 w-[3px] h-full" style={{ background: 'linear-gradient(180deg, #10b981, #059669)' }} />

                            <div className="pl-4 pr-4 pt-3 pb-0">
                              {/* Row 1: Lock Icon | Vault Name + Growth | Divider | Est. Return */}
                              <div className="flex items-center gap-3">
                                {/* Lock icon box */}
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                  style={{ background: vaultTheme.iconBg, border: `1px solid ${vaultTheme.iconBorder}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }}
                                >
                                  <Lock size={17} className="text-[#10b981]" strokeWidth={2.5} />
                                </div>

                                {/* Title + growth — expands */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[13px] font-black uppercase tracking-wider leading-none" style={{ color: vaultTheme.title }}>
                                      {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} VAULT
                                    </span>
                                    <div className="w-[7px] h-[7px] rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981] animate-pulse shrink-0" />
                                  </div>
                                  <div className="flex items-center gap-1 text-[#10b981]">
                                    <TrendingUp size={11} strokeWidth={3} />
                                    <span className="text-[9px] font-black uppercase tracking-[0.15em] leading-none">
                                      +{Math.round(pledge.reward_multiplier * 100)}% GROWTH
                                    </span>
                                  </div>
                                </div>

                                {/* Vertical separator */}
                                <div className="w-[1px] h-9 shrink-0" style={{ background: vaultTheme.divider }} />

                                {/* Est. Return */}
                                <div className="flex flex-col items-end shrink-0 gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[22px] font-black leading-none" style={{ color: '#F59E0B', textShadow: '0 0 20px rgba(245,158,11,0.35)' }}>
                                      {expectedReward}
                                    </span>
                                    <KashCoinIcon className="w-7 h-7" glow={true} />
                                  </div>
                                  <span className="text-[8px] font-black uppercase tracking-[0.18em] leading-none" style={{ color: vaultTheme.muted }}>EST. RETURN</span>
                                </div>
                              </div>

                              {/* Divider */}
                              <div className="mt-3 mb-2.5 h-[1px]" style={{ background: vaultTheme.line }} />

                              {/* Row 2: Maturity Progress label + Days badge */}
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: vaultTheme.muted }}>MATURITY PROGRESS</span>
                                <div
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
                                >
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                  </svg>
                                  <span className="text-[9px] font-black text-[#10b981] uppercase tracking-[0.12em]">{remainingLabel}</span>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div
                                className="h-[6px] w-full rounded-full overflow-hidden mb-3"
                                style={{ background: vaultTheme.progressTrack, border: `1px solid ${vaultTheme.progressBorder}` }}
                              >
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{ duration: 1, ease: 'easeOut' }}
                                  className="h-full rounded-full"
                                  style={{ background: 'linear-gradient(90deg, #059669, #10b981, #34d399)', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }}
                                />
                              </div>
                            </div>

                            {/* Emergency Liquidation button row — with circuit-trace decoration */}
                            <div className="relative flex items-center justify-center px-4 pb-3">
                              {/* Left trace */}
                              <div className="flex-1 flex items-center gap-1.5 mr-2 opacity-40">
                                <div className="h-[1px] flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6))' }} />
                                <div className="w-2 h-2 rounded-full border border-red-500/60 flex items-center justify-center">
                                  <div className="w-1 h-1 rounded-full bg-red-500/40" />
                                </div>
                                <div className="w-1.5 h-[1px] bg-red-500/60" />
                              </div>

                              <button
                                onClick={() => setBreakVaultWarn(pledge.id)}
                                className="flex items-center gap-2 px-5 py-2 rounded-full transition-all group"
                                style={{
                                  background: 'rgba(239,68,68,0.06)',
                                  border: '1px solid rgba(239,68,68,0.15)',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'; }}
                              >
                                <AlertTriangle size={11} className="text-red-500/80" />
                                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-red-500/80">EMERGENCY LIQUIDATION</span>
                              </button>

                              {/* Right trace */}
                              <div className="flex-1 flex items-center gap-1.5 ml-2 opacity-40">
                                <div className="w-1.5 h-[1px] bg-red-500/60" />
                                <div className="w-2 h-2 rounded-full border border-red-500/60 flex items-center justify-center">
                                  <div className="w-1 h-1 rounded-full bg-red-500/40" />
                                </div>
                                <div className="h-[1px] flex-1" style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.6), transparent)' }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activePledges.length === 0 && (
                  <div className="py-10 text-center opacity-30">
                    <Gem size={32} className="mx-auto mb-3 text-theme-muted" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Active Vaults Found</p>
                  </div>
                )}
              </div>

            </div>

            <UniversalModal
              isOpen={!!doubleDownOffer}
              onClose={() => setDoubleDownOffer(null)}
              title="Compound Opportunity"
              variant="victory"
              showClose={false}
            >
              <div className="text-center">
                <Gem size={48} className="text-emerald-500 mx-auto mb-4" />
                <h3 className="text-2xl font-black mb-2">Double Down?</h3>
                <p className="text-sm mb-6 font-medium opacity-90">
                  Lock your claimed <span className="font-bold text-amber-500">{doubleDownOffer} KC</span> for 30 days at <span className="font-bold text-amber-500">150% Yield (Compound Bonus)</span>.
                  This offer is exclusive and cannot be modified.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setDoubleDownOffer(null)} 
                    className="py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-black/10 dark:hover:bg-white/10 font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Collect & Leave
                  </button>
                  <button onClick={executeDoubleDown} className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95">
                    Double Down
                  </button>
                </div>
              </div>
            </UniversalModal>

            <UniversalModal
              isOpen={!!breakVaultWarn}
              onClose={() => setBreakVaultWarn(null)}
              title="Break Vault"
              variant="shatter"
            >
              <div className="text-center">
                <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-black mb-2">Penalty Warning</h3>
                <p className="text-sm mb-6 font-medium opacity-90">
                  Breaking this vault before maturity incurs a <span className="font-bold">40% penalty</span> on your principal, and all bonus yield is forfeited. You will only be refunded 60%.
                </p>
                <button
                  onClick={async () => {
                    await breakVault(breakVaultWarn);
                    setBreakVaultWarn(null);
                  }}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                >
                  Confirm Break Vault
                </button>
              </div>
            </UniversalModal>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

export function CoinsVaultModal({ isOpen, onClose }) {
  const { economy } = useEconomy();
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSurgeTooltip, setShowSurgeTooltip] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadHistory();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, viewMode]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const days = viewMode === 'week' ? 7 : 30;
      const data = await getCoinHistory(days);
      setHistory(data);
    } catch (err) {
      console.error("Failed to load coin history", err);
    } finally {
      setLoading(false);
    }
  };

  if (!economy) return null;

  // Process History Data
  const labels = history.length > 0
    ? history.map(h => {
      const d = new Date(h.date);
      return viewMode === 'week' ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    })
    : ['No Data'];

  const chartValues = history.length > 0 ? history.map(h => h.earned_from_mocks || 0) : [0];

  const chartData = {
    labels: labels,
    datasets: [
      {
        fill: true,
        label: 'Kash Earned',
        data: chartValues,
        borderColor: theme === 'light' ? '#4361ee' : 'rgba(245, 158, 11, 1)',
        backgroundColor: theme === 'light' ? 'rgba(67, 97, 238, 0.15)' : 'rgba(245, 158, 11, 0.15)',
        tension: 0.4,
        pointBackgroundColor: theme === 'light' ? '#4361ee' : 'rgba(245, 158, 11, 1)',
        pointRadius: history.length > 15 ? 0 : 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => `${context.parsed.y} KC`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#888888',
          font: { size: 10, weight: 'bold' }
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(128, 128, 128, 0.1)' },
        ticks: {
          precision: 0,
          color: '#888888',
          font: { size: 10 },
          callback: (value) => {
            if (value % 1 === 0) return formatKC(value);
            return null;
          }
        }
      }
    }
  };

  const activePledges = economy.active_pledges || [];
  const totalStaked = activePledges.reduce((sum, p) => sum + p.pledged_amount, 0);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] overflow-y-auto overflow-x-hidden custom-scrollbar flex items-start sm:items-center justify-center p-0 sm:p-6 backdrop-blur-md bg-theme-bg/90"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="w-full min-h-screen sm:min-h-0 sm:max-h-[90vh] sm:max-w-md md:max-w-4xl mx-auto flex flex-col bg-theme-surface border-0 ring-1 ring-theme-border/20 sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative sm:overflow-hidden"
          >
            {/* Header */}
            <div className="shrink-0 p-6 bg-gradient-to-b from-theme-primary/10 to-transparent flex items-start justify-between relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-theme-primary via-theme-accent to-theme-primary opacity-50" />
              <div>
                <h2 className="text-2xl font-black flex items-center gap-2 text-theme-text tracking-tight">
                  <KashCoinIcon className="w-6 h-6" glow={theme !== 'light'} />
                  Coins Vault
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted mt-1 opacity-60">Treasury Analytics</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full bg-theme-bg/50 hover:bg-theme-bg border border-theme-border/50 transition-all">
                <X size={18} className="text-theme-muted" />
              </button>
            </div>

            <div className="flex-1 sm:overflow-y-auto sm:custom-scrollbar p-6 sm:p-8 pt-0 flex flex-col md:grid md:grid-cols-2 md:gap-8 md:items-start">
              {/* Left Column: Metrics & Controls */}
              <div className="flex flex-col gap-4">
                {/* Total Coins Display */}
                <div className="flex flex-col items-center justify-center py-5 bg-gradient-to-b from-theme-primary/10 to-transparent rounded-3xl border border-theme-primary/20 relative overflow-hidden">
                  <div className="text-[11px] font-black text-theme-primary/80 uppercase tracking-[0.2em] mb-1.5">Liquid Balance</div>
                  <div className="flex items-center gap-4">
                    <h1 className="text-5xl font-black text-theme-text tracking-tighter drop-shadow-lg">
                      {formatKC(economy.kash_coins_balance)}
                    </h1>
                    <KashCoinIcon className="w-10 h-10" />
                  </div>
                </div>

                {/* Power Surge Card (Directly below Liquid Balance) */}
                {(() => {
                  const todayStr = new Date().toDateString();
                  const isPowerSurgeActive = (economy.power_surge_expires_at && new Date(economy.power_surge_expires_at) > new Date()) || 
                                             (economy.power_surge_active_date === todayStr);
                  
                  let surgeDurationLabel = "";
                  let diffDays = 0;
                  if (economy.power_surge_expires_at && new Date(economy.power_surge_expires_at) > new Date()) {
                    const diffMs = new Date(economy.power_surge_expires_at).getTime() - Date.now();
                    diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                    surgeDurationLabel = ` (${diffDays}d left)`;
                  }

                  return (
                    <div
                      className={`flex flex-col items-center justify-center py-4 rounded-3xl border relative overflow-hidden transition-all bg-gradient-to-b ${
                        isPowerSurgeActive
                          ? 'from-amber-500/15 to-transparent border-amber-500/30 shadow-[0_12px_30px_rgba(245,158,11,0.15)]'
                          : 'from-theme-primary/10 to-transparent border-theme-primary/20'
                      }`}
                    >
                      {isPowerSurgeActive && (
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                      )}
                      
                      <div 
                        className="text-[11px] font-black uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1.5"
                        style={{ color: isPowerSurgeActive ? 'rgb(var(--color-primary))' : 'var(--color-text-muted)' }}
                      >
                        <span className={isPowerSurgeActive ? 'text-amber-500' : 'text-theme-primary/80'}>Power Surge</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowSurgeTooltip(!showSurgeTooltip); }}
                          className={`p-1 rounded-full transition-all ${showSurgeTooltip ? 'text-amber-400 bg-amber-500/10' : 'text-theme-muted/40 hover:text-amber-300 hover:bg-white/5'}`}
                          aria-label="Power Surge Information"
                        >
                          <Info size={12} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <h2 className={`text-2xl font-black tracking-tight flex items-center gap-2 ${isPowerSurgeActive ? 'text-amber-400' : 'text-theme-text opacity-70'}`}>
                          {isPowerSurgeActive ? (
                            <span className="flex items-center gap-2">
                              +50% Boost
                              {diffDays > 0 && (
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full select-none">
                                  {diffDays}d left
                                </span>
                              )}
                            </span>
                          ) : (
                            'Inactive'
                          )}
                        </h2>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isPowerSurgeActive ? 'bg-amber-400/20 text-amber-300 animate-pulse' : 'bg-theme-border/40 text-theme-muted opacity-40'
                        }`}>
                          <Zap size={15} className={isPowerSurgeActive ? 'fill-amber-300' : ''} />
                        </div>
                      </div>

                      <AnimatePresence initial={false}>
                        {showSurgeTooltip && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="w-11/12 mx-auto overflow-hidden text-[10px] text-theme-muted font-medium leading-relaxed bg-amber-500/[0.04] border border-amber-500/15 p-3 rounded-2xl flex flex-col gap-1.5 text-left shadow-inner animate-spring"
                          >
                            <span className="text-amber-400 font-black tracking-wider uppercase text-[9px]">Power Surge Protocol:</span>
                            <span>Earned by scoring 8/10 or higher in any Resurrection Mock (daily reset), or via referral welcome bonuses (1-week surge) and scratch cards (3-day surge). When active, you receive a +50% KashCoin earnings boost on all Mock tests completed.</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}

                {/* Staked Coins Info */}
                <div className="bg-theme-bg rounded-2xl p-4 border border-theme-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp size={14} className="text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Locked in Vaults</div>
                      <div className="text-sm font-bold text-theme-text">{formatKC(totalStaked)} KC Staked</div>
                    </div>
                  </div>
                  <KashCoinIcon className="w-6 h-6 opacity-50" glow={false} />
                </div>
              </div>

              {/* Right Column: Chart Section */}
              <div className="flex flex-col mt-6 md:mt-0 w-full h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-[11px] text-theme-text uppercase tracking-widest">Earning History</h3>
                    <div className="flex bg-theme-bg p-1 rounded-full border border-theme-border/50">
                      <button
                        onClick={() => setViewMode('week')}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-theme-primary text-white shadow-sm' : 'text-theme-muted hover:text-theme-text'}`}
                      >
                        Week
                      </button>
                      <button
                        onClick={() => setViewMode('month')}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-theme-primary text-white shadow-sm' : 'text-theme-muted hover:text-theme-text'}`}
                      >
                        Month
                      </button>
                    </div>
                  </div>
                  <div className="h-[210px] w-full bg-theme-bg/50 rounded-2xl p-4 border border-theme-border/50 relative overflow-hidden">
                    {loading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-theme-bg/40 backdrop-blur-sm">
                        <div className="w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <Line data={chartData} options={chartOptions} />
                  </div>
                  <p className="text-[9px] text-theme-muted mt-2 font-medium italic opacity-60">* History is tracked daily. New accounts show balance stability.</p>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
