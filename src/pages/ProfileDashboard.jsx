import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/Header';
import { 
  User, Settings, Award, Clock, ChevronRight, ChevronDown, Shield, Zap, Sparkles, 
  CheckCircle, XCircle, TrendingUp, Lock, Wand2, Eye, EyeOff, Send, 
  RefreshCw, MessageSquare, BarChart2, X, BookmarkCheck, LayoutGrid, 
  ChevronUp, Lightbulb, LogOut, Key, Mail, LockKeyhole, AlertTriangle, Snowflake, Loader, Trophy, Calendar
} from 'lucide-react';
import BYOKSettingsModal from '../components/BYOKSettingsModal';
import ProfileCustomizerModal from '../components/ProfileCustomizerModal';
import StudyGoalsModal from '../components/StudyGoalsModal';
import Avatar, { avatarsList } from '../components/Avatars';
import PremiumProfileCard from '../components/PremiumProfileCard';
import { useTheme } from '../context/ThemeContext';

import { getAggregatedStats, saveOutput } from '../lib/db';
import WarRoomSection from '../components/WarRoomSection';
import PerformanceChart from '../components/PerformanceChart';
import { useEconomy } from '../context/EconomyContext';
import { KashCoinDisplay } from '../components/EconomyUI';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  queryGenerativeAI, 
  renderMathInHtmlString, 
  formatMentorResponse, 
  stripCodeFences, 
  buildMcqCreatorPrompt, 
  buildStudyPlanPrompt, 
  buildReportCardPrompt, 
  buildLearnStuffPrompt, 
  queryColorHighlightsForExplanations, 
  applyHighlightsToText,
  sanitizeHtml
} from '../lib/ai';
import { useToast } from '../context/ToastContext';
import { useSound } from '../context/SoundContext';
import ScratchCardSection from '../components/ScratchCardSection';
import { motion, AnimatePresence } from 'framer-motion';

const MODES = [
  { 
    id: 'mcq', 
    emoji: '🎯', 
    label: 'MCQ Creator', 
    bg: 'bg-purple-500/10', 
    border: 'border-purple-500/20', 
    text: 'text-purple-600 dark:text-purple-400', 
    activeBg: 'bg-purple-600 text-white', 
    placeholder: 'Topic for MCQs… (leave empty for random)' 
  },
  { 
    id: 'learn', 
    emoji: '💡', 
    label: 'Learn Stuff', 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-500/20', 
    text: 'text-emerald-600 dark:text-emerald-400', 
    activeBg: 'bg-emerald-600 text-white', 
    placeholder: 'Any topic to learn… (leave empty for surprise topic)' 
  },
  { 
    id: 'plan', 
    emoji: '📅', 
    label: 'Study Plan', 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/20', 
    text: 'text-blue-600 dark:text-blue-400', 
    activeBg: 'bg-blue-600 text-white', 
    placeholder: 'Custom plan request… (leave empty for weekly schedule)' 
  },
  { 
    id: 'report', 
    emoji: '📊', 
    label: 'Report Card', 
    bg: 'bg-rose-500/10', 
    border: 'border-rose-500/20', 
    text: 'text-rose-600 dark:text-rose-400', 
    activeBg: 'bg-rose-600 text-white', 
    placeholder: 'Press send to generate your diagnostic report…' 
  },
];

const loaderMessages = {
  mcq: 'Kash is crafting your custom practice MCQs…',
  plan: 'Kash is designing your strategic study plan…',
  report: 'Kash is compiling your performance diagnostics…',
  learn: 'Kash is structuring the core concept and mnemonics…'
};

