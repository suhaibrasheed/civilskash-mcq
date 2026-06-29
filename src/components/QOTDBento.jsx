import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Clock, Lock, Sparkles, Eye, RotateCw, Info, Check, ChevronRight, X } from 'lucide-react';
import { useEconomy } from '../context/EconomyContext';
import { useSound } from '../context/SoundContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ALL_STATIC_BANKS_SYNC } from '../lib/dataHub';
import { KashCoinIcon } from './EconomyUI';
import McqCard from './McqCard';
import staticExams from '../question_bank/exams.json';

// --- Helper Functions ---

const getQOTDDayString = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  const formattedStr = formatter.format(now);
  const match = formattedStr.match(/(\d+)\/(\d+)\/(\d+),\s+(\d+):(\d+):(\d+)/);
  if (!match) return { dateStr: now.toDateString(), msToNextReset: 0 };
  
  const [_, month, day, year, hour, minute, second] = match.map(Number);
  let istDate = new Date(year, month - 1, day, hour, minute, second);
  
  let qotdDate = new Date(istDate);
  if (hour < 4) {
    qotdDate.setDate(qotdDate.getDate() - 1);
  }
  
  const qotdDateStr = `${qotdDate.getFullYear()}-${String(qotdDate.getMonth() + 1).padStart(2, '0')}-${String(qotdDate.getDate()).padStart(2, '0')}`;
  
  let nextReset = new Date(istDate);
  nextReset.setHours(4, 0, 0, 0);
  if (istDate.getHours() >= 4) {
    nextReset.setDate(nextReset.getDate() + 1);
  }
  
  const msToNextReset = Math.max(0, nextReset.getTime() - istDate.getTime());
  
  return { dateStr: qotdDateStr, msToNextReset };
};

const seededRandom = (seedStr) => {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  return () => {
    hash = (hash * 9301 + 49297) % 233280;
    return Math.abs(hash) / 233280;
  };
};

