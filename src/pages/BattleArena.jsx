import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Swords, ArrowLeft, Clock, ShieldCheck, Sparkles, Trophy, Lock, 
  AlertTriangle, AlertCircle, Share2, Info, CheckCircle2, XCircle, 
  RefreshCw, Star, Coins, Zap, HelpCircle, User, ChevronRight, Eye, Trash2, X, Quote,
  MinusCircle, Activity, Maximize2, Minimize2
} from 'lucide-react';
import Header, { MCQKashLogo } from '../components/Header';
import Avatar from '../components/Avatars';
import UniversalModal from '../components/UniversalModal';
import { useTheme } from '../context/ThemeContext';
import { KashCoinIcon } from '../components/EconomyUI';
import { avatarsList } from '../components/Avatars';
import { useAuth } from '../context/AuthContext';
import { useEconomy } from '../context/EconomyContext';
import { useToast } from '../context/ToastContext';
import { useSound } from '../context/SoundContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ALL_STATIC_BANKS_SYNC, DYNAMIC_EXAMS } from '../lib/dataHub';
import { EXAM_CONFIG } from '../lib/mockEngine';
import McqCard from '../components/McqCard';
import { queryGenerativeAI, formatMentorResponse, stripCodeFences } from '../lib/ai';
import QOTDBento from '../components/QOTDBento';

// ─── Helpers ─────────────────────────────────────────────────────────

// Convert current time to IST and get the current hour and date string
const getISTDetails = () => {
  const now = new Date();
  
  // Format hour in IST
  const hrFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    hour12: false
  });
  const hour = parseInt(hrFormatter.format(now));

  // Format date in IST
  const dtFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const dateStr = dtFormatter.format(now); // "MM/DD/YYYY"
  
  return { hour, dateStr };
};

const getCardRarity = (card) => {
  if (!card) return 'common';
  const outcome = card.outcome;
  const userScore = card.userScore || card.score || 0;
  const opponentScore = card.opponentScore || card.opponent_score || 0;
  if (outcome !== 'VICTORY') return 'common';
  if (userScore >= 18.0) return 'legendary';
  const uRank = card.userRank || 15;
  const oRank = card.opponentRank || card.rank || 15;
  if (oRank < uRank - 30) return 'legendary';
  if (userScore >= 15.0) return 'epic';
  if (userScore > opponentScore && (userScore - opponentScore) <= 1.0) return 'clutch';
  return 'common';
};

// Calculate overall aspirant caliber (guaranteed between 5 and 100)
const calculateCaliber = (accuracy, rank = 15) => {
  const acc = accuracy || 70;
  const percentile = Math.max(5, Math.min(99, Math.round((1 - (rank - 1) / 50) * 100)));
  return Math.round((acc * 0.7) + (percentile * 0.3));
};

// Dynamically resolve and format target exam labels (e.g. 'jkssb-faa' -> 'JKSSB FAA')
const getExamLabel = (examId) => {
  if (!examId) return 'State PSC';
  const conf = EXAM_CONFIG[examId];
  if (conf && conf.label) return conf.label;
  
  // Try to find in dynamic exams list to get the exact name
  const dynamicMatch = DYNAMIC_EXAMS.find(e => e.id === examId);
  if (dynamicMatch && dynamicMatch.name) return dynamicMatch.name;

  // Clean trailing year suffix (e.g., -2026) and format
  const cleanId = examId.replace(/-\d{4}$/, '');
  return cleanId.replace(/-/g, ' ').toUpperCase();
};

// Snap score to the nearest valid MCQ marking scheme decimal (+1 / -0.25)
// Snapping options: .00, .25, .50, .75
const snapToMarkingScheme = (score) => {
  const snapped = Math.round(score * 4) / 4;
  return snapped;
};

// Relative Probability Battle Engine
const runBattleEngine = (userAccuracy, opponentAccuracy, userScore, userRank = 11, opponentRank = 15) => {
  // If user score is 20/20, separate logic/genius bot trap will trigger
  if (userScore >= 20.00) {
    return 18.75;
  }

  // Step 1: Base win probability according to user score
  let baseWinProb = 0.00;
  if (userScore < 4.0) {
    baseWinProb = 0.00; // Handled separately (always lose)
  } else if (userScore < 6.0) {
    baseWinProb = 0.05;
  } else if (userScore < 8.0) {
    baseWinProb = 0.15;
  } else if (userScore < 10.0) {
    baseWinProb = 0.30;
  } else if (userScore < 12.0) {
    baseWinProb = 0.45;
  } else if (userScore < 14.0) {
    baseWinProb = 0.60;
  } else if (userScore < 16.0) {
    baseWinProb = 0.70;
  } else if (userScore < 18.0) {
    baseWinProb = 0.80;
  } else {
    baseWinProb = 0.95;
  }

  // Step 2: Accuracy adjustment: (UserAcc - OpponentAcc) * 0.5% capped at ±12%
  const accuracyDiff = userAccuracy - opponentAccuracy;
  let accuracyAdj = accuracyDiff * 0.005;
  accuracyAdj = Math.max(-0.12, Math.min(0.12, accuracyAdj));

  // Step 3: Kash Rank adjustment: (OpponentRank - UserRank) * 0.5% capped at ±12%
  const rankDiff = opponentRank - userRank;
  let rankAdj = rankDiff * 0.005;
  rankAdj = Math.max(-0.12, Math.min(0.12, rankAdj));

  // Step 4: Final win probability clamped between 5% and 95%
  let finalWinProb = baseWinProb + accuracyAdj + rankAdj;
  finalWinProb = Math.max(0.05, Math.min(0.95, finalWinProb));

  // Step 5: Roll outcome
  let userWins;
  if (userScore < 4.0) {
    userWins = false;
  } else {
    userWins = Math.random() < finalWinProb;
  }

  // Step 6: Generate opponent score in multiples of 0.25
  let opponentScore;
  if (userWins) {
    // Generate opponent score in [Max(0.00, userScore - 3.0), userScore] (natural tie possible if it rolls userScore)
    const minVal = Math.max(0.00, userScore - 3.0);
    const maxVal = userScore;
    if (maxVal >= minVal) {
      const steps = Math.floor((maxVal - minVal) / 0.25);
      if (steps > 0) {
        const randomStep = Math.floor(Math.random() * (steps + 1));
        opponentScore = minVal + randomStep * 0.25;
      } else {
        opponentScore = minVal;
      }
    } else {
      opponentScore = 0.00;
    }
  } else {
    // Opponent wins or natural tie (opponentScore >= userScore)
    let minVal, maxVal;
    if (userScore < 4.0) {
      // Opponent score range is strictly 6.25 - 15.00 when user score is < 4
      minVal = 6.25;
      maxVal = 15.00;
    } else {
      minVal = userScore;
      maxVal = Math.min(18.75, userScore + 3.0);
    }

    if (minVal <= maxVal) {
      const steps = Math.floor((maxVal - minVal) / 0.25);
      if (steps > 0) {
        const randomStep = Math.floor(Math.random() * (steps + 1));
        opponentScore = minVal + randomStep * 0.25;
      } else {
        opponentScore = minVal;
      }
    } else {
      opponentScore = 18.75;
    }
  }

  // Snap to valid MCQ marking scheme decimal (+1 / -0.25)
  let snappedScore = snapToMarkingScheme(opponentScore);

  // Absolute ceiling constraint: 18.75 (19 correct, 1 incorrect)
  if (snappedScore > 18.75) {
    snappedScore = 18.75;
  }
  
  // Floor constraint: Opponent score can never be negative
  if (snappedScore < 0.00) {
    snappedScore = 0.00;
  }

  return snappedScore;
};

// Seeded PRNG and shuffle helpers for Asynchronous Challenge
const mulberry32 = (seed) => {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const getSeedHash = (seedVal) => {
  const str = String(seedVal);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash;
};

const seededShuffle = (arr, rng) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Generate deterministic target exam mock questions
const generateBattleMockQuestions = (targetExamId, seed = null) => {
  // 1. Dynamic registration of Supabase-loaded exams (e.g. JKSSB faa)
  if (DYNAMIC_EXAMS && Array.isArray(DYNAMIC_EXAMS)) {
    DYNAMIC_EXAMS.forEach(exam => {
      if (!EXAM_CONFIG[exam.id]) {
        EXAM_CONFIG[exam.id] = {
          label: exam.name,
          fullName: `${exam.name} Series`,
          categories: exam.categories.map(c => c.id),
          weights: exam.categories.map(c => ({ categoryId: c.id, fraction: c.weight / 100 })),
          categoryLabels: Object.fromEntries(exam.categories.map(c => [c.id, c.id.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())])),
          difficultyWeights: exam.difficulties || { easy: 0.33, medium: 0.33, hard: 0.34 }
        };
      }
    });
  }

  const config = EXAM_CONFIG[targetExamId];
  const totalQuestionsNeeded = 20;

  const isSeeded = seed !== null;
  const rng = isSeeded ? mulberry32(getSeedHash(seed)) : null;

  // Helper sorting function to ensure same base alignment
  const alignSort = (arr) => [...arr].sort((a, b) => String(a.id).localeCompare(String(b.id)));

  // Fallback 1: If config is missing, return 20 random static questions
  if (!config) {
    const aligned = alignSort(ALL_STATIC_BANKS_SYNC);
    return isSeeded ? seededShuffle(aligned, rng).slice(0, totalQuestionsNeeded) : aligned.sort(() => 0.5 - Math.random()).slice(0, totalQuestionsNeeded);
  }

  const categories = config.categories;
  const pool = ALL_STATIC_BANKS_SYNC.filter(q => categories.includes(q.category_id));

  // Fallback 2: If category pool is empty, return 20 random static questions
  if (pool.length === 0) {
    const aligned = alignSort(ALL_STATIC_BANKS_SYNC);
    return isSeeded ? seededShuffle(aligned, rng).slice(0, totalQuestionsNeeded) : aligned.sort(() => 0.5 - Math.random()).slice(0, totalQuestionsNeeded);
  }

  // Group by category and difficulty
  const grouped = {};
  categories.forEach(catId => {
    grouped[catId] = { easy: [], medium: [], hard: [] };
  });

  pool.forEach(q => {
    const cat = q.category_id;
    const diff = (q.difficulty || 'medium').toLowerCase();
    const targetDiff = (diff === 'easy' || diff === 'medium' || diff === 'hard') ? diff : 'medium';
    if (grouped[cat]) {
      grouped[cat][targetDiff].push(q);
    }
  });

  // Category allocations based on config weights
  const categoryAllocations = {};
  let allocatedSum = 0;
  config.weights.forEach(w => {
    const slots = Math.round(w.fraction * totalQuestionsNeeded);
    categoryAllocations[w.categoryId] = slots;
    allocatedSum += slots;
  });

  // Adjust diff
  let diffCount = totalQuestionsNeeded - allocatedSum;
  if (diffCount !== 0) {
    const topCategory = config.weights[0]?.categoryId || categories[0];
    if (topCategory) {
      categoryAllocations[topCategory] = (categoryAllocations[topCategory] || 0) + diffCount;
    }
  }

  const selectedQuestions = [];
  const difficultyWeights = config.difficultyWeights || { easy: 0.3, medium: 0.4, hard: 0.3 };

  categories.forEach(catId => {
    const categoryQty = categoryAllocations[catId] || 0;
    if (categoryQty <= 0) return;

    // Distribute by difficulty weights
    const easySlots = Math.round(categoryQty * difficultyWeights.easy);
    const hardSlots = Math.round(categoryQty * difficultyWeights.hard);
    const mediumSlots = categoryQty - easySlots - hardSlots;

    const pullFromGroup = (diffLevel, count) => {
      const list = grouped[catId][diffLevel] || [];
      const aligned = alignSort(list);
      return isSeeded ? seededShuffle(aligned, rng).slice(0, count) : aligned.sort(() => 0.5 - Math.random()).slice(0, count);
    };

    let pulledEasy = pullFromGroup('easy', easySlots);
    let pulledMedium = pullFromGroup('medium', mediumSlots);
    let pulledHard = pullFromGroup('hard', hardSlots);

    let pulled = [...pulledEasy, ...pulledMedium, ...pulledHard];

    // Fallback if category pools are dry
    if (pulled.length < categoryQty) {
      const alreadyPulledIds = new Set(pulled.map(q => q.id));
      const categoryAllPool = pool.filter(q => q.category_id === catId && !alreadyPulledIds.has(q.id));
      const needed = categoryQty - pulled.length;
      const aligned = alignSort(categoryAllPool);
      const extra = isSeeded ? seededShuffle(aligned, rng).slice(0, needed) : aligned.sort(() => 0.5 - Math.random()).slice(0, needed);
      pulled.push(...extra);
    }

    selectedQuestions.push(...pulled);
  });

  // Fallback 3: If category slots are dry, pull from remaining categories of this exam
  if (selectedQuestions.length < totalQuestionsNeeded) {
    const alreadySelectedIds = new Set(selectedQuestions.map(q => q.id));
    const remainingPool = pool.filter(q => !alreadySelectedIds.has(q.id));
    const extraNeeded = totalQuestionsNeeded - selectedQuestions.length;
    const aligned = alignSort(remainingPool);
    const extras = isSeeded ? seededShuffle(aligned, rng).slice(0, extraNeeded) : aligned.sort(() => 0.5 - Math.random()).slice(0, extraNeeded);
    selectedQuestions.push(...extras);
  }

  // Fallback 4: If still short of 20 questions, pull globally from any category
  if (selectedQuestions.length < totalQuestionsNeeded) {
    const alreadySelectedIds = new Set(selectedQuestions.map(q => q.id));
    const globalPool = ALL_STATIC_BANKS_SYNC.filter(q => !alreadySelectedIds.has(q.id));
    const extraNeeded = totalQuestionsNeeded - selectedQuestions.length;
    const aligned = alignSort(globalPool);
    const extras = isSeeded ? seededShuffle(aligned, rng).slice(0, extraNeeded) : aligned.sort(() => 0.5 - Math.random()).slice(0, extraNeeded);
    selectedQuestions.push(...extras);
  }

  const finalAligned = alignSort(selectedQuestions);
  return isSeeded ? seededShuffle(finalAligned, rng).slice(0, totalQuestionsNeeded) : finalAligned.sort(() => 0.5 - Math.random()).slice(0, totalQuestionsNeeded);
};

// ─── Component ───────────────────────────────────────────────────────

