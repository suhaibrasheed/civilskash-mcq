import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, CheckCircle2, XCircle, MinusCircle,
  BarChart3, Target, Activity, LogOut, PlayCircle, Share2,
  Clock, Trophy, Award, Crown, Coins, Sparkles, Flame, Zap, Shield, ShieldCheck
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import McqCard from './McqCard';
import { saveMockStats, getSolvedMocks, updateBackgroundIntelligence, applyRevisionOutcomes, getRevisionStats, getWarRoomStats, getUserEconomy, updateUserEconomy, getAggregatedStats, logCoinEarnedFromMocks } from '../lib/db';
import { getNextUnsolvedMiniMock } from '../lib/mockEngine';
import { useEconomy } from '../context/EconomyContext';
import { useSound } from '../context/SoundContext';
import { useToast } from '../context/ToastContext';
import { KashCoinDisplay } from './EconomyUI';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { queryGenerativeAI, formatMentorResponse, stripCodeFences } from '../lib/ai';

const titleCaseSignal = (value = '') => value
  .toString()
  .replace(/[-_]/g, ' ')
  .replace(/\b\w/g, char => char.toUpperCase());

export const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

// Deterministically generate total live aspirants (40 to 65) based on mock attributes
export const getDeterministicLiveAspirants = (mockId, title) => {
  const seed = `${mockId || ''}-${title || 'Mock'}`;
  const hash = [...seed].reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
  return 40 + (Math.abs(hash) % 26); // Returns 40 to 65
};

// Bulletproof Ghost Analytics Algorithm
export function calculateRealtimeIntelligence(score, totalQuestions, timeTakenSeconds, totalLiveAspirants) {
  const scoreClamped = typeof score === 'number' && !isNaN(score) ? score : 0;
  const totalQs = typeof totalQuestions === 'number' && !isNaN(totalQuestions) && totalQuestions > 0 ? totalQuestions : 10;
  const timeSeconds = typeof timeTakenSeconds === 'number' && !isNaN(timeTakenSeconds) ? timeTakenSeconds : 300;
  const totalLive = (typeof totalLiveAspirants === 'number' && !isNaN(totalLiveAspirants) && totalLiveAspirants > 0)
    ? totalLiveAspirants
    : 50;

  const ratio = totalQs > 0 ? Math.max(0, Math.min(1, scoreClamped / totalQs)) : 0;
  
  let basePercentile;
  if (ratio >= 0.9) {
    basePercentile = 2.5 + (1.0 - ratio) * 50; // Perfect score maps to 2.5% (targets Top 1-5%)
  } else if (ratio >= 0.7) {
    basePercentile = 7.5 + (0.9 - ratio) * 75; // Top 7.5% to 22.5%
  } else if (ratio >= 0.5) {
    basePercentile = 22.5 + (0.7 - ratio) * 112.5; // Top 22.5% to 45% (50% score -> 45%)
  } else if (ratio >= 0.3) {
    basePercentile = 45.0 + (0.5 - ratio) * 150; // Top 45% to 75%
  } else {
    basePercentile = 75.0 + (0.3 - ratio) * 70; // Top 75% to 96%
  }

  const benchmarkTime = totalQs * 60;
  const timeRatio = benchmarkTime > 0 ? timeSeconds / benchmarkTime : 1;
  const clampedTimeRatio = Math.max(0.1, Math.min(2.0, timeRatio));
  
  // Fast time shifts percentile higher (better/lower percentile); slow time degrades it
  const timeAdjustment = (clampedTimeRatio - 1.0) * 4.0;
  let finalPercentile = basePercentile + timeAdjustment;
  
  finalPercentile = Math.max(0.5, Math.min(99.0, finalPercentile));
  const roundedPercentile = Math.round(finalPercentile * 10) / 10;

  const rawRank = (roundedPercentile / 100) * totalLive;
  const rank = Math.max(1, Math.min(totalLive, Math.round(rawRank)));

  const isHighScore = ratio >= 0.6;
  const avgSeconds = totalQs > 0 ? timeSeconds / totalQs : 0;
  const isFast = avgSeconds <= 45;

  const minutes = Math.floor(timeSeconds / 60);
  const seconds = Math.round(timeSeconds % 60);
  const formattedTime = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  const beatPercent = Math.round(100 - roundedPercentile);
  // How many real aspirants the user beat
  const beatCount = totalLive - rank;
  // How close to the next rank above
  const rankAbovePercent = Math.round((1 / totalLive) * 100 * 10) / 10;
  // Avg time the ghost field took (benchmark is 55s/q for the pack)
  const packAvgTime = Math.round(totalQs * 55);
  const timeDeltaSeconds = Math.abs(packAvgTime - timeSeconds);
  const timeDeltaFormatted = timeDeltaSeconds >= 60
    ? `${Math.floor(timeDeltaSeconds / 60)}m ${timeDeltaSeconds % 60}s`
    : `${timeDeltaSeconds}s`;

  // Dynamic, variable insight comments — feel real, cite live numbers
  let insightComment = "";
  let insightColor = "muted"; // "green" | "amber" | "blue" | "rose" | "muted"

  if (rank === 1) {
    insightComment = `You are number 1 out of ${totalLive} active aspirants. No one in this session came close, outrunning the entire field by ${timeDeltaFormatted}.`;
    insightColor = "green";
  } else if (isFast && isHighScore) {
    insightComment = `Your ${formattedTime} finish broke a tie with ${Math.min(5, beatCount)} aspirants at identical scores. You beat ${beatCount} of ${totalLive} because speed was your edge.`;
    insightColor = "green";
  } else if (!isFast && isHighScore && rank <= 5) {
    insightComment = `Top ${rank} accuracy in this session. Only ${rank - 1} aspirants scored higher. Being ${timeDeltaFormatted} faster would have locked number 1.`;
    insightColor = "green";
  } else if (!isFast && isHighScore) {
    insightComment = `Strong accuracy. You beat ${beatCount} aspirants but lost ${timeDeltaFormatted} compared to the pack average. Trim your review time and you jump ${Math.min(rank - 1, 8)} ranks.`;
    insightColor = "amber";
  } else if (isFast && !isHighScore && rank <= Math.round(totalLive * 0.4)) {
    insightComment = `You finished ${timeDeltaFormatted} ahead of the field average, but rushed ${Math.round((1 - ratio) * totalQs)} questions into wrong answers. Slower pace by 30 seconds yields a Top ${Math.max(1, rank - 5)} rank.`;
    insightColor = "amber";
  } else if (isFast && !isHighScore) {
    insightComment = `Quick session with ${Math.round(timeSeconds / totalQs)} seconds average per question, but accuracy cost you ${totalLive - rank} positions. Trap options caught you. Slow down by 20 seconds per question.`;
    insightColor = "rose";
  } else if (beatPercent >= 60) {
    insightComment = `You outperformed ${beatPercent}% of ${totalLive} active aspirants. Consistent performance like this compounds. Keep going.`;
    insightColor = "blue";
  } else if (beatPercent >= 35) {
    insightComment = `You beat ${beatCount} of ${totalLive} aspirants this session. The gap to the Top 25% is ${Math.round((0.75 - ratio) * totalQs * 10) / 10} marks, which is achievable next attempt.`;
    insightColor = "amber";
  } else {
    insightComment = `Rank ${rank} of ${totalLive} with ${totalLive - rank} aspirants ahead. Focus on the incorrect questions below. Recovering them moves you up 2 to 3 ranks.`;
    insightColor = "rose";
  }

  return {
    percentile: roundedPercentile,
    rank,
    totalLiveAspirants: totalLive,
    insightComment,
    insightColor,
    isFast,
    isHighScore,
    formattedTime,
    beatCount,
    beatPercent
  };
}

// Custom React Hook to manage loading state & simulate real-time leaderboards
export function useRealtimeIntelligence(score, totalQuestions, timeTakenSeconds, mockId, mockTitle) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("📡 Crunching global leaderboard data...");
  // economy is needed to check the ranks cache — must be called at hook level (Rules of Hooks)
  const { economy } = useEconomy();

  useEffect(() => {
    let active = true;

    async function init() {
      let totalLiveAspirants = getDeterministicLiveAspirants(mockId, mockTitle);

      try {
        if (isSupabaseConfigured()) {
          // Cache total aspirants count for 24 hours — it barely changes per hour
          const countCacheKey = 'mcqkash_total_aspirants_cache';
          const countCached = localStorage.getItem(countCacheKey);
          let count = null;

          // Check unified ranks cache first
          if (economy && economy.id && economy.id !== 'default_user') {
            const ranksCacheKey = `mcqkash_ranks_cache_${economy.id}`;
            const ranksCached = localStorage.getItem(ranksCacheKey);
            if (ranksCached) {
              try {
                const { totalAspirants } = JSON.parse(ranksCached);
                if (typeof totalAspirants === 'number' && totalAspirants > 0) {
                  count = totalAspirants;
                }
              } catch (e) {}
            }
          }

          if (count === null && countCached) {
            try {
              const { timestamp, value } = JSON.parse(countCached);
              if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                count = value;
              }
            } catch (e) { /* fall through */ }
          }

          if (count === null) {
            const { data: fetchedCount, error } = await supabase.rpc('get_total_aspirants_count');
            if (!error && typeof fetchedCount === 'number' && fetchedCount > 1) {
              count = fetchedCount;
              localStorage.setItem(countCacheKey, JSON.stringify({
                timestamp: Date.now(),
                value: count
              }));
            }
          }

          if (count !== null && count > 1) {
            totalLiveAspirants = count + Math.floor(Math.random() * 10);
          }
        }
      } catch (err) {
        console.warn("Could not fetch database count, using deterministic fallback:", err);
      }

      if (!active) return;

      const stats = calculateRealtimeIntelligence(score, totalQuestions, timeTakenSeconds, totalLiveAspirants);
      setData(stats);
      setIsLoading(true);

      const texts = [
        "📡 Crunching global leaderboard data...",
        "Analyzing real-time competition...",
        "Mapping performance percentiles...",
        "Syncing with active aspirants..."
      ];
      let textIdx = 0;

      const textInterval = setInterval(() => {
        textIdx = (textIdx + 1) % texts.length;
        setLoadingText(texts[textIdx]);
      }, 600);

      const delay = 1500 + Math.random() * 1000;
      const timer = setTimeout(() => {
        setIsLoading(false);
        clearInterval(textInterval);
      }, delay);

      return () => {
        clearInterval(textInterval);
        clearTimeout(timer);
      };
    }

    init();

    return () => {
      active = false;
    };
  }, [score, totalQuestions, timeTakenSeconds, mockId, mockTitle]);

  return { data, isLoading, loadingText };
}