export default function QOTDBento() {
  const { economy, transactKC } = useEconomy();
  const { playCorrect, playWrong, playShatter } = useSound();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const userId = user?.id || 'guest_user';
  
  const [state, setState] = useState('idle'); // 'idle', 'active', 'result', 'resolved', 'review_history'
  const [countdown, setCountdown] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [devOffset, setDevOffset] = useState(() => {
    return Number(localStorage.getItem(`mcqkash_qotd_dev_offset_${userId}`) || 0);
  });
  
  // Track database length loaded asynchronously on boot
  const [bankLength, setBankLength] = useState(0);
  
  const timerRef = useRef(null);
  const [currentQOTDDate, setCurrentQOTDDate] = useState('');

  const updateTimer = () => {
    const { dateStr, msToNextReset } = getQOTDDayString();
    setCurrentQOTDDate(dateStr);
    
    const totalSecs = Math.floor(msToNextReset / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
  };

  useEffect(() => {
    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Poll database bank length in background to catch the async loading trigger on boot
  useEffect(() => {
    const checkLength = () => {
      if (ALL_STATIC_BANKS_SYNC.length !== bankLength) {
        setBankLength(ALL_STATIC_BANKS_SYNC.length);
      }
    };
    checkLength();
    const interval = setInterval(checkLength, 250);
    return () => clearInterval(interval);
  }, [bankLength]);

  const qotdQuestion = useMemo(() => {
    if (!currentQOTDDate || ALL_STATIC_BANKS_SYNC.length === 0) return null;
    
    // First, check if there is an already solved QOTD in localStorage for today.
    const qotdKey = `mcqkash_qotd_${userId}_${currentQOTDDate}`;
    const saved = localStorage.getItem(qotdKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.questionId) {
        const solvedQ = ALL_STATIC_BANKS_SYNC.find(q => q.id === parsed.questionId);
        if (solvedQ) return solvedQ;
      }
    }
    
    const targetExamId = economy?.target_exam || 'jkssb-faa';
    const examConfig = (staticExams || []).find(e => e.id === targetExamId);
    const categoryIds = examConfig ? examConfig.categories.map(c => c.id) : [];
    
    let pool = ALL_STATIC_BANKS_SYNC;
    if (categoryIds.length > 0) {
      pool = ALL_STATIC_BANKS_SYNC.filter(q => categoryIds.includes(q.category_id));
    }
    if (pool.length === 0) {
      pool = ALL_STATIC_BANKS_SYNC;
    }
    
    const poolEasyMediumMedia = pool.filter(q => 
      ['easy', 'medium'].includes(String(q.difficulty).toLowerCase()) &&
      (q.has_media || q.image_url || q.question?.includes('<img') || q.explanation?.includes('<img'))
    );
    const poolHardExplanation = pool.filter(q => 
      String(q.difficulty).toLowerCase() === 'hard' && 
      (q.explanation || q.has_explanation)
    );
    
    const historyKey = `mcqkash_qotd_history_${userId}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    let seedOffset = devOffset;
    let selected = null;
    let attempts = 0;
    
    do {
      const seed = `${userId}-${currentQOTDDate}-${seedOffset}`;
      const rand = seededRandom(seed);
      const roll = rand();
      
      let candidate = null;
      if (roll < 0.70 && poolEasyMediumMedia.length > 0) {
        const idx = Math.floor(rand() * poolEasyMediumMedia.length);
        candidate = poolEasyMediumMedia[idx];
      } else if (poolHardExplanation.length > 0) {
        const idx = Math.floor(rand() * poolHardExplanation.length);
        candidate = poolHardExplanation[idx];
      } else {
        const idx = Math.floor(rand() * pool.length);
        candidate = pool[idx];
      }
      
      if (candidate && !history.includes(candidate.id)) {
        selected = candidate;
        break;
      }
      
      seedOffset++;
      attempts++;
    } while (attempts < 50 && pool.length > 7);
    
    if (!selected) {
      const seed = `${userId}-${currentQOTDDate}-${devOffset}`;
      const rand = seededRandom(seed);
      const roll = rand();
      if (roll < 0.70 && poolEasyMediumMedia.length > 0) {
        const idx = Math.floor(rand() * poolEasyMediumMedia.length);
        selected = poolEasyMediumMedia[idx];
      } else if (poolHardExplanation.length > 0) {
        const idx = Math.floor(rand() * poolHardExplanation.length);
        selected = poolHardExplanation[idx];
      } else {
        const idx = Math.floor(rand() * pool.length);
        selected = pool[idx];
      }
    }
    
    return selected;
  }, [currentQOTDDate, userId, economy?.target_exam, devOffset, bankLength]);

  useEffect(() => {
    if (!currentQOTDDate) return;
    
    const qotdKey = `mcqkash_qotd_${userId}_${currentQOTDDate}`;
    const saved = localStorage.getItem(qotdKey);
    
    const streakKey = `mcqkash_qotd_streak_${userId}`;
    const savedStreak = Number(localStorage.getItem(streakKey) || 0);
    setCurrentStreak(savedStreak);
    
    if (saved) {
      const parsed = JSON.parse(saved);
      setSelectedOption(parsed.selectedOption);
      setIsCorrect(parsed.isCorrect);
      setEarnedCoins(parsed.earnedCoins);
      setState('resolved');
      
      if (parsed.questionId) {
        const historyKey = `mcqkash_qotd_history_${userId}`;
        let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        if (!history.includes(parsed.questionId)) {
          history = [parsed.questionId, ...history].slice(0, 7);
          localStorage.setItem(historyKey, JSON.stringify(history));
        }
      }
    } else {
      setState('idle');
      setSelectedOption(null);
      setIsCorrect(false);
      setEarnedCoins(0);
    }
  }, [currentQOTDDate, userId, qotdQuestion]);

  const handleBetClick = async () => {
    if (!qotdQuestion) return;
    
    const coinBalance = economy?.kash_coins_balance || 0;
    if (coinBalance < 30) {
      playShatter();
      alert("Insufficient KashCoins! Complete battles or review bookmarks to earn more.");
      return;
    }
    
    const success = await transactKC(-30);
    if (!success) return;
    
    playCorrect();
    setState('active');
  };

  const handleDevReset = () => {
    const qotdKey = `mcqkash_qotd_${userId}_${currentQOTDDate}`;
    localStorage.removeItem(qotdKey);
    setState('idle');
    setSelectedOption(null);
    setIsCorrect(false);
    setEarnedCoins(0);
    
    const newOffset = devOffset + 1;
    setDevOffset(newOffset);
    localStorage.setItem(`mcqkash_qotd_dev_offset_${userId}`, String(newOffset));
  };

  const handleOptionSelect = async (optId) => {
    if (state !== 'active' || !qotdQuestion) return;
    
    setSelectedOption(optId);
    
    const optionIsCorrect = optId === qotdQuestion.correctId;
    setIsCorrect(optionIsCorrect);
    
    let coinsToAward = 0;
    if (optionIsCorrect) {
      const isPro = economy?.user_tier === 'Pro';
      coinsToAward = isPro ? 100 : 50;
      await transactKC(coinsToAward);
    }
    
    const newStreak = currentStreak + 1;
    setCurrentStreak(newStreak);
    localStorage.setItem(`mcqkash_qotd_streak_${userId}`, String(newStreak));
    
    // Save solved QOTD question ID to history (keep max 7 entries)
    const historyKey = `mcqkash_qotd_history_${userId}`;
    let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history = [qotdQuestion.id, ...history.filter(id => id !== qotdQuestion.id)].slice(0, 7);
    localStorage.setItem(historyKey, JSON.stringify(history));
    
    setEarnedCoins(coinsToAward);
    setState('result');
    
    const qotdKey = `mcqkash_qotd_${userId}_${currentQOTDDate}`;
    localStorage.setItem(qotdKey, JSON.stringify({
      questionId: qotdQuestion.id, // Lock the solved question ID in today's state configuration
      selectedOption: optId,
      isCorrect: optionIsCorrect,
      earnedCoins: coinsToAward
    }));
  };

  const handleInfoClick = () => {
    showToast("Wager 30 KashCoins to unlock today's QOTD challenge. Solve correctly to keep your daily streak and earn rewards!", "info");
  };

  // Look up actual question data for previously solved QOTDs
  const previousQOTDQuestions = useMemo(() => {
    const historyKey = `mcqkash_qotd_history_${userId}`;
    const historyIds = JSON.parse(localStorage.getItem(historyKey) || '[]');
    return historyIds
      .map(id => ALL_STATIC_BANKS_SYNC.find(q => q.id === id))
      .filter(Boolean);
  }, [userId, state]);

  // Streak tracker is hidden when answering MCQ or reviewing history
  const isFocusedMode = state === 'active' || state === 'result' || state === 'review_history';

  return (
    <div className="w-full mt-6">
      <div className={`grid grid-cols-1 ${isFocusedMode ? '' : 'md:grid-cols-10'} gap-4 items-stretch`}>
        
              {/* Tile A: The Streak Tracker */}
              {!isFocusedMode && (
                <div 
                  className="md:col-span-3 rounded-3xl p-[1.5px] transition-all duration-300 relative overflow-hidden flex flex-col justify-center items-center text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.4) 0%, rgba(251, 191, 36, 0.05) 50%, rgba(124, 58, 237, 0.25) 100%)',
                    boxShadow: '0 12px 36px -10px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <div 
                    className="rounded-[22px] p-6 w-full h-full relative z-10 flex flex-col items-center justify-center space-y-3 min-h-[140px]"
                    style={{
                      background: 'linear-gradient(145deg, rgba(13, 21, 38, 0.9) 0%, rgba(8, 12, 24, 0.96) 100%)',
                    }}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-md animate-pulse" />
                      <Flame className="w-10 h-10 text-amber-500 relative z-10 fill-amber-500/10" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-100 font-outfit uppercase tracking-wider leading-none">
                        {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-amber-400 mt-1.5 leading-none">
                        QOTD Streak
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tile B: The Action & QOTD Hub */}
              <div 
                className={`rounded-3xl p-[1.5px] transition-all duration-300 relative overflow-hidden ${isFocusedMode ? 'w-full' : 'md:col-span-7'}`}
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.4) 0%, rgba(251, 191, 36, 0.05) 50%, rgba(124, 58, 237, 0.25) 100%)',
                  boxShadow: '0 12px 36px -10px rgba(0, 0, 0, 0.5)'
                }}
              >
                {/* Glowing orbs */}
                <div className="absolute top-[-80px] right-[-80px] w-56 h-56 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

                <div 
                  className={`rounded-[22px] ${isFocusedMode ? 'p-3 sm:p-4' : 'p-6'} relative z-10 space-y-4 h-full flex flex-col justify-center`}
                  style={{
                    background: 'linear-gradient(145deg, rgba(13, 21, 38, 0.9) 0%, rgba(8, 12, 24, 0.96) 100%)',
                  }}
                >
                  <AnimatePresence mode="wait">
                    
                    {/* State 1: Ready to Play (Premium Symmetrical Design with Gold Side Line) */}
                    {state === 'idle' && (
                      <motion.div 
                        key="ready"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4 w-full"
                      >
                        <div className="flex items-center text-left">
                          {/* Vertical Premium Accent Bar */}
                          <div className="w-[5px] h-[40px] bg-gradient-to-b from-amber-400 to-yellow-600 rounded-full mr-4 flex-shrink-0" />
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                              <h3 className="text-base font-black text-slate-100 uppercase tracking-tight font-outfit">
                                Question of the Day
                              </h3>
                              
                              {/* Inline controls */}
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={handleInfoClick}
                                  title="QOTD Information"
                                  className="p-1 rounded bg-amber-500/5 hover:bg-amber-500/10 text-amber-500/60 hover:text-amber-500 border border-amber-500/10 active:scale-95 transition-all cursor-pointer"
                                >
                                  <Info size={10} />
                                </button>
                              </div>
                            </div>
                      <span className="text-[10px] font-semibold text-amber-500/80 block italic">
                        "Challenge yourself today, to sharpen memory"
                      </span>
                    </div>
                  </div>

                  {/* Bet 30 Button */}
                  <button 
                    onClick={handleBetClick}
                    className="w-fit relative group flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl overflow-hidden font-black text-xs uppercase tracking-widest text-slate-900 transition-all duration-300 hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    <span>Bet 30</span> 
                    <KashCoinIcon className="w-4 h-4 ml-0.5 animate-bounce-slow" />
                  </button>
                </motion.div>
              )}

              {/* State 2 & 3: Active Question View */}
              {(state === 'active' || state === 'result') && qotdQuestion && (
                <motion.div 
                  key="active-qotd"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 w-full"
                >
                  <div className="w-full rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                    <McqCard 
                      key={`${qotdQuestion.id}-${state}`}
                      questionData={qotdQuestion}
                      mode={state === 'result' ? 'result' : 'practice'}
                      showExplanationToggle={true}
                      externalSelection={selectedOption}
                      onSelect={handleOptionSelect}
                    />
                  </div>

                  {/* Answer Banner Section */}
                  {state === 'result' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 mt-4"
                    >
                      {isCorrect ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-500/5">
                          <span className="flex items-center gap-2">🏆 Correct Answer!</span>
                          <span className="flex items-center gap-1 font-black text-sm text-emerald-300">+{earnedCoins} <KashCoinIcon className="w-4 h-4" /></span>
                        </div>
                      ) : (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs font-bold shadow-lg shadow-rose-500/5">
                          ❌ Incorrect! Wager of 30 KC forfeited. Keep checking in daily!
                        </div>
                      )}

                      <div className="flex items-center justify-between w-full">
                        {/* Reset Clock capsule */}
                        <div className="flex items-center gap-1.5 text-[10px] text-theme-muted font-black uppercase tracking-wider bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-full w-fit">
                          <Clock size={11} className="text-amber-500" />
                          <span>Next reset in:</span>
                          <span className="text-amber-400 font-mono tracking-wider ml-0.5">{countdown}</span>
                        </div>

                        {/* Inline controls */}
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={handleInfoClick}
                            className="p-1 rounded bg-amber-500/5 hover:bg-amber-500/10 text-amber-500/60 hover:text-amber-500 border border-amber-500/10 active:scale-95 transition-all cursor-pointer"
                          >
                            <Info size={10} />
                          </button>
                        </div>
                      </div>

                      {/* Pro tier nudge */}
                      {economy?.user_tier !== 'Pro' && (
                        <div className="bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-purple-500/10 border border-purple-500/20 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="space-y-0.5">
                            <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                              <Sparkles size={11} className="text-amber-400" /> Pro Multiplier
                            </div>
                            <p className="text-xs text-slate-300">
                              Pro members earn 100 KC (+50 extra bonus) per QOTD resolve.
                            </p>
                          </div>
                          <button 
                            onClick={() => alert("Upgrade flows")}
                            className="text-[9px] font-black uppercase tracking-wider bg-purple-500 text-slate-100 px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors shadow-md shadow-purple-500/15 cursor-pointer"
                          >
                            Go Pro
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* State 4: Resolved (Premium Capsule Card Design based on Reference Image 2) */}
              {state === 'resolved' && (
                <motion.div 
                  key="resolved"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-3 w-full"
                >
                  {/* Premium Solved Green Inner Card Capsule */}
                  <div className="bg-emerald-500/10 border border-emerald-500/25 py-2.5 px-4 rounded-xl flex items-center justify-between shadow-lg shadow-emerald-500/5">
                    <div className="flex items-center gap-3">
                      {/* Green Check Circle */}
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
                        <Check size={14} className="text-emerald-400 stroke-[3]" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-black text-emerald-400 font-outfit uppercase tracking-tight">
                          Today's QOTD solved.
                        </h4>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5 leading-none">
                          Return tomorrow!
                        </p>
                      </div>
                    </div>
                    {/* Coin Reward payout text on the right */}
                    <div className="flex items-center gap-1.5 font-mono text-xs font-black text-emerald-400">
                      <span>{earnedCoins || 50}</span>
                      <KashCoinIcon className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                  </div>

                  {/* Solved controls and capsule actions row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 w-full pt-1">
                    {/* Left aligned items: Timer + Config icons */}
                    <div className="flex items-center gap-2">
                      {/* Clock Reset Time badge */}
                      <div className="flex items-center gap-1.5 text-[10px] text-theme-muted font-black uppercase tracking-wider bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
                        <Clock size={11} className="text-amber-500" />
                        <span>Reset in:</span>
                        <span className="text-amber-400 font-mono tracking-wider ml-0.5">{countdown}</span>
                      </div>

                      {/* Info button */}
                      <button 
                        onClick={handleInfoClick}
                        title="QOTD Information"
                        className="p-1.5 rounded-full bg-amber-500/5 hover:bg-amber-500/10 text-amber-500/60 hover:text-amber-500 border border-amber-500/10 active:scale-95 transition-all cursor-pointer"
                      >
                        <Info size={11} />
                      </button>
                    </div>

                    {/* Right aligned item: Review History Capsule */}
                    {previousQOTDQuestions.length > 0 && (
                      <button
                        onClick={() => setState('review_history')}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 px-3.5 py-1.5 rounded-full cursor-pointer active:scale-95 transition-all"
                      >
                        <Eye size={12} />
                        <span>Review Previous QOTD</span>
                        <ChevronRight size={11} className="text-amber-500/60" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* State 5: Review History view (Symmetrical listing with Reset Timer and close options based on mockup 3) */}
              {state === 'review_history' && (
                <motion.div 
                  key="review_history"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-4 w-full"
                >
                  {/* Top Info Banner corresponding to Image 3 Red Box */}
                  <div className={`py-3 px-4 rounded-xl text-[11px] font-bold flex items-center justify-center text-center shadow-lg ${isCorrect ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-emerald-500/5' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-rose-500/5'}`}>
                    <span>{isCorrect ? "🏆 Victory! You won today's QOTD challenge." : "❌ Defeat! You lost today's QOTD challenge. Keep practicing!"}</span>
                  </div>

                  {/* Clock Reset and close trigger row (responsive stacking on mobile) */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-1.5 text-[10px] text-theme-muted font-black uppercase tracking-wider bg-white/5 border border-white/5 px-3.5 py-1.5 rounded-full w-fit">
                      <Clock size={11} className="text-amber-500" />
                      <span>Next Reset in:</span>
                      <span className="text-amber-400 font-mono tracking-wider ml-0.5">{countdown}</span>
                    </div>

                    <button 
                      onClick={() => setState('resolved')}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 px-3.5 py-1.5 rounded-full cursor-pointer active:scale-95 transition-all w-fit"
                    >
                      <X size={11} />
                      <span>Close Review</span>
                    </button>
                  </div>

                  {/* Divider line */}
                  <div className="border-t border-white/5" />

                  {/* Scrollable feed of previous QOTDs */}
                  <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                    {previousQOTDQuestions.map((q, idx) => (
                      <div key={q.id} className="border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative bg-slate-950/20">
                        <div className="bg-white/5 px-4 py-2 border-b border-white/5 text-[9px] font-black uppercase text-amber-500 tracking-widest flex items-center justify-between">
                          <span>Previous Challenge #{idx + 1}</span>
                          <span className="text-[8px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20">{String(q.difficulty).toUpperCase()}</span>
                        </div>
                        <McqCard 
                          key={`review-item-${q.id}`}
                          questionData={q}
                          mode="result"
                          showExplanationToggle={true}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