export default function BattleArena() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { economy, transactKC, refreshEconomy, openProUpsell } = useEconomy();
  const { showToast } = useToast();
  const { playVictory, playShatter, playCorrect, playWrong, playTick } = useSound();

  // Force Refresh Economy on Mount to get live wagering coins and streak status
  useEffect(() => {
    if (refreshEconomy) {
      refreshEconomy(true);
    }
  }, []);
  const [step, setStep] = useState('gate'); // 'gate', 'matchmaking', 'pre-start', 'mock', 'reveal', 'genius-trap', 'finished'
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error enabling fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Error exiting fullscreen:', err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  // Gate check results
  const [isLockedBySleep, setIsLockedBySleep] = useState(false);
  const [isLockedByDailyLimit, setIsLockedByDailyLimit] = useState(false);
  const [isLockedByCoins, setIsLockedByCoins] = useState(false);
  
  // Matchmaking variables
  const [matchProgress, setMatchProgress] = useState(0);
  const [matchTimer, setMatchTimer] = useState(0);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [matchmakingCopy, setMatchmakingCopy] = useState('Booting Arena telemetry...');
  const [opponent, setOpponent] = useState(null);
  
  // 25% Ghost match state
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [ghostChoiceNeeded, setGhostChoiceNeeded] = useState(false);
  const [matchWillSucceed, setMatchWillSucceed] = useState(true);
  const [matchFailed, setMatchFailed] = useState(false);
  
  // Mock Exam state
  const [currentSeed, setCurrentSeed] = useState(null);
  const [challengeData, setChallengeData] = useState(null);
  const [isFriendChallengeSetup, setIsFriendChallengeSetup] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiLoadingText, setAiLoadingText] = useState('');
  const [isEarlySubmitWaiting, setIsEarlySubmitWaiting] = useState(false);
  const [earlySubmitTimeRemaining, setEarlySubmitTimeRemaining] = useState(0);
  const [pendingNotifId, setPendingNotifId] = useState('');
  const [answers, setAnswers] = useState({});
  const [mockTimeLeft, setMockTimeLeft] = useState(1200); // 20 mins for 20 questions
  const [timeSpent, setTimeSpent] = useState({});
  const [visited, setVisited] = useState(new Set([0]));
  const [marked, setMarked] = useState({});
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [opponentStatus, setOpponentStatus] = useState('Active');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'OK', cancelText: 'Cancel' });
  const [used5050, setUsed5050] = useState({});
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  
  // Caliber metric calculations
  const [userCaliber, setUserCaliber] = useState(50);
  const [opponentCaliber, setOpponentCaliber] = useState(50);
  
  // Scoring & Reveal
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isInstantReveal, setIsInstantReveal] = useState(false);
  const [tickingScore, setTickingScore] = useState(-5.0);
  const [isTickingActive, setIsTickingActive] = useState(false);
  
  // Payout details
  const [userKashRank, setUserKashRank] = useState(11);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [insuranceActive, setInsuranceActive] = useState(false);
  const [insuranceMessage, setInsuranceMessage] = useState('');
  
  // X-Ray FOMO Modal
  const [xrayOpen, setXrayOpen] = useState(false);
  
  // Theme and Refs
  const { theme } = useTheme();
  const cardRef = useRef(null);

  // Battle Cards history
  const [battleHistory, setBattleHistory] = useState([]);
  const [selectedHistoryCard, setSelectedHistoryCard] = useState(null);
  const [isCardUnboxed, setIsCardUnboxed] = useState(true);
  const [reviewFilter, setReviewFilter] = useState('all');

  const handleSelectHistoryCard = (card) => {
    setSelectedHistoryCard(card);
    if (card) {
      setIsCardUnboxed(card.unboxed !== false);
      // Play premium sound effect on card open automatically
      if (card.outcome === 'VICTORY') {
        if (playVictory) playVictory();
      } else if (card.outcome === 'DEFEAT') {
        if (playShatter) playShatter();
      } else {
        if (playCorrect) playCorrect();
      }
    } else {
      setIsCardUnboxed(true);
    }
  };

  const handleUnboxCard = () => {
    if (!selectedHistoryCard) return;
    
    // Play sound effects
    if (selectedHistoryCard.outcome === 'VICTORY') {
      if (playVictory) playVictory();
    } else if (selectedHistoryCard.outcome === 'DEFEAT') {
      if (playShatter) playShatter();
    } else {
      if (playCorrect) playCorrect();
    }
    
    // Set unboxed state
    setIsCardUnboxed(true);
    
    // Save unboxed: true to localStorage history
    const userId = economy?.id || 'guest';
    const updatedHistory = battleHistory.map(c => {
      if (c.id === selectedHistoryCard.id) {
        return { ...c, unboxed: true };
      }
      return c;
    });
    setBattleHistory(updatedHistory);
    try {
      localStorage.setItem(`mcqkash_battle_history_${userId}`, JSON.stringify(updatedHistory));
    } catch (e) {}
  };

  // Load battle history & check for deep link
  useEffect(() => {
    const userId = economy?.id || 'guest';
    try {
      const stored = localStorage.getItem(`mcqkash_battle_history_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Retroactively fix any challenge result cards that were saved with unboxed: false
        // (from earlier code) so they render as visible in the gallery
        const fixed = parsed.map(card =>
          (card.isChallengeMode && card.unboxed === false) ? { ...card, unboxed: true } : card
        );
        // Persist the fix if anything changed
        const hadFix = fixed.some((c, i) => c.unboxed !== parsed[i].unboxed);
        if (hadFix) localStorage.setItem(`mcqkash_battle_history_${userId}`, JSON.stringify(fixed));
        setBattleHistory(fixed);
      }
    } catch(e) {}
    
    // Check if deep linked from notification (ghost/early submit)
    if (location.state?.showBattleId) {
      const bId = location.state.showBattleId;
      // Clear location state immediately to prevent re-opening on refresh
      navigate(location.pathname, { replace: true, state: {} });
      try {
        const storedNotif = localStorage.getItem(`mcqkash_battle_notifications_${userId}`);
        if (storedNotif) {
          const list = JSON.parse(storedNotif);
          const found = list.find(item => item.id === bId);
          if (found) {
            // Setup card display
            const mockOpponent = {
              full_name: found.opponentName,
              avatar_id: found.opponentAvatarId,
              is_pro: found.opponentIsPro,
              accuracy: found.opponentAccuracy,
              rank: found.opponentRank || 15
            };
            setOpponent(mockOpponent);
            setUserScore(found.userScore);
            setOpponentScore(found.opponentScore);
            
            // Calculate correct / incorrect counts from userScore
            const computedCorrect = Math.max(0, Math.min(20, Math.round((found.userScore + 5) / 1.25)));
            const computedIncorrect = Math.max(0, 20 - computedCorrect);
            setCorrectCount(computedCorrect);
            setIncorrectCount(computedIncorrect);

            setPayoutAmount(found.coinChange + 100);
            
            // Load saved questions & answers from local storage
            let loadedQuestions = [];
            let loadedAnswers = {};
            try {
              const savedQs = localStorage.getItem(`mcqkash_pending_battle_questions_${found.id}`);
              const savedAns = localStorage.getItem(`mcqkash_pending_battle_answers_${found.id}`);
              if (savedQs) loadedQuestions = JSON.parse(savedQs);
              if (savedAns) loadedAnswers = JSON.parse(savedAns);
            } catch (e) {
              console.warn('Failed to load saved battle details:', e);
            }

            // Fallback if not saved
            if (loadedQuestions.length === 0) {
              loadedQuestions = generateBattleMockQuestions(found.targetExam);
            }

            setQuestions(loadedQuestions);
            setAnswers(loadedAnswers);
            setIsInstantReveal(true);
            setStep('reveal');
            
            // Play victory or defeat sounds according to user's performance
            const outcome = found.userScore > found.opponentScore ? 'VICTORY' : found.userScore < found.opponentScore ? 'DEFEAT' : 'TIE';
            if (outcome === 'VICTORY') {
              if (playVictory) playVictory();
            } else if (outcome === 'DEFEAT') {
              if (playShatter) playShatter();
            } else {
              if (playCorrect) playCorrect();
            }
          }
        }
      } catch (e) {}
    }

    // Check if navigated from challenge notification → show challenger's result card
    if (location.state?.showChallengeResult) {
      const card = location.state.showChallengeResult;
      navigate(location.pathname, { replace: true, state: {} });

      // CRITICAL: Reset these flags so the reveal step doesn't use placeholder overrides
      // isFriendChallengeSetup = true would hide opponent name/score with 'Your Friend'/'---'
      setIsFriendChallengeSetup(false);
      setIsGhostMode(false);
      setIsTickingActive(false);
      setIsEarlySubmitWaiting(false);

      // Reconstruct opponent (the friend who accepted the challenge)
      setOpponent({
        full_name: card.opponentName || 'Your Friend',
        avatar_id: card.opponentAvatarId || 1,
        is_pro: card.opponentIsPro || false,
        accuracy: 75,
        rank: card.opponentRank || 15
      });

      // Set scores so the reveal step renders correctly
      setUserScore(card.userScore || 0);
      setOpponentScore(card.opponentScore || 0);

      // Approximate correct/incorrect from challenger's original score
      const compCorrect = Math.max(0, Math.min(20, Math.round((card.userScore + 5) / 1.25)));
      setCorrectCount(compCorrect);
      setIncorrectCount(Math.max(0, 20 - compCorrect));

      // Show payout amount (abs so UI doesn't show negative)
      setPayoutAmount(Math.abs(card.coinChange || 0) + 100);
      setIsInstantReveal(true);

      // Go straight to the reveal step — full result UI renders cleanly
      if (card.outcome === 'VICTORY') { if (playVictory) playVictory(); }
      else if (card.outcome === 'DEFEAT') { if (playShatter) playShatter(); }
      else { if (playCorrect) playCorrect(); }
      setStep('reveal');
    }
  }, [location.state, economy?.id]);

  // Simple obfuscation helper: base64 encode/decode score
  const encodeScore = (s) => btoa(String(s));
  const decodeScore = (s) => {
    try { return parseFloat(atob(s)); } catch(e) { return parseFloat(s) || 0; }
  };

  // Parse challenge parameters if deep linked via WhatsApp/Telegram (Runs 100% offline, zero database queries!)
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const challengerId = query.get('challenger_id');
    const challengerName = query.get('challenger_name') || 'Aspirant';
    const challengerUsername = query.get('challenger_username') || 'challenger';
    const examParam = query.get('exam');
    const seedParam = query.get('seed');
    const scoreParam = query.get('score');

    if (challengerId && examParam && seedParam && scoreParam) {
      if (user?.id) {
        localStorage.setItem(`mcqkash_has_used_challenges_${user.id}`, 'true');
      }
      const parsedScore = decodeScore(scoreParam);
      setChallengeData({
        challengerId,
        challengerName: challengerName,
        challengerUsername: challengerUsername,
        challengerAvatarId: 1,
        challengerAccuracy: 75,
        challengerStreak: 0,
        exam: examParam,
        seed: seedParam,
        scoreToBeat: parsedScore
      });
      setOpponent({
        id: challengerId,
        full_name: challengerName,
        username: challengerUsername,
        avatar_id: 1,
        accuracy: 75,
        rank: parseInt(query.get('challenger_rank') || '15', 10),
        is_pro: false
      });
      setStep('challenge-intro');
    }
  }, [location.search]);

  const buildChallengeUrl = (challengerId, challengerName, challengerUsername, exam, seed, score) => {
    const baseUrl = `${window.location.origin}${window.location.pathname.startsWith('/mcq') ? '/mcq' : ''}/arena/challenge`;
    const params = new URLSearchParams({
      challenger_id: challengerId,
      challenger_name: challengerName || 'Aspirant',
      challenger_username: challengerUsername || 'challenger',
      challenger_rank: String(userKashRank || 15),
      exam: exam,
      seed: String(seed),
      score: encodeScore(score)
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const handleStartChallengeSetup = async () => {
    if (!economy) return;
    if (!economy.target_exam) {
      showToast('You must select your Target Exam to start a challenge', 'warning');
      navigate('/profile', { state: { openStudyGoals: true, message: 'You must select your Target Exam to start a challenge' } });
      return;
    }

    const randomSeed = Math.floor(Math.random() * 1000000) + 1;
    setCurrentSeed(randomSeed);
    setIsFriendChallengeSetup(true);
    setChallengeData(null);

    setIsAiLoading(true);
    setAiLoadingText('Generating challenge questions...');

    const pulledQuestions = generateBattleMockQuestions(economy.target_exam, randomSeed);
    if (pulledQuestions.length === 0) {
      showToast('Failed to generate challenge questions.', 'error');
      setIsAiLoading(false);
      return;
    }
    setOpponent({
      id: 'friend_placeholder',
      full_name: 'Your Friend',
      avatar_id: 2,
      accuracy: 75,
      rank: 15,
      is_pro: false
    });
    setQuestions(pulledQuestions);
    setCurrentIdx(0);
    setAnswers({});
    setMockTimeLeft(1200);
    setTimeSpent({});
    setVisited(new Set([0]));
    setIsAiLoading(false);
    setStep('pre-start');
  };

  const handleStartChallengeMock = async () => {
    if (!economy || !challengeData) return;

    // Deduct 50 KashCoins wager for friend duel
    const transOk = await transactKC(-50);
    if (!transOk) {
      // Generous Mode: Accept challenge with subsidized wager
      showToast('Generous Mode: Entering duel with subsidized wager! 🪙', 'info');
    }

    setIsAiLoading(true);
    setAiLoadingText('Reconstituting challenge telemetry...');

    // Normalize and locate matching exam configuration (or fall back to first key)
    let examKey = challengeData.exam;
    let config = EXAM_CONFIG[examKey];

    if (!config && examKey) {
      const normalizedSearch = examKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedKey = Object.keys(EXAM_CONFIG).find(key => {
        return key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedSearch;
      });
      if (matchedKey) {
        examKey = matchedKey;
        config = EXAM_CONFIG[matchedKey];
      }
    }

    // Direct fallback to prevent hangs
    if (!config) {
      const fallbackKey = Object.keys(EXAM_CONFIG)[0];
      if (fallbackKey) {
        examKey = fallbackKey;
        config = EXAM_CONFIG[fallbackKey];
      }
    }

    if (config) {
      const pulledQuestions = generateBattleMockQuestions(examKey, challengeData.seed);
      if (pulledQuestions.length === 0) {
        showToast('Failed to pull questions for your challenge.', 'error');
        setIsAiLoading(false);
        return;
      }

      // Inject exactly 2 Pro locked MCQs if user is not Pro
      let finalQuestions = [...pulledQuestions];
      if (economy?.user_tier !== 'Pro') {
        const lockCount = 2;
        const availableIndices = [];
        for (let i = 1; i < finalQuestions.length; i++) availableIndices.push(i);
        
        // Shuffle indices
        for (let i = availableIndices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
        }
        
        const indicesToLock = availableIndices.slice(0, lockCount);
        for (const idx of indicesToLock) {
          finalQuestions[idx] = {
            ...finalQuestions[idx],
            id: `locked-exam-${finalQuestions[idx]?.id || idx}`,
            isLockedDummy: true,
            lockedQuestion: finalQuestions[idx],
          };
        }
      }

      setQuestions(finalQuestions);
      setCurrentIdx(0);
      setAnswers({});
      setMockTimeLeft(1200);
      setTimeSpent({});
      setVisited(new Set([0]));
      setIsAiLoading(false);
      setStep('mock');
    } else {
      showToast('Failed to launch challenge. No target categories available.', 'error');
      setIsAiLoading(false);
    }
  };

  const handleChallengeShare = async () => {
    if (!economy) return;
    localStorage.setItem(`mcqkash_has_used_challenges_${economy.id}`, 'true');
    const shareSeed = currentSeed || Math.floor(Math.random() * 1000000) + 1;
    const challengeUrl = buildChallengeUrl(economy.id, economy.full_name || 'Aspirant', economy.username || 'challenger', economy.target_exam || 'upsc-pre', shareSeed, userScore);
    const formattedMessage = `⚡ Think you've got superior prep? I just set a challenge deck in ${getExamLabel(economy.target_exam)} Battle Arena. Accept my MCQ challenge and let's see who wins this! ⚔️ Enter the duel here: ${challengeUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MCQKash Asynchronous Duel',
          text: formattedMessage,
          url: challengeUrl
        });
        showToast('Challenge link shared successfully! ⚔️', 'success');
      } catch (err) {
        console.warn('Navigator share failed, copying link to clipboard instead:', err);
        copyToClipboard(challengeUrl);
      }
    } else {
      copyToClipboard(challengeUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Challenge link copied to clipboard! 📋', 'success');
    }).catch(() => {
      showToast('Failed to copy challenge link.', 'error');
    });
  };


  // Run initial gate checks when page loads
  useEffect(() => {
    runGateChecks();
  }, [economy]);

  // Load user's rank from cached leaderboard in localStorage to prevent query egress
  useEffect(() => {
    function loadUserRankFromCache() {
      if (!economy) return;
      try {
        const cached = localStorage.getItem('mcqkash_lb_cache_coins');
        if (cached) {
          const { data } = JSON.parse(cached);
          if (Array.isArray(data)) {
            const userRow = data.find(row => row.id === economy.id || row.username === economy.username);
            if (userRow && userRow.rank) {
              setUserKashRank(userRow.rank);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load user rank from cache:', err);
      }
      setUserKashRank(15); // Fallback default rank
    }
    loadUserRankFromCache();
  }, [economy?.id]);

  const runGateChecks = () => {
    if (!economy) return;
    
    // Check 1: Target Exam gate
    if (!economy.target_exam) {
      // Not locked, but requires redirecting. We do this on start search.
      return;
    }

    // Check 2: Sleep Time Lock (12 AM to 6 AM IST)
    const { hour, dateStr } = getISTDetails();
    if (hour >= 0 && hour < 6) {
      setIsLockedBySleep(true);
      return;
    } else {
      setIsLockedBySleep(false);
    }

    // Check 3: Daily Limit (1 battle per day)
    // BYPASS FOR TESTING: Let Daily challenges be unlimited
    setIsLockedByDailyLimit(false);

    // Check 4: Coins requirement (100 coins minimum)
    // Generous Mode: Insufficient coins never locks the user out
    setIsLockedByCoins(false);
  };

  // Matchmaking Telemetry Copy Cycler
  useEffect(() => {
    if (step !== 'matchmaking') return;
    const copies = [
      'Connecting to Battle Arena network...',
      'Searching for online aspirants...',
      'Pinging active lobby queues...',
      'Comparing matching tier grades...',
      'Measuring response latencies...',
      'Locking in candidate connection...',
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % copies.length;
      setMatchmakingCopy(copies[idx]);
    }, 2500);
    return () => clearInterval(interval);
  }, [step, searchTrigger]);

  // Matchmaking Timer & Probability Engine
  useEffect(() => {
    if (step !== 'matchmaking') return;

    // If matching will succeed, pick 3 to 12 secs; if it will fail, search for exactly 24 secs.
    const searchDurationSeconds = matchWillSucceed ? (Math.floor(Math.random() * 10) + 3) : 24;
    setMatchTimer(searchDurationSeconds);

    const start = Date.now();
    const timer = setInterval(async () => {
      const elapsed = (Date.now() - start) / 1000;
      const progress = Math.min(100, (elapsed / searchDurationSeconds) * 100);
      setMatchProgress(Math.round(progress));

      if (progress >= 100) {
        clearInterval(timer);
        
        if (!matchWillSucceed) {
          // Fake failure path (no DB call)
          setMatchFailed(true);
        } else {
          // 25% Ghost match check
          const isGhost = Math.random() < 0.25;
          if (isGhost) {
            setIsGhostMode(true);
            setGhostChoiceNeeded(true);
          } else {
            // Find real leaderboard opponent
            await selectLeaderboardOpponent();
          }
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, [step, searchTrigger, matchWillSucceed]);

  // Pull leaderboard and pick candidate
  const selectLeaderboardOpponent = async () => {
    if (!user?.id) {
      setMatchFailed(true);
      return;
    }
    try {
      // Get recently matched opponent usernames from local storage (history of last 3)
      const lastUsernamesKey = `mcqkash_last_usernames_${user?.id || 'guest'}`;
      let lastUsernames = [];
      try {
        const stored = localStorage.getItem(lastUsernamesKey);
        lastUsernames = stored ? JSON.parse(stored) : [];
      } catch (e) {}

      // Clean the usernames list to prevent null/empty strings
      const cleanUsernames = lastUsernames.filter(uname => uname && typeof uname === 'string' && uname.trim() !== '');

      // Resolve usernames and anti-collision checks params
      const userUsername = economy?.username || null;
      const userReferredBy = economy?.referred_by || null;

      // Query exactly 1 diverse opponent using get_diverse_opponent RPC filtering by exclude_usernames
      const { data: responseData, error } = await supabase.rpc('get_diverse_opponent', {
        viewer_id: user?.id,
        exclude_usernames: cleanUsernames,
        viewer_username: userUsername,
        viewer_referred_by: userReferredBy
      });

      const chosen = responseData && responseData.length > 0 ? responseData[0] : null;

      if (error || !chosen) {
        console.error('get_diverse_opponent RPC Error details:', error);
        throw new Error('No candidate found or database error.');
      }

      // Resolve usernames with fallback
      const resolvedUsername = chosen.username || (chosen.full_name || 'aspirant').toLowerCase().replace(/[^a-z0-9]/g, '');

      // Save to recently matched usernames cache (keep last 3)
      lastUsernames.push(resolvedUsername);
      if (lastUsernames.length > 3) {
        lastUsernames.shift();
      }
      try {
        localStorage.setItem(lastUsernamesKey, JSON.stringify(lastUsernames));
      } catch (e) {}

      // Try to fetch opponent's accuracy. If 0 or unavailable, calculate based on user's range.
      let oppAccuracy = chosen.users_accuracy;
      if (!oppAccuracy || oppAccuracy <= 0) {
        const userAcc = economy?.users_accuracy || 70;
        let offset = 0;
        while (offset === 0) {
          offset = Math.floor(Math.random() * 41) - 20; // Random offset between -20 and +20 (excluding 0)
        }
        oppAccuracy = Math.max(30, Math.min(95, Math.round(userAcc + offset)));
      }

      const oppStreak = chosen.streak_days || chosen.daily_streak || chosen.streak || (Math.random() < 0.3 ? Math.floor(Math.random() * 6) + 3 : 0);
      
      // Default opponent's target exam to matching user's exam if null/missing
      const oppTargetExam = chosen.target_exam || economy?.target_exam || 'upsc-pre';

      setOpponent({
        id: chosen.id,
        full_name: chosen.full_name || 'Aspirant',
        avatar_id: chosen.avatar_id || 1,
        username: resolvedUsername,
        referred_by: chosen.referred_by || null,
        is_pro: (chosen.pro_expires_at && new Date(chosen.pro_expires_at) > new Date()) || !!chosen.is_admin,
        accuracy: Math.round(oppAccuracy),
        rank: chosen.rank || 15,
        streak: oppStreak,
        status_message: chosen.status_message || null,
        target_exam: oppTargetExam
      });
      setStep('pre-start');
    } catch (err) {
      console.warn('Database error in matchmaking, setting match failed:', err);
      setMatchFailed(true);
    }
  };

  const generateMockOpponent = () => {
    // Get recently matched opponent usernames from local storage (history of last 3)
    const lastUsernamesKey = `mcqkash_last_usernames_${user?.id || 'guest'}`;
    let lastUsernames = [];
    try {
      const stored = localStorage.getItem(lastUsernamesKey);
      lastUsernames = stored ? JSON.parse(stored) : [];
    } catch (e) {}

    // Collectible fallback opponents (expanded and given stable usernames)
    const fallbacks = [
      { id: 'mock_opp_anjali', full_name: 'Anjali Sharma', username: 'anjali_sharma', is_pro: true, rank: 4, status_message: 'Rank 1 is mine! 🎯 Keep pushing!' },
      { id: 'mock_opp_vikram', full_name: 'Vikram Malhotra', username: 'vikram_malhotra', is_pro: false, rank: 12 },
      { id: 'mock_opp_karan', full_name: 'Karan Mehra', username: 'karan_mehra', is_pro: true, rank: 2, status_message: 'UPSC Prelims prep mode: ON. Let’s match!' },
      { id: 'mock_opp_sneha', full_name: 'Sneha Patel', username: 'sneha_patel', is_pro: false, rank: 23 },
      { id: 'mock_opp_rahul', full_name: 'Rahul Verma', username: 'rahul_verma', is_pro: false, rank: 9 },
      { id: 'mock_opp_priya', full_name: 'Priya Nandy', username: 'priya_nandy', is_pro: true, rank: 6, status_message: 'Syllabus revised twice. Bring it on!' },
      { id: 'mock_opp_amit', full_name: 'Amit Chaudhary', username: 'amit_chaudhary', is_pro: false, rank: 18 },
      { id: 'mock_opp_rohit', full_name: 'Rohit Sharma', username: 'rohit_sharma', is_pro: false, rank: 15 },
      { id: 'mock_opp_tanvi', full_name: 'Tanvi Goyal', username: 'tanvi_goyal', is_pro: true, rank: 8, status_message: 'Consistency is key. 🔑' },
      { id: 'mock_opp_arjun', full_name: 'Arjun Kapoor', username: 'arjun_kapoor', is_pro: false, rank: 29 },
      { id: 'mock_opp_deepika', full_name: 'Deepika Sen', username: 'deepika_sen', is_pro: true, rank: 11 },
      { id: 'mock_opp_abhishek', full_name: 'Abhishek Roy', username: 'abhishek_roy', is_pro: false, rank: 20 },
      { id: 'mock_opp_neha', full_name: 'Neha Gupta', username: 'neha_gupta', is_pro: true, rank: 7, status_message: 'Focused on high-yield topics.' },
      { id: 'mock_opp_vivek', full_name: 'Vivek Joshi', username: 'vivek_joshi', is_pro: false, rank: 33 },
      { id: 'mock_opp_divya', full_name: 'Divya Iyer', username: 'divya_iyer', is_pro: true, rank: 5, status_message: 'Answer writing + MCQs daily.' }
    ];

    // Filter out mock opponents recently battled by matching username
    let eligible = fallbacks.filter(f => !lastUsernames.includes(f.username));
    if (eligible.length === 0) {
      eligible = fallbacks; // Fallback to all if pool collapses
    }

    const picked = eligible[Math.floor(Math.random() * eligible.length)];
    const userAcc = economy?.users_accuracy || 70;
    let offset = 0;
    while (offset === 0) {
      offset = Math.floor(Math.random() * 41) - 20; // Random offset between -20 and +20 (excluding 0)
    }
    const oppAccuracy = Math.max(30, Math.min(95, Math.round(userAcc + offset)));

    // Save mock opponent username to history cache (keep last 3)
    lastUsernames.push(picked.username);
    if (lastUsernames.length > 3) {
      lastUsernames.shift();
    }
    try {
      localStorage.setItem(lastUsernamesKey, JSON.stringify(lastUsernames));
    } catch (e) {}

    // Mock target exam - selected completely at random from all registered exams
    const examKeys = Object.keys(EXAM_CONFIG);
    const simulatedExam = examKeys[Math.floor(Math.random() * examKeys.length)] || 'upsc-pre';

    setOpponent({
      id: picked.id,
      full_name: picked.full_name,
      avatar_id: Math.floor(Math.random() * 9) + 1,
      username: picked.username,
      referred_by: null,
      is_pro: picked.is_pro,
      accuracy: oppAccuracy,
      rank: picked.rank,
      streak: Math.random() < 0.3 ? Math.floor(Math.random() * 6) + 3 : 0,
      status_message: picked.status_message || null,
      target_exam: simulatedExam
    });
    setStep('pre-start');
  };

  // Start the matchmaking loop
  const handleStartSearch = () => {
    if (!economy) return;
    
    // Target Exam check
    if (!economy.target_exam) {
      showToast('You must select your Target Exam to Battle', 'warning');
      navigate('/profile', { state: { openStudyGoals: true, message: 'You must select your Target Exam to Battle' } });
      return;
    }

    if (isLockedBySleep) return;
    if (isLockedByDailyLimit) return;
    if (isLockedByCoins) return;

    // Roll matching success: 80% match, 20% no match
    const isSuccessfulMatch = Math.random() < 0.80;
    setMatchWillSucceed(isSuccessfulMatch);

    setIsGhostMode(false);
    setGhostChoiceNeeded(false);
    setMatchFailed(false);
    setMatchProgress(0);
    setStep('matchmaking');
  };

  // Wager deduction and starting the mock
  const handleStartMock = async () => {
    if (!economy || !opponent) return;

    // Deduct KashCoins wager (50 for Friend Challenge, 100 for Daily Battle)
    const wagerAmount = isFriendChallengeSetup ? -50 : -100;
    const transOk = await transactKC(wagerAmount);
    if (!transOk) {
      // Generous Mode: Enter battle with subsidized wager
      showToast('Generous Mode: Entering battle with subsidized wager! 🪙', 'info');
    }

    // Set daily limit battle timestamp (in IST dateStr)
    const { dateStr } = getISTDetails();
    const userId = economy.id || 'guest';
    localStorage.setItem(`mcqkash_last_battle_date_${userId}`, dateStr);

    // Generate a random seed if not in challenge mode
    const activeSeed = challengeData ? challengeData.seed : (currentSeed || Math.floor(Math.random() * 1000000) + 1);
    if (!challengeData) {
      setCurrentSeed(activeSeed);
    }

    // Pull 20 Questions based on target exam
    const pulledQuestions = generateBattleMockQuestions(economy.target_exam, activeSeed);
    if (pulledQuestions.length === 0) {
      showToast('Failed to pull questions for your target exam.', 'error');
      return;
    }

    // Phase 5: Gating Logic. If Free user, inject exactly 2 Pro locked MCQs.
    let finalQuestions = [...pulledQuestions];
    if (economy.user_tier !== 'Pro') {
      const lockCount = 2;
      const availableIndices = [];
      for (let i = 1; i < finalQuestions.length; i++) availableIndices.push(i);
      
      // Shuffle indices
      for (let i = availableIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
      }
      
      const indicesToLock = availableIndices.slice(0, lockCount);
      for (const idx of indicesToLock) {
        finalQuestions[idx] = {
          ...finalQuestions[idx],
          id: `locked-exam-${finalQuestions[idx]?.id || idx}`,
          isLockedDummy: true,
          lockedQuestion: finalQuestions[idx],
        };
      }
    }

    // Calculate threat caliber progress scores
    setUserCaliber(calculateCaliber(economy?.users_accuracy || 70, userKashRank));
    setOpponentCaliber(calculateCaliber(opponent.accuracy, opponent.rank));

    setQuestions(finalQuestions);
    setAnswers({});
    setTimeSpent({});
    setVisited(new Set([0]));
    setMarked({});
    setOpponentProgress(0);
    setOpponentStatus(`${opponent.full_name} is connecting...`);
    setMockTimeLeft(1200);
    setCurrentIdx(0);
    setStep('mock');
  };

  // Mock Timer
  useEffect(() => {
    if (step !== 'mock') return;
    
    const timer = setInterval(() => {
      setMockTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitMock();
          return 0;
        }
        return prev - 1;
      });

      // Track time spent per question
      if (questions.length > 0) {
        const qId = questions[currentIdx]?.id;
        if (qId) {
          setTimeSpent(prev => ({ ...prev, [qId]: (prev[qId] || 0) + 1 }));
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [step, questions, currentIdx]);

  // Simulated Opponent Progress Timer (creates PvP tension)
  useEffect(() => {
    if (step !== 'mock' || !opponent || isGhostMode) return;
    
    // Reset initial state
    setOpponentProgress(0);
    setOpponentStatus(`${opponent.full_name} is starting the battle...`);

    const interval = setInterval(() => {
      setOpponentProgress(prev => {
        if (prev >= 20) {
          clearInterval(interval);
          setOpponentStatus(`${opponent.full_name} finished!`);
          return 20;
        }
        
        const increment = Math.random() < 0.65 ? 1 : 2;
        const next = Math.min(20, prev + increment);
        
        // Random Status message updates
        const statuses = [
          `${opponent.full_name} is solving Question ${Math.min(20, next + 1)}...`,
          `${opponent.full_name} matches caliber pace...`,
          `${opponent.full_name} solved Question ${next}...`,
          `${opponent.full_name} is reviewing answers...`
        ];
        
        if (next === 20) {
          setOpponentStatus(`${opponent.full_name} finished!`);
        } else {
          setOpponentStatus(statuses[Math.floor(Math.random() * statuses.length)]);
        }
        
        return next;
      });
    }, 12000 + Math.random() * 8000); // update every 12-20 seconds

    return () => clearInterval(interval);
  }, [step, opponent]);

  const handleSelectOption = (optionId) => {
    const q = questions[currentIdx];
    if (answers[q.id] === optionId) return; // already selected
    
    setAnswers(prev => ({ ...prev, [q.id]: optionId }));
    
    // Play neutral option chime for exam selection to prevent cheats/loopholes
    if (playTick) playTick();
  };

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Submitting the mock and running the Battle Engine
  const handleSubmitMock = async () => {
    if (!economy || !opponent) return;

    // Calculate score
    let score = 0;
    let correct = 0;
    let incorrect = 0;
    let fiftyFiftyDeductions = 0;
    questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer) {
        if (userAnswer === q.correctId) {
          if (used5050[q.id]) {
            score += 0.50; // +1.00 correct - 0.50 penalty
            fiftyFiftyDeductions++;
          } else {
            score += 1.00;
          }
          correct++;
        } else {
          score -= 0.25;
          incorrect++;
        }
      }
    });

    setUserScore(score);
    setCorrectCount(correct);
    setIncorrectCount(incorrect);

    // User Accuracy
    const userAcc = economy.users_accuracy || 75;

    // Run Relative Probability Battle Engine to determine opponent's score
    const oppScore = challengeData 
      ? challengeData.scoreToBeat 
      : isFriendChallengeSetup
      ? 0
      : runBattleEngine(userAcc, opponent.accuracy, score, userKashRank, opponent.rank || 15);
    setOpponentScore(oppScore);

    // Determine Reveal Flow (Ticking vs Instant)
    const instant = Math.random() < 0.25;
    setIsInstantReveal(instant);

    // Phase 5: The 20/20 Boss Anomaly Trap
    if (correct === 20) {
      // Deduct 200 KashCoins
      await transactKC(-200);
      setStep('genius-trap');
      // Trigger failure/shatter haptics
      if (playShatter) playShatter();
      return;
    }

    // Normal PvP Payout Economics (calculate early so it can be stored in pending ghost/early submit notifications)
    let winProfit = 0;
    let insActive = false;
    let insMsg = '';
    const userIsPro = economy.is_pro;
    const oppIsPro = opponent.is_pro;

    if (score > oppScore) {
      if (!userIsPro && oppIsPro) {
        winProfit = 150;
        insActive = true;
        insMsg = "Pro Opponent triggered Betting Insurance. 50 coins refunded to them.";
      } else {
        winProfit = 200;
      }
    } else if (score < oppScore) {
      if (userIsPro) {
        winProfit = 50;
        insActive = true;
        insMsg = "You are Pro, 50 coins refunded.";
      } else {
        winProfit = 0;
      }
    } else {
      winProfit = 100;
    }

    setPayoutAmount(winProfit);
    setInsuranceActive(insActive);
    setInsuranceMessage(insMsg);

    // Early submit waiting logic (User submits in under 3 minutes / 200 seconds)
    const elapsedTime = 1200 - mockTimeLeft;
    const isEarlySubmit = elapsedTime < 200;

    if (isEarlySubmit && !isGhostMode && !challengeData && !isFriendChallengeSetup) {
      setIsEarlySubmitWaiting(true);
      const delaySeconds = Math.floor(Math.random() * 181) + 120; // 120 to 300 seconds (2 to 5 minutes)
      setEarlySubmitTimeRemaining(delaySeconds);

      const newNotifId = `battle_notif_${Date.now()}`;
      setPendingNotifId(newNotifId);

      const userId = economy.id || 'guest';
      const triggerTimestamp = Date.now() + (delaySeconds * 1000);

      const newNotif = {
        id: newNotifId,
        opponentName: opponent.full_name,
        opponentAvatarId: opponent.avatar_id,
        opponentAccuracy: opponent.accuracy,
        opponentScore: oppScore,
        opponentIsPro: oppIsPro,
        userScore: score,
        userAccuracy: Math.round((correct / 20) * 100),
        timestamp: triggerTimestamp,
        status: 'pending',
        userWon: score > oppScore,
        targetExam: economy.target_exam || 'UPSC Pre',
        date: getISTDetails().dateStr,
        coinChange: winProfit - 100,
        userRank: userKashRank || 15,
        opponentRank: opponent.rank || 15
      };

      try {
        const stored = localStorage.getItem(`mcqkash_battle_notifications_${userId}`);
        const list = stored ? JSON.parse(stored) : [];
        list.push(newNotif);
        localStorage.setItem(`mcqkash_battle_notifications_${userId}`, JSON.stringify(list));
        // Save current battle questions & answers
        localStorage.setItem(`mcqkash_pending_battle_questions_${newNotifId}`, JSON.stringify(questions));
        localStorage.setItem(`mcqkash_pending_battle_answers_${newNotifId}`, JSON.stringify(answers));
      } catch (e) {}

      setStep('reveal');
      return;
    }

    // Ghost match completion scheduling
    if (isGhostMode) {
      // Save pending battle notification
      const userId = economy.id || 'guest';
      const delayMinutes = Math.floor(Math.random() * 56) + 5; // 5 to 60 mins
      const triggerTimestamp = Date.now() + (delayMinutes * 60 * 1000);
      const isUserWinner = score > oppScore;

      // Payout in Ghost Mode
      let ghostOutcomeChange = 0;
      if (isUserWinner) {
        ghostOutcomeChange = economy.is_pro ? 100 : (opponent.is_pro ? 50 : 100);
      } else if (score < oppScore) {
        ghostOutcomeChange = economy.is_pro ? -50 : -100;
      }

      const ghostNotifId = `battle_notif_${Date.now()}`;
      const newNotif = {
        id: ghostNotifId,
        opponentName: opponent.full_name,
        opponentAvatarId: opponent.avatar_id,
        opponentAccuracy: opponent.accuracy,
        opponentScore: oppScore,
        opponentIsPro: opponent.is_pro,
        userScore: score,
        userAccuracy: Math.round((correct / 20) * 100),
        timestamp: triggerTimestamp,
        status: 'pending',
        userWon: isUserWinner,
        targetExam: economy.target_exam || 'UPSC Pre',
        date: getISTDetails().dateStr,
        coinChange: winProfit - 100,
        userRank: userKashRank || 15,
        opponentRank: opponent.rank || 15
      };

      try {
        const stored = localStorage.getItem(`mcqkash_battle_notifications_${userId}`);
        const list = stored ? JSON.parse(stored) : [];
        list.push(newNotif);
        localStorage.setItem(`mcqkash_battle_notifications_${userId}`, JSON.stringify(list));
        // Save current battle questions & answers
        localStorage.setItem(`mcqkash_pending_battle_questions_${ghostNotifId}`, JSON.stringify(questions));
        localStorage.setItem(`mcqkash_pending_battle_answers_${ghostNotifId}`, JSON.stringify(answers));
      } catch (e) {}

      // Open Ghost pending results screen
      setStep('reveal');
      return;
    }

    // Apply normal PvP payout instantly (already computed above)
    if (payoutAmount > 0) {
      await transactKC(payoutAmount);
    }

    // For challenge mode: oppScore is challengeData.scoreToBeat (already set above)
    // Use it so the friend's battle card correctly shows the challenger's real score
    const effectiveOppScore = challengeData ? challengeData.scoreToBeat : oppScore;
    const effectiveOppName = challengeData ? challengeData.challengerName : opponent.full_name;
    const effectiveOppAvatarId = challengeData ? challengeData.challengerAvatarId : opponent.avatar_id;
    const effectiveOppIsPro = challengeData ? false : oppIsPro;
    const effectiveOppRank = challengeData ? (opponent.rank || 15) : (opponent.rank || 15);

    // Save Battle Card in History Gallery (for the person submitting — friend or regular player)
    const newBattleCard = {
      id: `battle_${Date.now()}`,
      userId: economy.id || 'guest',
      userFullName: economy.full_name || 'You',
      userAvatarId: economy.avatar_id || 1,
      userIsPro: userIsPro,
      userScore: score,
      userCorrect: correct,
      userIncorrect: incorrect,
      userRank: userKashRank || 15,

      opponentName: effectiveOppName,
      opponentAvatarId: effectiveOppAvatarId,
      opponentIsPro: effectiveOppIsPro,
      opponentScore: effectiveOppScore,
      opponentStreak: opponent?.streak || 0,
      opponentRank: effectiveOppRank,

      targetExam: economy.target_exam || challengeData?.exam || 'UPSC Pre',
      date: getISTDetails().dateStr,
      timestamp: Date.now(),
      outcome: score > effectiveOppScore ? 'VICTORY' : score < effectiveOppScore ? 'DEFEAT' : 'TIE',
      coinChange: score > effectiveOppScore
        ? (userIsPro ? 100 : (effectiveOppIsPro ? 50 : 100))
        : (score < effectiveOppScore ? (userIsPro ? -50 : -100) : 0),
      isChallengeMode: !!challengeData,
      unboxed: true
    };

    // Save submitter's battle card to their localStorage history
    // SKIP for isFriendChallengeSetup (challenger's own run) — their card is created from
    // notification metadata when they click "See Battle Result" in the bell icon.
    // The friend (accepter) correctly gets their card saved here since challengeData is set for them.
    const userId = economy.id || 'guest';
    if (!isFriendChallengeSetup) {
      try {
        const stored = localStorage.getItem(`mcqkash_battle_history_${userId}`);
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(newBattleCard);
        localStorage.setItem(`mcqkash_battle_history_${userId}`, JSON.stringify(list));
        setBattleHistory(list);
      } catch (e) {}
    }

    // Challenge Friend: notify challenger with suspenseful message + compact result payload
    if (challengeData) {
      const friendName = economy.full_name || 'A friend';
      const friendUsername = economy.username || 'friend';
      // Suspenseful message — does NOT reveal who won (challenger must click to see)
      const suspenseMessage = `⚔️ ${friendName} (@${friendUsername}) accepted your challenge! Tap to see who won the duel!`;

      // Compact metadata to reconstruct the challenger's result card (minimal payload)
      const resultMeta = JSON.stringify({
        fn: friendName,                    // friend full name
        fu: friendUsername,                // friend username
        fa: economy.avatar_id || 1,       // friend avatar id
        fr: userKashRank || 15,           // friend's real Kash rank
        fs: score,                         // friend score
        cs: challengeData.scoreToBeat,     // challenger's original score
        ex: challengeData.exam,            // exam slug
        dt: getISTDetails().dateStr        // date
      });

      const notifPayload = {
        id: `challenge_${challengeData.challengerId}_${Date.now()}`,
        user_id: challengeData.challengerId,
        message: suspenseMessage,
        metadata: resultMeta,
        created_at: new Date().toISOString(),
        read: false,
        type: 'challenge_resolved'
      };

      try {
        // Path A: DB INSERT — guarantees delivery even if challenger is currently offline
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifPayload);

        if (notifError) {
          console.error('[Challenge Notif] Supabase insert failed:', notifError.code, notifError.message, notifError.details);
        } else {
          console.log('[Challenge Notif] DB notification sent to challenger:', challengeData.challengerId);
        }
      } catch (err) {
        console.error('[Challenge Notif] DB insert network error:', err);
      }

      try {
        // Path B: WebSocket broadcast — instant delivery at 0 bytes of DB egress if challenger is online
        const broadcastChannel = supabase.channel(`notif_broadcast_${challengeData.challengerId}`, {
          config: { broadcast: { self: false } }
        });
        await broadcastChannel.subscribe();
        await broadcastChannel.send({
          type: 'broadcast',
          event: 'new_notification',
          payload: notifPayload
        });
        supabase.removeChannel(broadcastChannel);
        console.log('[Challenge Notif] Broadcast sent to challenger channel:', challengeData.challengerId);
      } catch (broadcastErr) {
        console.warn('[Challenge Notif] Broadcast failed (non-critical, DB delivery is the fallback):', broadcastErr);
      }

      // Mark seed as attempted locally
      try {
        const attemptedStr = localStorage.getItem(`mcqkash_attempted_challenges_${userId}`);
        const attemptedList = attemptedStr ? JSON.parse(attemptedStr) : [];
        if (!attemptedList.includes(challengeData.seed)) {
          attemptedList.push(challengeData.seed);
          localStorage.setItem(`mcqkash_attempted_challenges_${userId}`, JSON.stringify(attemptedList));
        }
      } catch (e) {}
    }

    // Open reveal page
    setStep('reveal');
  };

  const handleDeleteCard = async (cardId) => {
    if (!economy) return;
    
    // Check if user has enough coins
    if (economy.kash_coins_balance < 50) {
      showToast('Not enough KashCoins! Deleting a Battle Card requires 50 KashCoins.', 'warning');
      return;
    }

    // Deduct 50 KashCoins directly without confirmation modal
    const success = await transactKC(-50);
    if (success) {
      const userId = economy.id || 'guest';
      const updatedHistory = battleHistory.filter(c => c.id !== cardId);
      setBattleHistory(updatedHistory);
      try {
        localStorage.setItem(`mcqkash_battle_history_${userId}`, JSON.stringify(updatedHistory));
      } catch (e) {}
      
      handleSelectHistoryCard(null);
      showToast('Battle Card permanently deleted. 50 KashCoins deducted.', 'success');
    } else {
      showToast('Failed to complete coin transaction.', 'error');
    }
  };

  // ticking score reveal controller
  useEffect(() => {
    if (step !== 'reveal') return;
    if (isGhostMode) return; // Ghost mode doesn't tick opponent score
    if (isEarlySubmitWaiting) return; // Don't tick score or play sounds if user is waiting for opponent

    if (isInstantReveal) {
      // Instant reveal
      setTickingScore(opponentScore);
      setIsTickingActive(false);
      triggerConfettiOrShatter(userScore > opponentScore);
    } else {
      // Slow reveal count up
      setTickingScore(-5.0);
      setIsTickingActive(true);
      
      const start = Date.now();
      const duration = 2500; // 2.5 seconds total
      
      const timer = setInterval(() => {
        const elapsed = Date.now() - start;
        const progress = Math.min(1, elapsed / duration);
        
        // Calculate intermediate score
        const currentScore = -5.0 + (opponentScore + 5.0) * progress;
        const snappedCurrent = snapToMarkingScheme(currentScore);
        setTickingScore(snappedCurrent);

        if (progress >= 1) {
          clearInterval(timer);
          setIsTickingActive(false);
          triggerConfettiOrShatter(userScore > opponentScore);
        }
      }, 100);

      return () => clearInterval(timer);
    }
  }, [step, isInstantReveal, opponentScore]);

  const triggerConfettiOrShatter = (won) => {
    if (won) {
      // Confetti burst!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      if (playVictory) playVictory();
    } else {
      if (playShatter) playShatter();
    }
  };

  // ─── Pure Canvas 2D share card ─────────────────────────────────────────
  const drawBattleCardCanvas = async (card) => {
    const W = 900, H = 600;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const isWin = card.outcome === 'VICTORY';
    const isDef = card.outcome === 'DEFEAT';
    const stampColor = isWin ? '#10b981' : isDef ? '#f43f5e' : '#3b82f6';
    const examLabel = card.targetExam === 'upsc-pre' ? 'UPSC PRELIMS' : card.targetExam === 'ssc-cgl' ? 'SSC CGL' : 'STATE PSC';
    const uRank = card.userRank || userKashRank || 15;
    const oRank = card.opponentRank || card.rank || 15;
    const coinAmt = Math.abs(card.coinChange);
    const uName = (card.userFullName || 'You').substring(0, 18);
    const oppName = (card.opponentName || 'Opponent').substring(0, 18);
    const uUsername = (economy?.username || 'you').toLowerCase().substring(0, 18);
    const oUsername = oppName.toLowerCase().replace(/\s+/g, '').substring(0, 18);
    const uScore = card.userScore.toFixed(2);
    const oScore = card.opponentScore.toFixed(2);

    // ── Background ──
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#0a0a12');
    bgGrad.addColorStop(1, '#0f0f1e');
    ctx.fillStyle = bgGrad;
    roundRect(ctx, 0, 0, W, H, 36);
    ctx.fill();

    // ── Subtle grid pattern ──
    ctx.save();
    ctx.globalAlpha = 0.025;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();

    // ── Glow blobs ──
    drawGlow(ctx, W * 0.18, H * 0.35, 180, 'rgba(99,102,241,0.12)');
    drawGlow(ctx, W * 0.82, H * 0.35, 180, isWin ? 'rgba(16,185,129,0.10)' : isDef ? 'rgba(244,63,94,0.10)' : 'rgba(59,130,246,0.10)');
    drawGlow(ctx, W * 0.5, H * 0.7, 120, `${stampColor}18`);

    // ── Outer border ──
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 1.5, 1.5, W - 3, H - 3, 35);
    ctx.stroke();
    ctx.restore();

    // ── Header row ──
    // Exam pill
    roundRect(ctx, 36, 32, 180, 30, 15);
    ctx.fillStyle = 'rgba(99,102,241,0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(99,102,241,0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, 36, 32, 180, 30, 15);
    ctx.stroke();
    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(examLabel, 36 + 90, 52);
    // Date
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(card.date, W - 36, 52);

    // ── Divider line under header ──
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(36, 74, W - 72, 1);
    ctx.restore();

    // ── Load + draw both avatars ──
    const avatarY = 90, avatarR = 64;
    const leftX = W * 0.22, rightX = W * 0.78;

    const drawAvatar = async (avatarId, cx, cy, borderColor) => {
      const avatarDef = avatarsList.find(a => a.id === Number(avatarId)) || avatarsList[0];
      // Render avatar SVG to blob then img
      const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgEl.setAttribute('viewBox', '0 0 100 100');
      svgEl.setAttribute('width', '128');
      svgEl.setAttribute('height', '128');
      // Build the gradient defs needed by avatars
      const defsHtml = `<defs>
        <linearGradient id="avGrad-1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4f46e5"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient>
        <linearGradient id="avGrad-2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#e11d48"/></linearGradient>
        <linearGradient id="avGrad-3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#059669"/></linearGradient>
        <linearGradient id="avGrad-4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#ec4899"/></linearGradient>
        <linearGradient id="avGrad-5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient>
        <linearGradient id="avGrad-6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ec4899" stop-opacity="0.8"/><stop offset="100%" stop-color="#f43f5e"/></linearGradient>
        <linearGradient id="avGrad-7" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#14b8a6"/><stop offset="100%" stop-color="#0f766e"/></linearGradient>
        <linearGradient id="avGrad-8" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f97316"/><stop offset="100%" stop-color="#ea580c"/></linearGradient>
        <linearGradient id="avGrad-9" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient>
        <linearGradient id="avGrad-10" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#4338ca"/></linearGradient>
      </defs>`;
      // Serialize avatar component to SVG string
      const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      tempSvg.setAttribute('viewBox', '0 0 100 100');
      tempSvg.setAttribute('width', '128');
      tempSvg.setAttribute('height', '128');
      tempSvg.innerHTML = defsHtml;
      // Use a temp container to render
      const tmpDiv = document.createElement('div');
      tmpDiv.style.cssText = 'position:fixed;left:-9999px;top:0;';
      document.body.appendChild(tmpDiv);
      const { createRoot } = await import('react-dom/client');
      const { flushSync } = await import('react-dom');
      const React2 = await import('react');
      const { avatarsList: avList } = await import('../components/Avatars');
      const avDef = avList.find(a => a.id === Number(avatarId)) || avList[0];
      const AvatarComp = avDef.component;
      const root = createRoot(tmpDiv);
      flushSync(() => {
        root.render(React2.createElement(AvatarComp, { className: 'w-full h-full' }));
      });
      const svgString = defsHtml + tmpDiv.innerHTML;
      root.unmount();
      document.body.removeChild(tmpDiv);

      return new Promise((resolve) => {
        const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="128" height="128">${svgString}</svg>`], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          // Clip to circle
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy + avatarR, avatarR, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, cx - avatarR, cy, avatarR * 2, avatarR * 2);
          ctx.restore();
          // Border ring
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy + avatarR, avatarR + 3, 0, Math.PI * 2);
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.8;
          ctx.stroke();
          ctx.restore();
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => {
          // Fallback: draw colored circle
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy + avatarR, avatarR, 0, Math.PI * 2);
          ctx.fillStyle = borderColor + '33';
          ctx.fill();
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.font = 'bold 42px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', cx, cy + avatarR);
          ctx.textBaseline = 'alphabetic';
          ctx.restore();
          URL.revokeObjectURL(url);
          resolve();
        };
        img.src = url;
      });
    };

    await Promise.all([
      drawAvatar(card.userAvatarId || 1, leftX, avatarY, '#6366f1'),
      drawAvatar(card.opponentAvatarId || 2, rightX, avatarY, 'rgba(255,255,255,0.4)')
    ]);

    const nameY = avatarY + avatarR * 2 + 25;
    // ── User name + username ──
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui';
    ctx.fillText(uName, leftX, nameY);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '15px system-ui';
    ctx.fillText('@' + uUsername, leftX, nameY + 24);
    // ── Rank badges ──
    const drawRankPill = (cx, y, rankText) => {
      ctx.font = 'bold 12px system-ui';
      const tw = ctx.measureText(rankText).width + 30;
      const th = 26;
      roundRect(ctx, cx - tw / 2, y, tw, th, th / 2);
      ctx.fillStyle = 'rgba(245,158,11,0.14)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245,158,11,0.35)';
      ctx.lineWidth = 1.2;
      roundRect(ctx, cx - tw / 2, y, tw, th, th / 2);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'center';
      ctx.fillText(rankText, cx, y + 17);
    };
    drawRankPill(leftX, nameY + 36, `#${uRank} RANK`);
    drawRankPill(rightX, nameY + 36, `#${oRank} RANK`);

    // ── Scores ──
    ctx.font = 'bold 54px monospace';
    ctx.fillStyle = '#818cf8';
    ctx.textAlign = 'center';
    ctx.fillText(uScore, leftX, nameY + 124);
    ctx.fillStyle = isWin ? 'rgba(255,255,255,0.65)' : '#f43f5e';
    ctx.fillText(oScore, rightX, nameY + 124);

    // ── Opponent name + username ──
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui';
    ctx.fillText(oppName, rightX, nameY);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '15px system-ui';
    ctx.fillText('@' + oUsername, rightX, nameY + 24);

    // ── VS Battle emblem (center) ──
    const vsX = W / 2, vsY = avatarY + avatarR + 10;
    // Outer circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(vsX, vsY, 34, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    // Crossed swords SVG path drawn on canvas
    ctx.save();
    ctx.translate(vsX - 16, vsY - 16);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    // Sword 1 (top-left to bottom-right)
    ctx.save();
    ctx.translate(16, 16);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-1.5, -12, 3, 24);
    ctx.fillRect(-4, 9, 8, 3);
    ctx.restore();
    // Sword 2 (top-right to bottom-left)
    ctx.save();
    ctx.translate(16, 16);
    ctx.rotate(-Math.PI / 4);
    ctx.fillRect(-1.5, -12, 3, 24);
    ctx.fillRect(-4, 9, 8, 3);
    ctx.restore();
    ctx.restore();

    // ── Horizontal separator ──
    const sepY = nameY + 148;
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(36, sepY, W - 72, 1);
    ctx.restore();

    // ── Outcome STAMP ──
    const stampY = sepY + 20;
    const stampText = card.outcome;
    ctx.font = 'bold 52px system-ui';
    const stampW = ctx.measureText(stampText).width + 80;
    const stampH = 72;
    const stampX = (W - stampW) / 2;
    // Fill
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = stampColor;
    roundRect(ctx, stampX, stampY, stampW, stampH, 10);
    ctx.fill();
    ctx.restore();
    // Border
    ctx.strokeStyle = stampColor;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7;
    roundRect(ctx, stampX, stampY, stampW, stampH, 10);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Text
    const stampGlow = ctx.createLinearGradient(stampX, stampY, stampX + stampW, stampY + stampH);
    stampGlow.addColorStop(0, stampColor);
    stampGlow.addColorStop(1, stampColor + 'cc');
    ctx.fillStyle = stampGlow;
    ctx.font = 'bold 52px system-ui';
    ctx.textAlign = 'center';
    ctx.shadowColor = stampColor;
    ctx.shadowBlur = 18;
    ctx.fillText(stampText, W / 2, stampY + 51);
    ctx.shadowBlur = 0;

    // ── Coin row (KashCoin SVG rendered inline) ──
    const coinRowY = stampY + stampH + 20;
    const coinLabel = isWin ? `Won: +${coinAmt}` : isDef ? `Loss: ${coinAmt}` : `Tied: ${coinAmt}`;
    ctx.fillStyle = isWin ? '#10b981' : isDef ? '#f43f5e' : '#6366f1';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(coinLabel, W / 2 - 16, coinRowY + 18);
    // Draw KashCoin as SVG img
    await new Promise((resolve) => {
      const kcSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="32" height="32">
        <defs>
          <radialGradient id="kcbg" cx="34%" cy="27%" r="72%">
            <stop offset="0%" stop-color="#FFF4B0"/>
            <stop offset="34%" stop-color="#FBBF24"/>
            <stop offset="68%" stop-color="#EA8A06"/>
            <stop offset="100%" stop-color="#9A4A0A"/>
          </radialGradient>
          <linearGradient id="kcrim" x1="14" y1="8" x2="52" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFF0A3"/>
            <stop offset="42%" stop-color="#EAB308"/>
            <stop offset="100%" stop-color="#92400E"/>
          </linearGradient>
        </defs>
        <circle cx="32" cy="32.9" r="28.8" fill="#5B2106" opacity="0.24"/>
        <circle cx="32" cy="32" r="30" fill="url(#kcrim)"/>
        <circle cx="32" cy="32" r="26.3" fill="url(#kcbg)"/>
        <path d="M21.4 20.2H27.5V29.7L36.2 20.2H43.0L32.6 31.4L43.4 43.8H36.1L27.5 33.9V43.8H21.4V20.2Z" fill="#7A2E06" opacity="0.98"/>
      </svg>`;
      const blob = new Blob([kcSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const coinLabelW = ctx.measureText(coinLabel).width;
        ctx.drawImage(img, W / 2 - 16 + coinLabelW / 2 + 4, coinRowY + 2, 26, 26);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      img.src = url;
    });

    return canvas;
  };

  // Helper: rounded rect path
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Helper: soft glow blob
  function drawGlow(ctx, cx, cy, r, color) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const handleFlexShare = async (customText, cardData = null) => {
    const defaultText = customText || `I just fought in the Battle Arena on MCQKash! Flexing my score card. Join the arena: ${window.location.origin}`;

    const cardToShare = cardData || selectedHistoryCard;
    if (!cardToShare) {
      showToast('No card selected to share.', 'warning');
      return;
    }

    try {
      showToast('Generating Battle Card...', 'info');
      const canvas = await drawBattleCardCanvas(cardToShare);
      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast('Failed to generate card image.', 'error');
          return;
        }
        if (!blob) { showToast('Failed to generate card.', 'error'); return; }
        const file = new File([blob], `mcqkash_battle_card_${Date.now()}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'MCQKash Battle Card', text: defaultText });
            showToast('Battle Card shared! 🏆', 'success');
          } catch (shareErr) {
            console.warn('Web Share failed, falling back to download:', shareErr);
            downloadBlob(blob);
          }
        } else {
          downloadBlob(blob);
        }
      }, 'image/png');

      return;
    } catch (err) {
      console.error('Image capture failed:', err);
      showToast('Image share failed. Copying flex text instead.', 'warning');
    }

    // Fallback: Web Share Text API or Clipboard
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Battle Arena Flex', text: defaultText, url: window.location.origin });
        showToast('Shared successfully!', 'success');
      } catch (err) {
        console.warn('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(defaultText);
        showToast('Flex copied to clipboard! Share it on WhatsApp/Instagram!', 'success');
      } catch (e) {
        showToast('Failed to copy. Share manually!', 'error');
      }
    }
  };

  const downloadBlob = (blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mcqkash_battle_card_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Battle Card downloaded as image!', 'success');
  };

  const finalizeEarlySubmit = async () => {
    setIsEarlySubmitWaiting(false);
    
    // Apply normal PvP payout instantly
    if (payoutAmount > 0) {
      await transactKC(payoutAmount);
    }
    
    // Save Battle Card in History Gallery
    const userId = economy?.id || 'guest';
    const newBattleCard = {
      id: pendingNotifId,
      userId: userId,
      userFullName: economy?.full_name || 'You',
      userAvatarId: economy?.avatar_id || 1,
      userIsPro: economy?.is_pro || false,
      userScore: userScore,
      userCorrect: correctCount,
      userIncorrect: incorrectCount,
      userRank: userKashRank || 15,
      
      opponentName: opponent?.full_name || 'Opponent',
      opponentAvatarId: opponent?.avatar_id || 2,
      opponentIsPro: opponent?.is_pro || false,
      opponentScore: opponentScore,
      opponentStreak: opponent?.streak || 0,
      opponentRank: opponent?.rank || 15,
      
      targetExam: economy?.target_exam || 'UPSC Pre',
      date: getISTDetails().dateStr,
      timestamp: Date.now(),
      outcome: userScore > opponentScore ? 'VICTORY' : userScore < opponentScore ? 'DEFEAT' : 'TIE',
      coinChange: payoutAmount - 100,
      unboxed: true
    };

    try {
      const stored = localStorage.getItem(`mcqkash_battle_history_${userId}`);
      const list = stored ? JSON.parse(stored) : [];
      if (!list.some(item => item.id === pendingNotifId)) {
        list.unshift(newBattleCard);
        localStorage.setItem(`mcqkash_battle_history_${userId}`, JSON.stringify(list));
        setBattleHistory(list);
      }
    } catch (e) {}

    // Update pending notification in localStorage
    try {
      const storedNotif = localStorage.getItem(`mcqkash_battle_notifications_${userId}`);
      if (storedNotif) {
        const list = JSON.parse(storedNotif);
        const filtered = list.filter(n => n.id !== pendingNotifId);
        localStorage.setItem(`mcqkash_battle_notifications_${userId}`, JSON.stringify(filtered));
      }
    } catch (e) {}

    // Play Victory or defeat sound
    const outcome = userScore > opponentScore ? 'VICTORY' : userScore < opponentScore ? 'DEFEAT' : 'TIE';
    if (outcome === 'VICTORY') {
      if (playVictory) playVictory();
    } else if (outcome === 'DEFEAT') {
      if (playShatter) playShatter();
    } else {
      if (playCorrect) playCorrect();
    }
  };

  useEffect(() => {
    if (!isEarlySubmitWaiting || earlySubmitTimeRemaining <= 0) return;
    
    const interval = setInterval(() => {
      setEarlySubmitTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          finalizeEarlySubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isEarlySubmitWaiting, earlySubmitTimeRemaining, pendingNotifId, payoutAmount, userScore, correctCount, incorrectCount, opponent, opponentScore]);

  const handleGenerateCheatSheet = async () => {
    if (economy?.user_tier !== 'Pro') {
      openProUpsell('Smart Notes');
      return;
    }

    const incorrectQuestions = questions.filter(q => answers[q.id] && answers[q.id] !== q.correctId);
    const skippedQuestions = questions.filter(q => !answers[q.id]);
    const totalMistakes = incorrectQuestions.length + skippedQuestions.length;

    if (totalMistakes === 0) {
      showToast("Awesome job! You got a perfect score, so no mistakes to revise. Try generating a similar mock instead!", "info");
      return;
    }

    setIsAiLoading(true);
    setAiLoadingText("Analyzing your test performance and mistakes...");

    try {
      const questionsToInclude = [...incorrectQuestions, ...skippedQuestions].slice(0, 10);
      const mistakesText = questionsToInclude.map((q, idx) => {
        const optionsText = q.options.map(o => `${o.label || o.id}) ${o.text}`).join('\n');
        return `Question #${idx + 1}:
Question: ${q.question}
Options:
${optionsText}
Correct Option: ${q.correctId}
Standard Explanation: ${q.explanation}
`;
      }).join('\n\n');

      setAiLoadingText("Synthesizing concept revision notes...");

      const systemPrompt = `You are 'Kash, the Knowledge Architect' — a master teacher who explains concepts beautifully and memorably.
Your task is to analyze the student's mistakes and skipped questions, then generate crisp, high-yield revision notes and core concepts.
Identify common conceptual themes or core weaknesses in their performance and write sections to address them.
Structure your notes beautifully with markdown headings (## for main sections, ### for subsections), clear bullet points, and highlight crucial keywords or rules using **bold** formatting (which will be styled as amber highlights).

Constraints:
- Do not use LaTeX formatting. Return standard text/markdown only.
- Do NOT include any introductory or concluding conversational text. Start immediately with the first ## section.
- Be academically rigorous, highly dense, and clear.`;

      const userPrompt = `Mistakes and skipped questions from Mock Exam:
${mistakesText}

Generate high-yield revision notes.`;

      const resultText = await queryGenerativeAI(systemPrompt, userPrompt);
      const formattedHtml = formatMentorResponse(resultText);

      const output = {
        id: Date.now(),
        mode: 'learn',
        title: `Revision Sheet: Battle Arena Challenge`,
        html: formattedHtml,
        mcqs: null,
        timestamp: new Date().toISOString(),
        savedToDb: false
      };

      const savedOutputs = localStorage.getItem('civilsKash_mentorOutputs');
      let outputsList = [];
      if (savedOutputs) {
        try {
          outputsList = JSON.parse(savedOutputs);
        } catch (e) {
          console.error(e);
        }
      }
      outputsList = [output, ...outputsList];
      localStorage.setItem('civilsKash_mentorOutputs', JSON.stringify(outputsList));

      showToast("Cheat Sheet generated! Opening Personal AI Mentor...", "success");
      
      navigate('/profile', {
        state: {
          openMentor: true,
          mentorMode: 'learn',
          pipeOutput: output
        }
      });
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to generate cheat sheet.", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateSimilarMock = async () => {
    if (economy?.user_tier !== 'Pro') {
      openProUpsell('Mock Forge');
      return;
    }

    setIsAiLoading(true);
    setAiLoadingText("Extracting topics, tags, and sample questions...");

    try {
      const categories = Array.from(new Set(questions.map(q => q.category).filter(Boolean)));
      const tags = Array.from(new Set(questions.flatMap(q => q.tags || []).filter(Boolean)));
      const topics = Array.from(new Set(questions.map(q => q.topic || q.subject).filter(Boolean)));

      const exampleQs = [];
      const incorrects = questions.filter(q => answers[q.id] && answers[q.id] !== q.correctId);
      exampleQs.push(...incorrects.slice(0, 2));
      if (exampleQs.length < 2) {
        const otherQs = questions.filter(q => !exampleQs.includes(q));
        exampleQs.push(...otherQs.slice(0, 2 - exampleQs.length));
      }

      const examplesText = exampleQs.map((q, idx) => {
        const optionsText = q.options.map(o => `${o.label || o.id}) ${o.text}`).join('\n');
        return `Example Question #${idx + 1}:
Question: ${q.question.replace(/<[^>]*>/g, '').trim()}
Options:
${optionsText.replace(/<[^>]*>/g, '').trim()}
Correct Option: ${q.correctId}
`;
      }).join('\n\n');

      setAiLoadingText("Kash is generating 10 new similar questions...");

      const systemPrompt = `You are 'Kash, the MCQ Creator' — an elite question designer for competitive exam aspirants.
Your task is to generate exactly 10 new, challenging multiple-choice questions similar to the student's mock exam profile.
Use the categories, topics, tags, and examples provided to guide the subject matter and difficulty level.

Strict Schema Requirements:
Return ONLY a raw JSON array of exactly 10 question objects. Do NOT wrap in markdown fences. Do NOT add any extra text or conversation.
Each object in the array must strictly match this schema:
[
  {
    "question": "The question text.",
    "options": [
      "Option 1",
      "Option 2",
      "Option 3",
      "Option 4"
    ],
    "correctOptionIndex": 0,
    "explanation": "A short, clear explanation of 2-3 sentences.",
    "category": "The subject category of the question (must choose from: ${categories.slice(0, 5).join(', ') || 'General Studies'}).",
    "tag": "Exactly 1 specific topic tag (must choose from: ${tags.slice(0, 8).join(', ') || 'General Concept'}).",
    "difficulty": "The difficulty of the question (must choose from: Easy, Medium, Hard)."
  }
]

Constraints:
- Strictly avoid LaTeX formatting. Use standard plain text only.
- Options must be challenging and require critical thinking.
- correctOptionIndex must be a number from 0 to 3 corresponding to the correct option.
- Ensure a natural mix of Easy (20%), Medium (50%), and Hard (30%) difficulties.`;

      const userPrompt = `Mock Exam Profile:
Categories: ${categories.slice(0, 5).join(', ') || 'General Studies'}
Tags: ${tags.slice(0, 8).join(', ') || 'Mock'}

Similar Style Examples:
${examplesText}

Generate exactly 10 new questions.`;

      const rawResult = await queryGenerativeAI(systemPrompt, userPrompt);
      setAiLoadingText("Parsing and building your custom test session...");

      const stripped = stripCodeFences(rawResult);
      let data = [];
      try {
        data = JSON.parse(stripped);
      } catch (err) {
        console.warn("JSON parse failed, attempting robust parsing:", err);
        const startIdx = rawResult.indexOf('[');
        const endIdx = rawResult.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1) {
          data = JSON.parse(rawResult.substring(startIdx, endIdx + 1));
        } else {
          throw new Error("Could not parse AI response as JSON.");
        }
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("AI output was not in correct JSON array format.");
      }

      const labels = ['a', 'b', 'c', 'd'];
      const convertedMcqs = data.map((q, idx) => {
        return {
          id: `ai_mock_${Date.now()}_${idx}`,
          question: q.question,
          options: q.options.map((optText, optIdx) => ({
            id: labels[optIdx] || String(optIdx),
            label: (labels[optIdx] || String(optIdx)).toUpperCase(),
            text: optText
          })),
          correctId: labels[q.correctOptionIndex] || 'a',
          explanation: q.explanation || 'No explanation provided.',
          difficulty: q.difficulty || 'Medium',
          category: q.category || categories[0] || 'AI Generated',
          tags: [q.tag || tags[0] || 'General'].filter(Boolean),
          isAiMockQuestion: true
        };
      });

      const newMock = {
        id: `ai_mock_${Date.now()}`,
        title: `AI similar mock: Battle Arena Challenge`,
        minutes: 10,
        questionData: convertedMcqs,
        type: 'ai_generated',
        isAiGenerated: true
      };

      showToast("Similar Mock generated! Loading test session...", "success");

      navigate('/mock-test', {
        state: {
          mock: newMock,
          from: '/profile'
        }
      });
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to generate similar mock.", "error");
    } finally {
      setIsAiLoading(false);
    }
  };


  const handleTryAgain = () => {
    const isSuccessfulMatch = Math.random() < 0.80;
    setMatchWillSucceed(isSuccessfulMatch);

    setGhostChoiceNeeded(false);
    setIsGhostMode(false);
    setMatchFailed(false);
    setMatchProgress(0);
    setStep('matchmaking');
    setSearchTrigger(prev => prev + 1);
  };

  const handleStartGhostAnyway = () => {
    setGhostChoiceNeeded(false);
    setMatchFailed(false);
    setIsGhostMode(true);
    // Fetch a real opponent from the database, but play asynchronously (Ghost Mode)
    selectLeaderboardOpponent();
  };

  // Calculate user categories correct/incorrect breakdown for X-Ray
  const xrayBreakdown = useMemo(() => {
    if (questions.length === 0) return { best: '', worst: '' };

    const catStats = {};
    questions.forEach(q => {
      const cat = q.category_id;
      if (!catStats[cat]) catStats[cat] = { total: 0, correct: 0 };
      catStats[cat].total++;
      if (answers[q.id] === q.correctId) {
        catStats[cat].correct++;
      }
    });

    let bestCat = null;
    let worstCat = null;
    let bestRatio = -1;
    let worstRatio = 2;

    Object.entries(catStats).forEach(([catId, stat]) => {
      const ratio = stat.correct / stat.total;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestCat = catId;
      }
      if (ratio < worstRatio) {
        worstRatio = ratio;
        worstCat = catId;
      }
    });

    const config = economy && EXAM_CONFIG[economy.target_exam];
    const getCatLabel = (id) => (config && config.categoryLabels[id]) || id.replace(/-/g, ' ');

    return {
      best: bestCat ? getCatLabel(bestCat) : 'General Topics',
      worst: worstCat ? getCatLabel(worstCat) : 'Specialty Sections'
    };
  }, [questions, answers, economy]);

  const currentGreeting = () => {
    if (userScore > opponentScore) return 'Victory is Yours!';
    if (userScore < opponentScore) return 'Defeat in Battle';
    return 'Arena Draw!';
  };

  if (step === 'mock' && questions.length > 0) {
    const currentQuestion = questions[currentIdx];
    const getStatusColor = (status, idx) => {
      const isActive = currentIdx === idx;
      let baseClass = "aspect-square rounded-xl flex items-center justify-center text-sm font-black border transition-all hover:scale-105 ";
      if (isActive) {
        baseClass += "ring-2 ring-theme-primary ring-offset-2 ring-offset-theme-bg ";
      }
      switch(status) {
        case 'answered': return baseClass + 'bg-emerald-500 text-white border-emerald-600';
        case 'marked': return baseClass + 'bg-purple-500 text-white border-purple-600';
        case 'not_answered': return baseClass + 'bg-rose-500 text-white border-rose-600';
        default: return baseClass + 'bg-theme-bg border-theme-border/60 text-theme-muted hover:border-theme-primary/30';
      }
    };

    const getQuestionStatus = (idx) => {
      const q = questions[idx];
      const ans = answers[q.id];
      const isMarked = marked[q.id];
      if (ans) {
        return isMarked ? 'marked' : 'answered';
      } else {
        return isMarked ? 'marked' : (visited.has(idx) ? 'not_answered' : 'unseen');
      }
    };

    const handleSelectQuestion = (idx) => {
      setCurrentIdx(idx);
      setVisited(prev => {
        const next = new Set(prev);
        next.add(idx);
        return next;
      });
    };

    const handleToggleMark = () => {
      const q = questions[currentIdx];
      setMarked(prev => ({ ...prev, [q.id]: true }));
      if (currentIdx < questions.length - 1) {
        handleSelectQuestion(currentIdx + 1);
      }
    };

    const handleClear = () => {
      const q = questions[currentIdx];
      setAnswers(prev => {
        const next = { ...prev };
        delete next[q.id];
        return next;
      });
      setMarked(prev => {
        const next = { ...prev };
        delete next[q.id];
        return next;
      });
    };

    return (
      <div className="min-h-screen bg-theme-bg flex flex-col h-screen overflow-hidden text-theme-text font-sans relative z-50">
        {/* Header */}
        <header className="h-14 bg-theme-surface border-b border-theme-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: 'Abandon Battle',
                  message: 'Abandoning the battle will forfeit your 100 KashCoins wager! Are you sure you want to exit?',
                  confirmText: 'Abandon & Exit',
                  cancelText: 'Stay',
                  onConfirm: () => navigate('/')
                });
              }} 
              className="p-2 hover:bg-theme-surface-hover rounded-full text-theme-text transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleFullscreen} 
              title={isFullscreen ? "Exit Full Screen" : "Full Screen Mode"}
              className="p-2 hover:bg-theme-surface-hover rounded-full text-theme-text transition-colors flex items-center justify-center border border-transparent hover:border-theme-border/50 shrink-0"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <div className="flex items-center gap-2 bg-theme-surface-hover px-3 py-1 rounded-full border border-theme-border shadow-inner shrink-0">
              <Clock size={15} className={mockTimeLeft < 120 ? 'text-rose-500 animate-pulse' : 'text-theme-primary'} />
              <span className={`font-mono font-bold text-xs ${mockTimeLeft < 120 ? 'text-rose-500' : 'text-theme-text'}`}>
                {formatTime(mockTimeLeft)}
              </span>
            </div>
            <button 
              onClick={handleSubmitMock} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 active:scale-95 shrink-0"
            >
              Submit
            </button>
          </div>
        </header>

        {/* Main Content Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Question Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto mb-4 text-theme-muted font-bold text-xs flex justify-between items-center">
              <span>Question {currentIdx + 1} of {questions.length}</span>
              <div className="flex items-center gap-2">
                <span className="bg-theme-primary/10 text-theme-primary px-2.5 py-1 rounded text-[10px] uppercase tracking-wide">+1 Mark / -0.25 Negative</span>
                <button 
                  onClick={() => setIsInfoModalOpen(true)} 
                  className="text-theme-muted hover:text-theme-text transition-colors p-1"
                  title="Mock Guidelines"
                >
                  <Info size={14} />
                </button>
              </div>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <McqCard 
                key={currentQuestion.id} 
                questionData={currentQuestion} 
                mode="exam" 
                externalSelection={answers[currentQuestion.id] || null}
                onSelect={handleSelectOption}
                onUse5050={() => {
                  setUsed5050(prev => ({ ...prev, [currentQuestion.id]: true }));
                }}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="max-w-3xl mx-auto w-full mt-8 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-1">
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <button 
                  onClick={handleToggleMark} 
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-theme-surface border rounded-full text-theme-text hover:bg-theme-surface-hover transition-all font-bold text-sm shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap ${marked[currentQuestion.id] ? 'border-purple-500 text-purple-500 bg-purple-500/5' : 'border-theme-border hover:border-purple-500/50'}`}
                >
                  <span className="hidden sm:inline">Mark for Review</span>
                  <span className="sm:hidden">Review</span>
                </button>
                <button 
                  onClick={handleClear} 
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-theme-surface border border-theme-border rounded-full text-theme-text hover:bg-theme-surface-hover hover:border-rose-500/50 transition-all font-bold text-sm shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap"
                >
                  Clear
                </button>
              </div>
              <div className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                <button 
                  disabled={currentIdx === 0}
                  onClick={() => handleSelectQuestion(currentIdx - 1)}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-theme-surface border border-theme-border rounded-full text-theme-text hover:bg-theme-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold text-sm shadow-md hover:shadow-lg"
                >
                  Prev
                </button>
                <button 
                  onClick={() => {
                    if (currentIdx < questions.length - 1) {
                      handleSelectQuestion(currentIdx + 1);
                    }
                  }} 
                  className="flex-1 sm:flex-none px-6 sm:px-8 py-2.5 bg-theme-primary hover:bg-blue-600 text-white rounded-full font-black text-sm transition-all shadow-md shadow-theme-primary/20 hover:shadow-theme-primary/45 active:scale-95 whitespace-nowrap"
                >
                  Save & Next
                </button>
              </div>
            </div>

            {/* Mobile Smart-Mock Palette */}
            <div className="max-w-3xl mx-auto w-full mt-10 border-t border-theme-border/60 pt-6 lg:hidden">
              <h3 className="font-bold text-theme-text text-sm mb-3">Smart-Mock Palette</h3>
              
              {/* Palette Legend */}
              <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs text-theme-text font-medium mb-4">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600 shadow-sm inline-block"></span> Answered</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-600 shadow-sm inline-block"></span> Not Answered</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-theme-bg border border-theme-border shadow-sm inline-block"></span> Not Visited</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-purple-600 shadow-sm inline-block"></span> Marked</div>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {questions.map((q, idx) => (
                  <button 
                    key={q.id} 
                    onClick={() => handleSelectQuestion(idx)}
                    className={getStatusColor(getQuestionStatus(idx), idx)}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* Mobile Submit Button */}
              <div className="mt-6">
                <button 
                  onClick={handleSubmitMock} 
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-500/10 active:scale-95 animate-subtle"
                >
                  Submit Challenge
                </button>
              </div>
            </div>
          </div>

          {/* Right: Question Palette */}
          <div className="w-80 bg-theme-surface border-l border-theme-border hidden lg:flex flex-col shrink-0">
            <div className="p-4 border-b border-theme-border shrink-0">
              <h3 className="font-black text-xs uppercase tracking-widest text-theme-text">Battle-Mock Palette</h3>
            </div>
            
            {/* Palette Legend */}
            <div className="p-4 border-b border-theme-border shrink-0 grid grid-cols-2 gap-2.5 text-[10px] text-theme-text font-bold uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600 shadow-sm inline-block shrink-0" /> 
                Answered
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600 shadow-sm inline-block shrink-0" /> 
                Not Answered
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-theme-bg border border-theme-border shadow-sm inline-block shrink-0" /> 
                Unvisited
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 border border-purple-600 shadow-sm inline-block shrink-0" /> 
                Marked
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, idx) => (
                  <button 
                    key={q.id} 
                    onClick={() => handleSelectQuestion(idx)}
                    className={getStatusColor(getQuestionStatus(idx), idx)}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit button in Palette */}
            <div className="p-4 border-t border-theme-border">
              <button 
                onClick={handleSubmitMock} 
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                Submit Challenge
              </button>
            </div>
          </div>
        </div>

        {/* Challenge Mock Guidelines Modal */}
        <UniversalModal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          title="Battle Mock Guidelines"
        >
          <div className="space-y-5 text-sm text-theme-text text-left leading-relaxed">
            <div className="space-y-1">
              <h4 className="font-bold text-theme-primary flex items-center gap-1.5">
                <span>📌</span> Mark for Review
              </h4>
              <p className="text-xs text-theme-muted pl-5">
                Highlights the question in purple in your navigation palette so you can review it before submitting. It has no impact on score.
              </p>
            </div>

            <div className="space-y-1 border-t border-theme-border/30 pt-3">
              <h4 className="font-bold text-amber-500 flex items-center gap-1.5">
                <span>⚡</span> 50/50 Lifeline Penalty
              </h4>
              <p className="text-xs text-theme-muted pl-5">
                Using the 50/50 lifeline costs 3 KashCoins and eliminates 2 incorrect choices. If you answer correctly using 50/50, a penalty of <strong>0.5 marks is deducted</strong> (earning +0.50 net instead of +1.00 for that question).
              </p>
            </div>

            {economy?.user_tier !== 'Pro' ? (
              <div className="space-y-2 border-t border-amber-500/20 bg-amber-500/5 p-3.5 rounded-xl mt-3">
                <h4 className="font-bold text-amber-600 flex items-center gap-1.5">
                  <span>🔒</span> Free Tier Scoring Limit
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                  As a Free member, this battle challenge contains <strong>2 Pro Locked MCQs</strong>. These are locked, reducing your max scoring potential by 2 points. Upgrade to Pro to unlock 100% scoring capacity!
                </p>
                <button
                  onClick={() => {
                    setIsInfoModalOpen(false);
                    navigate('/upgrade');
                  }}
                  className="mt-1.5 w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-lg text-[10px] uppercase tracking-wider transition-all active:scale-95 text-center"
                >
                  Upgrade to Pro
                </button>
              </div>
            ) : (
              <div className="space-y-1 border-t border-emerald-500/20 bg-emerald-500/5 p-3 rounded-xl mt-3 text-emerald-800 dark:text-emerald-300">
                <h4 className="font-bold flex items-center gap-1.5">
                  <span>★</span> Active Pro Member
                </h4>
                <p className="text-xs">
                  You have active Pro status. No scoring limits are active. All questions are fully unlocked and scoreable.
                </p>
              </div>
            )}
          </div>
        </UniversalModal>

        {/* Custom Confirmation Modal */}
        <UniversalModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          title={confirmModal.title}
        >
          <div className="space-y-5 text-center">
            <p className="text-sm text-theme-text leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                }}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-rose-500/10"
              >
                {confirmModal.confirmText}
              </button>
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 border border-theme-border bg-theme-surface text-theme-text rounded-xl text-xs font-black uppercase tracking-wider hover:bg-theme-surface-hover transition-all active:scale-95"
              >
                {confirmModal.cancelText}
              </button>
            </div>
          </div>
        </UniversalModal>
      </div>
    );
  }

  if (loading) return null; // Wait for initial session loading to complete

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname + location.search, message: "Accept battle after quick sign in!" }} />;
  }

  return (
    <div className="min-h-screen pb-20 relative bg-theme-bg text-theme-text font-sans">
      <Header />
      
      {/* ── Page-wide atmospheric depth layer ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.05]" style={{ background: 'var(--color-primary)' }} />
        <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.04]" style={{ background: 'var(--color-accent)' }} />
      </div>

      <main className="max-w-4xl mx-auto px-6 py-6 relative z-10">
        
        {/* Navigation back header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => {
              if (step === 'mock') {
                setConfirmModal({
                  isOpen: true,
                  title: 'Abandon Battle',
                  message: 'Abandoning the battle will forfeit your 100 KashCoins wager! Are you sure you want to exit?',
                  confirmText: 'Abandon & Exit',
                  cancelText: 'Stay',
                  onConfirm: () => navigate('/')
                });
              } else {
                navigate('/');
              }
            }} 
            className="flex items-center gap-2 text-theme-muted hover:text-theme-text transition-colors group font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Exit Arena
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-theme-accent/20 bg-theme-accent/5 backdrop-blur-md">
            <Swords size={12} className="text-theme-accent animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-theme-accent">Battle Gate</span>
          </div>
        </div>

        {/* ─── SCREEN 0: CHALLENGE INTRO DASHBOARD CARD ─── */}
        {step === 'challenge-intro' && challengeData && (() => {
          // Check if seed was already attempted
          const userId = economy?.id || 'guest';
          let alreadyAttempted = false;
          try {
            const attemptedStr = localStorage.getItem(`mcqkash_attempted_challenges_${userId}`);
            const attemptedList = attemptedStr ? JSON.parse(attemptedStr) : [];
            if (attemptedList.includes(challengeData.seed)) {
              alreadyAttempted = true;
            }
          } catch(e) {}

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto relative overflow-hidden rounded-[32px] border border-amber-500/35 bg-theme-surface/40 backdrop-blur-md p-8 shadow-2xl space-y-6 text-center"
              style={{
                background: 'linear-gradient(145deg, rgba(var(--color-surface-rgb), 0.95) 0%, rgba(245, 158, 11, 0.05) 100%)',
                boxShadow: '0 20px 50px -15px rgba(245, 158, 11, 0.15)'
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)' }} />

              <div className="w-20 h-20 rounded-full border-4 border-amber-500/40 p-0.5 mx-auto bg-theme-bg shadow-xl relative z-10 animate-bounce flex items-center justify-center overflow-hidden">
                <Avatar id={challengeData.challengerAvatarId} className="w-full h-full rounded-full" />
              </div>

              <div className="space-y-2 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/15 select-none animate-pulse">
                  CHALLENGE INVITE
                </span>
                <h1 className="text-3xl font-black tracking-tight uppercase mt-2">
                  Challenge Accepted
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-theme-muted">
                  <span className="text-theme-primary font-bold">{challengeData.challengerName} (@{challengeData.challengerUsername || 'challenger'})</span> has challenged you to beat their score in <span className="text-theme-accent font-black uppercase">{challengeData.exam.replace(/-/g, ' ')}</span>!
                </p>
              </div>

              {/* Score to beat block */}
              <div className="p-5 bg-amber-500/5 rounded-2xl border border-amber-500/20 max-w-[240px] mx-auto relative z-10">
                <span className="text-[9px] font-black text-theme-muted uppercase tracking-widest block mb-1">SCORE TO BEAT</span>
                <span className="text-4xl font-mono font-black text-amber-500">{challengeData.scoreToBeat.toFixed(2)}</span>
                <span className="text-xs font-semibold text-theme-muted block mt-1">out of 20.00</span>
              </div>

              {alreadyAttempted && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs font-semibold text-rose-500 relative z-10">
                  ⚠️ You have already played this duel! Ask your friend for a new challenge link.
                </div>
              )}

              <div className="flex gap-4 pt-2 relative z-10">
                {alreadyAttempted ? (
                  <button
                    disabled
                    className="flex-1 py-4 bg-theme-border text-theme-muted font-black rounded-2xl text-xs uppercase tracking-wider cursor-not-allowed opacity-50"
                  >
                    Already Attempted
                  </button>
                ) : (
                  <button
                    onClick={handleStartChallengeMock}
                    className="flex-1 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider hover:opacity-95 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                  >
                    Accept & Start Duel
                  </button>
                )}
                <button
                  onClick={() => {
                    setChallengeData(null);
                    setStep('gate');
                  }}
                  className="py-4 px-6 border border-theme-border bg-theme-surface text-theme-text font-black rounded-2xl text-xs uppercase tracking-wider hover:border-theme-primary transition-all active:scale-95"
                >
                  Decline
                </button>
              </div>
            </motion.div>
          );
        })()}

        {/* ─── SCREEN 1: BATTLE GATE ─── */}
        {step === 'gate' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Header info */}
            <div className="text-center pt-2 pb-1">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-3 font-outfit">
                THE <span className="text-gradient-primary">BATTLE ARENA</span>
              </h1>
              <p className="text-sm md:text-base font-semibold text-theme-muted max-w-lg mx-auto leading-relaxed mt-3 px-4">
                Every Battle Counts. <span className="text-theme-primary font-bold">Bet KashCoins</span>, <span className="text-theme-accent font-bold">Beat Aspirants</span>, <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent font-black drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)] inline-block">Win Battle Cards</span> and <span className="text-theme-text font-black underline decoration-theme-primary/40 underline-offset-4">Dominate the Rankings</span>.
              </p>
            </div>

            {/* Lock Messages (Exclusive Gates) */}
            {isLockedBySleep && (
              <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-md p-6 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                  <Lock size={28} />
                </div>
                <h3 className="text-lg font-black text-rose-500 uppercase tracking-tight">Arena Is Sleeping</h3>
                <p className="text-xs font-semibold text-theme-muted leading-relaxed max-w-sm mx-auto">
                  "The Arena is sleeping. Real aspirants are resting for tomorrow's grind. Come back at 6:00 AM IST."
                </p>
              </div>
            )}

            {!isLockedBySleep && isLockedByDailyLimit && (
              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-md p-6 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto animate-pulse">
                  <Trophy size={28} />
                </div>
                <h3 className="text-lg font-black text-amber-500 uppercase tracking-tight">Daily Honor Secured</h3>
                <p className="text-xs font-semibold text-theme-muted leading-relaxed max-w-sm mx-auto">
                  "You have completed your daily challenge. The Arena limits warriors to 1 match per day to enforce rigorous, disciplined training. Come back tomorrow!"
                </p>
              </div>
            )}

            {!isLockedBySleep && !isLockedByDailyLimit && isLockedByCoins && (
              <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-md p-6 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                  <Coins size={28} />
                </div>
                <h3 className="text-lg font-black text-rose-500 uppercase tracking-tight">Insufficient KashCoins</h3>
                <p className="text-xs font-semibold text-theme-muted leading-relaxed max-w-sm mx-auto">
                  "Entering the Battle Arena requires a wager of 100 KashCoins. Solve daily mocks, fix mistakes, or preserve streaks to earn more!"
                </p>
              </div>
            )}

            {/* Start matchmaking buttons */}
            {!isLockedBySleep && !isLockedByDailyLimit && !isLockedByCoins && (
              <div className="flex flex-col sm:flex-row justify-center gap-5 py-4 px-4 items-center w-full max-w-2xl mx-auto">
                {/* DAILY BATTLE BUTTON */}
                <button
                  onClick={handleStartSearch}
                  className="group relative w-full sm:w-1/2 flex items-center justify-between px-7 py-4 rounded-3xl overflow-hidden transition-all duration-350 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(249,115,22,0.25)] active:scale-95 text-white border border-orange-500/30 bg-gradient-to-br from-orange-500 via-red-500 to-amber-600 shadow-lg"
                >
                  {/* Subtle hover sweep light */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 group-hover:rotate-6 transition-transform">
                      <Swords size={20} className="text-white" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-extrabold text-[15px] tracking-tight leading-none mb-1.5 uppercase font-outfit">DAILY BATTLE</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/80 leading-none">
                        Wager: 100 KashCoins
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/70 group-hover:translate-x-1 transition-transform relative z-10" />
                </button>

                {/* CHALLENGE FRIEND BUTTON */}
                <button
                  onClick={handleStartChallengeSetup}
                  className="group relative w-full sm:w-1/2 flex items-center justify-between px-7 py-4 rounded-3xl overflow-hidden transition-all duration-350 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(139,92,246,0.25)] active:scale-95 text-white border border-purple-500/30 bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700 shadow-lg"
                >
                  {/* Subtle hover sweep light */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform">
                      <Zap size={20} className="text-amber-300 fill-amber-300/20" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-extrabold text-[15px] tracking-tight leading-none mb-1.5 uppercase font-outfit">CHALLENGE FRIEND</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/80 leading-none">
                        Wager: 50 KashCoins
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/70 group-hover:translate-x-1 transition-transform relative z-10" />
                </button>
              </div>
            )}
            
            {/* QOTD Bento Section */}
            <QOTDBento />

            {/* Collectible gallery cards section */}
            <div className="pt-8 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-theme-muted px-2">
                Your Collectible Battle History
              </h3>
              
              {battleHistory.length === 0 ? (
                <div className="rounded-2xl border border-theme-border/50 bg-theme-surface/30 p-10 text-center text-theme-muted font-semibold text-xs leading-relaxed">
                  ⚔️ Your Arena record is clean. Win PvP battles to collect rare, theme-responsive Battle Cards!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {battleHistory.map((card) => (
                    <motion.div
                      key={card.id}
                      onClick={() => handleSelectHistoryCard(card)}
                      whileHover={{ scale: 1.04, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative rounded-[24px] cursor-pointer p-4 overflow-hidden border backdrop-blur-md transition-all duration-300 flex flex-col justify-between"
                      style={{
                        background: card.outcome === 'VICTORY' 
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(var(--color-surface-rgb), 0.85) 100%)' 
                          : card.outcome === 'DEFEAT'
                          ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.06) 0%, rgba(var(--color-surface-rgb), 0.85) 100%)'
                          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(var(--color-surface-rgb), 0.85) 100%)',
                        borderColor: card.outcome === 'VICTORY' 
                          ? 'rgba(16, 185, 129, 0.25)' 
                          : card.outcome === 'DEFEAT'
                          ? 'rgba(244, 63, 94, 0.25)'
                          : 'rgba(59, 130, 246, 0.25)',
                        boxShadow: card.outcome === 'VICTORY'
                          ? '0 8px 24px -10px rgba(16, 185, 129, 0.2), inset 0 1px 1px rgba(255,255,255,0.03)'
                          : card.outcome === 'DEFEAT'
                          ? '0 8px 24px -10px rgba(244, 63, 94, 0.2), inset 0 1px 1px rgba(255,255,255,0.03)'
                          : '0 8px 24px -10px rgba(59, 130, 246, 0.2), inset 0 1px 1px rgba(255,255,255,0.03)',
                        minHeight: '160px',
                        filter: card.outcome === 'DEFEAT' ? 'grayscale(35%) opacity(0.95)' : 'none'
                      }}
                    >
                      {/* Holographic sweep sheen effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

                      {(() => {
                        const capsuleClass = card.outcome === 'VICTORY'
                          ? 'bg-emerald-500/[0.04] border border-emerald-500/15 text-emerald-400'
                          : card.outcome === 'DEFEAT'
                          ? 'bg-rose-500/[0.04] border border-rose-500/15 text-rose-400'
                          : 'bg-blue-500/[0.04] border border-blue-500/15 text-blue-400';

                        return (
                          <>
                            {/* Header details with themed glassmorphic capsules */}
                            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider mb-2 gap-2 relative z-10">
                              <span className={`px-2 py-0.5 rounded-full backdrop-blur-sm max-w-[95px] truncate leading-none ${capsuleClass}`}>
                                {card.targetExam === 'upsc-pre' ? 'UPSC Prelims' : card.targetExam === 'ssc-cgl' ? 'SSC CGL' : 'State PSC'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full backdrop-blur-sm leading-none ${capsuleClass}`}>
                                {card.date}
                              </span>
                            </div>

                             {/* Opponent Layout (Ignoring User entirely, Centralized Opponent after VS) */}
                             <div className="flex items-center gap-3.5 my-auto relative z-10 py-1.5 w-full">
                               {/* Left: Premium theme-sensitive "VS" indicator */}
                               <div className={`px-3 py-1.5 rounded-xl border font-black text-[10px] tracking-wider select-none leading-none flex items-center justify-center shrink-0 ${
                                 card.outcome === 'VICTORY'
                                   ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                                   : card.outcome === 'DEFEAT'
                                   ? 'bg-rose-500/10 border-rose-500/25 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
                                   : 'bg-blue-500/10 border-blue-500/25 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.15)]'
                               }`}>
                                 VS
                               </div>

                               {/* Center-Right: Opponent details (Avatar first, then text next to it) */}
                               <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                 <div className="w-12 h-12 rounded-full border-2 border-theme-accent p-0.5 bg-theme-bg shadow-md shrink-0">
                                   <Avatar id={card.opponentAvatarId || 2} className="w-full h-full rounded-full" />
                                 </div>
                                 <div className="flex flex-col items-start space-y-1 truncate text-left">
                                   <span className={`text-[13.5px] font-black truncate w-full max-w-[130px] leading-tight ${
                                     card.outcome === 'VICTORY'
                                       ? 'text-emerald-400'
                                       : card.outcome === 'DEFEAT'
                                       ? 'text-rose-400'
                                       : 'text-blue-400'
                                   }`}>
                                     @{card.opponentName ? card.opponentName.toLowerCase().replace(/\s+/g, '') : 'aspirant'}
                                   </span>
                                   <span className="text-[9.5px] font-black text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 leading-none select-none flex items-center gap-1">
                                     <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v3c0 2.2 1.8 4 4 4h1.1c.9 2 2.8 3.5 5.1 3.9v3.1H9v2h6v-2h-4.2v-3.1c2.3-.4 4.2-1.9 5.1-3.9H17c2.2 0 4-1.8 4-4V7c0-1.1-.9-2-2-2zM7 11c-1.1 0-2-.9-2-2V7h2v4zm12-2c0 1.1-.9-2-2 2v-4h2v2z"/></svg>
                                     <span>#{card.opponentRank || card.rank || 15}</span>
                                   </span>
                                 </div>
                                </div>
                             </div>

                            {/* Footer: Stamp on left, coins on right */}
                            <div className="flex justify-between items-center pt-2 mt-auto relative z-10 gap-2">
                              <span className={`border text-[8px] sm:text-[8.5px] font-black tracking-[0.14em] px-2.5 py-1 rounded uppercase select-none leading-none shrink-0 ${
                                card.outcome === 'VICTORY'
                                  ? 'border-emerald-500/35 text-emerald-400 bg-emerald-500/5'
                                  : card.outcome === 'DEFEAT'
                                  ? 'border-rose-500/35 text-rose-400 bg-rose-500/5'
                                  : 'border-blue-500/35 text-blue-400 bg-blue-500/5'
                              }`}
                              style={{ fontFamily: 'Outfit, sans-serif' }}
                              >
                                {card.outcome}
                              </span>
                              
                              <div className="flex items-center gap-1.5">
                                <span className={
                                  card.outcome === 'DEFEAT'
                                    ? 'text-rose-400 font-black text-[13px] sm:text-sm'
                                    : card.outcome === 'TIE'
                                    ? 'text-blue-400 font-black text-[13px] sm:text-sm'
                                    : 'text-emerald-400 font-black text-[13px] sm:text-sm'
                                }>
                                  {card.coinChange >= 0 ? '+' : ''}{card.coinChange}
                                </span>
                                <KashCoinIcon className="w-4 h-4 shrink-0" glow={false} />
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}

        {/* ─── SCREEN 2: MATCHMAKING SCREEN ─── */}
        {step === 'matchmaking' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center space-y-8"
          >
            {/* Search Radar Radar Animation */}
            <div className="relative w-48 h-48 rounded-full border border-theme-primary/20 bg-theme-surface/10 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-[inset_0_0_20px_rgba(var(--color-primary-rgb),0.12),0_0_15px_rgba(0,0,0,0.35)]">
              {/* Radar Grid Lines */}
              <div className="absolute w-full h-[1px] bg-theme-primary/10" />
              <div className="absolute h-full w-[1px] bg-theme-primary/10" />
              {/* Concentric grid rings */}
              <div className="absolute w-36 h-36 rounded-full border border-theme-primary/10" />
              <div className="absolute w-24 h-24 rounded-full border border-theme-primary/10" />
              <div className="absolute w-12 h-12 rounded-full border border-theme-primary/10" />

              {/* Rotating radar sweep */}
              <motion.div 
                className="absolute inset-0 origin-center pointer-events-none"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                style={{
                  background: 'conic-gradient(from 0deg, transparent 50%, rgba(var(--color-primary-rgb), 0.12) 80%, rgba(var(--color-primary-rgb), 0.45) 100%)',
                }}
              />

              {/* Glowing Blips (Simulated online aspirants) */}
              <motion.div 
                className="absolute w-2.5 h-2.5 rounded-full bg-theme-accent shadow-[0_0_8px_var(--color-accent)]"
                style={{ top: '22%', left: '72%' }}
                animate={{ opacity: [0, 1, 0.2, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
              />
              <motion.div 
                className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"
                style={{ top: '68%', left: '26%' }}
                animate={{ opacity: [0, 0, 1, 0.3, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 1.2 }}
              />
              <motion.div 
                className="absolute w-3 h-3 rounded-full bg-theme-primary shadow-[0_0_8px_var(--color-primary)]"
                style={{ top: '42%', left: '46%' }}
                animate={{ opacity: [0, 0.8, 0.1, 0] }}
                transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut', delay: 2.1 }}
              />
              
              {/* Center Icon */}
              <div className="w-14 h-14 rounded-full bg-theme-bg/80 border border-theme-primary/25 flex items-center justify-center text-theme-primary relative z-10 shadow-lg">
                <Swords size={22} className="animate-pulse" />
              </div>
            </div>

            {/* Coffee Matchmaking Copy */}
            <div className="space-y-3 max-w-sm">
              <h2 className="text-xl font-black text-theme-text uppercase tracking-tight">
                Matching Competitor
              </h2>
              <p className="text-xs font-semibold text-theme-muted leading-relaxed h-12 flex items-center justify-center">
                {matchmakingCopy}
              </p>
            </div>

            {/* Progress bar */}
            {!ghostChoiceNeeded && !matchFailed && (
              <div className="w-full max-w-xs space-y-1">
                <div className="flex justify-between text-[10px] font-black text-theme-muted uppercase tracking-widest">
                  <span>Signal Search</span>
                  <span>{matchProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-theme-surface border border-theme-border overflow-hidden">
                  <div 
                    className="h-full bg-gradient-primary rounded-full transition-all duration-100"
                    style={{ width: `${matchProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Match Failed options */}
            {matchFailed && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 max-w-sm space-y-4 shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
                
                <h3 className="text-sm font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5 justify-center">
                  <AlertCircle size={16} className="text-rose-500 animate-pulse" />
                  Search Timeout
                </h3>
                <p className="text-xs font-semibold text-theme-muted leading-normal">
                  Ouch! Couldn't find any aspirant battling online right now.
                </p>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleTryAgain}
                    className="flex-1 py-2.5 rounded-xl border border-theme-border bg-theme-surface text-[10px] font-black uppercase tracking-wider hover:border-theme-primary hover:text-theme-primary transition-all active:scale-95"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={handleStartGhostAnyway}
                    className="flex-1 py-2.5 rounded-xl bg-theme-primary text-white text-[10px] font-black uppercase tracking-wider hover:opacity-95 transition-all active:scale-95 shadow-md shadow-theme-primary/10"
                  >
                    Start Anyway
                  </button>
                </div>
              </motion.div>
            )}

            {/* Ghost Match options */}
            {ghostChoiceNeeded && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 max-w-sm space-y-4 shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-theme-primary/5 rounded-full blur-xl pointer-events-none" />
                
                <h3 className="text-sm font-black text-theme-text uppercase tracking-wider flex items-center gap-1.5 justify-center">
                  <AlertCircle size={16} className="text-theme-primary animate-pulse" />
                  "Couldn't find an opponent right now."
                </h3>
                <p className="text-xs font-semibold text-theme-muted leading-normal">
                  No active competitors are matching in the lobby right now. You can try searching again, or jump straight into the challenge immediately in asynchronous ghost mode.
                </p>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleTryAgain}
                    className="flex-1 py-2.5 rounded-xl border border-theme-border bg-theme-surface text-[10px] font-black uppercase tracking-wider hover:border-theme-primary hover:text-theme-primary transition-all active:scale-95"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={handleStartGhostAnyway}
                    className="flex-1 py-2.5 rounded-xl bg-theme-primary text-white text-[10px] font-black uppercase tracking-wider hover:opacity-95 transition-all active:scale-95 shadow-md shadow-theme-primary/10"
                  >
                    Start Anyway
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ─── SCREEN 3: PRE-START MATCH PREVIEW ─── */}
        {step === 'pre-start' && opponent && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* The Duel Banner */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-10 px-8 relative overflow-hidden rounded-[32px] border border-theme-border bg-theme-surface/30 backdrop-blur-md shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-theme-primary/5 via-transparent to-theme-accent/5 pointer-events-none" />
              
              {/* User Side */}
              <motion.div 
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, type: 'spring', bounce: 0.2 }}
                className="flex flex-col items-center text-center space-y-4 flex-1 w-full"
              >
                {/* Glowing Avatar border ring */}
                <div className="relative">
                  <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-theme-primary to-blue-500 opacity-30 blur-sm animate-pulse" />
                  <div className="relative w-24 h-24 rounded-full border-3 border-theme-primary p-1 bg-theme-bg shadow-xl z-10">
                    <Avatar id={economy?.avatar_id || 1} className="w-full h-full rounded-full" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-black text-theme-text flex items-center justify-center gap-1.5 leading-none">
                    {economy?.full_name || 'You'}
                    {economy?.is_pro && (
                      <span className="px-2 py-0.5 rounded border border-amber-400 bg-amber-500/10 text-amber-500 text-[8.5px] font-black leading-none uppercase animate-pulse">PRO</span>
                    )}
                  </p>
                  <span className="text-[10px] text-theme-muted font-normal block mt-0.5">@{economy?.username || 'you'}</span>
                  <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
                    {getExamLabel(economy?.target_exam)}
                  </p>
                </div>
                {/* Mini Stats Grid */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-[200px] bg-theme-bg/40 border border-theme-border/30 rounded-xl p-2 text-[10px] font-black uppercase tracking-wider text-theme-muted">
                  <div className="border-r border-theme-border/30 pr-2">
                    <div className="text-[8px] opacity-60">Avg Acc</div>
                    <div className="text-theme-primary font-bold text-xs">{economy?.users_accuracy || 70}%</div>
                  </div>
                  <div className="pl-2">
                    <div className="text-[8px] opacity-60">Kash Rank</div>
                    <div className="text-theme-primary font-bold text-xs">#{userKashRank}</div>
                  </div>
                </div>
                {/* Embedded Caliber progress bar */}
                <div className="w-full max-w-[200px] mt-2">
                  <div className="w-full h-2.5 rounded-full bg-theme-bg overflow-hidden border border-theme-border/30 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-theme-primary to-blue-500 rounded-full" 
                      style={{ width: `${calculateCaliber(economy?.users_accuracy || 70, userKashRank)}%` }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* VS Divider */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: 'spring', delay: 0.2 }}
                className="flex flex-col items-center justify-center shrink-0 py-2 md:py-0"
              >
                <div className="w-14 h-14 rounded-full border border-theme-border bg-theme-bg flex items-center justify-center text-theme-primary shadow-xl relative">
                  <div className="absolute -inset-1 rounded-full border border-theme-primary/25 animate-ping opacity-75" />
                  <span className="font-outfit font-black text-lg italic tracking-widest text-gradient-primary">VS</span>
                </div>
              </motion.div>

              {/* Opponent Side */}
              <motion.div 
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, type: 'spring', bounce: 0.2 }}
                className="flex flex-col items-center text-center space-y-4 flex-1 w-full"
              >
                {/* Glowing Avatar border ring */}
                <div className="relative">
                  <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-theme-accent to-red-500 opacity-30 blur-sm animate-pulse" />
                  <div className="relative w-24 h-24 rounded-full border-3 border-theme-accent p-1 bg-theme-bg shadow-xl z-10">
                    <Avatar id={isGhostMode ? 1 : isFriendChallengeSetup ? 2 : opponent.avatar_id} className="w-full h-full rounded-full" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-black text-theme-text flex items-center justify-center gap-1.5 leading-none">
                    {isGhostMode ? 'Awaiting Challenger' : isFriendChallengeSetup ? 'Your Friend' : opponent.full_name}
                    {!isGhostMode && !isFriendChallengeSetup && opponent.is_pro && (
                      <span className="px-2 py-0.5 rounded border border-amber-400 bg-amber-500/10 text-amber-500 text-[8.5px] font-black leading-none uppercase animate-pulse">PRO</span>
                    )}
                  </p>
                  <span className="text-[10px] text-theme-muted font-normal block mt-0.5">{isGhostMode ? '@matching_soon' : isFriendChallengeSetup ? '@friend' : `@${opponent.username}`}</span>
                  <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
                    {isGhostMode ? 'Competitor' : isFriendChallengeSetup ? 'Opponent' : getExamLabel(opponent?.target_exam)}
                  </p>
                </div>
                {/* Mini Stats Grid */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-[200px] bg-theme-bg/40 border border-theme-border/30 rounded-xl p-2 text-[10px] font-black uppercase tracking-wider text-theme-muted">
                  <div className="border-r border-theme-border/30 pr-2">
                    <div className="text-[8px] opacity-60">Avg Acc</div>
                    <div className="text-theme-accent font-bold text-xs">{isGhostMode || isFriendChallengeSetup ? '---' : `${opponent.accuracy}%`}</div>
                  </div>
                  <div className="pl-2">
                    <div className="text-[8px] opacity-60">Kash Rank</div>
                    <div className="text-theme-accent font-bold text-xs">{isGhostMode || isFriendChallengeSetup ? '---' : `#${opponent.rank}`}</div>
                  </div>
                </div>
                {/* Embedded Caliber progress bar */}
                <div className="w-full max-w-[200px] mt-2">
                  <div className="w-full h-2.5 rounded-full bg-theme-bg overflow-hidden border border-theme-border/30 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-theme-accent to-red-500 rounded-full" 
                      style={{ width: `${isGhostMode || isFriendChallengeSetup ? 0 : calculateCaliber(opponent.accuracy, opponent.rank)}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Action Group with optimized vertical spacing */}
            <div className="space-y-2.5 mt-1">
              {/* Shoutout Tile (if opponent is PRO and has a status_message) */}
              {!isGhostMode && opponent && opponent.is_pro && opponent.status_message && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="max-w-xl mx-auto rounded-full border border-theme-primary/20 dark:border-amber-500/20 bg-theme-surface/95 dark:bg-gradient-to-r dark:from-amber-500/5 dark:via-theme-surface/30 dark:to-transparent backdrop-blur-md px-6 py-2 flex items-center justify-center gap-2 shadow-sm"
                >
                  <Quote size={12} className="text-theme-primary/80 dark:text-amber-400/80 shrink-0 fill-theme-primary/5 dark:fill-amber-500/5" />
                  <p className="text-xs md:text-sm tracking-wide text-theme-text/90 text-center font-normal leading-none">
                    <span className="font-bold text-theme-primary dark:text-amber-400">{opponent.full_name}</span>
                    <span className="text-theme-muted/70 font-normal mx-1">said,</span>
                    <span className="italic text-theme-text/85 font-normal">“{opponent.status_message}”</span>
                  </p>
                </motion.div>
              )}

              {/* Start Mock Action */}
              <div className="flex justify-center">
                <button
                  onClick={handleStartMock}
                  className="group relative flex items-center gap-3 px-8 py-4 bg-theme-primary text-white rounded-full font-black text-sm transition-all shadow-md shadow-theme-primary/10 hover:shadow-theme-primary/30 active:scale-95 hover:-translate-y-0.5"
                >
                  <Zap size={16} className="group-hover:scale-110 transition-transform" />
                  {isGhostMode ? 'START GHOST CHALLENGE' : 'START CHALLENGE'}
                </button>
              </div>
            </div>

            {/* Battle Gating warnings */}
            {isFriendChallengeSetup ? (
              <div className="max-w-xl mx-auto rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-theme-surface/60 to-indigo-500/10 backdrop-blur-md p-6 shadow-[0_15px_35px_-10px_rgba(139,92,246,0.15)] space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                    <Zap size={18} className="text-purple-400 fill-purple-400/20" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider font-outfit">Challenge Mode Active</h4>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest leading-none">Asynchronous Friend Duel</span>
                  </div>
                </div>
                
                <div className="space-y-2.5 text-xs text-theme-muted font-medium leading-relaxed border-t border-purple-500/20 pt-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-purple-400 shrink-0 mt-0.5">✦</span>
                    <p>Complete this 20-question mock test first to establish your benchmark score.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-purple-400 shrink-0 mt-0.5">✦</span>
                    <p>We'll generate a special "Link Magic" URL to share via WhatsApp/Telegram.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-purple-400 shrink-0 mt-0.5">✦</span>
                    <p>When your friend accepts, they tackle the identical deck of questions.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-purple-400 shrink-0 mt-0.5">✦</span>
                    <p>Wager of <strong className="text-slate-100">50 KashCoins</strong> committed. You will be notified instantly when they finish!</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-theme-surface/60 to-orange-500/10 backdrop-blur-md p-6 shadow-[0_15px_35px_-10px_rgba(245,158,11,0.15)] space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                    <Swords size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider font-outfit">Daily Battle Rules</h4>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest leading-none">Standard Mock Rules</span>
                  </div>
                </div>
                
                <div className="space-y-2.5 text-xs text-theme-muted font-medium leading-relaxed border-t border-amber-500/20 pt-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-amber-400 shrink-0 mt-0.5">✦</span>
                    <p>Standard mock consists of 20 randomized questions based on your target syllabus.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-amber-400 shrink-0 mt-0.5">✦</span>
                    <p>Scoring scheme is <strong>+1.00 Mark</strong> for correct and <strong>-0.25 Mark</strong> for incorrect answers.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-amber-400 shrink-0 mt-0.5">✦</span>
                    <p>Wager of <strong className="text-slate-100">100 KashCoins</strong> committed upon starting the mock match.</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}


        {/* ─── SCREEN 4: MOCK EXAM CHALLENGE SCREEN ─── */}
        {step === 'mock' && questions.length > 0 && (
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Left: Questions Area */}
            <div className="flex-1 space-y-6">
              
              {/* Question Header */}
              <div className="flex justify-between items-center text-xs font-black text-theme-muted uppercase tracking-widest">
                <span>MCQ {currentIdx + 1} of {questions.length}</span>
                <div className="flex items-center gap-2 bg-theme-surface border border-theme-border px-3 py-1 rounded-full shadow-inner">
                  <Clock size={14} className={mockTimeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-theme-primary'} />
                  <span className={`font-mono font-bold ${mockTimeLeft < 60 ? 'text-rose-500' : 'text-theme-text'}`}>
                    {formatTime(mockTimeLeft)}
                  </span>
                </div>
              </div>

              {/* Question Card */}
              <McqCard 
                key={questions[currentIdx].id}
                questionData={questions[currentIdx]}
                mode="exam"
                externalSelection={answers[questions[currentIdx].id] || null}
                onSelect={handleSelectOption}
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-2">
                  <button 
                    disabled={currentIdx === 0}
                    onClick={handlePrevQuestion}
                    className="px-5 py-2.5 rounded-xl border border-theme-border bg-theme-surface text-theme-text text-xs font-black uppercase tracking-wider hover:border-theme-primary/45 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    Prev
                  </button>
                  <button 
                    disabled={currentIdx === questions.length - 1}
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 rounded-xl border border-theme-border bg-theme-surface text-theme-text text-xs font-black uppercase tracking-wider hover:border-theme-primary/45 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    Next
                  </button>
                </div>

                <button
                  onClick={handleSubmitMock}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 active:scale-95"
                >
                  Submit Challenge
                </button>
              </div>
            </div>

            {/* Right: Threat Level Calibers & Question Index Grid */}
            <div className="w-full md:w-64 space-y-6 shrink-0">
              
              {/* Real-time Caliber threat indicator */}
              <div className="rounded-2xl border border-theme-border bg-theme-surface/40 p-4 space-y-4 shadow-md">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-theme-muted text-center border-b border-theme-border/20 pb-2">
                  Live Caliber Tension
                </h4>
                
                {/* User caliber status */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-black uppercase text-theme-muted">
                    <span>Your Caliber</span>
                    <span className="text-theme-primary">{userCaliber}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-theme-bg overflow-hidden">
                    <div className="h-full bg-theme-primary rounded-full" style={{ width: `${userCaliber}%` }} />
                  </div>
                </div>

                {/* Opponent caliber status */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-black uppercase text-theme-muted">
                    <span>{isGhostMode ? 'Awaiting Challenger' : opponent.full_name}</span>
                    <span className="text-theme-accent">{isGhostMode ? '---' : `${opponentCaliber}%`}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-theme-bg overflow-hidden">
                    <div className="h-full bg-theme-accent rounded-full" style={{ width: `${isGhostMode ? 0 : opponentCaliber}%` }} />
                  </div>
                </div>
              </div>

              {/* Grid Index Palette */}
              <div className="rounded-2xl border border-theme-border bg-theme-surface/40 p-4 space-y-3 shadow-md">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
                  Questions Matrix
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {questions.map((q, idx) => {
                    const ans = answers[q.id];
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={`aspect-square rounded-lg flex items-center justify-center text-xs font-black border transition-all ${
                          currentIdx === idx 
                            ? 'ring-2 ring-theme-primary ring-offset-2 ring-offset-theme-bg scale-105' 
                            : ''
                        } ${
                          ans ? 'bg-theme-primary text-white border-theme-primary/30 shadow-md shadow-theme-primary/10' : 'bg-theme-bg border-theme-border/50 text-theme-muted hover:border-theme-primary/30'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ─── SCREEN 5: REVEAL DECI-TICKING TENSION SCREEN ─── */}
        {step === 'reveal' && opponent && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center justify-center space-y-3"
          >
            {/* Ticking score scoreboard (while ticking) */}
            {isTickingActive ? (
              <div className="flex flex-col items-center justify-center space-y-8 w-full">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/15 animate-pulse">
                    GENERATING REAL-TIME EVALUATION
                  </span>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none font-outfit mt-1.5 uppercase">
                    Syncing telemetries...
                  </h1>
                </div>

                <div className="w-full max-w-md grid grid-cols-5 items-center gap-4 py-8 rounded-3xl border border-theme-border bg-theme-surface/40 backdrop-blur-md p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-theme-primary/5 via-transparent to-theme-accent/5 pointer-events-none" />
                  
                  {/* User Score card */}
                  <div className="col-span-2 flex flex-col items-center text-center space-y-2">
                    <Avatar id={economy?.avatar_id || 1} className="w-14 h-14 rounded-full border border-theme-primary" />
                    <p className="text-xs font-black text-theme-text">{economy?.full_name || 'You'}</p>
                    <div className="p-3 bg-theme-bg/60 rounded-2xl border border-theme-border/40 min-w-[80px]">
                      <span className="font-mono text-xl font-black text-theme-primary">
                        {userScore.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* VS */}
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    <Swords size={20} className="text-theme-muted" />
                  </div>

                  {/* Opponent Score card */}
                  <div className="col-span-2 flex flex-col items-center text-center space-y-2">
                    <Avatar id={isGhostMode ? 1 : opponent.avatar_id} className="w-14 h-14 rounded-full border border-theme-accent" />
                    <p className="text-xs font-black text-theme-text">{isGhostMode ? 'Awaiting Challenger' : opponent.full_name}</p>
                    <div className="p-3 bg-theme-bg/60 rounded-2xl border border-theme-border/40 min-w-[80px] flex items-center justify-center min-h-[50px]">
                      {isGhostMode ? (
                        <Clock size={16} className="text-theme-muted animate-spin" />
                      ) : (
                        <span className="font-mono text-xl font-black text-amber-500 animate-pulse">
                          {tickingScore.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs font-semibold text-theme-muted animate-pulse">
                  ⏳ Generating opponent score telemetry... Calibrating decimal snaps...
                </p>
              </div>
             ) : isEarlySubmitWaiting ? (
               /* Early Submit Pending screen (User finishes early, waiting for opponent) */
               <div className="flex flex-col items-center justify-center space-y-8 w-full">
                 <div className="text-center space-y-2">
                   <span className="text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/15 animate-pulse">
                     CHALLENGER ATTEMPTING BATTLE
                   </span>
                   <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-none font-outfit mt-1.5 uppercase text-gradient-primary">
                     Match in Progress
                   </h1>
                   <p className="text-xs sm:text-sm font-extrabold text-amber-500 italic mt-2 animate-pulse">
                     Fast isn't always smart. Pace yourself in exam mocks and avoid idle waiting.
                   </p>
                 </div>

                 {/* Bento Grid: User Card (left) + Wait Diagnostics (right) */}
                 <div className="grid grid-cols-1 md:grid-cols-5 gap-5 max-w-4xl mx-auto items-start w-full px-4">
                   
                   {/* LEFT: Live Match Card (Pending State) */}
                   <div className="md:col-span-2 flex flex-col gap-4 w-full">
                     <div
                       className={`w-full rounded-[28px] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden border transition-all duration-300 ${theme === 'dark' ? 'battle-card-glass-dark' : theme === 'sepia' ? 'battle-card-glass-sepia' : 'battle-card-glass-light'}`}
                       style={{
                         minHeight: '400px',
                         background: 'linear-gradient(145deg, rgba(var(--color-surface-rgb), 0.95) 0%, rgba(245, 158, 11, 0.05) 100%)',
                         borderColor: 'rgba(245, 158, 11, 0.35)',
                         boxShadow: '0 15px 35px -10px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255,255,255,0.06)'
                       }}
                     >
                       <div className="battle-card-sheen" />
                       
                       {/* Card Header */}
                       <div className="flex justify-between items-center relative z-10">
                         <div className="bg-theme-primary/10 border border-theme-primary/25 rounded-full px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-theme-primary select-none">
                           {economy?.target_exam === 'upsc-pre' ? 'UPSC Prelims' : economy?.target_exam === 'ssc-cgl' ? 'SSC CGL' : 'State PSC'}
                         </div>
                         <div className="bg-theme-primary/10 border border-theme-primary/25 rounded-full px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-theme-primary select-none">
                           {getISTDetails().dateStr}
                         </div>
                       </div>

                       {/* Players */}
                       <div className="relative z-10 flex-1 flex flex-col justify-center my-4 sm:my-5 space-y-4 sm:space-y-5">
                         <div className="flex items-center justify-between gap-3">
                           {/* User */}
                           <div className="flex flex-col items-center flex-1 space-y-2.5 min-w-0">
                             <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-theme-primary p-0.5 bg-theme-bg shadow-lg shrink-0">
                               <Avatar id={economy?.avatar_id || 1} className="w-full h-full rounded-full" />
                             </div>
                             <div className="text-center">
                               <div className="text-sm sm:text-base font-black text-theme-text truncate max-w-[100px] sm:max-w-[120px]">{economy?.full_name || 'You'}</div>
                               <div className="text-[10px] text-theme-muted/60 font-normal lowercase mt-0.5 truncate max-w-[100px] sm:max-w-[120px]">@{economy?.username || 'you'}</div>
                             </div>
                             <span className="font-mono text-xl sm:text-2xl font-black text-theme-primary">
                               {userScore.toFixed(2)}
                             </span>
                           </div>

                           {/* VS */}
                           <div className="flex items-center justify-center shrink-0 self-center">
                             <div className="relative w-11 h-11 sm:w-14 sm:h-14 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.35)] select-none">
                               <Swords size={24} className="text-amber-500 animate-pulse" />
                             </div>
                           </div>

                           {/* Opponent */}
                           <div className="flex flex-col items-center flex-1 space-y-2.5 min-w-0">
                             <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-theme-accent/60 p-0.5 bg-theme-bg shadow-lg relative shrink-0">
                               <Avatar id={opponent?.avatar_id || 2} className="w-full h-full rounded-full" />
                               <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                                 <Clock size={16} className="text-amber-500 animate-spin" />
                               </div>
                             </div>
                             <div className="text-center">
                               <div className="text-sm sm:text-base font-black text-theme-text truncate max-w-[100px] sm:max-w-[120px]">{opponent?.full_name}</div>
                               <div className="text-[10px] text-theme-muted/60 font-normal lowercase mt-0.5 truncate max-w-[100px] sm:max-w-[120px]">@{opponent?.full_name ? opponent.full_name.toLowerCase().replace(/\s+/g, '') : 'aspirant'}</div>
                             </div>
                             <span className="font-mono text-xl sm:text-2xl font-black text-theme-muted animate-pulse">
                               Solving...
                             </span>
                           </div>
                         </div>
                       </div>

                       {/* Bottom Status */}
                       <div className="flex items-center justify-center gap-1.5 select-none mb-1 relative z-10 text-[10px] font-black uppercase tracking-wider text-amber-500 animate-pulse">
                         <Activity size={10} className="shrink-0" />
                         SYNCING LIVE SCORE BOARDS...
                       </div>
                     </div>

                     {/* Exit Button */}
                     <button
                       onClick={() => navigate('/')}
                       className="w-full py-3 bg-theme-primary text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:opacity-95 transition-all active:scale-95 shadow-md"
                     >
                       Exit to Homepage
                     </button>
                   </div>

                   {/* RIGHT: Live Monitoring Panel */}
                   <div className="md:col-span-3 flex flex-col gap-4 w-full">
                     <div 
                       className="rounded-2xl p-5 space-y-4 relative overflow-hidden border border-theme-border/60 bg-theme-surface/40 backdrop-blur-md text-left"
                     >
                       <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                       
                       <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06] relative z-10">
                         <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                           <Activity size={16} className="animate-pulse" />
                         </div>
                         <div>
                           <h4 className="text-xs font-black text-theme-text uppercase tracking-wider leading-none">Challenger Live Status</h4>
                           <span className="text-[8px] text-theme-muted font-bold uppercase tracking-widest mt-0.5 block">PvP Battle</span>
                         </div>
                       </div>

                       <div className="space-y-3 relative z-10 text-xs font-medium text-theme-muted leading-relaxed">
                         <p>
                           Your opponent, <span className="text-theme-text font-black">{opponent?.full_name}</span>, is currently completing their arena battle.
                         </p>
                         <p>
                           To ensure competitive integrity, the final scoreboard will synchronize and reveal both players' scores simultaneously once your opponent has completed and submitted their attempt.
                         </p>
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2.5">
                          <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-amber-500 font-bold leading-normal">
                            You do not need to wait here. You can safely close this screen or go back to the homepage. The match will resolve in the background, and you'll be notified via your dashboard once the final results are locked in.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              /* Bento Dashboard (Once ticking is complete) */
              <div className="w-full space-y-3">
                
                {/* Header Outcome Title */}
                <div className="text-center space-y-2">
                  <span className={`text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full ${
                    isGhostMode 
                      ? 'bg-blue-500/10 text-blue-500 border border-blue-500/15'
                      : userScore > opponentScore 
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15' 
                      : userScore < opponentScore 
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/15' 
                      : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/15'
                  }`}>
                    {isGhostMode ? 'GHOST CHALLENGE SUBMITTED' : isFriendChallengeSetup ? 'CHALLENGE PREPARED' : currentGreeting()}
                  </span>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-none font-outfit mt-1.5 uppercase text-gradient-primary">
                    {isGhostMode ? 'Challenge Queued' : isFriendChallengeSetup ? 'Challenge Prepared!' : userScore > opponentScore ? 'Victory Earned' : userScore < opponentScore ? 'Defeated' : 'Arena Tie'}
                  </h1>
                </div>

                {/* Bento Grid: Battle Card (left) + Analytics (right) */}
                {(() => {
                  // Compute rarity for live result card — reuse same logic as history popup
                  const liveOutcome = userScore > opponentScore ? 'VICTORY' : userScore < opponentScore ? 'DEFEAT' : 'TIE';
                  const liveRarityFn = () => {
                    if (liveOutcome !== 'VICTORY') return 'common';
                    if (userScore >= 18.0) return 'legendary';
                    const uRank = userKashRank || 15;
                    const oRank = opponent?.rank || 15;
                    if (oRank < uRank - 30) return 'legendary';
                    if (userScore >= 15.0) return 'epic';
                    if (userScore > opponentScore && (userScore - opponentScore) <= 1.0) return 'clutch';
                    return 'common';
                  };
                  const liveRarity = liveRarityFn();
                  const cardThemeClass = theme === 'dark' ? 'battle-card-glass-dark' : theme === 'sepia' ? 'battle-card-glass-sepia' : 'battle-card-glass-light';
                  const rarityClass = `card-rarity-${liveRarity}`;
                  const liveUserRank = userKashRank || 15;
                  const liveOppRank = opponent?.rank || 15;
                  const netKC = payoutAmount - 100;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-5 max-w-4xl mx-auto items-start">

                      {/* ─── LEFT: Reused Collectible Battle Card ─── */}
                      <div className="md:col-span-2 flex flex-col gap-4">
                        <div
                          className={`w-full rounded-[28px] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden border transition-all duration-300 ${cardThemeClass} ${rarityClass}`}
                          style={{
                            minHeight: '400px',
                            background: liveOutcome === 'VICTORY'
                              ? 'linear-gradient(145deg, rgba(var(--color-surface-rgb), 0.95) 0%, rgba(16, 185, 129, 0.08) 100%)'
                              : liveOutcome === 'DEFEAT'
                              ? 'linear-gradient(145deg, rgba(var(--color-surface-rgb), 0.95) 0%, rgba(244, 63, 94, 0.08) 100%)'
                              : 'linear-gradient(145deg, rgba(var(--color-surface-rgb), 0.95) 0%, rgba(59, 130, 246, 0.12) 100%)',
                            borderColor: liveOutcome === 'VICTORY'
                              ? 'rgba(16, 185, 129, 0.35)'
                              : liveOutcome === 'DEFEAT'
                              ? 'rgba(244, 63, 94, 0.35)'
                              : 'rgba(59, 130, 246, 0.5)',
                            boxShadow: liveOutcome === 'VICTORY'
                              ? '0 15px 35px -10px rgba(16, 185, 129, 0.22), inset 0 1px 0 rgba(255,255,255,0.06)'
                              : liveOutcome === 'DEFEAT'
                              ? '0 15px 35px -10px rgba(244, 63, 94, 0.22), inset 0 1px 0 rgba(255,255,255,0.06)'
                              : '0 20px 40px -10px rgba(59, 130, 246, 0.35), inset 0 1px 0 rgba(255,255,255,0.06)'
                          }}
                        >
                          {/* Slowly animated theme-sensitive polish sheen */}
                          <div className="battle-card-sheen" />

                          {/* Epic/Legendary gradient border */}
                          {(liveRarity === 'epic' || liveRarity === 'legendary') && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '28px' }}>
                              <defs>
                                <linearGradient id={`live-border-grad-${liveRarity}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                  {liveRarity === 'legendary' ? (
                                    <>
                                      <stop offset="0%" stopColor="#ff0055" />
                                      <stop offset="25%" stopColor="#fbbf24" />
                                      <stop offset="50%" stopColor="#00ff66" />
                                      <stop offset="75%" stopColor="#00ffff" />
                                      <stop offset="100%" stopColor="#ff0055" />
                                    </>
                                  ) : (
                                    <>
                                      <stop offset="0%" stopColor="#c084fc" />
                                      <stop offset="100%" stopColor="#fbbf24" />
                                    </>
                                  )}
                                </linearGradient>
                              </defs>
                              <rect x="1.5" y="1.5" width="calc(100% - 3px)" height="calc(100% - 3px)" rx="26" fill="none" stroke={`url(#live-border-grad-${liveRarity})`} strokeWidth={liveRarity === 'legendary' ? 3.5 : 2.5} />
                            </svg>
                          )}

                          {/* Noise texture overlay */}
                          <div
                            className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-repeat"
                            style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\"/%3E%3C/svg%3E')" }}
                          />

                          {/* Card Header */}
                          <div className="flex justify-between items-center relative z-10">
                            <div className="bg-theme-primary/10 border border-theme-primary/25 rounded-full px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-theme-primary select-none">
                              {economy?.target_exam === 'upsc-pre' ? 'UPSC Prelims' : economy?.target_exam === 'ssc-cgl' ? 'SSC CGL' : 'State PSC'}
                            </div>
                            <div className="bg-theme-primary/10 border border-theme-primary/25 rounded-full px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-theme-primary select-none">
                              {getISTDetails().dateStr}
                            </div>
                          </div>

                          {/* Players Block — same as collectible card */}
                          <div className="relative z-10 flex-1 flex flex-col justify-center my-4 sm:my-5 space-y-4 sm:space-y-5">
                            <div className="flex items-center justify-between gap-3">

                              {/* User */}
                              <div className="flex flex-col items-center flex-1 space-y-2.5 min-w-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-theme-primary p-0.5 bg-theme-bg shadow-lg shrink-0">
                                  <Avatar id={economy?.avatar_id || 1} className="w-full h-full rounded-full" />
                                </div>
                                <div className="text-center">
                                  <div className="text-sm sm:text-base font-black text-theme-text truncate max-w-[100px] sm:max-w-[120px]">{economy?.full_name || 'You'}</div>
                                  <div className="text-[10px] text-theme-muted/60 font-normal lowercase mt-0.5 truncate max-w-[100px] sm:max-w-[120px]">@{economy?.username || 'you'}</div>
                                </div>
                                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 text-amber-500 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider select-none">
                                  <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v3c0 2.2 1.8 4 4 4h1.1c.9 2 2.8 3.5 5.1 3.9v3.1H9v2h6v-2h-4.2v-3.1c2.3-.4 4.2-1.9 5.1-3.9H17c2.2 0 4-1.8 4-4V7c0-1.1-.9-2-2-2zM7 11c-1.1 0-2-.9-2-2V7h2v4zm12-2c0 1.1-.9 2-2 2v-4h2v2z"/></svg>
                                  <span>#{liveUserRank} Rank</span>
                                </div>
                                <span className="font-mono text-xl sm:text-2xl font-black text-theme-primary">
                                  {userScore.toFixed(2)}
                                </span>
                              </div>

                              {/* Premium Golden SVG Battle Emblem */}
                              <div className="flex items-center justify-center shrink-0 self-center">
                                <div className="relative w-11 h-11 sm:w-14 sm:h-14 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.35)] select-none">
                                  <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                      <radialGradient id="liveGoldGlow" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor="rgba(245, 158, 11, 0.3)" />
                                        <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
                                      </radialGradient>
                                    </defs>
                                    <circle cx="24" cy="24" r="22" fill="url(#liveGoldGlow)" />
                                    <g transform="translate(24,24) rotate(45)">
                                      <rect x="-1" y="-15" width="2" height="22" rx="0.5" fill="#f59e0b" />
                                      <polygon points="-1,-15 1,-15 0,-19" fill="#fef3c7" />
                                      <rect x="-4.5" y="4" width="9" height="1.5" rx="0.5" fill="#d97706" />
                                      <rect x="-1" y="5.5" width="2" height="6" rx="0.5" fill="#92400e" />
                                    </g>
                                    <g transform="translate(24,24) rotate(-45)">
                                      <rect x="-1" y="-15" width="2" height="22" rx="0.5" fill="#f59e0b" />
                                      <polygon points="-1,-15 1,-15 0,-19" fill="#fef3c7" />
                                      <rect x="-4.5" y="4" width="9" height="1.5" rx="0.5" fill="#d97706" />
                                      <rect x="-1" y="5.5" width="2" height="6" rx="0.5" fill="#92400e" />
                                    </g>
                                    <polygon points="24,20 25.5,22.5 28,24 25.5,25.5 24,28 22.5,25.5 20,24 22.5,22.5" fill="#ffffff" />
                                  </svg>
                                </div>
                              </div>

                              {/* Opponent */}
                              <div className="flex flex-col items-center flex-1 space-y-2.5 min-w-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-theme-accent/60 p-0.5 bg-theme-bg shadow-lg relative shrink-0">
                                  <Avatar id={isGhostMode ? 1 : (opponent?.avatar_id || 2)} className="w-full h-full rounded-full" />
                                </div>
                                <div className="text-center">
                                  <div className="text-sm sm:text-base font-black text-theme-text truncate max-w-[100px] sm:max-w-[120px]">{isGhostMode ? 'Awaiting Challenger' : isFriendChallengeSetup ? 'Your Friend' : (opponent?.full_name || 'Opponent')}</div>
                                  <div className="text-[10px] text-theme-muted/60 font-normal lowercase mt-0.5 truncate max-w-[100px] sm:max-w-[120px]">{isGhostMode ? '@matching_soon' : isFriendChallengeSetup ? '@challenger' : `@${opponent?.full_name ? opponent.full_name.toLowerCase().replace(/\s+/g, '') : 'aspirant'}`}</div>
                                </div>
                                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 text-amber-500 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider select-none">
                                  <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v3c0 2.2 1.8 4 4 4h1.1c.9 2 2.8 3.5 5.1 3.9v3.1H9v2h6v-2h-4.2v-3.1c2.3-.4 4.2-1.9 5.1-3.9H17c2.2 0 4-1.8 4-4V7c0-1.1-.9-2-2-2zM7 11c-1.1 0-2-.9-2-2V7h2v4zm12-2c0 1.1-.9 2-2 2v-4h2v2z"/></svg>
                                  <span>{isGhostMode || isFriendChallengeSetup ? '---' : `#${liveOppRank}`} Rank</span>
                                </div>
                                <span className="font-mono text-xl sm:text-2xl font-black text-theme-primary">
                                  {isGhostMode || isFriendChallengeSetup ? '---' : opponentScore.toFixed(2)}
                                </span>
                              </div>

                            </div>

                            {/* Tilted Stamp with Glow */}
                            {!isGhostMode && (
                              <div className="flex justify-center items-center py-1.5 select-none">
                                <div
                                  className={`inline-flex items-center justify-center px-8 sm:px-10 py-2.5 sm:py-3 rounded-lg border-[3px] select-none transform -rotate-6 ${
                                    isFriendChallengeSetup
                                      ? 'border-purple-500/60 text-purple-400 bg-purple-500/5'
                                      : liveOutcome === 'VICTORY'
                                      ? 'border-emerald-500/60 text-emerald-400 bg-emerald-500/5'
                                      : liveOutcome === 'DEFEAT'
                                      ? 'border-rose-500/60 text-rose-400 bg-rose-500/5'
                                      : 'border-blue-500/60 text-blue-400 bg-blue-500/5'
                                  }`}
                                  style={{
                                    fontFamily: '"Outfit", "Impact", sans-serif',
                                    fontSize: 'clamp(18px, 5vw, 26px)',
                                    fontWeight: 900,
                                    letterSpacing: '0.28em',
                                    textTransform: 'uppercase',
                                    boxShadow: isFriendChallengeSetup
                                      ? '0 0 18px rgba(168,85,247,0.3), inset 0 0 18px rgba(168,85,247,0.07)'
                                      : liveOutcome === 'VICTORY'
                                      ? '0 0 18px rgba(16,185,129,0.3), inset 0 0 18px rgba(16,185,129,0.07)'
                                      : liveOutcome === 'DEFEAT'
                                      ? '0 0 18px rgba(244,63,94,0.3), inset 0 0 18px rgba(244,63,94,0.07)'
                                      : '0 0 18px rgba(59,130,246,0.3), inset 0 0 18px rgba(59,130,246,0.07)',
                                    filter: isFriendChallengeSetup
                                      ? 'drop-shadow(0 0 8px rgba(168,85,247,0.4))'
                                      : liveOutcome === 'VICTORY'
                                      ? 'drop-shadow(0 0 8px rgba(16,185,129,0.4))'
                                      : liveOutcome === 'DEFEAT'
                                      ? 'drop-shadow(0 0 8px rgba(244,63,94,0.4))'
                                      : 'drop-shadow(0 0 8px rgba(59,130,246,0.4))'
                                  }}
                                >
                                  {isFriendChallengeSetup ? 'PENDING' : liveOutcome}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Coin result */}
                          {isGhostMode ? (
                            <div className="flex items-center justify-center gap-1.5 select-none mb-1 relative z-10 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-theme-muted">
                              Wager counts only when opponent found
                            </div>
                          ) : isFriendChallengeSetup ? (
                            <div className="flex items-center justify-center gap-1.5 select-none mb-1 relative z-10 text-[10px] font-black uppercase tracking-wider text-purple-400">
                              Wager Stake: 50 KashCoins
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5 select-none mb-1 relative z-10">
                              <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest ${netKC >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {netKC >= 0 ? 'Won' : 'Loss'}:
                              </span>
                              <span className={`text-[11px] sm:text-[12px] font-black ${netKC >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {Math.abs(netKC)}
                              </span>
                              <KashCoinIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" glow={false} />
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-3 w-full">
                          {!isGhostMode ? (
                            <>
                              <div className="flex gap-3 w-full">
                                <button
                                  onClick={() => handleFlexShare(
                                    `I just battled in MCQKash! Scored ${userScore.toFixed(2)} points. Beat my score: ${window.location.origin}`,
                                    {
                                      outcome: liveOutcome,
                                      targetExam: economy?.target_exam,
                                      userRank: liveUserRank,
                                      opponentRank: liveOppRank,
                                      coinChange: netKC,
                                      userFullName: economy?.full_name || 'You',
                                      opponentName: opponent?.full_name || 'Opponent',
                                      userScore: userScore,
                                      opponentScore: opponentScore,
                                      date: getISTDetails().dateStr,
                                      userAvatarId: economy?.avatar_id || 1,
                                      opponentAvatarId: opponent?.avatar_id || 2
                                    }
                                  )}
                                  className={`${isFriendChallengeSetup ? 'w-full' : 'flex-1'} py-3 bg-gradient-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-theme-primary/10`}
                                >
                                  <Share2 size={14} />
                                  Flex Card
                                </button>
                                {!isFriendChallengeSetup && (
                                  <button
                                    onClick={handleChallengeShare}
                                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-indigo-500/10"
                                  >
                                    <Zap size={14} />
                                    Challenge Friend
                                  </button>
                                )}
                              </div>
                              <button
                                onClick={() => { setStep('gate'); setIsFriendChallengeSetup(false); refreshEconomy(); }}
                                className="w-full py-3 border border-theme-border bg-theme-surface text-theme-text rounded-2xl text-xs font-black uppercase tracking-wider hover:border-theme-primary transition-all flex items-center justify-center gap-2 active:scale-95"
                              >
                                Exit Arena
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => navigate('/')}
                              className="w-full py-3 bg-theme-primary text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:opacity-95 transition-all active:scale-95 shadow-md"
                            >
                              Go back to Homepage
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ─── RIGHT: Premium Analytics Panel ─── */}
                      <div className="md:col-span-3 flex flex-col gap-4">

                        {/* Share with Friend Card (High-Stakes Mode) */}
                        {isFriendChallengeSetup && (
                          <div className="bg-theme-surface/50 border border-purple-500/30 rounded-3xl p-5 shadow-[0_15px_30px_-10px_rgba(139,92,246,0.15)] relative overflow-hidden space-y-4 text-left backdrop-blur-md">
                            {/* Pulse Glow Vignette */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
                            
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shrink-0">
                                <Zap size={18} className="text-purple-400 fill-purple-400/10 animate-bounce-slow" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider leading-none">Share invitation</h4>
                                <span className="text-[8px] text-purple-400 font-black uppercase tracking-widest mt-1 block leading-none">Your Challenge is Ready</span>
                              </div>
                            </div>

                            <p className="text-xs text-theme-muted font-medium leading-relaxed">
                              Send the challenge mock invitation link to your friends. They will take the identical test deck, and your scores will duel asynchronously!
                            </p>

                            <button
                              onClick={handleChallengeShare}
                              className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:shadow-[0_8px_20px_rgba(139,92,246,0.25)] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
                            >
                              <Share2 size={14} />
                              Share with Friend
                            </button>
                          </div>
                        )}

                        {/* Wager Economics Tile (Compact version) */}
                        {!isGhostMode && !isFriendChallengeSetup && (
                          <div
                            className="rounded-2xl p-4 space-y-2.5 relative overflow-hidden text-left"
                            style={{
                              background: netKC >= 0
                                ? 'linear-gradient(135deg, rgba(16,185,129,0.07) 0%, rgba(var(--color-surface-rgb),0.6) 100%)'
                                : 'linear-gradient(135deg, rgba(244,63,94,0.07) 0%, rgba(var(--color-surface-rgb),0.6) 100%)',
                              border: netKC >= 0
                                ? '1px solid rgba(16,185,129,0.2)'
                                : '1px solid rgba(244,63,94,0.2)',
                              backdropFilter: 'blur(16px)',
                              boxShadow: netKC >= 0
                                ? '0 8px 32px -8px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.06)'
                                : '0 8px 32px -8px rgba(244,63,94,0.15), inset 0 1px 0 rgba(255,255,255,0.06)'
                            }}
                          >
                            {/* Subtle radial glow */}
                            <div
                              className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
                              style={{
                                background: netKC >= 0
                                  ? 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)'
                                  : 'radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%)',
                              }}
                            />

                            {/* Header */}
                            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06] relative z-10">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${netKC >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                                <KashCoinIcon className="w-4 h-4" glow={false} />
                              </div>
                              <div>
                                <h4 className="text-[11px] font-black text-theme-text uppercase tracking-wider leading-none">Wager Outcome</h4>
                                <span className="text-[7.5px] text-theme-muted font-bold uppercase tracking-widest mt-0.5 block leading-none">Match Economics</span>
                              </div>
                            </div>

                            {/* Stats rows */}
                            <div className="space-y-2 relative z-10">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">Wager Stake</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-black text-theme-text">100</span>
                                  <KashCoinIcon className="w-3.5 h-3.5" glow={false} />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">Winnings Credited</span>
                                <div className="flex items-center gap-1">
                                  <span className={`text-xs font-black ${netKC >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{payoutAmount}</span>
                                  <KashCoinIcon className="w-3.5 h-3.5" glow={false} />
                                </div>
                              </div>
                              <div className="h-px bg-white/[0.06]" />
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-theme-text uppercase tracking-wider">Net Outcome</span>
                                <div className="flex items-center gap-1">
                                  <span className={`text-sm font-black ${netKC >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {netKC >= 0 ? '+' : ''}{netKC}
                                  </span>
                                  <KashCoinIcon className="w-4 h-4" glow={netKC > 0} />
                                </div>
                              </div>
                            </div>

                            {/* Insurance alert */}
                            {insuranceActive && (
                              <div className="relative z-10 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-[9px] text-amber-500 font-bold flex items-center gap-1 leading-tight">
                                <Star size={11} className="shrink-0 animate-pulse text-amber-400" />
                                <span>{insuranceMessage}</span>
                              </div>
                            )}
                          </div>
                        )}



                        {/* AI X-Ray Telemetry Tile (Compact version) */}
                        {!isFriendChallengeSetup && (
                          <div
                            className="rounded-2xl p-4 flex flex-col justify-between flex-1 space-y-3 relative overflow-hidden text-left"
                            style={{
                              background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(15,18,29,0.75) 100%)',
                              border: '1px solid rgba(99,102,241,0.25)',
                              backdropFilter: 'blur(20px)',
                              boxShadow: '0 12px 40px -12px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                            }}
                          >
                            {/* Radial glow top-right */}
                            <div
                              className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
                              style={{
                                background: isGhostMode
                                  ? 'radial-gradient(circle, rgba(var(--color-primary-rgb),0.12) 0%, transparent 70%)'
                                  : netKC >= 0
                                  ? 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)'
                                  : 'radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%)'
                              }}
                            />

                            {/* Diagnostic Title */}
                            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06] relative z-10">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                isGhostMode
                                  ? 'bg-theme-primary/10 text-theme-primary'
                                  : netKC >= 0
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-rose-500/15 text-rose-400'
                              }`}>
                                <Eye size={14} />
                              </div>
                              <div>
                                <h4 className="text-[11px] font-black text-theme-text uppercase tracking-wider leading-none">AI X-Ray Telemetry</h4>
                                <span className="text-[7.5px] text-theme-muted font-bold uppercase tracking-widest mt-0.5 block leading-none">Accuracy Diagnostic</span>
                              </div>
                            </div>

                            {/* Diagnostic Content */}
                            <div className="relative z-10 flex-1">
                              {isGhostMode ? (
                                economy?.user_tier === 'Pro' ? (
                                  <div className="space-y-2.5 flex flex-col justify-center text-center py-4">
                                    <p className="text-[10px] text-theme-muted leading-relaxed font-semibold">
                                      AI X-Ray Telemetry accuracy diagnostics will calibrate once an opponent matches your queued challenge card.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-3 flex flex-col justify-between h-full">
                                    <div className="relative rounded-xl border border-rose-500/10 p-4 overflow-hidden select-none bg-rose-500/[0.02]">
                                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-theme-surface/50 backdrop-blur-[2px] p-3 text-center">
                                        <Lock size={16} className="text-amber-500 animate-pulse mb-1" />
                                        <p className="text-[9px] font-black text-theme-text uppercase tracking-wider leading-none">X-Ray Telemetry for Pro Users</p>
                                        <p className="text-[7px] text-theme-muted font-bold uppercase mt-0.5">Unlock when matched</p>
                                      </div>
                                    </div>
                                    <p className="text-[10px] font-semibold text-theme-muted leading-relaxed text-center">
                                      Upgrade to Pro to unveil comparative diagnostics once a competitor matches your card.
                                    </p>
                                    <button
                                      onClick={() => navigate('/upgrade')}
                                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/20 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md shrink-0"
                                    >
                                      <Star size={11} fill="currentColor" />
                                      UPGRADE TO PRO
                                    </button>
                                  </div>
                                )
                              ) : economy?.user_tier === 'Pro' ? (
                                <div className="space-y-2.5 flex flex-col justify-center">
                                  <p className="text-[10px] text-theme-muted leading-relaxed font-medium">
                                    Algorithmic breakdown of your 20-Question match against {opponent?.full_name}:
                                  </p>
                                  <div
                                    className="rounded-xl p-3 text-left space-y-2 bg-theme-bg/60 border border-theme-border/50"
                                  >
                                    <div className="flex items-start gap-2 text-[11px] text-theme-text font-semibold leading-normal">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                                      <div>{opponent?.full_name} dominated in <span className="text-theme-accent font-black">{xrayBreakdown.worst}</span>.</div>
                                    </div>
                                    <div className="flex items-start gap-2 text-[11px] text-theme-text font-semibold leading-normal">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5 animate-pulse" />
                                      <div>You were untouchable in <span className="text-theme-primary font-black">{xrayBreakdown.best}</span>.</div>
                                    </div>
                                  </div>
                                  <p className="text-[9px] text-theme-muted leading-snug">
                                    💡 Tip: Practice more questions under <span className="text-theme-accent font-bold">{xrayBreakdown.worst}</span> in Subject Hub to prevent close losses.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-3 flex flex-col justify-between h-full">
                                  <div className="relative rounded-xl border border-rose-500/10 p-4 overflow-hidden select-none bg-rose-500/[0.02]">
                                    <div className="filter blur-[4px] opacity-20 space-y-1.5 text-left text-[10px] font-bold leading-normal">
                                      <p>• {opponent?.full_name} dominated you in Geography with a 92% accuracy spread.</p>
                                      <p>• You were completely untouchable in Science with a +15 speed index.</p>
                                    </div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-theme-surface/50 backdrop-blur-[2px] p-3 text-center">
                                      <Lock size={16} className="text-amber-500 animate-pulse mb-1" />
                                      <p className="text-[9px] font-black text-theme-text uppercase tracking-wider leading-none">See where {opponent?.full_name} beat you.</p>
                                      <p className="text-[7px] text-theme-muted font-bold uppercase mt-0.5">Unlock X-Ray Analysis</p>
                                    </div>
                                  </div>
                                  <p className="text-[10px] font-semibold text-theme-muted leading-relaxed text-center">
                                    Unveil algorithmic diagnostic alerts of your mock challenge. Learn your critical weakness gaps to boost leaderboard standings.
                                  </p>
                                  <button
                                    onClick={() => navigate('/upgrade')}
                                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/20 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md shrink-0"
                                  >
                                    <Star size={11} fill="currentColor" />
                                    UPGRADE TO PRO
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Compact Free member scoring cap banner */}
                        {economy?.user_tier !== 'Pro' && (
                          <div 
                            className="rounded-3xl border border-amber-500/15 bg-amber-500/5 p-4 flex items-center justify-between gap-4 text-left relative overflow-hidden backdrop-blur-md shadow-sm animate-fade-in"
                          >
                            <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-full blur-lg pointer-events-none" />
                            <div className="flex items-center gap-3 relative z-10">
                              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                <Lock size={15} className="animate-pulse" />
                              </div>
                              <div>
                                <h5 className="font-black text-[10px] text-amber-500 uppercase tracking-widest leading-none">Free member scoring cap</h5>
                                <p className="text-[10px] text-theme-muted font-bold mt-1 leading-snug">
                                  Your scoring capacity was capped by <span className="text-amber-500">2.00 pts</span> due to <span className="text-amber-500">2 Pro Locked Questions</span>.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  );
                })()}

                {/* Analysis Hub Control Center */}
                <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-theme-surface to-amber-500/5 backdrop-blur-md p-6 shadow-[0_12px_40px_-20px_rgba(147,51,234,0.3)] mt-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all text-left relative z-10">
                  {/* Glow vignettes */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/5 rounded-full blur-[65px] pointer-events-none" />

                  <div className="flex items-center gap-4 relative z-10 flex-1 min-w-0">
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0 shadow-lg shadow-purple-500/10">
                      <Activity size={22} className="animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm md:text-base font-black text-theme-text uppercase tracking-wider">Analysis Hub</h4>
                      <p className="text-xs md:text-sm text-theme-muted font-bold block mt-1">
                        AI-powered mock intelligence
                      </p>
                    </div>
                  </div>

                  {/* Premium Aesthetics Button Suite */}
                  <div className="grid grid-cols-3 gap-2 w-full md:w-auto md:flex md:flex-nowrap md:gap-3 items-center relative z-10 shrink-0">
                    {/* War Room button */}
                    <button
                      onClick={() => navigate('/profile', { state: { scrollToSection: 'war-room-analytics' } })}
                      className="w-full md:w-auto px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-gradient-to-r from-rose-500 to-red-600 text-white transition-all active:scale-95 shadow-md shadow-rose-500/15 hover:shadow-rose-500/35 flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <Trophy size={11} className="text-white shrink-0" />
                      <span>War Room</span>
                    </button>

                    {/* Generate Smart Notes button */}
                    <button
                      onClick={handleGenerateCheatSheet}
                      className="w-full md:w-auto px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 text-white transition-all active:scale-95 shadow-md shadow-amber-500/15 hover:shadow-amber-500/35 flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <Sparkles size={11} className="text-white shrink-0" />
                      <span>Smart Notes</span>
                    </button>

                    {/* Generate Mock Forge button */}
                    <button
                      onClick={handleGenerateSimilarMock}
                      className="w-full md:w-auto px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-gradient-to-r from-purple-500 to-indigo-600 text-white transition-all active:scale-95 shadow-md shadow-purple-500/15 hover:shadow-purple-500/35 flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <Zap size={11} className="text-white shrink-0" />
                      <span>Mock Forge</span>
                    </button>
                  </div>
                </div>

                {/* Detailed Review Section */}
                {(() => {
                  const hasMedia = (q) => {
                    if (!q) return false;
                    const inExpl = q.explanation && (/<img|<iframe|<video/i.test(q.explanation) || /(?:^|\s|\b)(img[lrc]?|vid)\s+https?:\/\//i.test(q.explanation) || /\bhttps?:\/\/[^\s"']+\.(?:png|jpg|jpeg|gif|svg|webp)\b/i.test(q.explanation) || /youtube\.com|youtu\.be|vimeo\.com|data-video-url/i.test(q.explanation));
                    const inQuest = q.question && (/<img|<iframe|<video/i.test(q.question) || /(?:^|\s|\b)(img[lrc]?|vid)\s+https?:\/\//i.test(q.question) || /\bhttps?:\/\/[^\s"']+\.(?:png|jpg|jpeg|gif|svg|webp)\b/i.test(q.question) || /youtube\.com|youtu\.be|vimeo\.com|data-video-url/i.test(q.question));
                    return !!(inExpl || inQuest);
                  };
                  
                  const getPriorityScore = (q) => {
                    const media = hasMedia(q);
                    const isLocked = economy?.user_tier !== 'Pro' && (
                      q.difficulty?.toLowerCase() === 'hard' ||
                      (q.difficulty?.toLowerCase() === 'medium' && !media)
                    );
                    if (media) return 3;
                    if (isLocked) return 1;
                    if (q.explanation && q.explanation.trim()) return 2;
                    return 0;
                  };

                  const sortedReviewQuestions = [...questions].sort((a, b) => {
                    return getPriorityScore(b) - getPriorityScore(a);
                  });

                  const filteredQuestions = sortedReviewQuestions.filter(q => {
                    const ans = answers[q.id];
                    if (reviewFilter === 'all')       return true;
                    if (reviewFilter === 'correct')   return ans === q.correctId;
                    if (reviewFilter === 'incorrect') return ans && ans !== q.correctId;
                    if (reviewFilter === 'skipped')   return !ans;
                    return true;
                  });

                  const totalCount = questions.length;
                  const correctCountVal = questions.filter(q => answers[q.id] === q.correctId).length;
                  const incorrectCountVal = questions.filter(q => answers[q.id] && answers[q.id] !== q.correctId).length;
                  const skippedCountVal = questions.filter(q => !answers[q.id]).length;

                  return (
                    <section className="max-w-4xl mx-auto w-full mt-10 bg-theme-surface rounded-2xl border border-theme-border shadow-sm overflow-hidden relative z-10 text-left">
                      <div className="p-4 md:p-5 border-b border-theme-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-theme-surface">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center">
                            <Eye size={18} />
                          </div>
                          <h2 className="text-lg font-black text-theme-text">Detailed Review</h2>
                        </div>

                        <div className="flex bg-theme-bg p-1 rounded-lg border border-theme-border text-[10px] sm:text-xs">
                          {[
                            { key: 'all',       label: `All (${totalCount})` },
                            { key: 'correct',   label: `Correct (${correctCountVal})` },
                            { key: 'incorrect', label: `Incorrect (${incorrectCountVal})` },
                            { key: 'skipped',   label: `Skipped (${skippedCountVal})` },
                          ].map(({ key, label }) => (
                            <button
                              key={key}
                              onClick={() => setReviewFilter(key)}
                              className={`px-2.5 py-1 rounded-md font-bold transition-all whitespace-nowrap
                                ${reviewFilter === key
                                  ? key === 'correct'   ? 'bg-emerald-500/10 text-emerald-600'
                                  : key === 'incorrect' ? 'bg-rose-500/10 text-rose-600'
                                  : key === 'skipped'   ? 'bg-slate-500/10 text-slate-600'
                                  : 'bg-theme-surface shadow-sm text-theme-text'
                                  : 'text-theme-muted hover:text-theme-text'
                                }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 md:p-8 space-y-12 bg-theme-bg/50">
                        {filteredQuestions.length === 0 ? (
                          <p className="text-center text-theme-muted py-8 font-medium">
                            No questions for this filter.
                          </p>
                        ) : (
                          filteredQuestions.map((q, idx) => {
                            const userAnswer = answers[q.id];
                            const isCorrect = userAnswer === q.correctId;
                            const isSkipped = !userAnswer;
                            const originalIdx = questions.findIndex(origQ => origQ.id === q.id);
                            return (
                              <div key={q.id} className="relative">
                                <div
                                  className="absolute -top-3 left-6 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm animate-fade-in"
                                  style={{
                                    backgroundColor: isCorrect ? 'rgba(16,185,129,0.1)' : isSkipped ? 'rgba(100,116,139,0.1)' : 'rgba(244,63,94,0.1)',
                                    borderColor:     isCorrect ? 'rgba(16,185,129,0.2)' : isSkipped ? 'rgba(100,116,139,0.2)' : 'rgba(244,63,94,0.2)',
                                    color:           isCorrect ? '#10b981'               : isSkipped ? '#64748b'               : '#f43f5e',
                                  }}
                                >
                                  {isCorrect && <CheckCircle2 size={12} />}
                                  {!isCorrect && !isSkipped && <XCircle size={12} />}
                                  {isSkipped && <MinusCircle size={12} />}
                                  <span className="ml-1">
                                    Question {originalIdx + 1}: {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                                  </span>
                                </div>
                                <McqCard questionData={q} mode="result" externalSelection={userAnswer || null} />
                              </div>
                            );
                          })
                        )}
                      </div>
                    </section>
                  );
                })()}

              </div>
            )}
          </motion.div>
        )}


        {/* ─── SCREEN 6: 20/20 Genius Bot Trap Red Screen ─── */}
        {step === 'genius-trap' && opponent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-red-950 flex flex-col items-center justify-center p-6 text-center space-y-6 select-none overflow-hidden"
          >
            {/* Visual warning flash */}
            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.12)_0%,transparent_60%)] pointer-events-none animate-pulse" />
            
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] relative z-10 animate-bounce">
              <AlertTriangle size={36} />
            </div>

            <div className="space-y-3 max-w-md relative z-10">
              <h1 className="text-4xl font-extrabold tracking-tighter text-red-500 uppercase font-outfit">
                GENIUS DETECTED
              </h1>
              <p className="text-sm text-red-100 font-semibold leading-relaxed">
                "Wait... 20/20? Our algorithm thinks you're either a bot or an absolute genius. We matched {opponent.full_name} against Einstein, this seemed unfair to him. So we gave him 200 Coin from generous you."
              </p>
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest leading-none pt-2">
                Wallet Penalty: -200 KashCoins
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs relative z-10">
              <button
                onClick={() => handleFlexShare(`${economy?.full_name || 'Aspirant'} just broke MCQKash's algorithm scoring 20/20 in Battle Arena. Try to beat me: ${window.location.origin}`)}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-red-600/20"
              >
                <Share2 size={14} />
                FLEX THE ALGORITHM BREAK
              </button>

              <button
                onClick={() => {
                  setStep('gate');
                  refreshEconomy();
                }}
                className="w-full py-3 border border-red-500/30 bg-red-950 text-red-300 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-900/40 transition-all active:scale-95"
              >
                Acknowledge & Exit
              </button>
            </div>
          </motion.div>
        )}



      </main>

      {/* ─── X-RAY ANALYTICS MODAL (FOMO GENERATOR) ─── */}
      <AnimatePresence>
        {xrayOpen && opponent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setXrayOpen(false)}
              className="absolute inset-0 bg-[#05070a]/80 backdrop-filter backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="bg-theme-surface border border-theme-border rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl space-y-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-theme-primary/10 text-theme-primary flex items-center justify-center mx-auto">
                <Eye size={28} />
              </div>

              {/* Pro Content */}
              {economy?.user_tier === 'Pro' ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-theme-text uppercase tracking-tight">
                    Micro-Syllabus Analysis
                  </h3>
                  <p className="text-xs text-theme-muted font-semibold leading-relaxed">
                    Here is the algorithmic diagnostic breakdown of your 20-Question match against {opponent.full_name}:
                  </p>
                  
                  {/* Detailed strength/weakness */}
                  <div className="rounded-2xl border border-theme-border bg-theme-bg/60 p-4 text-left space-y-3">
                    <div className="flex items-start gap-2.5 text-xs text-theme-text font-semibold leading-normal">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                      <div>
                        {opponent.full_name} dominated you in <span className="text-theme-accent font-bold">{xrayBreakdown.worst}</span>.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-theme-text font-semibold leading-normal">
                      <span className="w-1.5 h-1.5 rounded-full bg-theme-primary shrink-0 mt-1.5 animate-pulse" />
                      <div>
                        {economy?.full_name || 'You'} were completely untouchable in <span className="text-theme-primary font-bold">{xrayBreakdown.best}</span>.
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-theme-muted leading-tight">
                    Tip: Target {xrayBreakdown.worst} inside **Subject Hub** to raise your overall calibration scores and prevent close losses.
                  </p>
                </div>
              ) : (
                /* Free FOMO wall content */
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-theme-text uppercase tracking-tight">
                    X-Ray Breakdown Locked
                  </h3>
                  
                  {/* Blurred Wall simulation */}
                  <div className="relative rounded-2xl border border-rose-500/10 p-5 overflow-hidden select-none bg-rose-500/[0.02]">
                    {/* Blurred block */}
                    <div className="filter blur-[5px] opacity-35 space-y-3 text-left text-xs font-bold leading-normal">
                      <p>• {opponent.full_name} dominated you in Indian Geography with a 92% speed ratio.</p>
                      <p>• You were completely untouchable in Science & Tech with a +15 accuracy index.</p>
                    </div>
                    
                    {/* Overlay prompt */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-theme-surface/60 backdrop-blur-[2px] p-4 text-center">
                      <Lock size={20} className="text-theme-accent animate-pulse mb-2" />
                      <p className="text-xs font-black text-theme-text uppercase tracking-wider leading-snug">
                        See exactly where {opponent.full_name} beat you.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-theme-muted leading-relaxed">
                    Unveil algorithmic diagnostic alerts of your mock challenge. Learn your critical weakness gaps to boost leaderboard standings.
                  </p>

                  <button
                    onClick={() => {
                      setXrayOpen(false);
                      navigate('/upgrade');
                    }}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-amber-500/20"
                  >
                    <Star size={12} fill="currentColor" />
                    UPGRADE TO PRO
                  </button>
                </div>
              )}

              <button
                onClick={() => setXrayOpen(false)}
                className="w-full py-2.5 border border-theme-border bg-theme-bg text-theme-text rounded-xl text-xs font-black uppercase tracking-wider hover:border-theme-primary/45 transition-all active:scale-95"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collectible Cards Gallery details popup */}
      <AnimatePresence>
        {selectedHistoryCard && (() => {
          const isVictory = selectedHistoryCard.outcome === 'VICTORY';
          const isDefeat  = selectedHistoryCard.outcome === 'DEFEAT';

          const isProSlayer    = isVictory && selectedHistoryCard.opponentIsPro;
          const isStreakBreaker = isVictory && selectedHistoryCard.opponentStreak >= 3;
          const userRank     = selectedHistoryCard.userRank || userKashRank || 15;
          const opponentRank = selectedHistoryCard.opponentRank || selectedHistoryCard.rank || 15;

          // ── Per-outcome palette ──────────────────────────────────────────────
          // Bold, deep coloured backgrounds — the accent is woven through every
          // element but at different opacities so it feels rich, not monochrome.
          const p = isVictory ? {
            cardBg:      'linear-gradient(160deg, #071a13 0%, #0b2e1e 50%, #061812 100%)',
            borderColor: 'rgba(52,211,153,0.45)',
            // Richer inner glow and corner blobs for premium depth
            innerGlow:   'radial-gradient(ellipse 100% 65% at 50% 0%, rgba(16,185,129,0.22) 0%, transparent 65%)',
            pillBg:      'rgba(16,185,129,0.12)',
            pillBorder:  'rgba(52,211,153,0.3)',
            pillTxt:     '#6ee7b7',
            nameTxt:     '#d1fae5',
            // Username: same tint family as name but softer — reads as a pair
            handleTxt:   '#86efac',
            userRingBg:  'rgba(16,185,129,0.22)',
            userRing:    '0 0 0 2.5px rgba(52,211,153,0.75)',
            oppRingBg:   'rgba(255,255,255,0.06)',
            oppRing:     '0 0 0 2px rgba(255,255,255,0.2)',
            scoreTxt:    '#34d399',
            scoreGlow:   'rgba(16,185,129,0.5)',
            // Rank: premium amber-gold universal across all cards
            rankBg:      'rgba(245,158,11,0.1)',
            rankBorder:  'rgba(251,191,36,0.3)',
            rankTxt:     '#fbbf24',
            stampBg:     'rgba(16,185,129,0.1)',
            stampBorder: 'rgba(52,211,153,0.6)',
            stampTxt:    '#4ade80',
            stampGlow:   '0 0 32px rgba(16,185,129,0.32), inset 0 0 24px rgba(16,185,129,0.08)',
            coinTxt:     '#34d399',
            label:       'VICTORY',
            coinSign:    selectedHistoryCard.coinChange >= 0 ? 'Won' : 'Lost',
            cornerBlob:  'rgba(16,185,129,0.10)',
          } : isDefeat ? {
            cardBg:      'linear-gradient(160deg, #180609 0%, #2a0b0e 50%, #180609 100%)',
            borderColor: 'rgba(251,113,133,0.45)',
            innerGlow:   'radial-gradient(ellipse 100% 65% at 50% 0%, rgba(244,63,94,0.22) 0%, transparent 65%)',
            pillBg:      'rgba(244,63,94,0.12)',
            pillBorder:  'rgba(251,113,133,0.3)',
            pillTxt:     '#fca5a5',
            nameTxt:     '#fee2e2',
            // Username: same rosé family as name, slightly desaturated
            handleTxt:   '#fda4af',
            userRingBg:  'rgba(244,63,94,0.22)',
            userRing:    '0 0 0 2.5px rgba(251,113,133,0.75)',
            oppRingBg:   'rgba(255,255,255,0.06)',
            oppRing:     '0 0 0 2px rgba(255,255,255,0.2)',
            scoreTxt:    '#fb7185',
            scoreGlow:   'rgba(244,63,94,0.5)',
            // Rank: same amber-gold across all cards
            rankBg:      'rgba(245,158,11,0.1)',
            rankBorder:  'rgba(251,191,36,0.3)',
            rankTxt:     '#fbbf24',
            stampBg:     'rgba(244,63,94,0.1)',
            stampBorder: 'rgba(251,113,133,0.6)',
            stampTxt:    '#f87171',
            stampGlow:   '0 0 32px rgba(244,63,94,0.32), inset 0 0 24px rgba(244,63,94,0.08)',
            coinTxt:     '#fb7185',
            label:       'DEFEAT',
            coinSign:    'Lost',
            cornerBlob:  'rgba(244,63,94,0.10)',
          } : {
            cardBg:      'linear-gradient(160deg, #060c1a 0%, #0b1830 50%, #060c1a 100%)',
            borderColor: 'rgba(96,165,250,0.45)',
            innerGlow:   'radial-gradient(ellipse 100% 65% at 50% 0%, rgba(59,130,246,0.22) 0%, transparent 65%)',
            pillBg:      'rgba(59,130,246,0.12)',
            pillBorder:  'rgba(96,165,250,0.3)',
            pillTxt:     '#93c5fd',
            nameTxt:     '#dbeafe',
            // Username: same sky-blue family as name, slightly warmer
            handleTxt:   '#7dd3fc',
            userRingBg:  'rgba(59,130,246,0.22)',
            userRing:    '0 0 0 2.5px rgba(96,165,250,0.75)',
            oppRingBg:   'rgba(255,255,255,0.06)',
            oppRing:     '0 0 0 2px rgba(255,255,255,0.2)',
            scoreTxt:    '#60a5fa',
            scoreGlow:   'rgba(59,130,246,0.5)',
            // Rank: same amber-gold across all cards
            rankBg:      'rgba(245,158,11,0.1)',
            rankBorder:  'rgba(251,191,36,0.3)',
            rankTxt:     '#fbbf24',
            stampBg:     'rgba(59,130,246,0.1)',
            stampBorder: 'rgba(96,165,250,0.6)',
            stampTxt:    '#60a5fa',
            stampGlow:   '0 0 32px rgba(59,130,246,0.32), inset 0 0 24px rgba(59,130,246,0.08)',
            coinTxt:     '#60a5fa',
            label:       'TIE',
            coinSign:    selectedHistoryCard.coinChange >= 0 ? 'Won' : 'Lost',
            cornerBlob:  'rgba(59,130,246,0.10)',
          };

          const glowClass = isVictory ? 'battle-card-glow-victory'
                          : isDefeat  ? 'battle-card-glow-defeat'
                          :             'battle-card-glow-tie';

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => handleSelectHistoryCard(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              />

              {/* Outer wrapper — wider so card fills screen */}
              <div className="relative z-10 w-full max-w-[420px] sm:max-w-[480px] md:max-w-[520px] flex flex-col items-center gap-3 sm:gap-4">

                {/* ── THE CARD ── */}
                <motion.div
                  ref={cardRef}
                  initial={{ scale: 0.88, opacity: 0, y: 28 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.88, opacity: 0, y: 28 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className={`w-full rounded-[28px] flex flex-col gap-4 sm:gap-5 relative overflow-hidden select-none ${isCardUnboxed ? glowClass : 'blur-xl animate-card-vibrate pointer-events-none'}`}
                  style={{
                    padding: '22px 24px 26px',
                    background: p.cardBg,
                    border: `1.5px solid ${p.borderColor}`,
                    // 3D depth via inset highlights + deep drop shadow
                    // The glow class only animates outer ambient shadow — no border override
                    transform: 'perspective(1200px) rotateX(2deg)',
                    transformOrigin: '50% 0%',
                  }}
                >
                  {/* Top-edge glass highlight */}
                  <div className="absolute top-0 left-[10%] right-[10%] h-px pointer-events-none z-20"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.15) 60%, transparent)' }} />

                  {/* Top radial accent haze */}
                  <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none z-0"
                    style={{ background: p.innerGlow }} />

                  {/* Corner accent blobs */}
                  <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none z-0"
                    style={{ background: p.cornerBlob, filter: 'blur(32px)' }} />
                  <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full pointer-events-none z-0"
                    style={{ background: p.cornerBlob, filter: 'blur(28px)' }} />

                  {/* Noise grain */}
                  <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.04] mix-blend-overlay"
                    style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"n\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.75\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23n)\"/%3E%3C/svg%3E')" }} />

                  {/* Sheen sweep */}
                  <div className="battle-card-sheen z-10" />

                  {/* ── HEADER ── */}
                  <div className="flex justify-between items-center relative z-10">
                    <div className="rounded-full px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider"
                      style={{ background: p.pillBg, border: `1px solid ${p.pillBorder}`, color: p.pillTxt }}>
                      {selectedHistoryCard.targetExam === 'upsc-pre' ? 'UPSC Prelims'
                        : selectedHistoryCard.targetExam === 'ssc-cgl' ? 'SSC CGL' : 'State PSC'}
                    </div>
                    <div className="rounded-full px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider"
                      style={{ background: p.pillBg, border: `1px solid ${p.pillBorder}`, color: p.pillTxt }}>
                      {selectedHistoryCard.date}
                    </div>
                  </div>

                  {/* ── PLAYERS — CSS grid guarantees perfect symmetry ── */}
                  <div className="relative z-10 grid gap-2" style={{ gridTemplateColumns: '1fr 52px 1fr' }}>

                    {/* USER */}
                    <div className="flex flex-col items-center gap-2.5 text-center">
                      <div className="rounded-full p-[3px]"
                        style={{ background: p.userRingBg, boxShadow: p.userRing }}>
                        <div className="w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] rounded-full overflow-hidden">
                          <Avatar id={selectedHistoryCard.userAvatarId || 1} className="w-full h-full" />
                        </div>
                      </div>
                      <div className="w-full px-1">
                        <div className="text-[15px] sm:text-[17px] font-black leading-tight mx-auto"
                          style={{ color: p.nameTxt }}>{selectedHistoryCard.userFullName || 'You'}</div>
                        <div className="text-[11px] sm:text-[12px] font-semibold lowercase mt-0.5 mx-auto"
                          style={{ color: p.handleTxt }}>@{economy?.username || 'you'}</div>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wide"
                        style={{ background: p.rankBg, border: `1px solid ${p.rankBorder}`, color: p.rankTxt, boxShadow: `0 0 8px rgba(245,158,11,0.12)` }}>
                        <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v3c0 2.2 1.8 4 4 4h1.1c.9 2 2.8 3.5 5.1 3.9v3.1H9v2h6v-2h-4.2v-3.1c2.3-.4 4.2-1.9 5.1-3.9H17c2.2 0 4-1.8 4-4V7c0-1.1-.9-2-2-2zM7 11c-1.1 0-2-.9-2-2V7h2v4zm12-2c0 1.1-.9 2-2 2v-4h2v2z"/></svg>
                        #{userRank}
                      </div>
                      <span className="font-mono text-[28px] sm:text-[34px] font-black tabular-nums leading-none"
                        style={{ color: p.scoreTxt, textShadow: `0 0 22px ${p.scoreGlow}` }}>
                        {selectedHistoryCard.userScore.toFixed(2)}
                      </span>
                    </div>

                    {/* VS icon */}
                    <div className="flex items-center justify-center" style={{ paddingTop: '18px' }}>
                      <div className="w-10 h-10 sm:w-12 sm:h-12" style={{ filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.6))' }}>
                        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
                          <defs><radialGradient id="vsG2"><stop offset="0%" stopColor="rgba(245,158,11,0.4)"/><stop offset="100%" stopColor="rgba(245,158,11,0)"/></radialGradient></defs>
                          <circle cx="24" cy="24" r="22" fill="url(#vsG2)"/>
                          <g transform="translate(24,24) rotate(45)">
                            <rect x="-1" y="-15" width="2" height="22" rx="0.5" fill="#f59e0b"/><polygon points="-1,-15 1,-15 0,-19" fill="#fef3c7"/>
                            <rect x="-4.5" y="4" width="9" height="1.5" rx="0.5" fill="#d97706"/><rect x="-1" y="5.5" width="2" height="6" rx="0.5" fill="#92400e"/>
                          </g>
                          <g transform="translate(24,24) rotate(-45)">
                            <rect x="-1" y="-15" width="2" height="22" rx="0.5" fill="#f59e0b"/><polygon points="-1,-15 1,-15 0,-19" fill="#fef3c7"/>
                            <rect x="-4.5" y="4" width="9" height="1.5" rx="0.5" fill="#d97706"/><rect x="-1" y="5.5" width="2" height="6" rx="0.5" fill="#92400e"/>
                          </g>
                          <polygon points="24,20 25.5,22.5 28,24 25.5,25.5 24,28 22.5,25.5 20,24 22.5,22.5" fill="#fff"/>
                        </svg>
                      </div>
                    </div>

                    {/* OPPONENT */}
                    <div className="flex flex-col items-center gap-2.5 text-center">
                      <div className="rounded-full p-[3px] relative"
                        style={{ background: p.oppRingBg, boxShadow: p.oppRing }}>
                        <div className="w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] rounded-full overflow-hidden">
                          <Avatar id={selectedHistoryCard.opponentAvatarId} className="w-full h-full" />
                        </div>
                        {selectedHistoryCard.opponentIsPro && (
                          <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white rounded-full leading-none text-[7px] p-[3px] border border-black">⭐</span>
                        )}
                      </div>
                      <div className="w-full px-1">
                        <div className="text-[15px] sm:text-[17px] font-black leading-tight mx-auto"
                          style={{ color: p.nameTxt }}>{selectedHistoryCard.opponentName}</div>
                        <div className="text-[11px] sm:text-[12px] font-semibold lowercase mt-0.5 mx-auto"
                          style={{ color: p.handleTxt }}>@{selectedHistoryCard.opponentName ? selectedHistoryCard.opponentName.toLowerCase().replace(/\s+/g,'') : 'aspirant'}</div>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wide"
                        style={{ background: p.rankBg, border: `1px solid ${p.rankBorder}`, color: p.rankTxt, boxShadow: `0 0 8px rgba(245,158,11,0.12)` }}>
                        <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v3c0 2.2 1.8 4 4 4h1.1c.9 2 2.8 3.5 5.1 3.9v3.1H9v2h6v-2h-4.2v-3.1c2.3-.4 4.2-1.9 5.1-3.9H17c2.2 0 4-1.8 4-4V7c0-1.1-.9-2-2-2zM7 11c-1.1 0-2-.9-2-2V7h2v4zm12-2c0 1.1-.9 2-2 2v-4h2v2z"/></svg>
                        #{opponentRank}
                      </div>
                      <span className="font-mono text-[28px] sm:text-[34px] font-black tabular-nums leading-none"
                        style={{ color: p.scoreTxt, textShadow: `0 0 22px ${p.scoreGlow}` }}>
                        {selectedHistoryCard.opponentScore.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* ── MICRO BADGES ── */}
                  {(isProSlayer || isStreakBreaker) && (
                    <div className="flex items-center justify-center gap-2 relative z-10 -mt-1">
                      {isProSlayer && (
                        <span className="text-[8px] sm:text-[9px] font-black px-2.5 py-1 rounded-full tracking-wider uppercase"
                          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
                          👑 Pro Slayer
                        </span>
                      )}
                      {isStreakBreaker && (
                        <span className="text-[8px] sm:text-[9px] font-black px-2.5 py-1 rounded-full tracking-wider uppercase"
                          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                          🔥 Streak Breaker
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── OUTCOME STAMP ── */}
                  <div className="relative z-10">
                    <div className="w-full rounded-xl flex items-center justify-center py-3 sm:py-3.5"
                      style={{
                        background: p.stampBg,
                        border: `2px solid ${p.stampBorder}`,
                        boxShadow: p.stampGlow,
                        color: p.stampTxt,
                        fontFamily: '"Outfit","Impact",sans-serif',
                        fontSize: 'clamp(20px, 5.5vw, 28px)',
                        fontWeight: 900,
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        textShadow: `0 0 16px ${p.stampTxt}99`,
                      }}>
                      {p.label}
                    </div>
                  </div>

                  {/* ── COIN ROW ── */}
                  <div className="flex items-center justify-center gap-2 relative z-10 -mt-1">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest"
                      style={{ color: p.coinTxt }}>{p.coinSign}:</span>
                    <span className="text-[12px] sm:text-[13px] font-black"
                      style={{ color: p.coinTxt }}>{Math.abs(selectedHistoryCard.coinChange)}</span>
                    <KashCoinIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" glow={false} />
                  </div>
                </motion.div>

                {/* ── ACTION BAR ── */}
                <div className="flex items-center justify-center gap-3 w-full relative z-20">
                  <button
                    onClick={() => handleDeleteCard(selectedHistoryCard.id)}
                    className="px-4 py-2.5 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500 hover:border-rose-500 hover:text-white text-rose-400 rounded-full transition-all flex items-center gap-1.5 active:scale-95 group"
                    title="Delete card (costs 50 KC)"
                  >
                    <Trash2 size={13} className="group-hover:rotate-12 transition-transform" />
                    <Coins size={11} className="text-amber-400" />
                    <span className="text-xs font-black text-amber-400 group-hover:text-white transition-colors">50</span>
                  </button>
                  <button
                    onClick={() => handleFlexShare(`I just got a ${selectedHistoryCard.outcome} on MCQKash Battle Arena! ${selectedHistoryCard.userScore} vs ${selectedHistoryCard.opponentScore}. Beat me: ${window.location.origin}`)}
                    className="px-4 py-2.5 bg-white/5 border border-white/15 hover:bg-white/10 hover:border-white/25 text-white/70 rounded-full transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Share2 size={13} />
                    <span className="text-xs font-black">Share</span>
                  </button>
                  <button
                    onClick={() => handleSelectHistoryCard(null)}
                    className="p-2.5 border border-white/10 bg-white/5 hover:border-rose-500/40 hover:text-rose-400 text-white/40 rounded-full transition-all flex items-center justify-center active:scale-95"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </AnimatePresence>



      {/* Challenge Mock Guidelines Modal for main view */}
      <UniversalModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Battle Mock Guidelines"
      >
        <div className="space-y-5 text-sm text-theme-text text-left leading-relaxed">
          <div className="space-y-1">
            <h4 className="font-bold text-theme-primary flex items-center gap-1.5">
              <span>📌</span> Mark for Review
            </h4>
            <p className="text-xs text-theme-muted pl-5">
              Highlights the question in purple in your navigation palette so you can review it before submitting. It has no impact on score.
            </p>
          </div>

          <div className="space-y-1 border-t border-theme-border/30 pt-3">
            <h4 className="font-bold text-amber-500 flex items-center gap-1.5">
              <span>⚡</span> 50/50 Lifeline Penalty
            </h4>
            <p className="text-xs text-theme-muted pl-5">
              Using the 50/50 lifeline costs 3 KashCoins and eliminates 2 incorrect choices. If you answer correctly using 50/50, a penalty of <strong>0.5 marks is deducted</strong> (earning +0.50 net instead of +1.00 for that question).
            </p>
          </div>

          {economy?.user_tier !== 'Pro' ? (
            <div className="space-y-2 border-t border-amber-500/20 bg-amber-500/5 p-3.5 rounded-xl mt-3">
              <h4 className="font-bold text-amber-600 flex items-center gap-1.5">
                <span>🔒</span> Free Tier Scoring Limit
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                As a Free member, this battle challenge contains <strong>2 Pro Locked MCQs</strong>. These are locked, reducing your max scoring potential by 2 points. Upgrade to Pro to unlock 100% scoring capacity!
              </p>
              <button
                onClick={() => {
                  setIsInfoModalOpen(false);
                  navigate('/upgrade');
                }}
                className="mt-1.5 w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-lg text-[10px] uppercase tracking-wider transition-all active:scale-95 text-center"
              >
                Upgrade to Pro
              </button>
            </div>
          ) : (
            <div className="space-y-1 border-t border-emerald-500/20 bg-emerald-500/5 p-3 rounded-xl mt-3 text-emerald-800 dark:text-emerald-300">
              <h4 className="font-bold flex items-center gap-1.5">
                <span>★</span> Active Pro Member
              </h4>
              <p className="text-xs">
                You have active Pro status. No scoring limits are active. All questions are fully unlocked and scoreable.
              </p>
            </div>
          )}
        </div>
      </UniversalModal>

      {/* Custom Confirmation Modal for main view */}
      <UniversalModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
      >
        <div className="space-y-5 text-center">
          <p className="text-sm text-theme-text leading-relaxed">
            {confirmModal.message}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                if (confirmModal.onConfirm) confirmModal.onConfirm();
              }}
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-rose-500/10"
            >
              {confirmModal.confirmText}
            </button>
            <button
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="px-5 py-2.5 border border-theme-border bg-theme-surface text-theme-text rounded-xl text-xs font-black uppercase tracking-wider hover:bg-theme-surface-hover transition-all active:scale-95"
            >
              {confirmModal.cancelText}
            </button>
          </div>
        </div>
      </UniversalModal>

      {/* AI Premium Features Glassmorphic Loading Overlay */}
      <AnimatePresence>
        {isAiLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0f121d]/90 border border-purple-500/20 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Glow vignette */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                <Sparkles size={26} className="text-amber-500 absolute inset-0 m-auto animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-lg text-slate-100 uppercase tracking-wider">
                  {(isFriendChallengeSetup || challengeData) && step !== 'reveal' ? "Duel Arena Setup" : "Kash AI Working"}
                </h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  {aiLoadingText || "Synthesizing intelligence features..."}
                </p>
              </div>

              <div className="pt-2">
                <span className="text-[9px] font-black uppercase tracking-widest bg-purple-500/15 text-purple-400 px-3 py-1 rounded-full border border-purple-500/20">
                  {(isFriendChallengeSetup || challengeData) && step !== 'reveal' ? "⚔️ Asynchronous Duel" : "★ Pro AI Integration"}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