const OutputCard = ({ output, onSave, onDelete, onAnswerMCQ }) => {
  const modeInfo = MODES.find(m => m.id === output.mode) || MODES[0];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="mcq-glass-card rounded-[1.35rem] p-5 md:p-6 transition-all space-y-4 relative overflow-hidden"
    >
      {/* CARD HEADER */}
      <div className="relative flex items-center justify-between border-b border-theme-border/40 pb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${modeInfo.bg} ${modeInfo.text} ${modeInfo.border}`}>
            {modeInfo.emoji} {modeInfo.label}
          </span>
          <span className="text-[10px] text-theme-muted font-bold">
            {new Date(output.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSave(output)}
            disabled={output.savedToDb}
            title={output.savedToDb ? "Saved to Library" : "Bookmark output"}
            className={`p-2 rounded-xl transition-all border ${
              output.savedToDb
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 font-extrabold cursor-default'
                : 'bg-theme-bg/60 border-theme-border/80 hover:border-amber-500/40 text-theme-muted hover:text-amber-500'
            }`}
          >
            <BookmarkCheck size={14} />
          </button>

          <button
            onClick={() => onDelete(output.id)}
            title="Remove from feed"
            className="p-2 rounded-xl bg-theme-bg/60 border border-theme-border/80 hover:border-rose-500/30 hover:bg-rose-500/10 text-theme-muted hover:text-rose-500 transition-all"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* CARD TITLE */}
      {output.title && (
        <h3 className="relative text-base font-extrabold text-theme-text tracking-tight">
          {output.title}
        </h3>
      )}

      {/* CARD CONTENT */}
      {output.mcqs ? (
        <div className="relative space-y-6 pt-2">
          {output.mcqs.map((mcq, idx) => (
            <div key={idx} className="mcq-inner-card rounded-[1.1rem] p-5 md:p-6 transition-all space-y-4">
              
              <div className="flex items-center justify-between text-[10px] font-semibold tracking-widest uppercase mb-1">
                <span className="text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/15">
                  MCQ {idx + 1}
                </span>
                <span className={`px-3 py-1 rounded-full border ${
                  (mcq.difficulty || 'Medium').toLowerCase() === 'hard'
                    ? 'text-rose-500 bg-rose-500/10 border-rose-500/10'
                    : (mcq.difficulty || 'Medium').toLowerCase() === 'easy'
                      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/10'
                      : 'text-blue-500 bg-blue-500/10 border-blue-500/10'
                }`}>
                  {mcq.difficulty || 'Medium'}
                </span>
              </div>

              <p className="nk-mcq-question font-bold text-theme-text text-[15px] leading-relaxed tracking-tight" dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(mcq.question) }} />
              
              <div className="space-y-2.5">
                {mcq.options.map(opt => {
                  const isSelected = mcq.selectedOption === opt.id;
                  const isCorrect = opt.id === mcq.correctId;
                  const hasAnswered = !!mcq.selectedOption;

                  let rowClass = 'w-full text-left flex items-center gap-3.5 p-3.5 rounded-[0.95rem] text-sm transition-all duration-200';
                  let bubbleClass = 'mcq-letter w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-200';

                  if (!hasAnswered) {
                    rowClass += ' mcq-option-row cursor-pointer text-theme-text font-medium group';
                    bubbleClass += ' text-theme-muted group-hover:text-theme-primary';
                  } else if (isCorrect) {
                    rowClass += ' mcq-option-correct text-emerald-800 dark:text-emerald-300 font-semibold pointer-events-none';
                    bubbleClass += ' bg-emerald-500 text-white';
                  } else if (isSelected) {
                    rowClass += ' mcq-option-wrong text-rose-800 dark:text-rose-300 font-semibold pointer-events-none';
                    bubbleClass += ' bg-rose-500 text-white';
                  } else {
                    rowClass += ' mcq-option-muted text-theme-muted opacity-40 pointer-events-none';
                    bubbleClass += ' text-theme-muted';
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={hasAnswered}
                      onClick={() => onAnswerMCQ(output.id, idx, opt.id)}
                      className={`group ${rowClass}`}
                    >
                      <span className={bubbleClass}>{opt.id.toUpperCase()}</span>
                      <span className="flex-1 text-[13px] md:text-sm leading-snug" dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(opt.text) }} />
                      {hasAnswered && isCorrect && <CheckCircle className="text-emerald-500 w-5 h-5 shrink-0" />}
                      {hasAnswered && isSelected && !isCorrect && <XCircle className="text-rose-500 w-5 h-5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              
              {mcq.selectedOption && (
                <div className="mcq-explanation-panel p-5 rounded-[1.1rem] space-y-4 mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex justify-between items-center pb-2 border-b border-theme-border/30">
                    <h4 className="flex items-center gap-2 font-bold text-theme-primary">
                      <Lightbulb size={18} /> Explanation
                    </h4>
                  </div>
                  <div className="leading-relaxed text-xs text-theme-text font-medium mentor-response" dangerouslySetInnerHTML={{ __html: formatMentorResponse(mcq.explanation) }} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          className="mentor-response prose max-w-none text-theme-text leading-relaxed text-sm pt-1"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(output.html) }}
        />
      )}
    </motion.div>
  );
};

export default function ProfileDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, signUp, signIn, signInWithGoogle, signOut } = useAuth();
  const { economy, toggleProTier, refreshEconomy, spendRevisionKC, openProUpsell, aiSettingsOpen, setAiSettingsOpen } = useEconomy();
  const { showToast } = useToast();
  const { playVictory } = useSound();
  const { theme } = useTheme();


  const getScratchHistory = () => {
    try {
      const username = economy?.username || 'default';
      const historyKey = `mcqkash_scratch_history_${username}`;
      let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      if (economy && economy.id && economy.id !== 'default_user') {
        let changed = false;
        
        // 1. Sync/Restore Welcome Card
        const hasWelcome = history.some(item => item.type === 'Welcome Card');
        const welcomePending = localStorage.getItem('mcqkash_welcome_coins_pending');
        if (economy.referred_by && !hasWelcome && !welcomePending) {
          history.push({
            id: 'welcome_restored',
            type: 'Welcome Card',
            coins: 150,
            wallet: 0,
            date: 'Welcome'
          });
          changed = true;
        }
        
        // 2. Sync/Restore Referral Cards
        const currentReferralCount = history.filter(item => item.type === 'Referral Card').length;
        const targetReferralCount = Number(economy.scratched_cards_count || 0);
        if (currentReferralCount < targetReferralCount) {
          const diff = targetReferralCount - currentReferralCount;
          for (let i = 0; i < diff; i++) {
            history.push({
              id: `ref_restored_${Date.now()}_${i}`,
              type: 'Referral Card',
              coins: 150,
              wallet: 25,
              date: 'Referred'
            });
          }
          changed = true;
        }
        
        if (changed) {
          localStorage.setItem(historyKey, JSON.stringify(history));
        }
      }
      return history;
    } catch (e) {
      return [];
    }
  };

  const getKashCoinsEarnedFromInvites = () => {
    const history = getScratchHistory();
    if (history.length > 0) {
      return history.reduce((sum, item) => sum + (item.coins || 0), 0);
    }
    return 0;
  };

  const getScratchedReferralCount = () => {
    const history = getScratchHistory();
    // Count only Referral Cards, excluding Welcome Card from invite counts
    return history.filter(item => item.type === 'Referral Card').length;
  };

  const getScratchedWelcomeCount = () => {
    const history = getScratchHistory();
    // Count Welcome Cards scratched
    return history.filter(item => item.type === 'Welcome Card').length;
  };

  const [studyGoalsOpen, setStudyGoalsOpen] = useState(false);
  
  // Customizer state
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showRewardCenterModal, setShowRewardCenterModal] = useState(false);

  // Billing Modal state
  const [showBillingModal, setShowBillingModal] = useState(false);

  // Inviter Card state
  const [inviterData, setInviterData] = useState(null);
  const [inviterLoading, setInviterLoading] = useState(false);

  useEffect(() => {
    if (showRewardCenterModal && economy?.referred_by) {
      const fetchInviterInfo = async () => {
        setInviterLoading(true);
        try {
          const { data, error } = await supabase.rpc('get_public_profile_by_username', {
            target_username: economy.referred_by
          });
          if (!error && data) {
            setInviterData(data);
            setInviterLoading(false);
            return;
          }
        } catch (e) {
          console.warn('RPC failed, falling back to local storage cache');
        }

        // Fallback: search in local leaderboard cache
        try {
          const cacheKey = 'mcqkash_lb_cache_coins';
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { data } = JSON.parse(cached);
            const found = data.find(p => p.username?.toLowerCase() === economy.referred_by.toLowerCase() || p.full_name?.toLowerCase() === economy.referred_by.toLowerCase());
            if (found) {
              setInviterData({
                avatar_id: found.avatar_id || 1,
                rank: found.rank || null,
                full_name: found.full_name || economy.referred_by,
                is_pro: !!found.pro_expires_at && new Date(found.pro_expires_at) > new Date()
              });
              setInviterLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Leaderboard cache search failed');
        }

        setInviterData({ avatar_id: 1, rank: null, full_name: economy.referred_by, is_pro: false });
        setInviterLoading(false);
      };
      fetchInviterInfo();
    }
  }, [showRewardCenterModal, economy?.referred_by]);

  // Body scroll locking when Reward Center is open & Force Refresh Economy
  useEffect(() => {
    if (showRewardCenterModal) {
      document.body.style.overflow = 'hidden';
      if (refreshEconomy) refreshEconomy(true);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showRewardCenterModal]);

  // Show all mock tests toggle (4 vs 12)
  const [showAllMocks, setShowAllMocks] = useState(false);

  // User Rank state
  const [userRank, setUserRank] = useState(null);
  const [totalAspirants, setTotalAspirants] = useState(null);



  // Handle redirect messages (e.g. guest intercepts)
  const toastFiredRef = useRef(false);
  useEffect(() => {
    if (location.state && (location.state.message || location.state.openStudyGoals || location.state.openRewards)) {
      if (location.state.message && !toastFiredRef.current) {
        showToast(location.state.message, 'warning');
        toastFiredRef.current = true;
      }
      if (location.state.openStudyGoals) {
        setStudyGoalsOpen(true);
      }
      if (location.state.openRewards) {
        setShowRewardCenterModal(true);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, showToast]);

  // Parse query params to auto-open Reward Center
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('rewards') === 'true') {
      setShowRewardCenterModal(true);
      navigate(location.pathname, { replace: true, state: location.state });
    }
  }, [location.search, location.pathname, navigate]);

  useEffect(() => {
    let active = true;
    const fetchUserRankAndCount = async (force = false) => {
      if (!user) {
        setUserRank(null);
        setTotalAspirants(null);
        return;
      }

      const now = Date.now();
      const cacheKey = `mcqkash_ranks_cache_${user.id}`;
      const cached = localStorage.getItem(cacheKey);

      let cacheFresh = false;
      if (cached) {
        try {
          const { timestamp, coinsRank, totalAspirants } = JSON.parse(cached);
          if (active) {
            setUserRank(coinsRank);
            if (typeof totalAspirants === 'number') setTotalAspirants(totalAspirants);
          }
          // 24 hour cache cooldown for ranks and total aspirants count
          if (now - timestamp < 24 * 60 * 60 * 1000) {
            cacheFresh = true;
          }
        } catch (e) { /* fall through on corrupt cache */ }
      }

      if (cacheFresh && !force) return;

      try {
        const { data: rankData, error: rankError } = await supabase.rpc('get_logged_in_user_coins_rank');
        if (rankError) throw rankError;
        if (active) {
          setUserRank(rankData);
        }

        const { data: countData, error: countError } = await supabase.rpc('get_total_aspirants_count');
        let count = null;
        if (!countError && typeof countData === 'number') {
          if (active) {
            setTotalAspirants(countData);
          }
          count = countData;
        }

        // Write-back to unified cache, preserving other ranks
        let cacheObj = { timestamp: now, coinsRank: rankData, streakRank: null, totalAspirants: count };
        if (cached) {
          try { cacheObj = { ...cacheObj, ...JSON.parse(cached) }; } catch (e) {}
        }
        cacheObj.timestamp = now;
        cacheObj.coinsRank = rankData;
        cacheObj.totalAspirants = count;
        localStorage.setItem(cacheKey, JSON.stringify(cacheObj));
      } catch (err) {
        console.error('Failed to fetch user rank/count:', err);
        if (active) {
          setUserRank(null);
          setTotalAspirants(null);
        }
      }
    };

    fetchUserRankAndCount(false);

    const handleSync = () => {
      fetchUserRankAndCount(true);
    };
    window.addEventListener('sync-profile-stats', handleSync);

    return () => {
      active = false;
      window.removeEventListener('sync-profile-stats', handleSync);
    };
  }, [user]);

  // Streak countdown banner state
  const [streakTimeLeft, setStreakTimeLeft] = useState('');

  // Master Prompter States
  const [showAiCoachDescription, setShowAiCoachDescription] = useState(false);
  const [showAiCoachModal, setShowAiCoachModal] = useState(false);
  const [masterMode, setMasterMode] = useState('mcq');
  const [outputs, setOutputs] = useState(() => {
    try {
      const saved = localStorage.getItem('civilsKash_mentorOutputs');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(o => o.mcqs ? { ...o, mcqs: o.mcqs.map(m => ({ ...m, selectedOption: null })) } : o);
      }
      return [];
    } catch (e) {
      return [];
    }
  });
  const [userPrompt, setUserPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ghostProfile, setGhostProfile] = useState(() => localStorage.getItem('civilsKash_ghostProfile') || '');

  useEffect(() => {
    localStorage.setItem('civilsKash_mentorOutputs', JSON.stringify(outputs));
  }, [outputs]);

  const filteredOutputs = outputs.filter(o => o.mode === masterMode);

  const [userStats, setUserStats] = useState({
    totalTests: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    accuracyRate: 0,
    history: []
  });

  // Load aggregated mock stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const aggregated = await getAggregatedStats();
        setUserStats(aggregated);
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      }
    };
    loadStats();
  }, []);

  // ── 1. STREAK COUNTDOWN TIMER HOOK ──
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight - now;

      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setStreakTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setStreakTimeLeft('0h 0m');
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, []);

  // ── 2. ONBOARDING MODAL DETECT ──
  useEffect(() => {
    if (user && economy && economy.id === user.id) {
      const isComplete = economy.onboarded || localStorage.getItem(`mcqkash_onboarded_${user.id}`) === 'true';
      if (!isComplete) {
        setShowCustomizer(true);
      }
    }
  }, [user, economy]);

  // ── 2B. DETECT HEADER DIRECT NAV ──
  useEffect(() => {
    if (location.state?.openBilling && economy?.user_tier === 'Pro') {
      setShowBillingModal(true);
      // Clear location state so modal doesn't keep opening on subsequent route matches
      window.history.replaceState({}, document.title);
    }
  }, [location.state, economy?.user_tier]);

  // ── 3. SIGN OUT HANDLER ──

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('Signed out successfully.', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ── 4. SETTINGS CLICK ──
  const handleSettingClick = (id) => {
    if (id === 'ai') {
      if (economy?.user_tier !== 'Pro') {
        openProUpsell('Elite AI Suite');
      } else {
        setAiSettingsOpen(true);
      }
    } else if (id === 'billing') {
      if (economy?.user_tier === 'Pro') {
        setShowBillingModal(true);
      } else {
        navigate('/upgrade');
      }
    } else if (id === 'goals') {
      setStudyGoalsOpen(true);
    } else if (id === 'rewards') {
      setShowRewardCenterModal(true);
    } else if (id === 'personal') {
      setShowCustomizer(true);
    } else {
      showToast(`${id.replace(/-/g, ' ')} settings are configured automatically.`, 'info');
    }
  };

  const handleShareReferral = async () => {
    const inviteUrl = window.location.origin + (window.location.pathname.startsWith('/mcq') ? '/mcq' : '') + '/signin?ref=' + encodeURIComponent(economy?.username || '');
    const shareText = `📚 Preparing for Competitive Exams?\nI'm using MCQkash for topic-wise MCQs, PYQ's, Smart Revision, and exam-focused Mock Test with AI Analysis.\nJoin to compete with me on Leaderboard and USE my referral code "${economy?.username}" when signing up and we'll both earn Jackpot KashCoins + Exclusive FREE Rewards 🎁\n🚀 Click here to register directly --> ${inviteUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MCQ Kash',
          text: shareText,
          url: inviteUrl
        });
        showToast("Referral shared successfully! 🚀", "success");
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Web Share failed:", err);
          copyShareFallback(shareText);
        }
      }
    } else {
      copyShareFallback(shareText);
    }
  };

  const copyShareFallback = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Share text copied to clipboard! 📋", "success");
  };

  const handleAiCoachClick = () => {
    if (economy?.user_tier !== 'Pro') {
      openProUpsell('Personal Coach');
    } else {
      setShowAiCoachModal(true);
    }
  };


  // ── 5. AI COACH MENTOR EXECUTION ──
  const executePrompt = async (mode, promptText) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setUserPrompt('');
    
    try {
      const provider = localStorage.getItem('civilsKash_aiProvider') || 'gemini';
      const activeKey = 
        provider === 'gemini' ? localStorage.getItem('civilsKash_geminiKey') :
        provider === 'openai' ? localStorage.getItem('civilsKash_openaiKey') :
        provider === 'deepseek' ? localStorage.getItem('civilsKash_deepseekKey') :
        provider === 'huggingface' ? localStorage.getItem('civilsKash_huggingfaceKey') : 
        localStorage.getItem('civilsKash_openrouterKey');

      if (!activeKey) {
        throw new Error(`Your API Key for ${provider.toUpperCase()} is not set. Please configure it in settings.`);
      }

      let rawResult;
      if (mode === 'mcq') {
        const { systemPrompt, userMsg } = buildMcqCreatorPrompt(promptText);
        rawResult = await queryGenerativeAI(systemPrompt, userMsg);
        let data;
        const stripped = stripCodeFences(rawResult);
        try {
          data = JSON.parse(stripped);
        } catch (err) {
          console.warn("Standard JSON parse failed, attempting robust extraction:", err);
          const startIdx = rawResult.indexOf('{');
          const endIdx = rawResult.lastIndexOf('}');
          if (startIdx !== -1 && endIdx !== -1) {
            try {
              data = JSON.parse(rawResult.substring(startIdx, endIdx + 1));
            } catch (err2) {
              console.error("Extracted JSON parsing failed too, attempting string cleaning:", err2);
              try {
                let candidate = rawResult.substring(startIdx, endIdx + 1);
                candidate = candidate.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
                  return match.replace(/\n/g, '\\n');
                });
                data = JSON.parse(candidate);
              } catch (err3) {
                console.error("All JSON recovery attempts failed:", err3);
              }
            }
          }
        }

        if (!data || !data.mcqs || data.mcqs.length === 0) {
          throw new Error("AI output was not in correct JSON format. Please try again.");
        }

        try {
          const explanations = data.mcqs.map(m => m.explanation || '');
          const highlightsList = await queryColorHighlightsForExplanations(explanations);
          
          data.mcqs.forEach((mcq, idx) => {
            const highlights = highlightsList[idx] || [];
            let highlightedExp = applyHighlightsToText(mcq.explanation || '', highlights);
            highlightedExp = highlightedExp.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-theme-text">$1</strong>');
            mcq.explanation = highlightedExp;
            
            if (mcq.question) {
              mcq.question = mcq.question.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-theme-text">$1</strong>');
            }
          });
        } catch (e) {
          console.warn("Failed to apply automatic color coding to explanations:", e);
        }

        const newOutput = { 
          id: Date.now(), 
          mode, 
          title: data.title || promptText || 'Custom MCQs', 
          mcqs: (data.mcqs || []).map(m => ({ ...m, selectedOption: null })), 
          html: null, 
          timestamp: new Date().toISOString(), 
          savedToDb: false 
        };
        setOutputs(prev => [newOutput, ...prev]);
      } else if (mode === 'plan') {
        const { systemPrompt, userMsg } = buildStudyPlanPrompt(promptText, ghostProfile, userStats);
        rawResult = await queryGenerativeAI(systemPrompt, userMsg);
        const html = formatMentorResponse(rawResult);
        const newOutput = { 
          id: Date.now(), 
          mode, 
          title: promptText || '', 
          html, 
          mcqs: null, 
          timestamp: new Date().toISOString(), 
          savedToDb: false 
        };
        setOutputs(prev => [newOutput, ...prev]);
      } else if (mode === 'report') {
        const { systemPrompt, userMsg } = buildReportCardPrompt(userStats);
        rawResult = await queryGenerativeAI(systemPrompt, userMsg);
        let html = '';
        let ghost = '';
        try {
          const data = JSON.parse(stripCodeFences(rawResult));
          html = formatMentorResponse(data.reportMarkdown || rawResult);
          ghost = data.ghostProfile || '';
        } catch (e) {
          console.warn("Report card parsing failed, using fallback:", e);
          html = formatMentorResponse(rawResult);
        }
        if (ghost) {
          setGhostProfile(ghost);
          localStorage.setItem('civilsKash_ghostProfile', ghost);
        }
        const newOutput = { 
          id: Date.now(), 
          mode, 
          title: 'Performance Report Card', 
          html, 
          mcqs: null, 
          timestamp: new Date().toISOString(), 
          savedToDb: false 
        };
        setOutputs(prev => [newOutput, ...prev]);
      } else if (mode === 'learn') {
        const { systemPrompt, userMsg } = buildLearnStuffPrompt(promptText);
        rawResult = await queryGenerativeAI(systemPrompt, userMsg);
        const html = formatMentorResponse(rawResult);
        const newOutput = { 
          id: Date.now(), 
          mode, 
          title: promptText || '', 
          html, 
          mcqs: null, 
          timestamp: new Date().toISOString(), 
          savedToDb: false 
        };
        setOutputs(prev => [newOutput, ...prev]);
      }
    } catch (err) {
      console.error(err);
      showToast('AI Error: ' + err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle incoming scroll-to-section and Personal AI Mentor modal triggers
  useEffect(() => {
    if (location.state?.scrollToSection) {
      const sectionId = location.state.scrollToSection;
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }

    if (location.state?.openMentor) {
      setShowAiCoachModal(true);
      if (location.state.mentorMode) {
        setMasterMode(location.state.mentorMode);
      }
      
      if (location.state.pipeOutput) {
        const newOutput = location.state.pipeOutput;
        setOutputs(prev => {
          if (prev.some(o => o.id === newOutput.id)) return prev;
          const updated = [newOutput, ...prev];
          localStorage.setItem('civilsKash_mentorOutputs', JSON.stringify(updated));
          return updated;
        });
      } else if (location.state.initialPrompt) {
        setUserPrompt(location.state.initialPrompt);
        if (location.state.autoExecute) {
          executePrompt(location.state.mentorMode || 'learn', location.state.initialPrompt);
        }
      }

      // Clear location state so they don't keep opening on subsequent navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSaveOutput = async (output) => {
    try {
      await saveOutput(output);
      setOutputs(prev => prev.map(o => o.id === output.id ? { ...o, savedToDb: true } : o));
      window.dispatchEvent(new Event('savedOutputsUpdated'));
      showToast('Saved to AI Library! 📌', 'success');
    } catch (err) {
      showToast('Failed to save: ' + err.message, 'error');
    }
  };

  const handleDeleteOutput = (id) => {
    setOutputs(prev => prev.filter(o => o.id !== id));
    showToast('Removed from feed', 'info');
  };

  const handleAnswerMCQ = (outputId, mcqIdx, optionId) => {
    setOutputs(prev => prev.map(o => {
      if (o.id === outputId) {
        const updatedMcqs = o.mcqs.map((m, idx) => {
          if (idx === mcqIdx) {
            return { ...m, selectedOption: optionId };
          }
          return m;
        });
        return { ...o, mcqs: updatedMcqs };
      }
      return o;
    }));
  };

  // Stats helpers
  const totalTests = userStats?.totalTests || 0;
  const totalQuestions = userStats?.totalQuestions || 0;
  const correctQs = userStats?.totalCorrect || 0;
  const incorrectQs = userStats?.totalIncorrect || 0;
  const accuracy = userStats?.accuracyRate !== undefined ? userStats.accuracyRate : 0;
  
  const lastHistory = userStats?.history?.[0];
  const lastScoreScaled = lastHistory?.total > 0 
    ? ((lastHistory.correct / lastHistory.total) * 10).toFixed(1) 
    : '0.0';

  const avgScoreScaled = totalQuestions > 0 
    ? ((correctQs / totalQuestions) * 10).toFixed(1)
    : '0.0';

  const stats = [
    { label: 'Mock Tests Taken', value: totalTests.toString(), icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: "MCQ's Solved", value: totalQuestions.toString(), icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Correct Qs', value: correctQs.toString(), icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Incorrect Qs', value: incorrectQs.toString(), icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Accuracy Rate', value: `${accuracy}%`, icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Last Score', value: `${lastScoreScaled}/10`, icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Average Score', value: `${avgScoreScaled}/10`, icon: Award, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Current Streak', value: `${economy?.current_streak_days || 0} Days`, icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="min-h-screen bg-theme-bg pb-24 font-sans">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {authLoading ? (
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-theme-primary/25 border-t-theme-primary rounded-full animate-spin" />
            <p className="text-xs text-theme-muted font-bold uppercase tracking-widest">Validating Session...</p>
          </div>
        ) : !user ? (
          /* ── GUEST / LOGGED-OUT: SIDE-BY-SIDE GUEST PREVIEW & SYNC CARD ── */
          <div className="max-w-md mx-auto mb-8">
            {/* GUEST INFO CARD (Redesigned, Spacious, Premium) */}
            <div className="bg-gradient-to-br from-theme-surface via-theme-surface to-theme-primary/5 rounded-3xl p-6 md:p-8 border border-theme-border shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[340px] hover:border-theme-primary/30 transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-theme-primary/10 rounded-full blur-[50px] pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/5 rounded-full blur-[50px] pointer-events-none" />
              
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left w-full">
                {/* Avatar with absolute pen/edit icon overlay */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-theme-primary/30 to-amber-500/30 p-1 shrink-0 relative shadow-inner">
                  <div className="w-full h-full rounded-full bg-theme-bg p-1">
                    <Avatar id={economy?.avatar_id || 1} className="w-full h-full rounded-full" />
                  </div>
                  <button 
                    onClick={() => setShowCustomizer(true)}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-theme-primary text-white border-2 border-theme-surface flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md"
                    title="Edit Character"
                  >
                    <User size={14} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded-full mb-2">
                    ⚡ Guest Mode
                  </div>
                  <h2 className="text-2xl font-[900] text-theme-text tracking-tight truncate">Guest Aspirant</h2>
                  <p className="text-xs text-theme-muted font-bold">guestaspirant@gmail.com</p>
                </div>
              </div>

              {/* Your Rank & Local Stats Grid */}
              <div className="mt-6 pt-6 border-t border-theme-border/50 grid grid-cols-3 gap-2 relative z-10 text-center sm:text-left">
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-[9px] font-black uppercase tracking-widest text-theme-muted">Your Rank</span>
                  <span className="text-sm font-black text-theme-text mt-1 flex items-center gap-1">
                    <Lock size={12} className="text-theme-muted" /> Offline
                  </span>
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-[9px] font-black uppercase tracking-widest text-theme-muted">KashCoins</span>
                  <span className="text-sm font-black text-amber-500 mt-1">{economy?.kash_coins_balance || 0}</span>
                </div>
                <div className="flex flex-col items-center sm:items-end">
                  <span className="text-[9px] font-black uppercase tracking-widest text-theme-muted">Streak</span>
                  <span className="text-sm font-black text-rose-500 mt-1">{economy?.current_streak_days || 0} Days</span>
                </div>
              </div>

              {/* Catchy Get Me In Button */}
              <div className="mt-6 w-full relative z-10">
                <button
                  onClick={() => navigate('/signin')}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-theme-primary to-theme-accent text-white font-black text-sm uppercase tracking-widest shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <Sparkles size={16} className="animate-pulse" />
                  Get me In
                </button>
              </div>
            </div>
          </div>
        ) : (
          <PremiumProfileCard
            economy={economy}
            userRank={userRank}
            totalAspirants={totalAspirants}
            onEditCharacter={() => setShowCustomizer(true)}
          />
        )}


        {/* ── STREAK COUNTDOWN RESET BANNER (Responsive Flex-Col on Mobile) ── */}
        {economy?.current_streak_days > 0 && (() => {
          const todayStr = new Date().toDateString();
          const isStreakProtected = economy?.last_streak_date === todayStr;
          const hasStreakFreeze = (economy?.available_streak_freezes || 0) > 0;

          if (isStreakProtected) {
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-emerald-500/20 via-theme-surface to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                    <CheckCircle className="animate-pulse" size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-theme-text leading-none mb-1">
                      Today's Streak is Protected! 🛡️
                    </h4>
                    <p className="text-xs text-theme-muted font-medium">
                      You completed a mock today. Your streak is safe. Next lock cycle opens in <strong className="text-emerald-500">{streakTimeLeft}</strong>.
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 px-3 py-1 rounded-full border border-emerald-500/10 whitespace-nowrap">
                    Active & Safe
                  </span>
                </div>
              </motion.div>
            );
          } else if (hasStreakFreeze) {
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-cyan-500/20 via-theme-surface to-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 shrink-0">
                    <Snowflake size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-theme-text leading-none mb-1">
                      Streak Protected by Shield ❄️
                    </h4>
                    <p className="text-xs text-theme-muted font-medium">
                      You haven't completed a mock today, but your active <strong className="text-cyan-500">Streak Freeze</strong> will automatically protect you. ({economy.available_streak_freezes} remaining).
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-600 px-3 py-1 rounded-full border border-cyan-500/10 whitespace-nowrap">
                    Freeze Shield Active
                  </span>
                </div>
              </motion.div>
            );
          } else {
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-rose-500/20 via-amber-500/10 to-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                    <TrendingUp className="animate-bounce" size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-theme-text leading-none mb-1">
                      Streak Protect Mode Active ⚠️
                    </h4>
                    <p className="text-xs text-theme-muted font-medium">
                      Streak ends in <strong className="text-rose-500">{streakTimeLeft}</strong>. Complete 1 MCQ Mock to lock streak!
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-600 px-3 py-1 rounded-full border border-rose-500/10 whitespace-nowrap">
                    Streak Ends Soon
                  </span>
                </div>
              </motion.div>
            );
          }
        })()}

        {/* ── #1: MINIMALISTIC GLASSMORPHIC NAVIGATION CAPSULES (Mobile Grid, Desktop Flex) ── */}
        <div className="grid grid-cols-2 md:flex bg-white/5 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl mb-8 shadow-lg gap-2 justify-center">
          {[
            { id: 'performance-analytics', label: 'Performance', icon: BarChart2 },
            { id: 'war-room-analytics', label: 'War Room', icon: Zap },
            { id: 'mocks-analytics', label: 'Mocks Analysis', icon: CheckCircle },
            { id: 'settings-analytics', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                const el = document.getElementById(tab.id);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-theme-muted hover:text-theme-text hover:bg-white/5 transition-all"
            >
              <tab.icon size={14} className="text-theme-primary shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── AI STUDY COACH BANNER (theme-sensitive) ── */}
        {(() => {
          const aiGlowColor = theme === 'dark'
            ? { shadow1: 'rgba(251,191,36,0.18)', shadow2: 'rgba(251,191,36,0.38)', border1: 'rgba(251,191,36,0.22)', border2: 'rgba(251,191,36,0.48)' }
            : theme === 'sepia'
            ? { shadow1: 'rgba(154,52,18,0.14)', shadow2: 'rgba(154,52,18,0.30)', border1: 'rgba(154,52,18,0.20)', border2: 'rgba(154,52,18,0.42)' }
            : { shadow1: 'rgba(67,97,238,0.12)', shadow2: 'rgba(67,97,238,0.28)', border1: 'rgba(67,97,238,0.18)', border2: 'rgba(67,97,238,0.38)' };

          const aiGradClass = theme === 'dark'
            ? 'from-amber-500/10 via-theme-surface to-purple-500/5'
            : theme === 'sepia'
            ? 'from-[#9a3412]/8 via-theme-surface to-[#65704a]/5'
            : 'from-indigo-500/8 via-theme-surface to-violet-500/5';

          const aiBlob1 = theme === 'dark'
            ? 'from-amber-500/10 to-purple-500/10'
            : theme === 'sepia'
            ? 'from-[#b45309]/8 to-[#65704a]/8'
            : 'from-indigo-500/10 to-violet-500/8';

          const aiBadgeClass = theme === 'dark'
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
            : theme === 'sepia'
            ? 'bg-[#b45309]/10 text-[#9a3412] border-[#b45309]/25'
            : 'bg-indigo-500/10 text-indigo-600 border-indigo-400/25';

          const aiSparkleClass = theme === 'dark'
            ? 'text-amber-400'
            : theme === 'sepia'
            ? 'text-[#b45309]'
            : 'text-indigo-500';

          const aiHoverClass = theme === 'dark'
            ? 'group-hover:text-amber-400'
            : theme === 'sepia'
            ? 'group-hover:text-[#9a3412]'
            : 'group-hover:text-indigo-500';

          const aiBtnClass = theme === 'dark'
            ? 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
            : theme === 'sepia'
            ? 'from-[#9a3412] to-[#7c2d12] hover:from-[#7c2d12] hover:to-[#6b1f0b]'
            : 'from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600';

          return (
            <motion.div
              animate={{
                boxShadow: [
                  `0 12px 40px -20px ${aiGlowColor.shadow1}, 0 0 15px -3px ${aiGlowColor.shadow1}`,
                  `0 12px 40px -20px ${aiGlowColor.shadow2}, 0 0 25px -1px ${aiGlowColor.shadow2}`,
                  `0 12px 40px -20px ${aiGlowColor.shadow1}, 0 0 15px -3px ${aiGlowColor.shadow1}`,
                ],
                borderColor: [aiGlowColor.border1, aiGlowColor.border2, aiGlowColor.border1],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className={`bg-gradient-to-tr ${aiGradClass} rounded-3xl p-5 border mb-8 relative overflow-hidden`}
            >
              <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${aiBlob1} rounded-full blur-[80px] pointer-events-none`} />

              <div className="relative z-10 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                  <div
                    onClick={() => setShowAiCoachDescription(!showAiCoachDescription)}
                    className="flex items-center gap-2.5 cursor-pointer select-none group"
                  >
                    <div className={`text-theme-muted ${aiHoverClass} transition-colors duration-200 flex items-center justify-center`}>
                      {showAiCoachDescription ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                    <h2 className={`text-lg font-black text-theme-text tracking-tight ${aiHoverClass} transition-colors duration-200`}>
                      Personal Study Mentor
                    </h2>
                    <div className={`flex items-center gap-1 ${aiBadgeClass} px-2 py-0.5 rounded-full border shrink-0`}>
                      <Sparkles size={11} className={`${aiSparkleClass} animate-pulse`} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Elite AI</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    <button
                      onClick={handleAiCoachClick}
                      className={`px-5 py-2.5 bg-gradient-to-r ${aiBtnClass} text-white rounded-xl font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5`}
                    >
                      {economy?.user_tier === 'Pro' ? (
                        <><Wand2 size={13} /> Start Coaching</>
                      ) : (
                        <><Lock size={13} /> Unlock Mentor</>
                      )}
                    </button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {showAiCoachDescription && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-theme-border/40 w-full mb-4" />
                      <p className="text-xs text-theme-muted font-medium max-w-3xl leading-relaxed text-center mx-auto pb-1">
                        Your competitors have access to the same books — not the same intelligence. Powered by your complete preparation history, this innovative Personal Study Mentor feature reveals Hidden Weaknesses, Generates Smart Mocks around your Mastery Index, giving you Personalized Guidance. This is a serious unfair edge over competition that our Pro Aspirants deserve.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })()}


        {/* ── #2: ALL SECTIONS STACKED SEQUENTIALLY ── */}
        <div className="space-y-12 animate-in fade-in duration-300">
          
          {/* A. PERFORMANCE SECTION */}
          <div id="performance-analytics" className="scroll-mt-6 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-theme-border pb-3">
              <BarChart2 className="text-theme-primary" size={20} />
              <h2 className="text-lg font-black text-theme-text uppercase tracking-tight">Performance Diagnostics</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="bg-theme-surface p-5 rounded-2xl border border-theme-border flex flex-col hover:border-theme-primary/30 transition-colors">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                    <stat.icon size={20} />
                  </div>
                  <div className="text-2xl font-black text-theme-text mb-1 tracking-tight">{stat.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Accuracy Trend chart */}
            <div className="bg-theme-surface rounded-3xl p-6 border border-theme-border shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-theme-muted mb-4 px-2">Accuracy Trend Line</h3>
              <PerformanceChart history={userStats.history} />
            </div>
          </div>

          {/* B. WAR ROOM SECTION */}
          <div id="war-room-analytics" className="scroll-mt-6 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-theme-border pb-3">
              <Zap className="text-theme-primary" size={20} />
              <h2 className="text-lg font-black text-theme-text uppercase tracking-tight">Competitive War Room</h2>
            </div>
            <WarRoomSection />
          </div>

          {/* C. MOCKS ANALYSIS SECTION */}
          <div id="mocks-analytics" className="scroll-mt-6 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-theme-border pb-3">
              <CheckCircle className="text-theme-primary" size={20} />
              <h2 className="text-lg font-black text-theme-text uppercase tracking-tight">Recent Mock Tests Analysis</h2>
            </div>
            
            <div className="bg-theme-surface rounded-2xl border border-theme-border overflow-hidden">
              {userStats.history.length === 0 ? (
                <div className="p-8 text-center text-theme-muted font-medium">
                  No mock tests attempted yet.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
                    {userStats.history.slice(0, showAllMocks ? 20 : 4).map((stat, i) => {
                      const isPassed = stat.percentage >= 50;
                      return (
                        <div 
                          key={i} 
                          className={`group relative rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all duration-300 ${
                            isPassed 
                              ? 'bg-emerald-500/[0.02] border-emerald-500/10 hover:border-emerald-500/35 hover:shadow-[0_12px_24px_rgba(16,185,129,0.04)]' 
                              : 'bg-rose-500/[0.02] border-rose-500/10 hover:border-rose-500/35 hover:shadow-[0_12px_24px_rgba(244,63,94,0.04)]'
                          }`}
                        >
                          {/* Meta */}
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <h4 className="font-extrabold text-sm text-theme-text leading-snug group-hover:text-theme-primary transition-colors">
                                {stat.title}
                              </h4>
                              <span className="text-[10px] text-theme-muted font-bold block mt-1">
                                Attempted: {new Date(stat.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            
                            <div className={`shrink-0 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              isPassed ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            }`}>
                              {isPassed ? 'Passed' : 'Review'}
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-3 gap-2 bg-theme-bg/40 rounded-xl p-2.5 text-[10px] border border-theme-border/20">
                            <div className="text-center">
                              <span className="text-theme-muted font-bold block">Correct</span>
                              <span className="font-black text-emerald-500 text-xs block mt-0.5">{stat.correct || 0}</span>
                            </div>
                            <div className="text-center border-x border-theme-border/30">
                              <span className="text-theme-muted font-bold block">Incorrect</span>
                              <span className="font-black text-rose-500 text-xs block mt-0.5">{stat.incorrect || 0}</span>
                            </div>
                            <div className="text-center">
                              <span className="text-theme-muted font-bold block">Score</span>
                              <span className="font-black text-theme-text text-xs block mt-0.5">{stat.percentage}%</span>
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-theme-border/20 text-[10px] text-theme-muted font-bold uppercase tracking-wider">
                            <span>Total: {stat.total || 10} Qs</span>
                            <span>{stat.attempted || 0} Attempted</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Expanding toggle button */}
                  {userStats.history.length > 4 && (
                    <div className="flex justify-center pb-5 pt-1 border-t border-theme-border/20">
                      <button
                        onClick={() => setShowAllMocks(!showAllMocks)}
                        className="px-6 py-2.5 bg-theme-surface-hover hover:bg-theme-border border border-theme-border rounded-xl text-xs font-black uppercase tracking-wider text-theme-text hover:text-theme-primary transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        {showAllMocks ? "Show Less Mocks" : `View More Mocks (${Math.min(20, userStats.history.length) - 4} More)`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* D. SETTINGS SECTION */}
          <div id="settings-analytics" className="scroll-mt-6 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-theme-border pb-3">
              <Settings className="text-theme-primary" size={20} />
              <h2 className="text-lg font-black text-theme-text uppercase tracking-tight">Profile Settings & Configuration</h2>
            </div>
            
            <div className="bg-theme-surface rounded-2xl border border-theme-border overflow-hidden">
              {[
                { id: 'personal', title: 'Personal Information', desc: 'Update your name and contact details' },
                { id: 'billing', title: 'Subscription & Billing', desc: 'Manage your Pro plan' },
                { id: 'rewards', title: 'Earn Rewards', desc: 'Invite friends, earn KashCoins, and unlock premium discounts' },
                { id: 'ai', title: 'Elite AI Suite', desc: 'Configure your personal AI keys, models, and explore premium features' },
                { id: 'goals', title: 'Study Goals', desc: 'Set daily targets and target exams' },
                { id: 'notifications', title: 'Notification Preferences', desc: 'Email and push alerts' },
              ].map((item, i, arr) => (
                <button 
                  key={i} 
                  onClick={() => handleSettingClick(item.id)}
                  className={`w-full flex items-center justify-between p-5 hover:bg-theme-surface-hover transition-colors text-left ${i !== arr.length - 1 ? 'border-b border-theme-border/50' : ''}`}
                >
                  <div>
                    <h3 className="font-bold text-theme-text mb-0.5">{item.title}</h3>
                    <p className="text-xs text-theme-muted font-medium">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.id === 'ai' && (
                      <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${economy?.user_tier === 'Pro' ? 'bg-amber-500/10 text-amber-500' : 'bg-theme-muted/10 text-theme-muted'}`}>
                        {economy?.user_tier === 'Pro' ? '★ Pro Active' : 'Configure'}
                      </span>
                    )}
                    <ChevronRight size={18} className="text-theme-muted" />
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* 🧠 PERSONAL AI MENTOR MODAL — responsive, Master Prompter system */}
      {showAiCoachModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAiCoachModal(false); }}
        >
          <div className="bg-theme-surface border border-theme-border rounded-t-3xl sm:rounded-3xl w-full sm:max-w-5xl lg:max-w-7xl shadow-2xl overflow-hidden flex flex-col h-[92vh] sm:h-[90vh] lg:h-[92vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">

            {/* SLIM HEADER */}
            <div className="px-4 py-3 border-b border-theme-border bg-theme-bg/60 backdrop-blur-sm flex items-center gap-2 shrink-0 justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500 animate-pulse shrink-0" />
                <span className="font-black text-sm text-theme-text uppercase tracking-tight">Personal AI Mentor</span>
              </div>

              <div className="flex items-center gap-2">
                {filteredOutputs.length > 0 && (
                  <button
                    onClick={() => handleSaveOutput(filteredOutputs[0])}
                    disabled={filteredOutputs[0].savedToDb}
                    title={filteredOutputs[0].savedToDb ? "Saved to Library" : "Save latest response"}
                    className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs font-bold ${
                      filteredOutputs[0].savedToDb
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 font-extrabold cursor-default'
                        : 'bg-theme-bg/60 border-theme-border/80 hover:border-amber-500/40 text-theme-muted hover:text-amber-500'
                    }`}
                  >
                    <BookmarkCheck size={13} />
                    <span className="hidden sm:inline">{filteredOutputs[0].savedToDb ? "Saved" : "Save Output"}</span>
                  </button>
                )}

                {filteredOutputs.length > 0 && (
                  <button
                    title="Clear current mode feed"
                    onClick={() => { setOutputs(prev => prev.filter(o => o.mode !== masterMode)); showToast('Active feed cleared', 'info'); }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-theme-muted hover:text-rose-500 transition-colors border border-theme-border"
                  >
                    <XCircle size={13} />
                  </button>
                )}

                <button
                  onClick={() => setShowAiCoachModal(false)}
                  className="p-1.5 rounded-lg hover:bg-theme-bg text-theme-muted hover:text-theme-text transition-colors border border-theme-border"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* BODY (FEED ONLY) */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-theme-bg/10">
              
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {isGenerating && (
                    <motion.div
                      key="loader"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-theme-surface border border-theme-border rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3.5 shadow-sm animate-pulse"
                    >
                      <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                        <Sparkles size={20} className="text-amber-500 absolute inset-0 m-auto" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-theme-text mb-0.5">Kash is thinking…</h4>
                        <p className="text-xs text-theme-muted font-medium">
                          {loaderMessages[masterMode] || 'Generating response...'}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {filteredOutputs.length === 0 ? (
                    !isGenerating && (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-center gap-4 my-auto h-full"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner">
                          <Sparkles size={30} className="text-amber-500 animate-pulse" />
                        </div>
                        <div className="max-w-md space-y-1">
                          <p className="font-black text-theme-text text-lg">Your Personal AI Mentor Feed</p>
                          <p className="text-sm text-theme-muted leading-relaxed">
                            {masterMode === 'mcq' && "Enter a topic to generate custom practice MCQs, or leave empty to generate random MCQs."}
                            {masterMode === 'plan' && "Enter a custom plan request, or leave empty to get a weekly study plan."}
                            {masterMode === 'report' && "Click send to compile your comprehensive performance diagnostics and report card."}
                            {masterMode === 'learn' && "Enter any topic to learn, or leave empty for a surprise topic explanation."}
                          </p>
                        </div>
                      </motion.div>
                    )
                  ) : (
                    filteredOutputs.map(output => (
                      <OutputCard
                        key={output.id}
                        output={output}
                        onSave={handleSaveOutput}
                        onDelete={handleDeleteOutput}
                        onAnswerMCQ={handleAnswerMCQ}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* INPUT ROW */}
            <div className="p-4 border-t border-theme-border bg-theme-surface shrink-0">
              <div className="flex flex-wrap gap-2 mb-3.5 max-w-4xl mx-auto w-full">
                {MODES.map(m => {
                  const isActive = masterMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMasterMode(m.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                        isActive
                          ? `${m.activeBg} border-transparent shadow-md`
                          : `bg-theme-bg border-theme-border text-theme-muted hover:text-theme-text hover:border-amber-500/30`
                      }`}
                    >
                      <span className="text-sm">{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executePrompt(masterMode, userPrompt);
                }}
                className="flex items-center gap-3 max-w-4xl mx-auto w-full relative"
              >
                <input
                  type="text"
                  value={masterMode === 'report' ? '' : userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder={MODES.find(m => m.id === masterMode)?.placeholder || 'Ask Kash anything…'}
                  disabled={isGenerating || masterMode === 'report'}
                  style={{ color: 'var(--color-text)' }}
                  className="flex-1 bg-theme-bg border-2 border-theme-border rounded-xl px-4 py-3 text-base font-semibold focus:outline-none focus:border-amber-500/60 focus:ring-4 focus:ring-amber-500/10 transition-all placeholder:text-theme-muted/55 disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center transition-all hover:from-amber-600 hover:to-amber-700 active:scale-95 shadow-lg shadow-amber-500/15 disabled:opacity-45 disabled:pointer-events-none"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ⚙️ PERSONAL BYOK AI SETTINGS MODAL */}
      <BYOKSettingsModal 
        isOpen={aiSettingsOpen} 
        onClose={() => setAiSettingsOpen(false)} 
      />

      {/* STUDY GOALS & FOCUS MODAL */}
      <StudyGoalsModal
        isOpen={studyGoalsOpen}
        onClose={() => setStudyGoalsOpen(false)}
      />

      {/* ONBOARDING PROFILE CUSTOMIZER DIALOG */}
      <ProfileCustomizerModal
        user={user}
        isOpen={showCustomizer}
        initialName={economy?.full_name || ''}
        initialAvatarId={economy?.avatar_id || 1}
        onClose={() => setShowCustomizer(false)}
        onComplete={({ fullName, avatarId }) => {
          setShowCustomizer(false);
          if (refreshEconomy) refreshEconomy(true);
        }}
      />

      {/* 💳 PREMIUM PLAN MANAGEMENT MODAL */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#05070a]/80 backdrop-filter backdrop-blur-md transition-opacity"
            onClick={() => setShowBillingModal(false)}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-[#0c0f17] border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            {/* Glow vignette */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-purple-500/10 blur-3xl pointer-events-none rounded-full" />
            
            {/* Header */}
            <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <span className="text-purple-400 font-bold text-sm">★</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-100 leading-none">MCQ Kash Pro</h3>
                  <span className="text-[10px] text-purple-400 font-bold tracking-wider uppercase">Subscription Status</span>
                </div>
              </div>
              <button 
                onClick={() => setShowBillingModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 overflow-y-auto z-10 flex-1">
              
              {/* Premium Status Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/40 via-indigo-950/20 to-transparent border border-purple-500/25 p-5 shadow-inner">
                {/* Micro reflection */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-300/20 to-transparent" />
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-purple-300/70 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/15">
                      {economy?.pro_tier === 'LIFETIME' ? 'Lifetime Pass' : 'Premium Membership'}
                    </span>
                    <h4 className="font-black text-xl text-slate-100 mt-2.5 leading-none">
                      {economy?.pro_tier ? economy.pro_tier.replace(/_/g, ' ') : 'Pro Active'}
                    </h4>
                  </div>
                  <span className="text-2xl">⚡</span>
                </div>

                <div className="flex items-center justify-between border-t border-purple-500/15 pt-3.5 mt-2.5 text-xs">
                  <span className="text-purple-300/70 font-semibold">Valid Until:</span>
                  <span className="font-bold text-slate-200">
                    {economy?.pro_tier === 'LIFETIME' ? (
                      'Lifetime Access (Forever)'
                    ) : economy?.pro_expiration ? (
                      new Date(economy.pro_expiration).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    ) : (
                      'Active'
                    )}
                  </span>
                </div>
              </div>

              {/* Payment History */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Transaction History</h4>
                {economy?.payment_history && economy.payment_history.length > 0 ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {economy.payment_history.map((tx, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs hover:border-white/10 transition-colors">
                        <div>
                          <div className="font-bold text-slate-200">Pro Upgrade ({tx.plan_id ? tx.plan_id.replace(/_/g, ' ') : 'Plan'})</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">ID: {tx.payment_id || tx.order_id || 'N/A'}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-100">₹{tx.amount_paid}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                            {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('en-IN') : 'Completed'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-white/5 text-center text-xs text-slate-500 font-semibold">
                    No transaction records stored locally.
                  </div>
                )}
              </div>

              {/* Help & Support Note */}
              <div className="rounded-2xl bg-purple-900/10 border border-purple-500/20 p-5 text-xs text-purple-300/95 leading-relaxed font-semibold">
                🎉 <span className="text-slate-100 font-extrabold">Congratulations!</span> You are officially a Pro member. You now have unrestricted access to all features, locked mock exams, and will automatically mint <span className="text-amber-400 font-black">double</span> the coins compared to free users on every correct answer. Let's build your streak!
              </div>

            </div>

            {/* Footer */}
            <div className="p-5 bg-white/[0.01] border-t border-white/5 flex items-center justify-center z-10">
              <button
                onClick={() => setShowBillingModal(false)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 active:scale-98"
              >
                🚀 Let's Crack It!
              </button>
            </div>

          </div>
        </div>
      )}
      {/* 🎁 REWARD CENTER MODAL */}
      {showRewardCenterModal && (
        <div 
          className="fixed inset-0 z-[9999] overflow-y-auto overflow-x-hidden custom-scrollbar flex items-start sm:items-center justify-center p-0 sm:p-6 backdrop-blur-md bg-theme-bg/90"
          onClick={(e) => { if (e.target === e.currentTarget) setShowRewardCenterModal(false); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="w-full min-h-screen sm:min-h-0 sm:max-h-[90vh] sm:max-w-md md:max-w-4xl flex flex-col bg-theme-surface border-0 ring-1 ring-theme-border/20 sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative sm:overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 p-6 bg-gradient-to-b from-theme-primary/10 to-transparent flex items-start justify-between relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-theme-primary via-theme-accent to-theme-primary opacity-50" />
              <div>
                <h2 className="text-2xl font-black flex items-center gap-2 text-theme-text italic tracking-tighter">
                  <Sparkles className="text-theme-primary fill-theme-primary animate-pulse" size={24} />
                  Reward Center
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted mt-1 opacity-60">Referral & Milestone Rewards Protocol</p>
              </div>
              <button onClick={() => setShowRewardCenterModal(false)} className="p-2 rounded-full bg-theme-bg/50 hover:bg-theme-bg border border-theme-border/50 transition-all">
                <X size={18} className="text-theme-muted" />
              </button>
            </div>

            <div className="flex-1 sm:overflow-y-auto sm:custom-scrollbar p-6 sm:p-8 pt-0 flex flex-col md:grid md:grid-cols-2 md:gap-10">
              
              {/* Left Column: Code & Stats */}
              <div className="flex flex-col">
                {/* Inviter Card (if invited by someone) */}
                {economy?.referred_by && (
                  <div className="mb-6 bg-gradient-to-r from-theme-primary/5 via-theme-accent/[0.03] to-transparent border border-theme-primary/20 rounded-3xl p-5 flex items-center justify-between relative overflow-hidden shadow-card hover:shadow-card-hover hover:border-theme-primary/35 hover:scale-[1.01] transition-all duration-350 ease-out group/inviter">
                    <div className="absolute inset-0 bg-grid-white/[0.01] pointer-events-none" />
                    
                    {/* Left Side: Avatar & Inviter Name */}
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-full ring-2 ring-theme-primary/30 group-hover/inviter:ring-theme-primary/50 p-[2px] bg-theme-surface shrink-0 transition-all duration-300">
                        {inviterLoading ? (
                          <div className="w-full h-full rounded-full bg-theme-bg/50 animate-pulse flex items-center justify-center">
                            <Loader size={16} className="text-theme-primary animate-spin" />
                          </div>
                        ) : (
                          <Avatar id={inviterData?.avatar_id || 1} className="w-full h-full rounded-full bg-theme-bg" />
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-primary opacity-90">Invited By</span>
                        <h4 className="font-black text-lg text-theme-text tracking-tight mt-0.5 flex items-center gap-2 leading-none">
                          {inviterLoading ? 'Loading...' : (inviterData?.full_name || economy.referred_by)}
                          {!inviterLoading && inviterData?.is_pro && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[8px] font-black tracking-widest uppercase animate-pulse">PRO</span>
                          )}
                        </h4>
                      </div>
                    </div>

                    {/* Right Side: Trophy Rank Badge */}
                    {!inviterLoading && inviterData?.rank && (
                      <div className="relative z-10 flex items-center gap-1.5 text-[11px] text-amber-500 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/20 font-black shadow-sm shrink-0">
                        <Trophy size={12} className="fill-amber-500" />
                        <span>Rank #{inviterData.rank}</span>
                      </div>
                    )}

                    {/* Visual accent */}
                    <div className="text-4xl font-serif text-theme-primary/10 select-none absolute right-4 top-2 font-bold pointer-events-none">✨</div>
                  </div>
                )}

                {/* Massive Referral Code Box */}
                <div className="flex flex-col items-center justify-center py-6 mb-6 bg-gradient-to-b from-theme-bg/40 to-theme-bg/10 rounded-3xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.15)] border-t border-theme-border/10 ring-1 ring-black/5 dark:ring-white/5 relative overflow-hidden text-center">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-theme-primary/80">Your Referral Code</span>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-theme-text tracking-tighter drop-shadow-2xl mt-3 mb-4 select-all truncate max-w-full px-4 text-center whitespace-nowrap">
                    {economy?.username || '---'}
                  </h1>
                  <button
                    onClick={handleShareReferral}
                    className="px-6 py-2.5 bg-gradient-to-r from-theme-primary to-theme-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md hover:opacity-95 active:scale-98 flex items-center gap-2"
                  >
                    <Send size={12} /> Share Referral
                  </button>
                </div>

                {/* Grid stats */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">Invite Stats</span>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Friends Joined */}
                    <div className="bg-blue-500/[0.03] border border-blue-500/10 rounded-2xl p-4 text-left">
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Friends Joined</span>
                      <div className="text-2xl font-black text-blue-500 mt-1">
                        {!economy || economy.id === 'default_user' ? getScratchedReferralCount() : (economy.referral_count || 0)}
                      </div>
                    </div>

                    {/* Earnings */}
                    <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-4 text-left">
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Earnings</span>
                      <div className="mt-1">
                        <KashCoinDisplay
                          amount={getKashCoinsEarnedFromInvites()}
                          className="text-2xl font-black text-amber-500"
                          iconClassName="w-[0.9em] h-[0.9em]"
                        />
                      </div>
                    </div>

                    {/* Streak Freeze */}
                    <div className="bg-cyan-500/[0.03] border border-cyan-500/10 rounded-2xl p-4 text-left">
                      <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Streak Freeze</span>
                      <div className="text-2xl font-black text-cyan-500 mt-1 flex items-baseline gap-1">
                        +{getScratchedReferralCount() + getScratchedWelcomeCount()} <span className="text-[10px] text-cyan-600/70 dark:text-cyan-400/70 font-bold tracking-wide">Shield</span>
                      </div>
                    </div>

                    {/* Power Surge */}
                    <div className="bg-rose-500/[0.03] border border-rose-500/10 rounded-2xl p-4 text-left">
                      <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Power Surge</span>
                      <div className="text-2xl font-black text-rose-500 mt-1 flex items-baseline gap-1">
                        +{(getScratchedReferralCount() * 3) + (getScratchedWelcomeCount() * 7)} <span className="text-[10px] text-rose-600/70 dark:text-rose-400/70 font-bold tracking-wide">Days</span>
                      </div>
                    </div>

                    {/* Wallet Money */}
                    <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl p-4 text-left col-span-2 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Wallet Money</span>
                        <div className="text-2xl font-black text-emerald-500 mt-1">
                          ₹{!economy || economy.id === 'default_user' ? (getScratchedReferralCount() * 25) : (economy.premium_discount_earned || 0)}
                        </div>
                      </div>
                      <span className="text-[9px] text-theme-muted font-bold tracking-wide max-w-[150px] text-right">
                        Applies to premium checkout automatically
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Information & Wallet */}
              <div className="flex flex-col gap-6 mt-6 md:mt-0">
                

                <ScratchCardSection
                  economy={economy}
                  refreshEconomy={refreshEconomy}
                  showToast={showToast}
                  playVictory={playVictory}
                />

                {/* Rewards Program Rules card */}
                <div className="bg-theme-primary/[0.01] dark:bg-theme-primary/[0.02] backdrop-blur-md border border-theme-primary/15 rounded-3xl p-5 space-y-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">How Referrals Work</span>
                  
                  <div className="space-y-3.5 text-xs text-left">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded bg-theme-primary/10 text-theme-primary flex items-center justify-center font-bold shrink-0 text-[10px]">1</div>
                      <div>
                        <span className="font-extrabold text-theme-text block">Share & Invite</span>
                        <span className="text-theme-muted font-medium text-[11px]">Give your real friends your referral code (i.e username) to sign-up.</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-[10px]">2</div>
                      <div>
                        <span className="font-extrabold text-theme-text block">Friends Get instant benefits</span>
                        <span className="text-theme-muted font-medium text-[11px]">Referees receive a <strong className="text-amber-500">variable 100-250 KashCoins</strong> + <strong className="text-cyan-400">1 Streak Freeze</strong> + <strong className="text-rose-400">7-day Power Surge boost</strong>.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold shrink-0 text-[10px]">3</div>
                      <div>
                        <span className="font-extrabold text-theme-text block">You Get premium rewards</span>
                        <span className="text-theme-muted font-medium text-[11px]">Every referral awards you a <strong className="text-emerald-400">flat ₹25 premium discount</strong> and a <strong className="text-amber-400">Scratch Card</strong> loaded with <strong className="text-amber-500">variable KashCoins</strong>, <strong className="text-cyan-400">freezes</strong>, and <strong className="text-rose-400">surges</strong>!</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 mt-4 pt-3.5 border-t border-theme-border/10 text-[9px] text-red-500 font-extrabold uppercase tracking-widest">
                      <span>⚠️ WARNING: using fake invite emails can result in account ban.</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
