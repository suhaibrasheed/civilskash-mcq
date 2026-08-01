import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Clock, Lock, Sparkles, Eye, History, RotateCw, Info, Check, ChevronRight, X } from 'lucide-react';
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
  
  const nextReset = new Date(istDate);
  if (hour >= 4) {
    nextReset.setDate(nextReset.getDate() + 1);
  }
  nextReset.setHours(4, 0, 0, 0);
  
  const msToNextReset = nextReset.getTime() - istDate.getTime();
  
  const yyyy = qotdDate.getFullYear();
  const mm = String(qotdDate.getMonth() + 1).padStart(2, '0');
  const dd = String(qotdDate.getDate()).padStart(2, '0');
  
  return {
    dateStr: `${yyyy}-${mm}-${dd}`,
    msToNextReset
  };
};

const seededRandom = (seedStr) => {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return () => {
    hash = (hash * 9301 + 49297) % 233280;
    return Math.abs(hash) / 233280;
  };
};

const getSeededRandom = seededRandom;


export default function QOTDBento() {
  const navigate = useNavigate();
  const { economy, transactKC } = useEconomy();
  const { playCorrect, playWrong, playShatter } = useSound();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const userId = user?.id || 'guest_user';
  
  const [state, setState] = useState('idle'); // 'idle', 'active', 'result', 'resolved', 'review_history'
  const [isBetting, setIsBetting] = useState(false);
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
    let history = [];
    try { history = JSON.parse(localStorage.getItem(historyKey) || '[]'); } catch (e) { history = []; }
    
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

  const getYesterdayQOTDDateStr = (todayStr) => {
    const [year, month, day] = todayStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!currentQOTDDate) return;
    
    const qotdKey = `mcqkash_qotd_${userId}_${currentQOTDDate}`;
    const saved = localStorage.getItem(qotdKey);
    
    const streakKey = `mcqkash_qotd_streak_${userId}`;
    const lastSolvedKey = `mcqkash_qotd_last_solved_date_${userId}`;
    
    let savedStreak = Number(localStorage.getItem(streakKey) || 0);
    let lastSolvedDate = localStorage.getItem(lastSolvedKey);
    
    // Legacy support: if there's a streak but no lastSolvedDate, set it appropriately
    if (savedStreak > 0 && !lastSolvedDate) {
      if (saved) {
        lastSolvedDate = currentQOTDDate;
      } else {
        lastSolvedDate = getYesterdayQOTDDateStr(currentQOTDDate);
      }
      localStorage.setItem(lastSolvedKey, lastSolvedDate);
    }
    
    // Check if streak was broken (missed a day)
    if (lastSolvedDate && lastSolvedDate !== currentQOTDDate) {
      const yesterdayStr = getYesterdayQOTDDateStr(currentQOTDDate);
      if (lastSolvedDate !== yesterdayStr) {
        // User missed at least one full QOTD day, reset streak to 0
        savedStreak = 0;
        localStorage.setItem(streakKey, '0');
        localStorage.removeItem(lastSolvedKey); // Clear it so it can be re-initialized
      }
    }
    
    setCurrentStreak(savedStreak);
    
    if (saved) {
      const parsed = JSON.parse(saved);
      setSelectedOption(parsed.selectedOption);
      setIsCorrect(parsed.isCorrect);
      setEarnedCoins(parsed.earnedCoins);
      setState('resolved');
      
      if (parsed.questionId) {
        const historyKey = `mcqkash_qotd_history_${userId}`;
        let history = [];
        try { history = JSON.parse(localStorage.getItem(historyKey) || '[]'); } catch (e) { history = []; }
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
    if (!qotdQuestion || isBetting) return;
    
    const coinBalance = economy?.kash_coins_balance || 0;
    if (coinBalance < 30) {
      playShatter();
      showToast("Insufficient KashCoins! Complete battles or review bookmarks to earn more.", "error");
      return;
    }
    
    setIsBetting(true);
    playCorrect();
    showToast("30 KashCoins wagered! Today's QOTD challenge unlocked 🎯", "success");
    setState('active');

    try {
      await transactKC(-30);
    } catch (err) {
      console.warn("Failed to process QOTD wager:", err);
    } finally {
      setIsBetting(false);
    }
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
    localStorage.setItem(`mcqkash_qotd_last_solved_date_${userId}`, currentQOTDDate);
    
    // Save solved QOTD question ID to history (keep max 7 entries)
    const historyKey = `mcqkash_qotd_history_${userId}`;
    let history = [];
    try { history = JSON.parse(localStorage.getItem(historyKey) || '[]'); } catch (e) { history = []; }
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
    let historyIds = [];
    try { historyIds = JSON.parse(localStorage.getItem(historyKey) || '[]'); } catch (e) { historyIds = []; }
    return historyIds
      .map(id => ALL_STATIC_BANKS_SYNC.find(q => q.id === id))
      .filter(Boolean);
  }, [userId, state]);

  // Streak tracker is hidden when answering MCQ or reviewing history
  const isFocusedMode = state === 'active' || state === 'result' || state === 'review_history';

  return (
    <div className="w-full mt-6">
      <div className={`grid grid-cols-1 ${isFocusedMode ? '' : 'md:grid-cols-10'} gap-4 items-stretch`}>
        
              {/* Tile A: Streak Tracker */}
              {!isFocusedMode && (
                <div 
                  className="qotd-bento-tile md:col-span-3 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-center items-center text-center min-h-[140px]"
                >
                  {/* Ambient glow behind flame */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(245, 158, 11, 0.12) 0%, transparent 65%)' }} />
                  
                  <div className="relative flex items-center justify-center mb-3">
                    <div className="absolute inset-0 bg-amber-500/25 rounded-full blur-xl animate-pulse" />
                    <Flame className="w-10 h-10 text-amber-500 relative z-10" style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))' }} />
                  </div>
                  <div className="relative z-10">
                    <div className="text-2xl font-black text-theme-text font-outfit uppercase tracking-wider leading-none">
                      {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-amber-500 mt-1.5 leading-none">
                      QOTD Streak
                    </div>
                  </div>
                </div>
              )}

              {/* Tile B: The Action & QOTD Hub */}
              <div 
                className={`qotd-bento-tile rounded-3xl ${isFocusedMode ? 'p-3 sm:p-4' : 'p-6'} relative overflow-hidden flex flex-col justify-center ${isFocusedMode ? 'w-full' : 'md:col-span-7'}`}
              >
                {/* Glowing subtle accent orb */}
                <div className="absolute top-[-80px] right-[-80px] w-56 h-56 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

                <AnimatePresence mode="wait">
                  
                  {state === 'idle' && (
                    <motion.div 
                      key="ready"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4 w-full relative z-10"
                    >
                      <div className="flex items-center text-left">
                        {/* Vertical Premium Accent Bar */}
                        <div className="w-[4px] h-[38px] rounded-full mr-4 flex-shrink-0" style={{ background: 'var(--gradient-primary)' }} />
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-theme-text uppercase tracking-tight font-outfit">
                              Question of the Day
                            </h3>
                            <button 
                              onClick={handleInfoClick}
                              className="p-1 rounded-full text-theme-muted hover:text-amber-500 hover:bg-amber-500/10 active:scale-90 transition-all cursor-pointer outline-none focus:outline-none"
                              title="QOTD Information"
                            >
                              <Info size={14} />
                            </button>
                          </div>

                          <p className="text-xs text-theme-muted font-medium italic">
                            "Challenge yourself today, to sharpen memory"
                          </p>
                        </div>
                      </div>

                      {/* Action Button: BET 30 KC */}
                      <button
                        onClick={handleBetClick}
                        disabled={isBetting}
                        className="group relative flex items-center gap-2 font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl active:scale-95 transition-all duration-200 shrink-0 cursor-pointer overflow-hidden outline-none focus:outline-none disabled:opacity-70 disabled:pointer-events-none"
                        style={{
                          background: 'var(--gradient-primary)',
                          color: '#ffffff',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          boxShadow: '0 4px 16px -4px rgba(var(--color-primary), 0.45), 0 1px 0 rgba(255, 255, 255, 0.12) inset'
                        }}
                      >
                        <span>{isBetting ? "Unlocking..." : "Bet 30"}</span>
                        <KashCoinIcon className="w-4 h-4" style={{ color: 'inherit' }} />
                        <div className="absolute inset-0 bg-white/15 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                      </button>
                    </motion.div>
                  )}

                  {/* State 2: Active MCQ Challenge */}
                  {(state === 'active' || state === 'result') && qotdQuestion && (
                    <motion.div 
                      key="active"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="space-y-4 relative z-10 w-full"
                    >
                      <McqCard 
                        key={`${qotdQuestion.id}-${state}`}
                        questionData={qotdQuestion}
                        mode={state === 'result' ? 'result' : 'practice'}
                        showExplanationToggle={true}
                        externalSelection={selectedOption}
                        onSelect={handleOptionSelect}
                      />

                      {/* Answer Banner Section */}
                      {state === 'result' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3 mt-4"
                        >
                          {isCorrect ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-500/5">
                              <span className="flex items-center gap-2">Correct Answer!</span>
                              <span className="flex items-center gap-1 font-black text-sm text-emerald-600 dark:text-emerald-300">+{earnedCoins} <KashCoinIcon className="w-4 h-4" /></span>
                            </div>
                          ) : (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3.5 rounded-xl text-xs font-bold shadow-lg shadow-rose-500/5">
                              Incorrect! Wager of 30 KC forfeited. Keep checking in daily!
                            </div>
                          )}

                          <div className="flex items-center justify-between w-full">
                            {/* Reset Clock capsule */}
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-full w-fit backdrop-blur-md">
                              <Clock size={11} className="text-amber-500" />
                              <span>Next reset:</span>
                              <span className="font-mono tracking-wider ml-0.5">{countdown}</span>
                            </div>

                            {/* Inline controls */}
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={handleInfoClick}
                                className="p-1 rounded-full text-amber-500/60 hover:text-amber-500 hover:bg-amber-500/10 active:scale-90 transition-all cursor-pointer outline-none focus:outline-none"
                                title="QOTD Information"
                              >
                                <Info size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Pro tier nudge */}
                          {economy?.user_tier !== 'Pro' && (
                            <div className="bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-purple-500/10 border border-purple-500/20 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="space-y-0.5">
                                <div className="text-[10px] font-black uppercase text-amber-500 dark:text-amber-400 tracking-wider flex items-center gap-1">
                                  <Sparkles size={11} className="text-amber-500 dark:text-amber-400" /> Pro Multiplier
                                </div>
                                <p className="text-xs text-theme-muted">
                                  Pro members earn 100 KC (+50 extra bonus) per QOTD resolve.
                                </p>
                              </div>
                              <button 
                                onClick={() => navigate('/pricing')}
                                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                              >
                                Upgrade Pro
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* State 3: Already Solved Today */}
                  {state === 'resolved' && (
                    <motion.div 
                      key="solved"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3.5 relative z-10 w-full"
                    >
                      {/* Solved Banner Card */}
                      <div className="bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-emerald-500/5 backdrop-blur-md">
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
                            <Check className="w-5 h-5 text-emerald-700 dark:text-emerald-400 stroke-[3]" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tight font-outfit">
                              Today's QOTD Solved
                            </div>
                            <div className="text-[11px] text-emerald-800/90 dark:text-emerald-400/80 font-bold">
                              Streak: {currentStreak} {currentStreak === 1 ? 'day' : 'days'} preserved
                            </div>
                          </div>
                        </div>

                        {/* Reset Clock pill */}
                        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-900 dark:text-amber-400 border border-amber-500/30 px-3.5 py-1.5 rounded-full shrink-0">
                          <Clock size={12} className="text-amber-700 dark:text-amber-500" />
                          <span>Next Reset:</span>
                          <span className="font-mono font-extrabold tracking-wider ml-0.5">{countdown}</span>
                        </div>
                      </div>

                      {/* Bottom Action Bar: Centered Review button with Info Icon after it */}
                      <div className="flex items-center justify-center gap-2.5 pt-0.5">
                        {previousQOTDQuestions.length > 0 && (
                          <button
                            onClick={() => setState('review_history')}
                            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-4 py-2 rounded-xl cursor-pointer active:scale-95 transition-all shadow-sm outline-none focus:outline-none"
                          >
                            <History size={14} className="text-amber-700 dark:text-amber-500" />
                            <span>Review Previous QOTD Archive</span>
                          </button>
                        )}

                        <button 
                          onClick={handleInfoClick}
                          className="p-2 rounded-full text-amber-500/70 hover:text-amber-500 hover:bg-amber-500/10 active:scale-90 transition-all cursor-pointer shrink-0 outline-none focus:outline-none"
                          title="QOTD Information"
                        >
                          <Info size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* State 4: Review History Feed */}
                  {state === 'review_history' && (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4 relative z-10 w-full"
                    >
                      {/* Header bar for history mode */}
                      <div className="flex items-center justify-between border-b border-theme-border/50 pb-3">
                        <div className="flex items-center gap-2">
                          <History size={15} className="text-amber-500" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-theme-text font-outfit">
                            Previous QOTD Archive
                          </h4>
                        </div>
                        <button
                          onClick={() => setState('resolved')}
                          className="flex items-center gap-1 text-[10px] font-bold text-theme-muted hover:text-theme-text bg-theme-surface/50 border border-theme-border/40 hover:border-theme-border px-3 py-1 rounded-full cursor-pointer transition-all outline-none focus:outline-none"
                        >
                          <X size={12} />
                          <span>Close Review</span>
                        </button>
                      </div>

                      {/* Scrollable feed of previous QOTDs (Full width, no double borders) */}
                      <div className="space-y-6 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
                        {previousQOTDQuestions.map((q, idx) => (
                          <div key={q.id} className="space-y-1.5">
                            <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-widest text-amber-500">
                              <span>Previous Challenge #{idx + 1}</span>
                              {q.difficulty && (
                                <span className="text-[8px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20">{String(q.difficulty).toUpperCase()}</span>
                              )}
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
  );
}
