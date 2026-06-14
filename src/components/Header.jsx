import React, { useState, useRef, useEffect } from 'react';
import { Settings, Sun, Moon, BookOpen, X, Hexagon, Type, Flame, Sparkles, Eye, EyeOff, Wand2, Zap, Award, Bell, BellOff } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useEconomy } from '../context/EconomyContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSound } from '../context/SoundContext';
import { KashCoinDisplay, StreakModal, CoinsVaultModal } from './EconomyUI';
import BYOKSettingsModal from './BYOKSettingsModal';
import { getRevisionStats } from '../lib/db';

// ── MCQ Kash Logo — Simplified & Clean ────────────────────────────
export function MCQKashLogo({ tier = 'FREE' }) {
  const isPro = tier === 'Pro';
  const navigate = useNavigate();
  return (
    <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 z-50">
      <Link
        to="/"
        onClick={(e) => {
          e.preventDefault();
          if (window.location.pathname === '/') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            navigate('/');
          }
        }}
        aria-label="MCQ Kash — Go to home"
        className="flex items-center gap-1.5 select-none group cursor-pointer"
      >
        {/* Hexagon icon — slightly larger */}
        <div className="relative flex items-center justify-center w-[34px] h-[34px] sm:w-[38px] sm:h-[38px]">
          <Hexagon
            size={32}
            className="absolute transition-all duration-500 group-hover:rotate-[30deg] group-hover:scale-105 sm:hidden"
            strokeWidth={1.6}
            style={{ color: 'rgb(var(--color-primary))' }}
          />
          <Hexagon
            size={36}
            className="absolute transition-all duration-500 group-hover:rotate-[30deg] group-hover:scale-105 hidden sm:block"
            strokeWidth={1.6}
            style={{ color: 'rgb(var(--color-primary))' }}
          />
          <span
            className="text-[12px] sm:text-[13px] font-black tracking-tighter relative z-10"
            style={{ color: 'rgb(var(--color-primary))' }}
          >
            M
          </span>
        </div>
        <div className="hidden min-[480px]:flex items-baseline gap-0.5 leading-none mt-0.5">
          <span className="text-[16px] sm:text-[19px] font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
            MCQ
          </span>
          <span className="text-[16px] sm:text-[19px] font-medium tracking-tight text-gradient-primary">
            Kash
          </span>
        </div>
      </Link>

      {/* Tier Badge — hidden on very small screens if FREE to save space */}
      <div className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-[0.12em] sm:tracking-[0.15em] border transition-all ${
        isPro
          ? 'bg-amber-500 text-amber-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
          : 'hidden sm:block bg-theme-bg/50 text-theme-muted border-theme-border/50 opacity-60'
      }`}>
        {tier}
      </div>
    </div>
  );
}

// ── Theme Switcher Panel ───────────────────────────────────────────
const themes = [
  { id: 'light', label: 'Light', icon: Sun, preview: ['#f0f4ff', '#4361ee', '#10b981'], desc: 'Crystal Daybreak' },
  { id: 'dark', label: 'Dark', icon: Moon, preview: ['#131825', '#818cf8', '#22d3ee'], desc: 'Midnight Cosmos' },
  { id: 'sepia', label: 'Sepia', icon: BookOpen, preview: ['#f5ede0', '#b45309', '#65704a'], desc: 'Gilded Manuscript' },
];

const TEXT_SIZE_STEPS = [
  { id: 'xs', title: 'Smallest', scale: 0.75 },
  { id: 'sm', title: 'Small', scale: 0.90 },
  { id: 'ms', title: 'Default', scale: 1.00 },
  { id: 'md', title: 'Large', scale: 1.20 },
  { id: 'ml', title: 'Very Large', scale: 1.35 },
  { id: 'lg', title: 'Extra Large', scale: 1.50 },
  { id: 'xl', title: 'Huge', scale: 1.75 },
  { id: 'xxl', title: 'Largest', scale: 2.00 }
];

function SettingsPanel({ onClose, onOpenAiSettings }) {
  const navigate = useNavigate();
  const { theme, setTheme, textSize, setTextSize } = useTheme();
  const { economy } = useEconomy();

  const safeIndex = (() => {
    const idx = TEXT_SIZE_STEPS.findIndex(s => s.id === textSize);
    return idx !== -1 ? idx : 3;
  })();

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (val >= 0 && val < TEXT_SIZE_STEPS.length) {
      setTextSize(TEXT_SIZE_STEPS[val].id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      onClick={e => e.stopPropagation()}
      className="absolute top-full right-0 mt-2 w-64 z-50 rounded-2xl overflow-hidden backdrop-blur-3xl shadow-2xl flex flex-col"
      style={{
        background: 'rgba(var(--color-surface-rgb), 0.96)',
        border: '1px solid rgba(var(--color-primary), 0.18)',
        maxHeight: 'calc(100dvh - 80px)',
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      <div className="px-4 py-3 border-b border-theme-border/10 flex items-center justify-between shrink-0">
        <span className="text-[11px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--color-text)' }}>
          Settings
        </span>
        <button onClick={onClose} className="p-1 hover:bg-theme-text/5 rounded-lg transition-colors">
          <X size={14} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>

      <div className="p-2 flex flex-col gap-1 overflow-y-auto">
        <div className="px-2 py-1.5 mt-1">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: 'var(--color-text)' }}>Themes</span>
        </div>
        {themes.map(t => {
          const isActive = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left w-full group/t"
              style={{
                background: isActive ? 'rgba(var(--color-primary), 0.15)' : 'transparent',
                color: isActive ? 'rgb(var(--color-primary))' : 'var(--color-text)'
              }}
            >
              <div className="flex shrink-0">
                {t.preview.map((c, i) => (
                  <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: c, border: '2px solid var(--color-surface)', marginLeft: i > 0 ? -4 : 0, zIndex: 3 - i, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold leading-none">{t.label}</p>
              </div>
              {isActive && <div className="w-4 h-4 rounded-full flex items-center justify-center bg-theme-primary"><svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1.5 4L4 6.5L8.5 2" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>}
            </button>
          );
        })}

        <div className="px-2 py-1.5 mt-2 border-t border-theme-border/10 flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: 'var(--color-text)' }}>Text Size</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'rgb(var(--color-primary))' }}>
            {TEXT_SIZE_STEPS[safeIndex]?.title}
          </span>
        </div>
        
        <div className="px-3 py-1 flex flex-col gap-1.5 mb-1">
          <div className="flex items-center gap-3">
            <span className="text-xs opacity-50 select-none font-normal" style={{ color: 'var(--color-text)' }}>A</span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="0"
                max={TEXT_SIZE_STEPS.length - 1}
                value={safeIndex}
                onChange={handleSliderChange}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-theme-border/30 accent-theme-primary focus:outline-none custom-range-slider"
                style={{
                  background: `linear-gradient(to right, rgb(var(--color-primary)) 0%, rgb(var(--color-primary)) ${(safeIndex / (TEXT_SIZE_STEPS.length - 1)) * 100}%, rgba(var(--color-text-rgb, 255, 255, 255), 0.1) ${(safeIndex / (TEXT_SIZE_STEPS.length - 1)) * 100}%, rgba(var(--color-text-rgb, 255, 255, 255), 0.1) 100%)`
                }}
              />
            </div>
            <span className="text-lg opacity-85 select-none font-bold" style={{ color: 'var(--color-text)' }}>A</span>
          </div>
          {/* Discrete Dot Ticks */}
          <div className="flex justify-between px-[10px] text-[8px] opacity-35 select-none" style={{ color: 'var(--color-text)' }}>
            {TEXT_SIZE_STEPS.map((step, idx) => (
              <span
                key={step.id}
                className={`transition-all duration-300 ${idx === safeIndex ? 'scale-150 font-bold' : 'scale-90 opacity-40'}`}
                style={{ color: idx === safeIndex ? 'rgb(var(--color-primary))' : 'inherit' }}
              >
                •
              </span>
            ))}
          </div>
        </div>

        <div className="px-2 py-1.5 mt-2 border-t border-theme-border/10">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: 'var(--color-text)' }}>AI Settings</span>
        </div>
        <div className="px-2 pb-1">
          <button
            onClick={() => {
              onClose();
              onOpenAiSettings();
            }}
            className="w-full py-2 rounded-xl text-xs font-bold transition-all bg-theme-surface-hover text-theme-text border border-theme-border hover:border-theme-primary/50 flex items-center justify-center gap-1.5"
          >
            <Sparkles size={12} className="text-amber-500 animate-pulse" />
            Personal AI Settings
          </button>
        </div>

        <div className="px-2 py-1.5 mt-1 border-t border-theme-border/10">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: 'var(--color-text)' }}>Membership</span>
        </div>
        <div className="px-2 pb-2">
          {economy && (
            <button
              onClick={() => {
                if (economy.user_tier === 'Pro') {
                  navigate('/profile', { state: { openBilling: true } });
                } else {
                  navigate('/upgrade');
                }
                onClose();
              }}
              className="w-full py-2 rounded-xl text-xs font-bold transition-all bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20"
            >
              {economy.user_tier === 'Pro' ? '★ Manage Plan' : 'Upgrade to Pro'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const getBacklogLevel = (count) => {
  if (count > 80) {
    return {
      title: 'CRITICAL ALERT',
      colorClass: 'text-red-500 font-extrabold tracking-wide uppercase',
      dotClass: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse',
      btnColorClass: 'text-red-500 hover:text-red-400',
      badgeClass: 'bg-red-600',
      message: `Your mistake pool has reached ${count} questions! Resurrect them immediately to prevent memory decay.`,
      active: true
    };
  }
  if (count > 50) {
    return {
      title: 'URGENT REVISION',
      colorClass: 'text-rose-500 font-extrabold tracking-wide uppercase',
      dotClass: 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)] animate-pulse',
      btnColorClass: 'text-rose-500 hover:text-rose-400',
      badgeClass: 'bg-rose-500',
      message: `You have ${count} unresolved mistakes in your pool. Take a Resurrection Mock now.`,
      active: true
    };
  }
  if (count > 25) {
    return {
      title: 'CAUTION',
      colorClass: 'text-amber-500 font-extrabold tracking-wide uppercase',
      dotClass: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)] animate-pulse',
      btnColorClass: 'text-amber-500 hover:text-amber-400',
      badgeClass: 'bg-amber-500',
      message: `Mistake backlog is growing (${count} questions). Keep it under control!`,
      active: true
    };
  }
  if (count > 10) {
    return {
      title: 'NOTICE',
      colorClass: 'text-blue-400 font-extrabold tracking-wide uppercase',
      dotClass: 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.4)] animate-pulse',
      btnColorClass: 'text-blue-400 hover:text-blue-300',
      badgeClass: 'bg-blue-400',
      message: `You have ${count} mistakes in your revision pool. Keep practicing!`,
      active: true
    };
  }
  return {
    title: '',
    colorClass: '',
    dotClass: '',
    btnColorClass: '',
    badgeClass: '',
    message: '',
    active: false
  };
};

// ── Notifications Command Center Panel ──────────────────────────────
function NotificationsPanel({ onClose, stats, isSilenced, pendingScratchCount, battleNotifications, setBattleNotifications, economy }) {
  const navigate = useNavigate();
  const backlogCount = stats?.totalResurrection || 0;
  const backlogLevel = getBacklogLevel(backlogCount);
  const hasBacklog = backlogLevel.active;
  const srsDue = stats?.dueSRS || 0;
  const hasUpdates = hasBacklog || srsDue > 0 || pendingScratchCount > 0 || (battleNotifications && battleNotifications.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      onClick={e => e.stopPropagation()}
      className="absolute top-full -right-9 xs:-right-10 sm:right-0 mt-2 w-[min(320px,calc(100vw-24px))] z-50 rounded-2xl overflow-hidden backdrop-blur-3xl shadow-2xl flex flex-col"
      style={{
        background: 'rgba(var(--color-surface-rgb), 0.98)',
        border: '1px solid rgba(var(--color-primary), 0.13)',
        maxHeight: 'calc(100dvh - 80px)',
      }}
    >
      <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[350px]">
        {isSilenced && (
          <div className="text-[11px] text-amber-500 font-bold flex items-center gap-1.5 opacity-90 border-b border-theme-border/10 pb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            🔇 Focus/DND mode active. Warnings silenced.
          </div>
        )}

        {!hasUpdates ? (
          <div className="py-6 text-center text-xs text-theme-muted font-bold">
            🎉 All caught up! No active warnings.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {battleNotifications && battleNotifications.map(n => (
              <div key={n.id} className="flex flex-col gap-1.5 text-[11px] leading-relaxed border-b border-theme-border/10 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start gap-2 text-theme-text font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-primary shrink-0 mt-1.5 animate-pulse" />
                  <div>
                    <span className="font-bold text-theme-primary">{n.opponentName}</span> accepted your challenge, checkout who won?
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigate('/battle-arena', { state: { showBattleId: n.id } });
                    const userId = economy?.id || 'guest';
                    try {
                      const stored = localStorage.getItem(`mcqkash_battle_notifications_${userId}`);
                      if (stored) {
                        const list = JSON.parse(stored);
                        const updated = list.map(item => item.id === n.id ? { ...item, status: 'read' } : item);
                        localStorage.setItem(`mcqkash_battle_notifications_${userId}`, JSON.stringify(updated));
                      }
                    } catch (e) {}
                    if (setBattleNotifications) {
                      setBattleNotifications(prev => prev.filter(item => item.id !== n.id));
                    }
                    onClose();
                  }}
                  className="pl-3.5 text-left text-[10px] font-black text-theme-primary hover:opacity-80 transition-colors uppercase tracking-wider inline-flex items-center"
                >
                  View Battle Card →
                </button>
              </div>
            ))}

            {pendingScratchCount > 0 && (
              <div className="flex flex-col gap-1.5 text-[11px] leading-relaxed border-b border-theme-border/10 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start gap-2 text-amber-500 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                  <span>You have {pendingScratchCount} pending Scratch Card{pendingScratchCount === 1 ? '' : 's'} waiting!</span>
                </div>
                <button
                  onClick={() => {
                    navigate('/profile?rewards=true');
                    onClose();
                  }}
                  className="pl-5 text-left text-[10px] font-black text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-wider inline-flex items-center"
                >
                  Claim in Reward Center →
                </button>
              </div>
            )}
            {hasBacklog && (
              <div className="flex flex-col gap-1.5 text-[11px] leading-relaxed border-b border-theme-border/10 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${backlogLevel.dotClass}`} />
                  <div>
                    <span className={`${backlogLevel.colorClass} mr-1.5`}>{backlogLevel.title}:</span>
                    <span className="text-theme-text/80 font-semibold">{backlogLevel.message}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigate('/resurrection');
                    onClose();
                  }}
                  className={`pl-3.5 text-left text-[10px] font-black transition-colors uppercase tracking-wider inline-flex items-center ${backlogLevel.btnColorClass}`}
                >
                  Resurrect Mistakes →
                </button>
              </div>
            )}

            {srsDue > 0 && (
              <div className="flex flex-col gap-1.5 text-[11px] leading-relaxed border-b border-theme-border/10 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start gap-2 text-theme-text font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5 animate-pulse" />
                  <span>You have {srsDue} card{srsDue === 1 ? '' : 's'} ready for daily spaced recall testing.</span>
                </div>
                <button
                  onClick={() => {
                    navigate('/resurrection');
                    onClose();
                  }}
                  className="pl-3.5 text-left text-[10px] font-black text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-wider inline-flex items-center"
                >
                  Start Recall →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Header ─────────────────────────────────────────────────────────
export default function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [coinsVaultOpen, setCoinsVaultOpen] = useState(false);
  const settingsRef = useRef(null);

  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const [revisionStats, setRevisionStats] = useState(null);

  const { theme, setTheme, textSize, setTextSize } = useTheme();
  const { economy, toggleProTier, aiSettingsOpen, setAiSettingsOpen, refreshEconomy, transactKC } = useEconomy();
  const { showToast } = useToast();
  const { playVictory, playShatter } = useSound();
  const { user } = useAuth();

  // Scratch Card pending calculation
  const welcomePending = !!localStorage.getItem('mcqkash_welcome_coins_pending');
  const dbCount = Number(economy?.referral_count || 0);
  const isGuest = !economy || economy.id === 'default_user';
  const scratchedCount = isGuest
    ? Number(localStorage.getItem(`mcqkash_scratched_count_${economy?.username || 'default'}`) || 0)
    : Number(economy?.scratched_cards_count || 0);
  const pendingReferrals = Math.max(0, dbCount - scratchedCount);
  const pendingScratchCount = (welcomePending ? 1 : 0) + pendingReferrals;

  // Track previous referral count and user ID for real-time toaster alerts
  const prevReferralCount = useRef(null);
  const prevUserId = useRef(null);

  // 15-second background polling to sync rewards
  useEffect(() => {
    if (!user || !refreshEconomy) return;
    const interval = setInterval(() => {
      refreshEconomy().catch(err => console.warn('Failed to sync economy:', err));
    }, 15000);
    return () => clearInterval(interval);
  }, [user, refreshEconomy]);

  // Real-time toast alert when a new friend joins
  useEffect(() => {
    if (!economy) return;
    const currentRefCount = Number(economy.referral_count || 0);
    const currentUserId = economy.id || 'guest';

    if (prevUserId.current !== currentUserId) {
      prevUserId.current = currentUserId;
      prevReferralCount.current = currentRefCount;
      return;
    }

    if (prevReferralCount.current !== null && currentRefCount > prevReferralCount.current) {
      showToast("🎉 A friend joined using your code! You've got a Scratch Card waiting in the Reward Center! 🎁", "success");
      if (playVictory) playVictory();
    }
    prevReferralCount.current = currentRefCount;
  }, [economy?.referral_count, economy?.id]);

  // Battle Arena Notifications Checker
  const [battleNotifications, setBattleNotifications] = useState([]);

  useEffect(() => {
    const checkBattleNotifications = () => {
      const userId = economy?.id || 'guest';
      try {
        const stored = localStorage.getItem(`mcqkash_battle_notifications_${userId}`);
        if (stored) {
          const list = JSON.parse(stored);
          const now = Date.now();
          let changed = false;
          
          const updated = list.map(n => {
            if (n.status === 'pending' && now >= n.timestamp) {
               n.status = 'triggered';
               changed = true;
               showToast(`⚔️ [Battle Arena] ${n.opponentName} accepted your challenge, checkout who won?`, "info");
               // No victory/shatter audio trigger on notification arrival to preserve suspense
               // (Sounds will play once the user opens and views the battle card results)
              // Award payout! Wager was deducted, now we award payout = coinChange + 100
              if (transactKC) {
                const payout = n.coinChange + 100;
                transactKC(payout);
              }
              // Save to battle history so it appears in the collectible gallery
              try {
                const historyStored = localStorage.getItem(`mcqkash_battle_history_${userId}`);
                const historyList = historyStored ? JSON.parse(historyStored) : [];
                if (!historyList.some(item => item.id === n.id)) {
                  const estimatedCorrect = Math.max(0, Math.min(20, Math.round((n.userScore + 5) / 1.25)));
                  const newBattleCard = {
                    id: n.id,
                    userId: userId,
                    userFullName: economy?.full_name || 'You',
                    userAvatarId: economy?.avatar_id || 1,
                    userIsPro: economy?.is_pro || false,
                    userScore: n.userScore,
                    userCorrect: estimatedCorrect,
                    userIncorrect: 20 - estimatedCorrect,
                    userRank: n.userRank || 15,
                    opponentName: n.opponentName,
                    opponentAvatarId: n.opponentAvatarId,
                    opponentIsPro: n.opponentIsPro,
                    opponentScore: n.opponentScore,
                    opponentRank: n.opponentRank || 15,
                    targetExam: n.targetExam,
                    date: n.date,
                    timestamp: Date.now(),
                    outcome: n.userScore > n.opponentScore ? 'VICTORY' : n.userScore < n.opponentScore ? 'DEFEAT' : 'TIE',
                    coinChange: n.coinChange,
                    unboxed: true
                  };
                  historyList.unshift(newBattleCard);
                  localStorage.setItem(`mcqkash_battle_history_${userId}`, JSON.stringify(historyList));
                }
              } catch (err) {
                console.warn('Failed to save ghost battle to history:', err);
              }
            }
            return n;
          });
          
          if (changed) {
            localStorage.setItem(`mcqkash_battle_notifications_${userId}`, JSON.stringify(updated));
          }
          
          // Only show triggered (unread) notifications in panel
          const triggeredList = updated.filter(n => n.status === 'triggered');
          setBattleNotifications(triggeredList);
        }
      } catch (e) {
        console.warn('Failed checking battle notifications:', e);
      }
    };

    checkBattleNotifications();
    const interval = setInterval(checkBattleNotifications, 6000); // Check every 6 seconds
    return () => clearInterval(interval);
  }, [economy?.id, showToast, playVictory, playShatter]);

  const dndFocusActive = economy?.dnd_focus_active || false;
  const smartDndActive = economy?.smart_dnd_active ?? true;
  const isSilenced = dndFocusActive || (smartDndActive && location.pathname.includes('/mock-test'));

  const backlogCount = revisionStats?.totalResurrection || 0;
  const backlogLevel = getBacklogLevel(backlogCount);
  const hasBacklog = backlogLevel.active;
  const srsDue = revisionStats?.dueSRS || 0;
  const hasUpdates = hasBacklog || srsDue > 0 || pendingScratchCount > 0 || battleNotifications.length > 0;

  useEffect(() => {
    let active = true;
    async function fetchStats() {
      try {
        const stats = await getRevisionStats();
        if (active) setRevisionStats(stats);
      } catch (err) {
        console.error(err);
      }
    }
    fetchStats();
    return () => { active = false; };
  }, [economy?.kash_coins_balance, location.key]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const handler = e => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notificationsOpen]);

  const handleOpenAiSettings = () => {
    setAiSettingsOpen(true);
  };

  const getFlameGlowColors = (themeName) => {
    switch (themeName) {
      case 'dark':
        return { stroke: 'text-rose-500', fill: 'fill-amber-400', glow: 'from-rose-600 via-amber-500 to-yellow-400', shadow: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' };
      case 'light':
        return { stroke: 'text-orange-600', fill: 'fill-yellow-400', glow: 'from-orange-500 via-yellow-400 to-amber-300', shadow: 'drop-shadow-[0_0_6px_rgba(249,115,22,0.4)]' };
      case 'sepia':
        return { stroke: 'text-amber-700', fill: 'fill-orange-400', glow: 'from-amber-700 via-orange-500 to-yellow-500', shadow: 'drop-shadow-[0_0_6px_rgba(180,83,9,0.5)]' };
      default:
        return { stroke: 'text-orange-600', fill: 'fill-yellow-400', glow: 'from-orange-500 via-yellow-400 to-amber-300', shadow: 'drop-shadow-[0_0_6px_rgba(249,115,22,0.4)]' };
    }
  };
  const flameStyles = getFlameGlowColors(theme);

  const isStreakDoneToday = () => {
    if (!economy || !economy.last_streak_date) return false;
    return new Date(economy.last_streak_date).toDateString() === new Date().toDateString();
  };

  useEffect(() => {
    if (!settingsOpen) return;
    const handler = e => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [settingsOpen]);

  return (
    <>
      <header
        className="sticky top-0 z-50 transition-all duration-500 relative"
        style={{
          background: 'rgba(var(--color-surface-rgb), 0.72)',
          borderBottom: '1px solid rgba(var(--color-primary), 0.10)',
          backdropFilter: 'blur(32px) saturate(200%) brightness(1.05)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%) brightness(1.05)',
          boxShadow: '0 1px 0 rgba(var(--color-primary), 0.08), 0 4px 24px rgba(0,0,0,0.10)',
        }}
      >
        {/* Subtle top accent glow line */}
        <div
          className="absolute top-0 inset-x-0 h-[2px] pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(var(--color-primary), 0.5) 35%, rgba(var(--color-primary), 0.7) 50%, rgba(var(--color-primary), 0.5) 65%, transparent 100%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 h-full min-h-[52px] sm:min-h-[56px] flex items-center justify-between gap-2 sm:gap-4">

          {/* Logo & Tier Badge */}
          <MCQKashLogo tier={economy?.user_tier || 'FREE'} />

          {/* ── Right Actions ─────────────────────────────────────── */}
          <div className="flex items-center gap-[6px]">

            {/* Streak / Flame — standalone icon button */}
            <button
              onClick={() => setStreakModalOpen(true)}
              aria-label="View streak"
              className="relative flex items-center justify-center w-[38px] h-[38px] rounded-full group transition-all duration-200 active:scale-90"
              style={{ overflow: 'visible' }}
            >
              {/* Hover ring — appears only on hover */}
              <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: 'rgba(var(--color-primary), 0.08)' }} />

              {isStreakDoneToday() ? (
                <div className="relative flex items-center justify-center">
                  <div className={`absolute inset-[-3px] bg-gradient-to-t ${flameStyles.glow} rounded-full blur-[6px] opacity-45 animate-pulse pointer-events-none`} />
                  <Flame
                    size={23}
                    strokeWidth={2}
                    className={`relative z-10 ${flameStyles.stroke} ${flameStyles.fill} ${flameStyles.shadow} transition-all duration-700`}
                  />
                </div>
              ) : (
                <Flame
                  className="text-theme-muted opacity-40 group-hover:opacity-75 group-hover:text-orange-400 transition-all duration-300"
                  size={23}
                  strokeWidth={1.6}
                  fill="transparent"
                />
              )}
            </button>

            {/* Coin balance — stat chip, minimal and clean */}
            <button
              onClick={() => setCoinsVaultOpen(true)}
              aria-label="View coin vault"
              className="group flex items-center gap-1.5 h-[38px] px-2.5 sm:px-3 rounded-full transition-all duration-200 active:scale-95"
              style={{
                background: 'rgba(var(--color-surface-rgb), 0.55)',
                border: '1px solid rgba(var(--color-border-rgb, 255,255,255), 0.12)',
              }}
            >
              <KashCoinDisplay
                amount={economy?.kash_coins_balance || 0}
                className="text-[13px] sm:text-[14px] font-extrabold group-hover:opacity-80 transition-opacity"
                iconClassName="w-[1.15em] h-[1.15em]"
              />
            </button>

            {/* Thin visual spacer */}
            <div className="w-px h-5 rounded-full opacity-20" style={{ background: 'var(--color-border)' }} />

            {/* Bell / Notifications — standalone */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(n => !n)}
                aria-label="Notifications"
                className={`relative flex items-center justify-center w-[38px] h-[38px] rounded-full group transition-all duration-200 active:scale-90 ${
                  notificationsOpen
                    ? 'text-theme-primary'
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                {/* Hover/active ring */}
                <span
                  className={`absolute inset-0 rounded-full transition-opacity duration-200 ${
                    notificationsOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  style={{ background: 'rgba(var(--color-primary), 0.09)' }}
                />

                {isSilenced ? (
                  <BellOff size={23} strokeWidth={1.7} className="relative z-10 opacity-55" />
                ) : (
                  <Bell size={23} strokeWidth={1.7} className="relative z-10" />
                )}

                {/* Notification badge dot */}
                {hasUpdates && !isSilenced && (
                  <span
                    className={`absolute rounded-full border-[2px] ${
                      hasBacklog ? backlogLevel.badgeClass : 'bg-blue-500'
                    } ${hasBacklog ? 'animate-pulse' : ''}`}
                    style={{
                      width: 8,
                      height: 8,
                      top: 8,
                      right: 8,
                      borderColor: 'rgba(var(--color-surface-rgb), 1)',
                      boxShadow: hasBacklog
                        ? '0 0 7px rgba(239,68,68,0.75)'
                        : '0 0 5px rgba(59,130,246,0.65)',
                      zIndex: 20,
                    }}
                  />
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <NotificationsPanel
                    onClose={() => setNotificationsOpen(false)}
                    stats={revisionStats}
                    isSilenced={isSilenced}
                    pendingScratchCount={pendingScratchCount}
                    battleNotifications={battleNotifications}
                    setBattleNotifications={setBattleNotifications}
                    economy={economy}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Settings — standalone */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(s => !s)}
                aria-label="Settings"
                className={`flex items-center justify-center w-[38px] h-[38px] rounded-full group transition-all duration-200 active:scale-90 ${
                  settingsOpen
                    ? 'text-theme-primary'
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                {/* Hover/active ring */}
                <span
                  className={`absolute inset-0 rounded-full transition-opacity duration-200 ${
                    settingsOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  style={{ background: 'rgba(var(--color-primary), 0.09)' }}
                />
                <motion.div
                  animate={{ rotate: settingsOpen ? 72 : 0 }}
                  transition={{ duration: 0.4, type: 'spring', stiffness: 180, damping: 14 }}
                  className="relative z-10 flex items-center justify-center"
                >
                  <Settings size={23} strokeWidth={1.7} />
                </motion.div>
              </button>

              <AnimatePresence>
                {settingsOpen && (
                  <SettingsPanel
                    onClose={() => setSettingsOpen(false)}
                    onOpenAiSettings={handleOpenAiSettings}
                  />
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </header>

      {/* Streak & Economy Modals */}
      <StreakModal isOpen={streakModalOpen} onClose={() => setStreakModalOpen(false)} />
      <CoinsVaultModal isOpen={coinsVaultOpen} onClose={() => setCoinsVaultOpen(false)} />

      {/* ⚙️ PERSONAL BYOK AI SETTINGS MODAL */}
      <BYOKSettingsModal 
        isOpen={aiSettingsOpen} 
        onClose={() => setAiSettingsOpen(false)} 
      />
    </>
  );
}