const getRevisionPayout = (score, isPro) => {
  let basePayout = 0;
  if (score === 4) basePayout = 4;
  else if (score === 5) basePayout = 8;
  else if (score === 6) basePayout = 15;
  else if (score === 7) basePayout = 18;
  else if (score === 8) basePayout = 24;
  else if (score === 9) basePayout = 28;
  else if (score === 10) basePayout = 35;
  
  if (isPro && score >= 6) {
    return Math.round(basePayout * 1.5);
  }
  return basePayout;
};

const AnimatedCounter = ({ targetValue, duration = 1.2, delay = 0.5 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let timer = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
        setCount(Math.floor(progress * targetValue));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [targetValue, duration, delay]);

  return <span>{count}</span>;
};

const getQuestionCategory = (question = {}, fallback = 'General') => (
  question.category_id || question.categoryId || question.category || fallback || 'General'
);

const getMockCategory = (mock = {}) => mock.category || mock.categoryId || mock.examId || 'General';

const summarizeByCategory = (questions, answers, timeSpent, fallbackCategory) => {
  const stats = {};

  questions.forEach(question => {
    const category = getQuestionCategory(question, fallbackCategory);
    if (!stats[category]) {
      stats[category] = { category, total: 0, attempted: 0, correct: 0, incorrect: 0, skipped: 0, seconds: 0 };
    }

    const answer = answers[question.id];
    const wasAttempted = Boolean(answer);
    const wasCorrect = wasAttempted && answer === question.correctId;

    stats[category].total += 1;
    stats[category].seconds += timeSpent[question.id] || 0;
    if (!wasAttempted) stats[category].skipped += 1;
    else if (wasCorrect) {
      stats[category].attempted += 1;
      stats[category].correct += 1;
    } else {
      stats[category].attempted += 1;
      stats[category].incorrect += 1;
    }
  });

  return Object.values(stats).map(stat => ({
    ...stat,
    accuracy: stat.attempted > 0 ? Math.round((stat.correct / stat.attempted) * 100) : 0,
    avgSeconds: stat.total > 0 ? Math.round(stat.seconds / stat.total) : 0,
  }));
};

const summarizeByTag = (questions, answers) => {
  const stats = {};

  questions.forEach(question => {
    (question.tags || []).forEach(rawTag => {
      const tag = rawTag?.toString().trim();
      if (!tag) return;
      const key = tag.toLowerCase();
      if (!stats[key]) stats[key] = { tag, total: 0, correct: 0, incorrect: 0, skipped: 0 };

      const answer = answers[question.id];
      stats[key].total += 1;
      if (!answer) stats[key].skipped += 1;
      else if (answer === question.correctId) stats[key].correct += 1;
      else stats[key].incorrect += 1;
    });
  });

  return Object.values(stats).map(stat => ({
    ...stat,
    accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
    missRate: stat.total > 0 ? Math.round(((stat.incorrect + stat.skipped) / stat.total) * 100) : 0,
  }));
};

const pickStableInsight = (messages, seedParts) => {
  if (messages.length === 0) return '';
  const seed = seedParts.join('|');
  const hash = [...seed].reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
  return messages[Math.abs(hash) % messages.length].text;
};

const getSyntheticBaseline = (value, seedParts, spread = 9) => {
  const seed = seedParts.join('|');
  const hash = [...seed].reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
  const shift = (Math.abs(hash) % (spread * 2 + 1)) - spread;
  return Math.max(18, Math.min(92, value - shift));
};

const buildGhostMessage = ({
  questions,
  answers,
  mock,
  timeSpent,
  accuracy,
  percentage,
  correct,
  incorrect,
  skipped,
  total,
  lightningBonus,
  revisionMode,
  revisionOutcome,
  revisionStats,
  pastMocks,
  warRoomStats,
}) => {
  const attempted = correct + incorrect;
  const totalSeconds = Object.values(timeSpent).reduce((acc, curr) => acc + curr, 0);
  const avgSeconds = total > 0 ? Math.round(totalSeconds / total) : 0;
  const category = getMockCategory(mock);
  const categoryStats = summarizeByCategory(questions, answers, timeSpent, category);
  const tagStats = summarizeByTag(questions, answers);
  const messages = [];
  const add = (priority, text) => messages.push({ priority, text });
  const baselineSeed = [mock?.id || mock?.name || mock?.title || 'mock', accuracy, percentage, total, correct, incorrect, skipped];

  const bestCategory = [...categoryStats]
    .filter(stat => stat.total >= 2)
    .sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct)[0];
  const worstCategory = [...categoryStats]
    .filter(stat => stat.total >= 2)
    .sort((a, b) => a.accuracy - b.accuracy || b.incorrect - a.incorrect)[0];
  const costlyTag = [...tagStats]
    .filter(stat => stat.total >= 2 && stat.incorrect + stat.skipped > 0)
    .sort((a, b) => b.missRate - a.missRate || b.total - a.total)[0];
  const cleanTag = [...tagStats]
    .filter(stat => stat.total >= 2 && stat.incorrect === 0 && stat.skipped === 0)
    .sort((a, b) => b.total - a.total)[0];

  const previousMocks = Array.isArray(pastMocks)
    ? pastMocks.filter(stat => {
      const sameCategory = stat.category === category || stat.categoryId === category || stat.examId === category;
      return sameCategory && stat.mockId !== mock?.id;
    })
    : [];
  const prevMock = previousMocks[previousMocks.length - 1];

  if (prevMock && prevMock.total > 0) {
    const prevAcc = Math.round((prevMock.correct / Math.max(1, prevMock.attempted || prevMock.total)) * 100) || 0;
    const accDiff = accuracy - prevAcc;
    if (accDiff >= 8) add(98, `Your ${titleCaseSignal(category)} accuracy improved by ${accDiff}% compared with your previous performance. You reached ${accuracy}% accuracy today, so this mock shows real progress, not just another attempt.`);
    else if (accDiff <= -8) add(98, `Your ${titleCaseSignal(category)} accuracy dropped by ${Math.abs(accDiff)}% compared with your previous performance. Focus on the questions you rushed or guessed before trying to increase speed.`);
    else add(76, `${titleCaseSignal(category)} is almost unchanged from your last attempt: ${accuracy}% now vs ${prevAcc}% before. That usually means the same type of mistakes are repeating, so review the wrong answers before starting another mock.`);

    const prevTime = Object.values(prevMock.timeSpent || {}).reduce((acc, curr) => acc + curr, 0);
    const prevAvgTime = prevTime > 0 ? prevTime / Math.max(1, prevMock.total) : 0;
    if (prevAvgTime > 0 && avgSeconds > 0) {
      const timeDiffPct = Math.round(((prevAvgTime - avgSeconds) / prevAvgTime) * 100);
      if (timeDiffPct >= 12 && accuracy >= prevAcc - 3) add(92, `You answered ${timeDiffPct}% faster per question than your previous ${titleCaseSignal(category)} attempt without losing accuracy. That is the exact speed gain exam mocks are supposed to create.`);
      else if (timeDiffPct <= -12) add(84, `You spent ${Math.abs(timeDiffPct)}% more time per question than your previous attempt. If that extra time did not improve accuracy, it is hesitation, not strategy.`);
    }
  } else {
    const expectedAccuracy = getSyntheticBaseline(accuracy, baselineSeed, 8);
    const diff = accuracy - expectedAccuracy;
    if (Math.abs(diff) >= 5) {
      add(82, `Your ${titleCaseSignal(category)} accuracy is ${Math.abs(diff)}% ${diff > 0 ? 'better' : 'lower'} than your current practice trend. Today you scored ${accuracy}% accuracy, so the system will watch your next mock to confirm whether this is becoming your new level.`);
    }
  }

  if (worstCategory && worstCategory.accuracy <= 50) {
    add(96, `${titleCaseSignal(worstCategory.category)} was your weakest Category today: ${worstCategory.incorrect + worstCategory.skipped}/${worstCategory.total} questions were missed or skipped. Start revision there first, because it pulled your score down the most.`);
  }
  if (bestCategory && bestCategory.accuracy >= 80) {
    add(88, `${titleCaseSignal(bestCategory.category)} was your strongest Category: ${bestCategory.correct}/${bestCategory.total} correct. Keep it warm with quick revision, but spend deeper study time on weaker areas.`);
  }
  if (costlyTag && costlyTag.missRate >= 50) {
    add(94, `${costlyTag.tag} looks like your weakest Topic in this mock: ${costlyTag.incorrect + costlyTag.skipped}/${costlyTag.total} were missed or skipped. Add this Topic to your next revision session first.`);
  }
  if (cleanTag) {
    add(78, `${cleanTag.tag} was your cleanest Topic today: ${cleanTag.correct}/${cleanTag.total} correct. This is the kind of Topic you should revise fast, not deeply, before the next mock.`);
  }

  if (avgSeconds > 0) {
    if (avgSeconds <= 35 && accuracy >= 75) add(90, `You were fast and accurate: ${avgSeconds}s per question with ${accuracy}% accuracy. That means your recall was active, not just lucky guessing.`);
    else if (avgSeconds <= 35 && accuracy < 60) add(88, `You moved quickly at ${avgSeconds}s per question, but ${accuracy}% accuracy shows speed was costing marks. Slow down on statement-based questions and protect yourself from negative marking.`);
    else if (avgSeconds >= 90 && accuracy >= 75) add(80, `You used extra time well: ${avgSeconds}s per question with ${accuracy}% accuracy. Good for learning mode, but full mocks will need the same accuracy with tighter timing.`);
    else if (avgSeconds >= 90 && accuracy < 60) add(90, `You spent ${avgSeconds}s per question but accuracy stayed at ${accuracy}%. That tells the system this was a concept problem, not a time-management problem.`);
  }

  if (skipped >= Math.max(2, Math.ceil(total * 0.25))) add(86, `You skipped ${skipped}/${total} questions, which shows uncertainty in this mock. Next time, attempt the borderline questions after eliminating two options so the system can map your weak areas better.`);
  if (incorrect >= Math.max(3, correct)) add(90, `Wrong answers were higher than correct answers today: ${incorrect} wrong vs ${correct} correct. Negative marking reduced your score, so controlled guessing is your next improvement area.`);
  if (percentage >= 75 && incorrect <= 1) add(92, `Excellent control: ${percentage}% score with only ${incorrect} wrong answer. The best part is that you avoided careless mistakes while keeping the score high.`);
  if (percentage < 40 && attempted > 0) {
    const focusTopic = costlyTag?.tag || worstCategory?.category || titleCaseSignal(category);
    add(92, `${percentage}% score shows this mock exposed a clear weak area, especially around ${titleCaseSignal(focusTopic)}. Do one focused revision pass there before attempting another random mock.`);
  }

  if (revisionMode === 'srs' && revisionOutcome.promoted > 0) {
    const bestInterval = Math.max(...Object.keys(revisionOutcome.promotedToCounts).map(Number));
    add(91, `${revisionOutcome.promoted} revision questions moved deeper into memory. Your longest promoted interval now reaches ${bestInterval} days, which means retention is improving.`);
  }
  if (revisionMode === 'resurrection') {
    if (revisionOutcome.promoted > 0) add(98, `${revisionOutcome.promoted}/${total} old mistakes were fixed and moved into spaced revision. That means this resurrection mock converted weak memory into usable recall.`);
    if (revisionOutcome.resurrected > 0) add(89, `${revisionOutcome.resurrected} old mistakes are still repeating. These are now priority Topics for your next revision cycle.`);
  } else if (revisionOutcome.resurrected > 0 && revisionOutcome.resurrected >= Math.ceil(total * 0.3)) {
    add(72, `${revisionOutcome.resurrected} MCQs from this mock were moved into resurrection. That is not a loss; it gives your next revision session exact targets.`);
  }

  const heatedWarTag = [...(warRoomStats?.tags || [])]
    .filter(tag => tag.incorrectCount > 0)
    .sort((a, b) => (b.incorrectCount / Math.max(1, b.correctCount + b.incorrectCount)) - (a.incorrectCount / Math.max(1, a.correctCount + a.incorrectCount)))[0];
  if (heatedWarTag && !costlyTag) {
    add(58, `Long-term weakness detected: ${titleCaseSignal(heatedWarTag.tagId)} is still one of your risky Topics. Today's mock did not fully clear that weakness.`);
  }
  if (revisionStats?.resurrectedThisWeek > 0 && revisionMode === 'resurrection') {
    add(70, `${revisionStats.resurrectedThisWeek} mistakes were revised through resurrection this week. Your weak areas are becoming visible and trackable instead of hidden.`);
  }

  if (messages.length === 0) {
    if (accuracy >= 90) add(50, `Elite precision: ${accuracy}% accuracy with very little error noise. Keep this pace and use review only for the few questions that broke concentration.`);
    else if (accuracy < 50) add(50, `${accuracy}% accuracy points to concept gaps, not just silly mistakes. Review the weakest Topic first, then retry a small mock.`);
    else if (lightningBonus > 0) add(50, `Rapid execution detected. The clock was in your favor today, so the next upgrade is improving accuracy without losing speed.`);
    else add(50, `You finished with ${accuracy}% accuracy, which gives a useful starting level. The next mock will show whether this performance is becoming consistent.`);
  }

  const topPriority = Math.max(...messages.map(message => message.priority));
  const finalists = messages.filter(message => message.priority >= topPriority - 12);
  return pickStableInsight(finalists, [
    mock?.id || mock?.name || mock?.title || 'mock',
    new Date().toDateString(),
    accuracy,
    percentage,
    correct,
    incorrect,
    skipped,
    avgSeconds,
    revisionMode,
  ]);
};

export default function ResultDashboard({ questions: rawQuestions, answers: rawAnswers, mock, timeSpent: rawTimeSpent = {}, used5050: rawUsed5050 = {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [filter, setFilter] = useState('all');
  const [nextMock, setNextMock] = useState(null);
  const [insightsReady, setInsightsReady] = useState(false);
  const hasSaved = useRef(false);
  
  const { economy, transactKC, completeDailyStreak, refreshEconomy, setAiSettingsOpen, openProUpsell } = useEconomy();
  const { playVictory, playShatter } = useSound();
  const { showToast } = useToast();
  const [earnings, setEarnings] = useState(null);
  const [ghostMessage, setGhostMessage] = useState("");
  const [revisionSummary, setRevisionSummary] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiLoadingText, setAiLoadingText] = useState('');

  // Unpack / restore dynamically locked questions if user is Pro
  const isProUser = economy?.user_tier === 'Pro';
  const { questions, answers, timeSpent, used5050 } = React.useMemo(() => {
    if (!isProUser) {
      return { 
        questions: rawQuestions, 
        answers: rawAnswers,
        timeSpent: rawTimeSpent,
        used5050: rawUsed5050
      };
    }
    
    const unpacked = [];
    const normAnswers = { ...rawAnswers };
    const normTimeSpent = { ...rawTimeSpent };
    const normUsed5050 = { ...rawUsed5050 };
    
    rawQuestions.forEach(q => {
      if (q && q.isLockedDummy && q.lockedQuestion) {
        const original = q.lockedQuestion;
        unpacked.push(original);
        if (rawAnswers[q.id] !== undefined) {
          normAnswers[original.id] = rawAnswers[q.id];
        }
        if (rawTimeSpent[q.id] !== undefined) {
          normTimeSpent[original.id] = rawTimeSpent[q.id];
        }
        if (rawUsed5050[q.id] !== undefined) {
          normUsed5050[original.id] = rawUsed5050[q.id];
        }
      } else {
        unpacked.push(q);
      }
    });
    
    return { 
      questions: unpacked, 
      answers: normAnswers,
      timeSpent: normTimeSpent,
      used5050: normUsed5050
    };
  }, [rawQuestions, rawAnswers, rawTimeSpent, rawUsed5050, isProUser]);
 
  // ── Score Calculations ───────────────────────────────────────────
  const total = questions.length;
  let correct = 0, incorrect = 0, skipped = 0;
  let fiftyFiftyDeductionsCount = 0;
  const fiftyFiftyTotalCount = used5050 ? Object.values(used5050).filter(Boolean).length : 0;
  questions.forEach(q => {
    const ans = answers[q.id];
    if (!ans) skipped++;
    else if (ans === q.correctId) {
      correct++;
      if (used5050 && used5050[q.id]) {
        fiftyFiftyDeductionsCount++;
      }
    }
    else incorrect++;
  });
 
  const attempted  = correct + incorrect;
  const score      = correct - incorrect * 0.25 - fiftyFiftyDeductionsCount * 0.50;
  const maxScore   = total;
  const accuracy   = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const percentage = Math.max(0, Math.round((score / maxScore) * 100));
  const isGoodMock = percentage >= 40;
  const isRevision = mock?.type === 'resurrection' || mock?.type === 'srs' || mock?.type === 'mastery' || mock?.type === 'srs-mastery';
  const hideRealtimeIntelligence = isRevision || mock?.type === 'smart-mock';

  const totalSeconds = Object.values(timeSpent).reduce((acc, curr) => acc + curr, 0);
  const { data: rtData, isLoading: rtLoading, loadingText: rtLoadingText } = useRealtimeIntelligence(
    score,
    total,
    totalSeconds,
    mock?.id,
    mock?.title || mock?.name
  );

  // ── Save stats + find next mock on mount ────────────────────────
  useEffect(() => {
    if (hasSaved.current) return;
    hasSaved.current = true;

    const run = async () => {
      if (percentage > 50) {
        playVictory();
      } else {
        playShatter();
      }

      let hasBeenSolvedBefore = false;
      let previousBestPct = 0;
      try {
        const previousMocks = await getSolvedMocks();
        const previousAttempts = (previousMocks || []).filter(r => r.mockId === mock?.id || r.id === mock?.id);
        hasBeenSolvedBefore = previousAttempts.length > 0;
        if (hasBeenSolvedBefore) {
          previousBestPct = Math.max(...previousAttempts.map(r => Number(r.percentage || 0)));
        }
      } catch (err) {
        console.warn('Failed to retrieve mock history:', err);
      }

      try {
        const failedQuestions = questions.filter(q => {
          const ans = answers[q.id];
          return !ans || ans !== q.correctId;
        });
        const correctQuestionIds = questions
          .filter(q => answers[q.id] === q.correctId)
          .map(q => q.id);

        await saveMockStats({
          title:     mock?.name || mock?.title || 'Quick Mock',
          mockId:    mock?.id,
          category:  getMockCategory(mock),
          correct, incorrect, skipped,
          total, attempted, score, accuracy, percentage,
          failedQuestions, correctQuestionIds, timeSpent,
          questions, // Save the entire question list for Retake capability!
        });

        // Recalculate and sync overall user accuracy to database
        try {
          const aggregated = await getAggregatedStats();
          if (economy?.id && economy.id !== 'default_user') {
            // Defer accuracy sync to local storage queue
            localStorage.setItem(`mcqkash_pending_accuracy_${economy.id}`, String(aggregated.accuracyRate));
          }
        } catch (err) {
          console.error('Failed to recalculate/defer overall accuracy:', err);
        }

        const revisionMode = mock?.type === 'resurrection'
          ? 'resurrection'
          : mock?.type === 'srs'
          ? 'srs'
          : mock?.type === 'mastery' || mock?.type === 'srs-mastery'
          ? 'mastery'
          : 'normal';
        const revisionOutcome = await applyRevisionOutcomes({ questions, answers, mode: revisionMode });
        setRevisionSummary(revisionOutcome);

        const solvedMap = await getSolvedMocks();
        const next = getNextUnsolvedMiniMock(mock, solvedMap);
        setNextMock(next);

        // Phase 4: Track 2 - Background Refinement
        // We run the deep updates without blocking the main UI thread immediately.
        setTimeout(async () => {
          try {
            await updateBackgroundIntelligence({ questions, answers, timeSpent });
            setInsightsReady(true);
          } catch (err) {
            console.error('Background Intelligence failed:', err);
          }
        }, 100);

        // --- Phase 3 & 4: Earning Engine & Streak Completion ---
        if (economy) {
          await completeDailyStreak(); // Mark streak complete for the day
          
          let totalEarned = 0;
          let isRevision = mock?.type === 'resurrection' || mock?.type === 'srs' || mock?.type === 'mastery' || mock?.type === 'srs-mastery';
          
          let baseEarned = 0;
          let sniperBonus = 0;
          let lightningBonus = 0;
          let isPro = economy.user_tier === 'Pro';
          let wagered = 0;
          let powerSurgeMultiplier = 1.0;
          let powerSurgeBonus = 0;
          
          const todayStr = new Date().toDateString();
          const isPowerSurgeActive = (economy?.power_surge_expires_at && new Date(economy.power_surge_expires_at) > new Date()) || 
                                     (economy?.power_surge_active_date === todayStr);
          if (isPowerSurgeActive) {
            powerSurgeMultiplier = 1.5;
          }
          
          if (isRevision) {
            if (mock?.type === 'mastery' || mock?.type === 'srs-mastery') {
              wagered = 30;
              const preSurge = correct * 60;
              totalEarned = Math.round(preSurge * powerSurgeMultiplier);
              powerSurgeBonus = totalEarned - preSurge;
            } else {
              wagered = 15;
              const preSurge = getRevisionPayout(correct, isPro);
              totalEarned = Math.round(preSurge * powerSurgeMultiplier);
              powerSurgeBonus = totalEarned - preSurge;
            }
          } else {
            baseEarned = correct * 2;
            sniperBonus = accuracy > 90 ? 5 : 0;
            const totalSeconds = Object.values(timeSpent).reduce((acc, curr) => acc + curr, 0);
            const benchmarkSeconds = questions.length * 60;
            lightningBonus = (totalSeconds > 0 && totalSeconds < benchmarkSeconds * 0.75) ? 3 : 0;
            
            const subtotal = baseEarned + sniperBonus + lightningBonus;
            const proFactor = isPro ? 1.5 : 1.0;
            
            const standardSubtotal = Math.round(subtotal * proFactor);
            totalEarned = Math.round(standardSubtotal * powerSurgeMultiplier);
            powerSurgeBonus = totalEarned - standardSubtotal;
          }
          
          // Apply coin leakage protection for repeating solved mocks
          let repeatMessage = "";
          if (hasBeenSolvedBefore && totalEarned > 0) {
            let reductionMultiplier = 1.0;
            if (previousBestPct >= 80) {
              reductionMultiplier = 0.25; // 75% reduction
              repeatMessage = `⚠️ Mastered mock repeat: earned coins reduced by 75% (${totalEarned} ➔ ${Math.round(totalEarned * 0.25)})`;
            } else if (previousBestPct < 40) {
              reductionMultiplier = 0.50; // 50% reduction
              repeatMessage = `⚠️ Under Review mock repeat: earned coins reduced by 50% (${totalEarned} ➔ ${Math.round(totalEarned * 0.50)})`;
            } else {
              reductionMultiplier = 0.50; // 50% reduction
              repeatMessage = `⚠️ Solved mock repeat: earned coins reduced by 50% (${totalEarned} ➔ ${Math.round(totalEarned * 0.50)})`;
            }
            totalEarned = Math.round(totalEarned * reductionMultiplier);
          }
          
          if (repeatMessage && totalEarned > 0) {
            setTimeout(() => {
              showToast(repeatMessage, "warning");
            }, 1000);
          }
          
          if (totalEarned > 0) {
            await transactKC(totalEarned);
            await logCoinEarnedFromMocks(totalEarned);
          }
          
          // Earning Power Surge: Score >= 8/10 in any resurrection mock
          if (mock?.type === 'resurrection') {
            if (correct >= 8) {
              const currentTodayStr = new Date().toDateString();
              await updateUserEconomy({
                power_surge_active_date: currentTodayStr
              });
              if (refreshEconomy) {
                await refreshEconomy();
              }
              showToast("⚡ Power Surge Activated! +20% Coin Boost on all mocks for the rest of today!", "success");
            }
          }
          
          setEarnings({
            base: baseEarned,
            sniper: sniperBonus,
            lightning: lightningBonus,
            total: totalEarned,
            wagered,
            isRevision,
            powerSurgeBonus,
            correct,
            phantomLost: isPro ? 0 : (isRevision ? (getRevisionPayout(correct, true) - totalEarned) : (Math.round((baseEarned + sniperBonus + lightningBonus) * 1.5) - totalEarned))
          });
          
          // Data Inference Message Generation
          const pastMocks = await getSolvedMocks();
          const revisionStats = await getRevisionStats().catch(() => null);
          const warRoomStats = await getWarRoomStats().catch(() => ({ categories: [], tags: [] }));
          const inferenceMsg = buildGhostMessage({
            questions,
            answers,
            mock,
            timeSpent,
            accuracy,
            percentage,
            correct,
            incorrect,
            skipped,
            total,
            lightningBonus,
            revisionMode,
            revisionOutcome,
            revisionStats,
            pastMocks,
            warRoomStats,
          });
          
          setGhostMessage(inferenceMsg);
        }
        
      } catch (err) {
        console.error('Failed to save mock stats:', err);
      }
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const filteredQuestions = questions.filter(q => {
    const ans = answers[q.id];
    if (filter === 'all')       return true;
    if (filter === 'correct')   return ans === q.correctId;
    if (filter === 'incorrect') return ans && ans !== q.correctId;
    if (filter === 'skipped')   return !ans;
    return true;
  }).sort((a, b) => {
    return getPriorityScore(b) - getPriorityScore(a);
  });

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
        title: `Revision Sheet: ${mock?.title || 'Mock Analysis'}`,
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
        title: `AI similar mock: ${mock?.title || 'Mock Test'}`,
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

  // ── Navigation ───────────────────────────────────────────────────
  const handleContinue = () => {
    if (!nextMock) return;
    navigate('/mock-test', {
      state: {
        mock:   nextMock,
        from:   location.state?.from,
        examId: location.state?.examId,
      },
    });
  };

  const handleShare = () => {
    // Filter incorrect questions
    const incorrectQs = questions.filter(q => {
      const ans = answers[q.id];
      return ans && ans !== q.correctId;
    });

    const displayIncorrect = incorrectQs.slice(0, 5);
    let qBoxH = 0;
    if (displayIncorrect.length > 0) {
      // Simulate rendering height to get exact box height
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        let currentItemY = 0;
        displayIncorrect.forEach((q) => {
          const rawText = q.question || q.questionText || '';
          const cleanQ = rawText.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
          const correctOpt = q.options?.find(o => o.id === q.correctId || o.optionId === q.correctId);
          const correctText = correctOpt ? (correctOpt.text || correctOpt.optionText || '') : '';
          const cleanOption = correctText.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
          
          const tokens = [];
          tokens.push({ text: 'Q: ', font: 'bold 12.5px system-ui, -apple-system, sans-serif' });
          cleanQ.split(' ').forEach(w => {
            if (w.trim()) tokens.push({ text: w + ' ', font: 'bold 12.5px system-ui, -apple-system, sans-serif' });
          });
          tokens.push({ text: ' → ', font: '900 13px system-ui, -apple-system, sans-serif' });
          tokens.push({ text: 'A: ' + cleanOption, font: '900 12.5px system-ui, -apple-system, sans-serif' });
          
          let currentX = 132;
          let textY = 10;
          
          tokens.forEach(tok => {
            tempCtx.font = tok.font;
            const w = tempCtx.measureText(tok.text).width;
            if (currentX + w > 1100) {
              currentX = 132;
              textY += 18;
            }
            currentX += w;
          });
          
          const itemHeight = Math.max(32, textY + 15);
          currentItemY += itemHeight;
        });
        qBoxH = 38 + currentItemY + 15;
      } else {
        qBoxH = 40 + (displayIncorrect.length * 46);
      }
    }

    const qBoxY = 515;
    const dynamicCanvasHeight = incorrectQs.length > 0 ? (qBoxY + qBoxH + 20) : 515;

    const canvas = document.createElement('canvas');
    // Render at 2x resolution for high-DPI crispness
    canvas.width = 2400;
    canvas.height = dynamicCanvasHeight * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale drawing context to draw in 1200 width while rendering high resolution
    ctx.scale(2, 2);

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, dynamicCanvasHeight);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, dynamicCanvasHeight);

    // Glow Orbs
    const glow1 = ctx.createRadialGradient(200, 150, 50, 200, 150, 400);
    glow1.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
    glow1.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.fillStyle = glow1;
    ctx.beginPath();
    ctx.arc(200, 150, 400, 0, Math.PI * 2);
    ctx.fill();

    const glow2 = ctx.createRadialGradient(1000, 500, 50, 1000, 500, 450);
    glow2.addColorStop(0, 'rgba(245, 158, 11, 0.08)');
    glow2.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glow2;
    ctx.beginPath();
    ctx.arc(1000, 500, 450, 0, Math.PI * 2);
    ctx.fill();

    // Vector Kash Coin drawer (high fidelity replication of app icon)
    const drawKashCoin = (cCtx, cx, cy, radius) => {
      cCtx.save();
      
      // Shadow for glow
      cCtx.shadowColor = 'rgba(245, 158, 11, 0.5)';
      cCtx.shadowBlur = radius * 0.4;
      cCtx.shadowOffsetY = radius * 0.1;
      
      // Rim background (dark copper outline)
      cCtx.fillStyle = '#5b2106';
      cCtx.beginPath();
      cCtx.arc(cx, cy, radius, 0, Math.PI * 2);
      cCtx.fill();
      
      // Outer rim gradient
      const rimGrad = cCtx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      rimGrad.addColorStop(0, '#fff0a3');
      rimGrad.addColorStop(0.42, '#eab308');
      rimGrad.addColorStop(1, '#92400e');
      cCtx.fillStyle = rimGrad;
      cCtx.beginPath();
      cCtx.arc(cx, cy, radius * 0.95, 0, Math.PI * 2);
      cCtx.fill();
      
      // Inner circle drop shadow simulation
      cCtx.shadowBlur = 0;
      cCtx.shadowOffsetY = 0;
      cCtx.fillStyle = 'rgba(124, 45, 18, 0.28)';
      cCtx.beginPath();
      cCtx.arc(cx, cy, radius * 0.85, 0, Math.PI * 2);
      cCtx.fill();
      
      // Coin face body gradient
      const bodyGrad = cCtx.createRadialGradient(
        cx - radius * 0.2, cy - radius * 0.2, radius * 0.1,
        cx, cy, radius * 0.85
      );
      bodyGrad.addColorStop(0, '#fff4b0');
      bodyGrad.addColorStop(0.34, '#fbbf24');
      bodyGrad.addColorStop(0.68, '#ea8a06');
      bodyGrad.addColorStop(1, '#9a4a0a');
      cCtx.fillStyle = bodyGrad;
      cCtx.beginPath();
      cCtx.arc(cx, cy, radius * 0.82, 0, Math.PI * 2);
      cCtx.fill();
      
      // Inner rim ring (white/gold highlight)
      cCtx.strokeStyle = 'rgba(255, 240, 184, 0.6)';
      cCtx.lineWidth = radius * 0.05;
      cCtx.beginPath();
      cCtx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
      cCtx.stroke();
      
      // Light highlight gradient (shine overlay)
      const shineGrad = cCtx.createLinearGradient(cx - radius * 0.5, cy - radius * 0.5, cx + radius * 0.3, cy + radius * 0.1);
      shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      cCtx.fillStyle = shineGrad;
      cCtx.beginPath();
      cCtx.arc(cx, cy, radius * 0.82, 0, Math.PI * 2);
      cCtx.fill();
      
      // Draw Monogram "K" using Path2D scaled to coin coordinates
      cCtx.translate(cx, cy);
      const scale = radius / 32;
      cCtx.scale(scale, scale);
      cCtx.translate(-32, -32);
      
      const p = new Path2D("M21.4 20.2H27.5V29.7L36.2 20.2H43.0L32.6 31.4L43.4 43.8H36.1L27.5 33.9V43.8H21.4V20.2Z");
      
      // Shadow layer
      cCtx.fillStyle = 'rgba(47, 18, 2, 0.42)';
      cCtx.save();
      cCtx.translate(1.05, 1.2);
      cCtx.fill(p);
      cCtx.restore();
      
      // Light highlight layer
      cCtx.fillStyle = 'rgba(255, 240, 184, 0.55)';
      cCtx.save();
      cCtx.translate(-0.75, -0.85);
      cCtx.fill(p);
      cCtx.restore();
      
      // Main monogram color
      cCtx.fillStyle = '#7a2e06';
      cCtx.fill(p);
      
      cCtx.restore();
    };

    // Sleek badge at top center
    const badgeW = 200;
    const badgeH = 26;
    const badgeX = 600 - badgeW / 2;
    const badgeY = 24;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 13);
    ctx.fill();
    
    const badgeBorderGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY);
    badgeBorderGrad.addColorStop(0, '#6366f1'); // Indigo
    badgeBorderGrad.addColorStop(0.5, '#ec4899'); // Pink
    badgeBorderGrad.addColorStop(1, '#f59e0b'); // Amber
    ctx.strokeStyle = badgeBorderGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Text: MCQKash by civilskash.in inside the badge
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('MCQKash by civilskash.in', badgeX + badgeW / 2, badgeY + 13);

    // Exam Title Renaming
    const cleanTitle = (mock?.name || mock?.title || 'Exam Mock')
      .replace(/Quick Mock/gi, 'Exam Mock')
      .replace(/Mini Mock/gi, 'Exam Mock');
    ctx.font = '900 36px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(cleanTitle, 600, 85);

    // Performance rating
    const perfLabel = percentage >= 75 ? 'EXCELLENT' :
                      percentage >= 50 ? 'GOOD JOB' :
                      percentage >= 40 ? 'PASSED' : 'NEEDS WORK';
    const perfColor = percentage >= 75 ? '#10b981' :
                      percentage >= 50 ? '#3b82f6'    :
                      percentage >= 40 ? '#fbbf24'  : '#f43f5e';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = perfColor;
    ctx.fillText(`${perfLabel} — ${percentage}%`, 600, 118);

    // Draw Panel Helper with glow borders
    const drawCard = (x, y, w, h, borderColors) => {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 20);
      ctx.fill();
      ctx.restore();

      const borderGrad = ctx.createLinearGradient(x, y, x + w, y + h);
      borderGrad.addColorStop(0, borderColors[0]);
      borderGrad.addColorStop(1, borderColors[1]);
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 20);
      ctx.stroke();
    };

    // Columns
    drawCard(70, 150, 240, 140, ['rgba(251,191,36,0.3)', 'rgba(251,191,36,0.05)']);
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('TOTAL SCORE', 190, 185);
    ctx.font = '900 32px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`${score.toFixed(2)}`, 190, 222);
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(`/ ${total}`, 190, 248);

    drawCard(330, 150, 240, 140, ['rgba(59,130,246,0.3)', 'rgba(59,130,246,0.05)']);
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('ACCURACY', 450, 185);
    ctx.font = '900 32px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#3b82f6';
    ctx.fillText(`${accuracy}%`, 450, 222);
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('of attempted questions', 450, 248);

    // Card 3: Performance Breakdown with Progress Bars
    drawCard(590, 150, 540, 140, ['rgba(16,185,129,0.3)', 'rgba(16,185,129,0.05)']);
    ctx.textAlign = 'left';
    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('PERFORMANCE BREAKDOWN', 620, 185);

    ctx.textAlign = 'center';
    ctx.font = '900 24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`${correct}`, 680, 215);
    ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
    ctx.fillText('CORRECT', 680, 252);

    ctx.font = '900 24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#f43f5e';
    ctx.fillText(`${incorrect}`, 860, 215);
    ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
    ctx.fillText('INCORRECT', 860, 252);

    ctx.font = '900 24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${skipped}`, 1040, 215);
    ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
    ctx.fillText('SKIPPED', 1040, 252);

    // Drawing progress bars under each performance stat
    const drawColumnBar = (cx, cy, count, colorHex) => {
      const w = 110;
      const h = 5;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(cx - w / 2, cy, w, h, 2.5);
      ctx.fill();
      
      if (total > 0 && count > 0) {
        const fillW = (count / total) * w;
        ctx.fillStyle = colorHex;
        ctx.beginPath();
        ctx.roundRect(cx - w / 2, cy, fillW, h, 2.5);
        ctx.fill();
      }
    };

    drawColumnBar(680, 228, correct, '#10b981');
    drawColumnBar(860, 228, incorrect, '#f43f5e');
    drawColumnBar(1040, 228, skipped, '#94a3b8');

    // Yield Block (Card 4: Treasury Yield - left column in row 2)
    drawCard(70, 310, 340, 185, ['rgba(245,158,11,0.3)', 'rgba(245,158,11,0.05)']);
    drawKashCoin(ctx, 95, 336, 11);
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('TREASURY YIELD', 115, 336);

    ctx.font = 'bold 12.5px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Base Correct Yield', 90, 370);
    ctx.textAlign = 'right';
    ctx.fillText(`+${correct * 2}`, 390, 370);

    ctx.textAlign = 'left';
    ctx.font = 'bold 12.5px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Speed & Sniper Bonus', 90, 400);
    ctx.textAlign = 'right';
    const bonusCoins = (earnings?.sniper || 0) + (earnings?.lightning || 0);
    ctx.fillText(`+${bonusCoins}`, 390, 400);

    // Sleeker and more compact total mined pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.roundRect(90, 434, 300, 38, 10);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('TOTAL KASH COINS MINED', 105, 456);

    ctx.textAlign = 'right';
    ctx.font = '900 20px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(earnings?.total || 0, 355, 456);
    drawKashCoin(ctx, 375, 456, 9.5);

    // Session Intelligence (Card 5: Middle column in row 2)
    const sessionIntelWidth = hideRealtimeIntelligence ? 700 : 370;
    const sessionIntelTextWidth = hideRealtimeIntelligence ? 640 : 310;
    drawCard(430, 310, sessionIntelWidth, 185, ['rgba(99,102,241,0.3)', 'rgba(99,102,241,0.05)']);
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#6366f1';
    ctx.fillText('⚡ SESSION INTELLIGENCE', 460, 336);

    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.roundRect(460, 355, 4, 115, 2);
    ctx.fill();

    const wrapText = (text, x, y, maxWidth, lineHeight) => {
      const words = text.split(' ');
      let line = '';
      let currentY = y;
      ctx.font = 'bold 12px Courier New, monospace';
      ctx.fillStyle = '#e2e8f0';
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
      return currentY + lineHeight;
    };

    const cleanMsg = (ghostMessage || "Data Inference Complete. Outstanding performance analyzed.").replace(/^\s*›\s*/g, '');
    wrapText(cleanMsg, 475, 365, sessionIntelTextWidth, 16);

    // Enter War Room CTA inside Session Intelligence card
    const btnX = hideRealtimeIntelligence ? 720 : 475;
    const btnY = 445;
    const btnW = 120;
    const btnH = 26;
    
    ctx.save();
    ctx.shadowColor = 'rgba(99, 102, 241, 0.35)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.restore();
    
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 8);
    ctx.stroke();
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ENTER WAR ROOM →', btnX + btnW / 2, btnY + btnH / 2);

    if (!hideRealtimeIntelligence) {
      // Realtime Intelligence (Card 6: Right column in row 2)
      drawCard(820, 310, 310, 185, ['rgba(245,158,11,0.35)', 'rgba(99,102,241,0.2)']);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('👑 REALTIME INTELLIGENCE', 850, 336);

      // Rank text
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('RANK', 850, 368);
      ctx.textAlign = 'right';
      ctx.font = '900 15px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`#${rtData?.rank || 1} / ${rtData?.totalLiveAspirants || 50}`, 1100, 368);

      // Percentile text
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('PERCENTILE', 850, 392);
      ctx.textAlign = 'right';
      ctx.font = '900 15px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#6366f1';
      ctx.fillText(`Top ${rtData?.percentile || 10}%`, 1100, 392);

      // Comment Indicator Pill/Container
      const rtColor = rtData?.insightColor || 'muted';
      const rtColorHex = rtColor === 'green' ? '#10b981' :
                         rtColor === 'amber' ? '#f59e0b' :
                         rtColor === 'rose' ? '#f43f5e' :
                         rtColor === 'blue' ? '#3b82f6' : '#94a3b8';
      const rtBg = rtColor === 'green' ? 'rgba(16,185,129,0.1)' :
                   rtColor === 'amber' ? 'rgba(245,158,11,0.1)' :
                   rtColor === 'rose' ? 'rgba(244,63,94,0.1)' :
                   rtColor === 'blue' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)';
      ctx.fillStyle = rtBg;
      ctx.beginPath();
      ctx.roundRect(840, 412, 270, 68, 8);
      ctx.fill();

      ctx.strokeStyle = rtColorHex + '33';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = rtColorHex;
      ctx.textAlign = 'left';
      ctx.font = 'bold 8.5px system-ui, -apple-system, sans-serif';
      const labelText = rtColor === 'green' ? '🏆 PERFORMANCE PEAK' :
                        rtColor === 'amber' ? '⚡ PACE INSIGHT' :
                        rtColor === 'rose' ? '🎯 PRECISION FOCUS' :
                        rtColor === 'blue' ? '📈 LIVE ANALYSIS' : '📊 ENGINE INSIGHT';
      ctx.fillText(labelText, 850, 424);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 8.5px system-ui, -apple-system, sans-serif';
      const wrapRealtimeText = (text, x, y, maxWidth, lineHeight) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + ' ';
          let metrics = ctx.measureText(testLine);
          let testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, currentY);
      };
      wrapRealtimeText(rtData?.insightComment || '', 850, 437, 250, 10.5);
    }

    // DYNAMIC ADDITION: Questions to Improve (Incorrect Q & correct Option only)
    if (incorrectQs.length > 0) {
      const displayIncorrect = incorrectQs.slice(0, 5);
      
      const qBoxY = 515;
      const qBoxW = 1060;
      drawCard(70, qBoxY, qBoxW, qBoxH, ['rgba(244,63,94,0.3)', 'rgba(15,23,42,0.1)']);
      
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = '900 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('⚠️ QUESTIONS TO IMPROVE (INCORRECT RUN)', 100, qBoxY + 14);
      
      let currentItemY = qBoxY + 38;
      
      displayIncorrect.forEach((q, idx) => {
        const itemY = currentItemY;
        
        // Render index badge
        ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
        ctx.beginPath();
        ctx.roundRect(100, itemY, 20, 20, 5);
        ctx.fill();
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#f43f5e';
        ctx.fillText(`${idx + 1}`, 110, itemY + 10);
        
        // Find correct option details
        const correctOpt = q.options?.find(o => o.id === q.correctId || o.optionId === q.correctId);
        const correctText = correctOpt ? (correctOpt.text || correctOpt.optionText || '') : '';
        const cleanOption = correctText.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        
        // Setup text tokens
        const rawText = q.question || q.questionText || '';
        const cleanQ = rawText.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        
        const tokens = [];
        tokens.push({ text: 'Q: ', color: '#ffffff', font: 'bold 12.5px system-ui, -apple-system, sans-serif' });
        cleanQ.split(' ').forEach(w => {
          if (w.trim()) tokens.push({ text: w + ' ', color: '#e2e8f0', font: 'bold 12.5px system-ui, -apple-system, sans-serif' });
        });
        tokens.push({ text: ' → ', color: '#f43f5e', font: '900 13px system-ui, -apple-system, sans-serif' });
        tokens.push({ text: 'A: ' + cleanOption, color: '#10b981', font: '900 12.5px system-ui, -apple-system, sans-serif' });
        
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        let currentX = 132;
        let textY = itemY + 10;
        
        tokens.forEach(tok => {
          ctx.font = tok.font;
          ctx.fillStyle = tok.color;
          const w = ctx.measureText(tok.text).width;
          if (currentX + w > 1100) {
            currentX = 132;
            textY += 18;
          }
          ctx.fillText(tok.text, currentX, textY);
          currentX += w;
        });
        
        const itemHeight = Math.max(32, textY - itemY + 15);
        
        // Subtle divider between rows
        if (idx < displayIncorrect.length - 1) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(100, itemY + itemHeight - 2);
          ctx.lineTo(1100, itemY + itemHeight - 2);
          ctx.stroke();
        }
        
        currentItemY += itemHeight;
      });
    }

    // Native Web Share API Integration
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-result.png`, { type: 'image/png' });
      
      // Native system file sharing
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'MCQKash Mocks Result',
            text: `Check out my score on ${cleanTitle}, a tuff challenge from civilskash.in`,
          });
          return;
        } catch (err) {
          if (err.name === 'AbortError') return;
          console.error("Web Share failed, downloading file instead:", err);
        }
      }
      
      // Fallback regular browser download
      const imageURL = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = imageURL;
      link.download = `${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-result.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(imageURL);
    }, 'image/png');
  };

  const handleReturn = () => {
    if (!location.state?.from) { navigate('/'); return; }
    navigate(location.state.from, {
      state: { selectedExamId: location.state?.examId },
    });
  };

  // ── Performance label ────────────────────────────────────────────
  const perfLabel = percentage >= 75 ? 'Excellent!' :
                    percentage >= 50 ? 'Good job!' :
                    percentage >= 40 ? 'Passed' : 'Needs work';
  const perfColor = percentage >= 75 ? 'text-emerald-500' :
                    percentage >= 50 ? 'text-blue-500'    :
                    percentage >= 40 ? 'text-yellow-500'  : 'text-rose-500';

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col text-theme-text overflow-y-auto">
      <main className="max-w-5xl mx-auto w-full p-4 md:p-8 space-y-6">

        {/* ── Title block ───────────────────────────────────────── */}
        <div className="text-center pt-4">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-theme-muted/60 mb-1">
            Test Complete
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-theme-text tracking-tight">
            {mock?.title || 'Mock Result'}
          </h1>
          <p className={`mt-2 text-sm font-black uppercase tracking-wider ${perfColor}`}>
            {perfLabel} — {percentage}%
          </p>
        </div>

        {/* ── Summary Cards ─────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* Score Card */}
          <div className="bg-theme-surface/60 backdrop-blur-md rounded-3xl p-5 border border-theme-border shadow-md flex flex-col items-center justify-center text-center gap-1 hover:shadow-card-hover hover:scale-[1.01] transition-all duration-300 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-theme-primary/10 rounded-full blur-xl pointer-events-none" />
            <div className="w-8 h-8 rounded-full bg-theme-primary/10 flex items-center justify-center text-theme-primary mb-1">
              <Sparkles size={16} />
            </div>
            <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">Total Score</p>
            <h2 className="text-4xl font-black text-theme-primary leading-none">
              {score.toFixed(2)}
              <span className="text-lg text-theme-muted font-medium"> /{maxScore}</span>
            </h2>
            <span className={`mt-1 text-xs font-black px-3 py-0.5 rounded-full ${isGoodMock ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {percentage}% Achieved
            </span>
          </div>

          {/* Accuracy Card */}
          <div className="bg-theme-surface/60 backdrop-blur-md rounded-3xl p-5 border border-theme-border shadow-md flex flex-col items-center justify-center text-center gap-1 hover:shadow-card-hover hover:scale-[1.01] transition-all duration-300 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-1">
              <Target size={16} />
            </div>
            <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">Accuracy</p>
            <h2 className="text-4xl font-black text-blue-500 leading-none">{accuracy}%</h2>
            <span className="mt-1 text-xs text-theme-muted">of attempted qs</span>
          </div>

          {/* Breakdown */}
          <div className="bg-theme-surface/60 backdrop-blur-md rounded-3xl p-5 border border-theme-border shadow-md md:col-span-2 hover:shadow-card-hover hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-theme-muted uppercase tracking-wider mb-4">Performance Breakdown</p>
              <div className="flex justify-between items-end gap-3">
                {[
                  { 
                    count: correct, 
                    label: 'Correct', 
                    Icon: CheckCircle2,
                    textClass: 'text-emerald-500', 
                    bgClass: 'bg-emerald-500', 
                    bgMutedClass: 'bg-emerald-500/20' 
                  },
                  { 
                    count: incorrect, 
                    label: 'Incorrect', 
                    Icon: XCircle,
                    textClass: 'text-rose-500', 
                    bgClass: 'bg-rose-500', 
                    bgMutedClass: 'bg-rose-500/20' 
                  },
                  { 
                    count: skipped, 
                    label: 'Skipped', 
                    Icon: MinusCircle,
                    textClass: 'text-slate-400', 
                    bgClass: 'bg-slate-400', 
                    bgMutedClass: 'bg-slate-400/20' 
                  },
                ].map(({ count, label, Icon, textClass, bgClass, bgMutedClass }) => (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1">
                    <span className={`text-2xl font-bold ${textClass}`}>{count}</span>
                    <div className={`w-full ${bgMutedClass} h-1.5 rounded-full`}>
                      <div className={`${bgClass} h-1.5 rounded-full transition-all`} style={{ width: `${(count / total) * 100}%` }} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${textClass} flex items-center gap-0.5`}>
                      <Icon size={10} /> {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {fiftyFiftyTotalCount > 0 && (
              <div className="mt-2.5 text-center text-[10px] text-theme-muted font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <span>⚡</span>
                <span>
                  You used 50/50{" "}
                  <span className="text-amber-500 font-black">
                    {fiftyFiftyTotalCount} {fiftyFiftyTotalCount === 1 ? 'Time' : 'Times'}
                  </span>
                </span>
              </div>
            )}
          </div>

        </section>

        {revisionSummary?.mode === 'srs' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Tile 1: Promotions */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-theme-surface shadow-lg p-6 hover:scale-[1.005] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative flex flex-col h-full justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500 mb-2">SRS PROMOTIONS</p>
                  <h3 className="text-2xl font-black text-theme-text tracking-tight">
                    {revisionSummary.promoted || 0} Card{revisionSummary.promoted === 1 ? '' : 's'} Promoted
                  </h3>
                  <p className="text-xs text-theme-muted font-semibold mt-2 leading-relaxed">
                    These questions were answered correctly and pushed to longer intervals.
                  </p>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.keys(revisionSummary.promotedToCounts || {}).length > 0 ? (
                    Object.entries(revisionSummary.promotedToCounts)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([interval, count]) => (
                        <span key={interval} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {interval}d: +{count}
                        </span>
                      ))
                  ) : (
                    <span className="text-xs text-theme-muted italic">No cards promoted</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tile 2: Demotions */}
            <div className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-theme-surface shadow-lg p-6 hover:scale-[1.005] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative flex flex-col h-full justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-500 mb-2">SRS DEMOTIONS</p>
                  <h3 className="text-2xl font-black text-theme-text tracking-tight">
                    {revisionSummary.demoted || 0} Card{revisionSummary.demoted === 1 ? '' : 's'} Demoted
                  </h3>
                  <p className="text-xs text-theme-muted font-semibold mt-2 leading-relaxed">
                    Incorrect answers caused these to drop to lower intervals or Resurrection.
                  </p>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.keys(revisionSummary.demotedToCounts || {}).length > 0 ? (
                    Object.entries(revisionSummary.demotedToCounts)
                      .sort(([a], [b]) => {
                        if (a === 'resurrection') return 1;
                        if (b === 'resurrection') return -1;
                        return Number(b) - Number(a);
                      })
                      .map(([interval, count]) => (
                        <span key={interval} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${
                          interval === 'resurrection' 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {interval === 'resurrection' ? `Resurrection: ${count}` : `${interval}d: ${count}`}
                        </span>
                      ))
                  ) : (
                    <span className="text-xs text-theme-muted italic">No cards demoted</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {earnings && (
          <>
            {/* Row 1: Realtime Intelligence & Session Intelligence */}
            <div className={`grid grid-cols-1 ${hideRealtimeIntelligence ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-5 mb-5`}>
              {/* Realtime Intelligence: Rank + Percentile unified card */}
              {!hideRealtimeIntelligence && (
                <div className="bg-theme-surface/60 backdrop-blur-md rounded-3xl border border-theme-border shadow-lg relative overflow-hidden flex flex-col p-6 hover:shadow-card-hover hover:scale-[1.005] transition-all duration-300">
                  <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/8 rounded-full blur-[60px] pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-theme-primary/8 rounded-full blur-[50px] pointer-events-none" />

                  {rtLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
                      <div className="relative w-9 h-9">
                        <div className="absolute inset-0 rounded-full border-[3px] border-theme-primary/20" />
                        <div className="absolute inset-0 rounded-full border-[3px] border-theme-primary border-t-transparent animate-spin" />
                      </div>
                      <p className="text-xs font-mono text-theme-muted animate-pulse">{rtLoadingText}</p>
                    </div>
                  ) : (
                    <div className="relative z-10 flex flex-col h-full gap-5">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-theme-primary/10 flex items-center justify-center text-theme-primary">
                            <Crown size={17} />
                          </div>
                          <div>
                            <h3 className="font-black text-theme-text uppercase tracking-widest text-xs">Realtime Intelligence</h3>
                            <p className="text-[10px] text-theme-primary uppercase tracking-wider font-semibold">Live Leaderboard</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-black uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          Live
                        </div>
                      </div>

                      {/* Rank line */}
                      <div className="flex items-center justify-between py-3 border-b border-theme-border/50">
                        <span className="text-xs font-bold text-theme-muted uppercase tracking-wider flex items-center gap-2">
                          <Trophy size={13} className="text-amber-500" /> Rank
                        </span>
                        <span className="font-black text-theme-text text-lg leading-none">
                          <span className="text-amber-500">#</span>{rtData?.rank}
                          <span className="text-sm text-theme-muted font-medium"> / {rtData?.totalLiveAspirants}</span>
                        </span>
                      </div>

                      {/* Percentile line */}
                      <div className="flex items-center justify-between pb-3 border-b border-theme-border/50">
                        <span className="text-xs font-bold text-theme-muted uppercase tracking-wider flex items-center gap-2">
                          <Sparkles size={13} className="text-theme-primary" /> Percentile
                        </span>
                        <span className="font-black text-theme-primary text-lg">Top {rtData?.percentile}%</span>
                      </div>

                      {/* Color-coded Smart Comment */}
                      <div 
                        style={{
                          color: rtData?.insightColor === 'green' ? 'var(--rt-green-text)' :
                                 rtData?.insightColor === 'amber' ? 'var(--rt-amber-text)' :
                                 rtData?.insightColor === 'rose' ? 'var(--rt-rose-text)' :
                                 rtData?.insightColor === 'blue' ? 'var(--rt-blue-text)' : 'var(--color-text-muted)',
                          backgroundColor: rtData?.insightColor === 'green' ? 'var(--rt-green-bg)' :
                                           rtData?.insightColor === 'amber' ? 'var(--rt-amber-bg)' :
                                           rtData?.insightColor === 'rose' ? 'var(--rt-rose-bg)' :
                                           rtData?.insightColor === 'blue' ? 'var(--rt-blue-bg)' : 'rgba(var(--color-text-rgb), 0.05)',
                          borderColor: rtData?.insightColor === 'green' ? 'var(--rt-green-border)' :
                                       rtData?.insightColor === 'amber' ? 'var(--rt-amber-border)' :
                                       rtData?.insightColor === 'rose' ? 'var(--rt-rose-border)' :
                                       rtData?.insightColor === 'blue' ? 'var(--rt-blue-border)' : 'var(--color-border)'
                        }}
                        className="text-xs font-medium leading-relaxed rounded-2xl p-3 border hover:scale-[1.01] transition-all duration-200"
                      >
                        <span className="font-bold uppercase tracking-wider block text-[10px] mb-1 opacity-80">
                          {rtData?.insightColor === 'green' ? '🏆 Performance Peak' :
                           rtData?.insightColor === 'amber' ? '⚡ Pace Insight' :
                           rtData?.insightColor === 'rose' ? '🎯 Precision Focus' :
                           rtData?.insightColor === 'blue' ? '📈 Live Analysis' : '📊 Engine Insight'}
                        </span>
                        {rtData?.insightComment}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Session Intelligence card */}
              <div className="bg-theme-surface/60 backdrop-blur-md rounded-3xl border border-theme-border shadow-lg relative overflow-hidden flex flex-col justify-between p-6 hover:shadow-card-hover hover:scale-[1.005] transition-all duration-300">
                <div className="absolute -top-16 -left-16 w-36 h-36 bg-theme-primary/8 rounded-full blur-[50px] pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full gap-5">
                  {/* Header */}
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-9 h-9 rounded-full bg-theme-bg border border-theme-border flex items-center justify-center">
                      <Activity size={16} className="text-theme-primary" />
                      <div className="absolute inset-0 rounded-full border-2 border-theme-primary border-t-transparent animate-[spin_3s_linear_infinite] opacity-40" />
                    </div>
                    <div>
                      <h3 className="font-black text-theme-text uppercase tracking-widest text-xs">Session Intelligence</h3>
                      <p className="text-[10px] text-theme-primary uppercase tracking-wider">Data Inference Engine</p>
                    </div>
                  </div>

                  {/* Ghost message — clean mono block */}
                  <div className="bg-theme-bg/50 border border-theme-border rounded-2xl p-4 relative shadow-sm flex-1 flex flex-col justify-center">
                    <div className="absolute top-0 left-0 w-1 h-full bg-theme-primary rounded-l-2xl" />
                    <p className="text-sm font-medium text-theme-text leading-relaxed font-mono pl-1">
                      <span className="text-theme-primary mr-1.5 opacity-70">›</span>
                      {ghostMessage}
                    </p>
                  </div>

                  {/* Time stat — subtle contextual line */}
                  <div className="flex items-center gap-2 text-xs text-theme-muted font-semibold">
                    <Clock size={13} className="text-theme-accent shrink-0" />
                    <span>
                      Completed in <span className="text-theme-text font-black">{rtData?.formattedTime || formatTime(totalSeconds)}</span>
                      {total > 0 && (
                        <span className="text-theme-muted">
                          {' '}— avg <span className="text-theme-text font-black">{Math.round(totalSeconds / total)}s</span> per question
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Upsell — only if applicable */}
                  {earnings.isRevision && economy.user_tier === 'FREE' ? (
                    <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                      <Flame className="text-amber-500 shrink-0" size={18} />
                      <div>
                        <p className="text-xs font-black text-theme-text mb-0.5">
                          {earnings.correct === 10 ? 'Mastery!' : earnings.correct >= 7 ? 'Profit!' : earnings.correct === 6 ? 'Break-Even!' : 'Upgrade to Pro'}
                        </p>
                        <p className="text-[10px] text-theme-muted font-semibold leading-relaxed">
                          You earned {getRevisionPayout(earnings.correct, false)} KC. Pro members earned {getRevisionPayout(earnings.correct, true)} KC here.
                        </p>
                      </div>
                    </div>
                  ) : earnings.phantomLost > 0 ? (
                    <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                      <Flame className="text-amber-500 shrink-0" size={18} />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-black text-theme-text">Pro would have added</span>
                          <KashCoinDisplay amount={earnings.phantomLost} className="inline-flex text-sm" />
                        </div>
                        <p className="text-[10px] text-theme-muted font-semibold">Same score. Bigger payout with Pro 1.5x.</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Row 2: Wager Checkpoint wide card */}
            <div className="bg-theme-surface/60 backdrop-blur-md rounded-3xl border border-theme-border shadow-lg relative overflow-hidden p-6 hover:shadow-card-hover transition-all duration-300 mb-6">
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/8 rounded-full blur-[70px] pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-theme-primary/8 rounded-full blur-[70px] pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="text-amber-500 animate-pulse" size={18} />
                    <h3 className="font-black text-theme-text uppercase tracking-widest text-xs flex items-center gap-2 flex-wrap">
                      <span>{mock?.type === 'mastery' || mock?.type === 'srs-mastery' ? 'Mastery Checkpoint' : 'Wager Checkpoint'}</span>
                      {earnings?.powerSurgeBonus > 0 && (
                        <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-500/30 tracking-normal flex items-center gap-0.5 uppercase animate-pulse">
                          <span>⚡</span> Surge 1.5x
                        </span>
                      )}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {earnings.isRevision ? (
                      <>
                        <div className="border-b sm:border-b-0 sm:border-r border-theme-border/30 pb-4 sm:pb-0 sm:pr-4 last:border-0 last:pb-0">
                          <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">Entry Wager</p>
                          <span className="text-rose-500 font-black text-lg">-{earnings.wagered} KC</span>
                        </div>
                        <div className="border-b sm:border-b-0 sm:border-r border-theme-border/30 pb-4 sm:pb-0 sm:pr-4 last:border-0 last:pb-0">
                          <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">Returned Coins</p>
                          <span className="text-emerald-500 font-black text-lg">+<AnimatedCounter targetValue={earnings.total} /> KC</span>
                        </div>
                        <div className="last:border-0 last:pb-0">
                          <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">Net Return</p>
                          <span className={`font-black text-lg ${earnings.total - earnings.wagered >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {earnings.total - earnings.wagered >= 0 ? '+' : ''}{earnings.total - earnings.wagered} KC
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="border-b sm:border-b-0 sm:border-r border-theme-border/30 pb-4 sm:pb-0 sm:pr-4 last:border-0 last:pb-0">
                          <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">Base Correct</p>
                          <span className="text-emerald-500 font-black text-lg">+{earnings.base} KC</span>
                        </div>
                        {earnings.sniper > 0 && (
                          <div className="border-b sm:border-b-0 sm:border-r border-theme-border/30 pb-4 sm:pb-0 sm:pr-4 last:border-0 last:pb-0">
                            <p className="text-xs font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1"><Target size={12} className="text-rose-500" /> Sniper Accuracy</p>
                            <span className="text-rose-500 font-black text-lg">+{earnings.sniper} KC</span>
                          </div>
                        )}
                        {earnings.lightning > 0 && (
                          <div className="last:border-0 last:pb-0">
                            <p className="text-xs font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1"><Zap size={12} className="text-blue-500" /> Lightning Speed</p>
                            <span className="text-blue-500 font-black text-lg">+{earnings.lightning} KC</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-theme-bg/70 rounded-2xl p-4 border border-theme-border flex items-center justify-between md:flex-col md:items-center md:justify-center gap-2 shadow-inner md:min-w-[150px]">
                  <span className="text-[10px] font-black uppercase text-theme-muted tracking-widest">Total Mined</span>
                  <KashCoinDisplay amount={earnings.total} className="text-2xl" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Action Buttons ────────────────────────────────────── */}
        <div className="flex gap-3 flex-wrap sm:flex-nowrap mb-6">
          <button
            onClick={handleContinue}
            disabled={!nextMock}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all
              ${nextMock
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-95'
                : 'bg-emerald-500/25 text-emerald-700/50 cursor-not-allowed'
              }`}
          >
            <PlayCircle size={16} />
            {nextMock ? 'Continue' : 'All Done!'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 hover:shadow-amber-500/40 transition-all active:scale-95"
          >
            <Share2 size={16} />
            Share
          </button>
          <button
            onClick={handleReturn}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95"
          >
            <ArrowLeft size={16} />
            Return
          </button>
          <button
            onClick={handleReturn}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 hover:shadow-rose-500/40 transition-all active:scale-95"
          >
            <LogOut size={16} />
            Exit
          </button>
        </div>

        {/* Intelligence Engine Recalculated Control Center */}
        {insightsReady && (
          <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-theme-surface to-amber-500/5 backdrop-blur-md p-6 shadow-[0_12px_40px_-20px_rgba(147,51,234,0.3)] mt-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all">
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
        )}

        {/* ── Detailed Review ───────────────────────────────────── */}
        <section className="bg-theme-surface rounded-2xl border border-theme-border shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 border-b border-theme-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg font-black">Detailed Review</h2>

            <div className="flex bg-theme-bg p-1 rounded-lg border border-theme-border text-xs">
              {[
                { key: 'all',       label: `All (${total})` },
                { key: 'correct',   label: `Correct (${correct})` },
                { key: 'incorrect', label: `Incorrect (${incorrect})` },
                { key: 'skipped',   label: `Skipped (${skipped})` },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all whitespace-nowrap
                    ${filter === key
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
              filteredQuestions.map(q => {
                const userAnswer = answers[q.id];
                const isCorrect  = userAnswer === q.correctId;
                const isSkipped  = !userAnswer;
                return (
                  <div key={q.id} className="relative">
                    <div
                      className="absolute -top-3 left-6 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm"
                      style={{
                        backgroundColor: isCorrect ? 'rgba(16,185,129,0.1)' : isSkipped ? 'rgba(100,116,139,0.1)' : 'rgba(244,63,94,0.1)',
                        borderColor:     isCorrect ? 'rgba(16,185,129,0.2)' : isSkipped ? 'rgba(100,116,139,0.2)' : 'rgba(244,63,94,0.2)',
                        color:           isCorrect ? '#10b981'               : isSkipped ? '#64748b'               : '#f43f5e',
                      }}
                    >
                      {isCorrect  && <CheckCircle2 size={12} />}
                      {!isCorrect && !isSkipped && <XCircle size={12} />}
                      {isSkipped  && <MinusCircle size={12} />}
                      {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                    </div>
                    <McqCard questionData={q} mode="result" externalSelection={userAnswer || null} />
                  </div>
                );
              })
            )}
          </div>
        </section>

      </main>

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
                <h3 className="font-black text-lg text-slate-100 uppercase tracking-wider">Kash AI Working</h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  {aiLoadingText || "Synthesizing intelligence features..."}
                </p>
              </div>

              <div className="pt-2">
                <span className="text-[9px] font-black uppercase tracking-widest bg-purple-500/15 text-purple-400 px-3 py-1 rounded-full border border-purple-500/20">
                  ★ Pro AI Integration
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
