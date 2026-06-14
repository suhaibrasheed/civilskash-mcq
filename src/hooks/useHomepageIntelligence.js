import { useState, useEffect, useMemo } from 'react';
import { getAggregatedStats, getWarRoomStats, getRevisionStats, getUserEconomy } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useEconomy } from '../context/EconomyContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { EXAM_SERIES } from '../lib/exams';

// Helper to map category slug/id to display names
const CATEGORY_MAP = {
  'accountancy': 'Accountancy',
  'ancient-history': 'Ancient History',
  'computer-awareness': 'Computer Awareness',
  'current-affairs': 'Current Affairs',
  'english': 'English',
  'environment': 'Environment',
  'general-science': 'General Science',
  'indian-economy': 'Indian Economy',
  'indian-geography': 'Indian Geography',
  'indian-polity': 'Indian Polity',
  'jk-affairs': 'JK Affairs',
  'maths': 'Maths',
  'medieval-history': 'Medieval History',
  'modern-history': 'Modern History',
  'physical-geography': 'Physical Geography',
  'reasoning': 'Reasoning',
  'static-gk': 'Static GK',
  'world-geography': 'World Geography'
};

const getCategoryName = (slug) => {
  if (!slug) return 'General';
  const cleanSlug = slug.toLowerCase().trim();
  return CATEGORY_MAP[cleanSlug] || slug.charAt(0).toUpperCase() + slug.slice(1);
};

const isDifficultyTag = (tag) => {
  if (!tag) return false;
  const t = tag.toLowerCase().trim();
  return t === '#easy' || t === '#medium' || t === '#hard' || t === 'easy' || t === 'medium' || t === 'hard';
};

export function useHomepageIntelligence() {
  const { user } = useAuth();
  const { economy } = useEconomy();
  const [loading, setLoading] = useState(true);
  const [ranks, setRanks] = useState({ coinsRank: null, streakRank: null });
  const [telemetry, setTelemetry] = useState(null);

  // 1. Fetch Supabase Leaderboard Ranks
  useEffect(() => {
    let active = true;
    async function fetchRanks() {
      if (!user || !isSupabaseConfigured()) return;
      try {
        const [coinsRes, streakRes] = await Promise.all([
          supabase.rpc('get_logged_in_user_coins_rank'),
          supabase.rpc('get_logged_in_user_streak_rank')
        ]);
        if (active) {
          setRanks({
            coinsRank: !coinsRes.error ? coinsRes.data : null,
            streakRank: !streakRes.error ? streakRes.data : null
          });
        }
      } catch (err) {
        console.warn('Failed to fetch user ranks:', err);
      }
    }
    fetchRanks();
    return () => { active = false; };
  }, [user]);

  // 2. Fetch IndexedDB Data
  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const stats = await getAggregatedStats();
        const warRoom = await getWarRoomStats();
        const revision = await getRevisionStats();
        const localEconomy = await getUserEconomy();

        if (active) {
          setTelemetry({
            stats,
            warRoom,
            revision,
            localEconomy
          });
        }
      } catch (err) {
        console.error('Error loading homepage intelligence data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [user]);

  // 3. Compute Intelligence State
  const result = useMemo(() => {
    if (loading || !telemetry) {
      return { loading: true, isMatureUser: false, intelligence: null };
    }

    const { stats, warRoom, revision, localEconomy } = telemetry;
    const history = stats.history || [];
    const totalAttempts = stats.totalTests || 0;
    const isMatureUser = totalAttempts >= 6;

    if (!isMatureUser) {
      return { loading: false, isMatureUser: false, intelligence: null };
    }

    // A. Parse Categories and Tags
    const categories = warRoom.categories || [];
    const tags = warRoom.tags || [];

    const attemptedCategories = categories.filter(c => (c.totalAttempted || 0) > 0);
    const sortedCats = [...attemptedCategories].sort((a, b) => (a.wmi || 0) - (b.wmi || 0));

    const weakestCategorySlug = sortedCats.length > 0 ? sortedCats[0].categoryId : '';
    const weakestCategory = getCategoryName(weakestCategorySlug);
    const weakestCategoryWmi = sortedCats.length > 0 ? Math.round(sortedCats[0].wmi || 0) : 0;
    const strongestCategory = sortedCats.length > 0 ? getCategoryName(sortedCats[sortedCats.length - 1].categoryId) : 'General';

    const overallWmi = attemptedCategories.length > 0
      ? attemptedCategories.reduce((sum, c) => sum + (c.wmi || 0), 0) / attemptedCategories.length
      : 0;

    // B. Calculate Speed Metrics
    let totalSeconds = 0;
    let totalAttemptedQs = 0;
    history.forEach(h => {
      if (h.timeSpent) {
        totalSeconds += Object.values(h.timeSpent).reduce((sum, s) => sum + (Number(s) || 0), 0);
      }
      totalAttemptedQs += (h.attempted || h.total || 0);
    });

    const avgSpeed = totalAttemptedQs > 0 ? (totalSeconds / totalAttemptedQs) : 45;
    const mostRecentMock = history[0];
    const recentAccuracy = mostRecentMock ? (mostRecentMock.accuracy || mostRecentMock.percentage || 0) : 0;
    const recentSpeed = (mostRecentMock && mostRecentMock.attempted > 0)
      ? (Object.values(mostRecentMock.timeSpent || {}).reduce((sum, s) => sum + (Number(s) || 0), 0) / mostRecentMock.attempted)
      : avgSpeed;

    const speedVariance = avgSpeed > 0 ? Math.max(0, Math.round(((avgSpeed - recentSpeed) / avgSpeed) * 100)) : 0;

    // C. Analyze Tag-level Leaks
    const tagStatsRecent = {};
    const tagStatsOlder = {};
    const tagToCategoryMap = {};
    history.forEach((mock, idx) => {
      const isRecent = idx < 3;
      const correctIds = new Set(mock.correctQuestionIds || []);
      const questions = mock.questions || [];
      questions.forEach(q => {
        if (q.tags && Array.isArray(q.tags)) {
          q.tags.forEach(t => {
            const tag = t.toLowerCase().trim();
            if (isDifficultyTag(tag)) return;
            const isCorrect = correctIds.has(q.id);
            const statsBucket = isRecent ? tagStatsRecent : tagStatsOlder;
            if (!statsBucket[tag]) statsBucket[tag] = { correct: 0, total: 0 };
            statsBucket[tag].total += 1;
            if (isCorrect) statsBucket[tag].correct += 1;

            if (q.category_id) {
              tagToCategoryMap[tag] = getCategoryName(q.category_id);
            }
          });
        }
      });
    });

    let weakestTag = '';
    let maxDrop = 0;
    Object.keys(tagStatsRecent).forEach(tag => {
      const recent = tagStatsRecent[tag];
      const older = tagStatsOlder[tag];
      if (recent.total >= 3 && older && older.total >= 5) {
        const recentAcc = (recent.correct / recent.total) * 100;
        const olderAcc = (older.correct / older.total) * 100;
        const drop = olderAcc - recentAcc;
        if (drop > 15 && drop > maxDrop) {
          maxDrop = drop;
          weakestTag = tag;
        }
      }
    });

    // Fallback if no specific drop is found: find tag with lowest accuracy and >= 5 attempts
    if (!weakestTag && tags.length > 0) {
      const sortedTags = [...tags]
        .filter(t => !isDifficultyTag(t.tagId) && (t.correctCount + t.incorrectCount) >= 5)
        .map(t => ({
          tagId: t.tagId,
          accuracy: (t.correctCount / (t.correctCount + t.incorrectCount)) * 100
        }))
        .sort((a, b) => a.accuracy - b.accuracy);
      if (sortedTags.length > 0 && sortedTags[0].accuracy < 60) {
        weakestTag = sortedTags[0].tagId;
      }
    }

    // E. Determine Tag Suggestion
    let tagSuggestion = '';
    let tagSuggestionCategory = '';
    if (tags.length > 0) {
      const sortedTagsForSuggestion = [...tags]
        .filter(t => !isDifficultyTag(t.tagId))
        .map(t => ({
          tagId: t.tagId,
          attempts: t.correctCount + t.incorrectCount,
          accuracy: (t.correctCount / Math.max(1, t.correctCount + t.incorrectCount)) * 100
        }))
        .filter(t => tagToCategoryMap[t.tagId] && t.accuracy < 75)
        .sort((a, b) => b.accuracy - a.accuracy);

      if (sortedTagsForSuggestion.length > 0) {
        const possible = sortedTagsForSuggestion.find(t => t.tagId !== weakestTag);
        tagSuggestion = possible ? possible.tagId : sortedTagsForSuggestion[0].tagId;
        tagSuggestionCategory = tagToCategoryMap[tagSuggestion] || weakestCategory;
      }
    }

    if (!tagSuggestion) {
      const allMappedTags = Object.keys(tagToCategoryMap);
      if (allMappedTags.length > 0) {
        tagSuggestion = allMappedTags.find(t => t !== weakestTag) || allMappedTags[0];
        tagSuggestionCategory = tagToCategoryMap[tagSuggestion];
      } else {
        tagSuggestion = 'polity';
        tagSuggestionCategory = 'Indian Polity';
      }
    }

    // D. Revision Statistics
    const srsDueCount = revision.dueSRS || 0;
    const totalResurrection = revision.poolCount || 0;

    // E. Habit Metrics
    const lastMockDate = history[0] ? new Date(history[0].date).getTime() : 0;
    const hoursSinceLastMock = lastMockDate > 0 ? (Date.now() - lastMockDate) / (1000 * 60 * 60) : 999;

    // F. Calculate Accuracy Variance
    const recentAccs = history.slice(0, 5).map(h => h.accuracy || h.percentage || 0);
    let isLowVariance = false;
    let overallAccuracy = stats.accuracyRate || 0;
    if (recentAccs.length >= 3) {
      const mean = recentAccs.reduce((a, b) => a + b, 0) / recentAccs.length;
      const variance = recentAccs.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / recentAccs.length;
      isLowVariance = variance < 50;
      overallAccuracy = Math.round(mean);
    }

    // ── G. Urgency Scoring Algorithm ──
    const triggers = [
      {
        id: 'revision',
        score: totalResurrection > 40 ? 95 : 0,
        label: 'HIGH REVISION LOAD',
        subheading: `You have ${totalResurrection} pending mistakes in your Resurrection pool. Clear them to protect your ${weakestCategory} mastery index.`,
        subheadingSegments: [
          { text: 'You have ', highlight: false },
          { text: `${totalResurrection} pending mistakes`, highlight: true, type: 'data' },
          { text: ' in your Resurrection pool. Clear them to protect your ', highlight: false },
          { text: weakestCategory, highlight: true, type: 'category' },
          { text: ' mastery index.', highlight: false }
        ],
        subCapsule2: { label: `${totalResurrection} Due Mistakes`, metricType: 'resurrection' }
      },
      {
        id: 'speed',
        score: (avgSpeed < 45 && recentAccuracy < 65) ? 85 : 0,
        label: 'RUSHING DETECTED',
        subheading: `You answered ${speedVariance}% faster than average yesterday, but accuracy dropped. You must prioritize precision over speed today.`,
        subheadingSegments: [
          { text: 'You answered ', highlight: false },
          { text: `${speedVariance}% faster`, highlight: true, type: 'data' },
          { text: ' than average yesterday, but accuracy dropped. Prioritize ', highlight: false },
          { text: 'precision over speed', highlight: true, type: 'emphasis' },
          { text: ' today.', highlight: false }
        ],
        subCapsule2: { label: `${Math.round(avgSpeed)}s Avg Speed`, metricType: 'speed' }
      },
      {
        id: 'tag',
        score: weakestTag ? 75 : 0,
        label: 'SCORE LEAK',
        subheadingSegments: [
          { text: 'You are leaking points in ', highlight: false },
          { text: weakestCategory ? weakestCategory.toUpperCase() : 'GENERAL TOPICS', highlight: true, type: 'category' },
          { text: `. Let's patch those foundational concepts before taking fresh mocks.`, highlight: false }
        ],
        subCapsule2: { label: `WMI: ${weakestCategoryWmi}%`, metricType: 'tag' }
      },
      {
        id: 'mastery',
        score: (overallWmi > 80 && isLowVariance) ? 65 : 0,
        label: 'PEAK MASTERY ACTIVE',
        subheading: `You are holding a highly stable ${overallAccuracy}% accuracy across major subjects. You are primed to challenge yourself with a full-length mock.`,
        subheadingSegments: [
          { text: 'You are holding a highly stable ', highlight: false },
          { text: `${overallAccuracy}% accuracy`, highlight: true, type: 'data' },
          { text: ' across major subjects. You are primed to challenge yourself with a ', highlight: false },
          { text: 'full-length mock', highlight: true, type: 'emphasis' },
          { text: '.', highlight: false }
        ],
        subCapsule2: { label: `WMI: ${Math.round(overallWmi)}%`, metricType: 'mastery' }
      },
      {
        id: 'cold',
        score: hoursSinceLastMock > 48 ? 45 : 0,
        label: 'CONSISTENCY ALERT',
        subheading: 'You know it takes 21 days to build a habit, but only 2 to break it. Start with a quick, low-pressure mini-mock to get your rhythm back.',
        subheadingSegments: [
          { text: 'You know it takes ', highlight: false },
          { text: '21 days', highlight: true, type: 'data' },
          { text: ' to build a habit, but only ', highlight: false },
          { text: '2 days', highlight: true, type: 'data' },
          { text: ' to break it. Start with a quick, low-pressure ', highlight: false },
          { text: 'mini-mock', highlight: true, type: 'emphasis' },
          { text: ' to get your rhythm back.', highlight: false }
        ],
        subCapsule2: { label: `${totalAttempts} Mocks Finished`, metricType: 'attempts' }
      },
      {
        id: 'fallback',
        score: 30,
        label: 'ACTIVE PREP MODE',
        subheading: "You are making steady progress. Let's target new mock tests today to explore untapped subjects.",
        subheadingSegments: [
          { text: "You are making steady progress. Let's target ", highlight: false },
          { text: 'new mock tests', highlight: true, type: 'emphasis' },
          { text: ' today to explore untapped subjects.', highlight: false }
        ],
        subCapsule2: { label: `${totalAttempts} Mocks Finished`, metricType: 'attempts' }
      }
    ];

    const activePool = triggers.filter(t => t.score > 0);
    const resolvedPool = activePool.length > 0 ? activePool : [triggers[triggers.length - 1]];

    // ── H. Heading Engine — Context-Aware, Data-Enriched Greetings ──
    // Each greeting is tuned to the user's actual state so it never feels generic.
    const userName = economy?.full_name || economy?.username || localEconomy?.full_name || localEconomy?.username || (user?.email ? user.email.split('@')[0] : 'Explorer');
    const targetExamId = economy?.target_exam || localEconomy?.target_exam;
    const targetExamObj = EXAM_SERIES.find(e => e.id === targetExamId);
    const targetExam = targetExamObj ? targetExamObj.name : 'your Exam';
    // Rank flags — needed by both greetings and capsule labels
    const userCoins = economy?.total_coins || localEconomy?.total_coins || economy?.liquid_coins || 0;
    let coinsRankVal = ranks.coinsRank;
    if (coinsRankVal === null && userCoins > 0) {
      coinsRankVal = Math.max(2, Math.min(150, Math.round(10000 / (userCoins + 10))));
    }
    const coinsRankHeld = coinsRankVal !== null && coinsRankVal > 0;

    const userStreak = economy?.current_streak_days || localEconomy?.current_streak_days || 0;
    let streakRankVal = ranks.streakRank;
    if (streakRankVal === null && userStreak > 0) {
      streakRankVal = Math.max(1, Math.min(100, 100 - userStreak * 2));
    }
    const streakRankHeld = streakRankVal !== null && streakRankVal > 0;
    const currentStreak  = economy?.current_streak_days || localEconomy?.current_streak_days || 0;

    const greetingTime = (() => {
      const hr = new Date().getHours();
      if (hr < 5)  return 'Still up,';
      if (hr < 12) return 'Good morning,';
      if (hr < 17) return 'Good afternoon,';
      if (hr < 21) return 'Good evening,';
      return 'Grinding late,';
    })();

    const greetings = [
      // 1. Time-of-day + name (classic, warm)
      [
        { text: `${greetingTime} `, highlight: false },
        { text: userName, highlight: true, type: 'username' },
        { text: `!`, highlight: false }
      ],
      // 2. Target exam call-out
      [
        { text: `Hey `, highlight: false },
        { text: userName, highlight: true, type: 'username' },
        { text: `, ready for `, highlight: false },
        { text: targetExam, highlight: true, type: 'exam' },
        { text: `?`, highlight: false }
      ],
      // 3. Streak (if active) or welcome back
      ...(currentStreak >= 3 ? [[
        { text: `${currentStreak}-day streak, `, highlight: false },
        { text: userName, highlight: true, type: 'username' },
        { text: `! Keep it going.`, highlight: false }
      ]] : [[
        { text: `Welcome back, `, highlight: false },
        { text: userName, highlight: true, type: 'username' },
        { text: `!`, highlight: false }
      ]]),
      // 4. Exam-focused war cry
      [
        { text: `Let's crack `, highlight: false },
        { text: targetExam, highlight: true, type: 'exam' },
        { text: `, `, highlight: false },
        { text: userName, highlight: true, type: 'username' },
        { text: `!`, highlight: false }
      ],
      // 5. Casual check-in
      [
        { text: `How's prep going, `, highlight: false },
        { text: userName, highlight: true, type: 'username' },
        { text: `?`, highlight: false }
      ],
      // 6. Short streak nudge or simple motivation
      ...(currentStreak === 0 ? [[
        { text: `Start your streak today, `, highlight: false },
        { text: userName, highlight: true, type: 'username' },
        { text: `!`, highlight: false }
      ]] : [[
        { text: `Time to grind, `, highlight: false },
        { text: userName, highlight: true, type: 'username' },
        { text: `.`, highlight: false }
      ]]),
      // 7. Friendly enjoying the journey
      [
        { text: `Hey `, highlight: false },
        { text: userName, highlight: true, type: 'username' },
        { text: `, enjoying the grind?`, highlight: false }
      ],
      // 8. Rank-aware or simple rank prompt
      ...(coinsRankHeld && ranks.coinsRank <= 100 ? [[
        { text: `Rank #${ranks.coinsRank}, `, highlight: false },
        { text: userName, highlight: true, type: 'username' },
        { text: `. Keep climbing!`, highlight: false }
      ]] : [[
        { text: `Ready to conquer, `, highlight: false },
        { text: userName, highlight: true, type: 'username' },
        { text: `?`, highlight: false }
      ]]),
    ];

    const coinsRank = ranks.coinsRank;
    const totalUsers = ranks.totalUsers || 100;
    const percentile = coinsRank && totalUsers ? Math.max(1, Math.min(100, Math.round((coinsRank / totalUsers) * 100))) : 12;

    const nextPercentileTarget = Math.max(1, Math.round(percentile * 0.85));
    const nextPercentileTargetStretch = Math.max(1, Math.round(percentile * 0.7));

    const activeTrigger = resolvedPool[0];
    const greetingSegments = greetings[0] || [];
    const heading = greetingSegments.map(s => s.text).join('');
    const headingSegments = greetingSegments;

    const rank1Text = streakRankHeld ? `#${streakRankVal} Streak Rank` : currentStreak > 0 ? `${currentStreak}d Streak` : 'Streak: Start Now';
    const rank2Text = coinsRankHeld ? `#${coinsRankVal} Kash Rank` : `${totalAttempts} Mocks Done`;

    const subCapsule1Streak = { label: rank1Text, value: streakRankVal, rankType: 'streak' };
    const subCapsule1Coins = { label: rank2Text, value: coinsRankVal, rankType: 'coins' };

    const subCapsule3Accuracy = { label: `Accuracy: ${Math.round(stats.accuracyRate || 0)}%`, metricType: 'accuracy' };
    const subCapsule3Wmi = { label: `Mastery: ${Math.round(overallWmi)}%`, metricType: 'wmi' };

    const subCapsule1 = user ? subCapsule1Streak : { label: 'Rank: Guest Mode', value: null, rankType: 'guest' };
    const subCapsule2 = activeTrigger.subCapsule2;
    const subCapsule3 = subCapsule3Accuracy;

    // ── I. Comprehensive Subheadings Pool ──
    // CRITICAL: Active trigger's messages come FIRST so the subheading is always
    // coherent with the top capsule insight the user sees. Then secondary triggers.
    // Universal messages fill the tail for endless variety. All hyphens have been removed.
    const revisionMessages = totalResurrection > 40 ? [
      [
        { text: 'You have ', highlight: false },
        { text: `${totalResurrection} pending mistakes`, highlight: true, type: 'data' },
        { text: ' in your Resurrection pool. Clear them before they compound further.', highlight: false }
      ],
      [
        { text: 'Each unresolved mistake costs you ', highlight: false },
        { text: '2 to 3 marks', highlight: true, type: 'data' },
        { text: ' in the final exam. Fix your revision pool before attempting fresh mocks.', highlight: false }
      ],
      [
        { text: 'Memory retention drops ', highlight: false },
        { text: '40%', highlight: true, type: 'data' },
        { text: ' if you delay revision beyond 72 hours. Your ', highlight: false },
        { text: `${totalResurrection} error pool`, highlight: true, type: 'data' },
        { text: ' is waiting.', highlight: false }
      ],
    ] : [];

    const speedMessages = (avgSpeed < 45 && recentAccuracy < 65) ? [
      [
        { text: 'You answered ', highlight: false },
        { text: `${speedVariance}% faster`, highlight: true, type: 'data' },
        { text: ' than average recently, but accuracy dropped. Prioritize ', highlight: false },
        { text: 'precision over speed', highlight: true, type: 'emphasis' },
        { text: ' today.', highlight: false }
      ],
      [
        { text: 'Speed without accuracy is wasted effort. Slowing down by ', highlight: false },
        { text: '20%', highlight: true, type: 'data' },
        { text: ' will lift your score on the very next mock you attempt.', highlight: false }
      ],
    ] : [];

    const tagMessages = weakestTag ? [
      [
        { text: 'You need to focus on ', highlight: false },
        { text: weakestTag.replace(/^#/, '').toLowerCase(), highlight: true, type: 'emphasis' },
        { text: ' in the ', highlight: false },
        { text: tagToCategoryMap[weakestTag] || weakestCategory, highlight: true, type: 'category' },
        { text: ' as you are leaking your marks.', highlight: false }
      ],
      [
        { text: 'Have you tried solving questions from ', highlight: false },
        { text: tagSuggestion.replace(/^#/, '').toLowerCase(), highlight: true, type: 'emphasis' },
        { text: ' from the ', highlight: false },
        { text: tagSuggestionCategory, highlight: true, type: 'category' },
        { text: ', this can be more rewarding for your ', highlight: false },
        { text: targetExam, highlight: true, type: 'exam' },
        { text: '.', highlight: false }
      ],
      [
        { text: 'You are dropping marks in ', highlight: false },
        { text: weakestCategory.toUpperCase(), highlight: true, type: 'category' },
        { text: '. Targeted practice now can flip the script before your next full mock.', highlight: false }
      ],
      [
        { text: 'Weak zones do not fix themselves. ', highlight: false },
        { text: '20 focused questions', highlight: true, type: 'data' },
        { text: ' in your low score area can boost your result by ', highlight: false },
        { text: '5 or more marks', highlight: true, type: 'data' },
        { text: '.', highlight: false }
      ],
      [
        { text: 'Your ', highlight: false },
        { text: weakestCategory.toUpperCase(), highlight: true, type: 'category' },
        { text: ' accuracy is below 50%. Each mock you take without fixing it costs compounding marks.', highlight: false }
      ],
      [
        { text: 'A targeted revision session today can ', highlight: false },
        { text: 'eliminate your score leak', highlight: true, type: 'emphasis' },
        { text: ' and strengthen your overall subject mastery index.', highlight: false }
      ],
    ] : [];

    const masteryMessages = (overallWmi > 80 && isLowVariance) ? [
      [
        { text: 'You are holding a stable ', highlight: false },
        { text: `${overallAccuracy}% accuracy`, highlight: true, type: 'data' },
        { text: ' across subjects. You are primed to challenge yourself with a ', highlight: false },
        { text: 'full mock', highlight: true, type: 'emphasis' },
        { text: '.', highlight: false }
      ],
      [
        { text: 'Strong consistency across all subjects. A ', highlight: false },
        { text: 'timed full mock', highlight: true, type: 'emphasis' },
        { text: ' today will sharpen your exam instincts before competition intensifies.', highlight: false }
      ],
      [
        { text: 'Your mastery index sits at ', highlight: false },
        { text: `${Math.round(overallWmi)}%`, highlight: true, type: 'data' },
        { text: '. This is the best time to push your limits with a high difficulty challenge.', highlight: false }
      ],
    ] : [];

    const coldMessages = hoursSinceLastMock > 48 ? [
      [
        { text: 'It takes ', highlight: false },
        { text: '21 days', highlight: true, type: 'data' },
        { text: ' to build a habit, but only ', highlight: false },
        { text: '2 days', highlight: true, type: 'data' },
        { text: ' to break it. A quick mini mock today reignites your rhythm.', highlight: false }
      ],
      [
        { text: 'A ', highlight: false },
        { text: '2 day prep gap', highlight: true, type: 'data' },
        { text: ' can cost you ', highlight: false },
        { text: '3 to 5 marks', highlight: true, type: 'data' },
        { text: ' in the actual exam. Start small, just 10 focused questions now.', highlight: false }
      ],
    ] : [];

    const leaderboardMessages = user && coinsRank ? [
      [
        { text: 'You are among the ', highlight: false },
        { text: `top ${percentile}% of aspirants`, highlight: true, type: 'emphasis' },
        { text: ' on the leaderboard. Keep sharpening your accuracy to secure your position.', highlight: false }
      ],
      [
        { text: 'With just ', highlight: false },
        { text: '10 right MCQs', highlight: true, type: 'data' },
        { text: ', you can climb into the ', highlight: false },
        { text: `top ${nextPercentileTarget}% of aspirants`, highlight: true, type: 'emphasis' },
        { text: ' on the leaderboard.', highlight: false }
      ],
      [
        { text: 'Solve ', highlight: false },
        { text: '15 right MCQs', highlight: true, type: 'data' },
        { text: ' to push yourself to the ', highlight: false },
        { text: `top ${nextPercentileTargetStretch}% of aspirants`, highlight: true, type: 'emphasis' },
        { text: ' and lead the pack.', highlight: false }
      ]
    ] : [];
    const dynamicRankMessages = [];
    if (streakRankHeld) {
      const deltaStreak = 2 + (streakRankVal % 3); // deterministic: 2, 3, or 4
      let targetStreakRank = streakRankVal - deltaStreak;
      if (targetStreakRank < 1) targetStreakRank = 1;

      // Variation 1
      dynamicRankMessages.push([
        { text: 'Your ', highlight: false },
        { text: `#${streakRankVal} Streak Rank`, highlight: true, type: 'streak-rank' },
        { text: ' is earned, not given. Just keep your streak active today to move to ', highlight: false },
        { text: `#${targetStreakRank}`, highlight: true, type: 'streak-rank' },
        { text: ' rank.', highlight: false }
      ]);

      // Variation 2
      dynamicRankMessages.push([
        { text: 'Climb the leaderboard! Extend your daily streak by ', highlight: false },
        { text: '1 day', highlight: true, type: 'data' },
        { text: ' to push your ', highlight: false },
        { text: `#${streakRankVal} Streak Rank`, highlight: true, type: 'streak-rank' },
        { text: ' up to ', highlight: false },
        { text: `#${targetStreakRank}`, highlight: true, type: 'streak-rank' },
        { text: '.', highlight: false }
      ]);

      // Variation 3
      dynamicRankMessages.push([
        { text: 'Every day counts. Keep your daily streak going to move your ', highlight: false },
        { text: `#${streakRankVal} Streak Rank`, highlight: true, type: 'streak-rank' },
        { text: ' closer to ', highlight: false },
        { text: `#${targetStreakRank}`, highlight: true, type: 'streak-rank' },
        { text: '.', highlight: false }
      ]);
    }
    if (coinsRankHeld) {
      const deltaCoins = 2 + (coinsRankVal % 3); // deterministic: 2, 3, or 4
      let targetCoinsRank = coinsRankVal - deltaCoins;
      if (targetCoinsRank < 1) targetCoinsRank = 1;
      const questionsCoins = 5 + (coinsRankVal % 11); // deterministic: 5 to 15

      // Variation 1
      dynamicRankMessages.push([
        { text: 'Your ', highlight: false },
        { text: `#${coinsRankVal} Kash Rank`, highlight: true, type: 'kash-rank' },
        { text: ' is earned, not given. Just solve ', highlight: false },
        { text: `${questionsCoins} questions`, highlight: true, type: 'data' },
        { text: ' to move to ', highlight: false },
        { text: `#${targetCoinsRank}`, highlight: true, type: 'kash-rank' },
        { text: ' rank.', highlight: false }
      ]);

      // Variation 2
      dynamicRankMessages.push([
        { text: 'Leaderboard advantage is waiting. Solve ', highlight: false },
        { text: `${questionsCoins} questions`, highlight: true, type: 'data' },
        { text: ' to elevate your ', highlight: false },
        { text: `#${coinsRankVal} Kash Rank`, highlight: true, type: 'kash-rank' },
        { text: ' to ', highlight: false },
        { text: `#${targetCoinsRank}`, highlight: true, type: 'kash-rank' },
        { text: ' today.', highlight: false }
      ]);

      // Variation 3
      dynamicRankMessages.push([
        { text: 'Consistency pays off. Just ', highlight: false },
        { text: `${questionsCoins} focused questions`, highlight: true, type: 'data' },
        { text: ' can boost your ', highlight: false },
        { text: `#${coinsRankVal} Kash Rank`, highlight: true, type: 'kash-rank' },
        { text: ' closer to ', highlight: false },
        { text: `#${targetCoinsRank}`, highlight: true, type: 'kash-rank' },
        { text: '.', highlight: false }
      ]);
    }

    // Universal pool (always available, strong variety)
    const universalMessages = [
      [
        { text: 'Consistent effort beats talent every time. Keep showing up daily and the results ', highlight: false },
        { text: 'will follow', highlight: true, type: 'emphasis' },
        { text: '.', highlight: false }
      ],
      [
        { text: 'Each question you attempt today is a question you will not guess tomorrow. ', highlight: false },
        { text: 'Keep the momentum going', highlight: true, type: 'emphasis' },
        { text: '.', highlight: false }
      ],
      [
        { text: 'Toppers do not practice until they get it right, they practice until they ', highlight: false },
        { text: "cannot get it wrong", highlight: true, type: 'emphasis' },
        { text: '. Keep going.', highlight: false }
      ],
      [
        { text: 'Your overall accuracy is ', highlight: false },
        { text: `${Math.round(overallAccuracy)}%`, highlight: true, type: 'data' },
        { text: '. Small daily improvements compound into a massive score advantage over time.', highlight: false }
      ],
      [
        { text: "Do not count the mocks you have done, make the mocks you do ", highlight: false },
        { text: 'count', highlight: true, type: 'emphasis' },
        { text: '. Deep analysis after every test is what separates toppers from the rest.', highlight: false }
      ],
      [
        { text: 'You have completed ', highlight: false },
        { text: `${totalAttempts} mocks`, highlight: true, type: 'data' },
        { text: ' so far. Every next session pushes you further up the leaderboard.', highlight: false }
      ],
      ...(dynamicRankMessages.length > 0 ? dynamicRankMessages : [[
        { text: 'Your rank is earned, not given. Every mock session today ', highlight: false },
        { text: 'compounds', highlight: true, type: 'emphasis' },
        { text: ' into leaderboard advantage tomorrow.', highlight: false }
      ]]),
      [
        { text: 'The exam rewards those who ', highlight: false },
        { text: 'practiced the smartest', highlight: true, type: 'emphasis' },
        { text: ', not just the most. Keep refining your strategy.', highlight: false }
      ],
      [
        { text: 'Every mistake you resolve today is a ', highlight: false },
        { text: 'guaranteed mark gained', highlight: true, type: 'emphasis' },
        { text: ' tomorrow. Your Resurrection pool is your competitive edge.', highlight: false }
      ],
      [
        { text: "You are making steady progress. Let us target ", highlight: false },
        { text: 'new mock tests', highlight: true, type: 'emphasis' },
        { text: ' today to uncover untapped subject potential.', highlight: false }
      ],
      [
        { text: 'Your ', highlight: false },
        { text: `${totalAttempts} mock sessions`, highlight: true, type: 'data' },
        { text: ' are building a foundation that will show up on exam day when it matters most.', highlight: false }
      ],
      [
        { text: 'The best time to fix a weak area was before your last mock. The ', highlight: false },
        { text: 'second best time', highlight: true, type: 'emphasis' },
        { text: ' is right now.', highlight: false }
      ],
    ];

    // Build the pool so the ACTIVE TRIGGER'S messages lead
    // This ensures coherence between top capsule label and what the subheading says
    const triggerMessageMap = {
      revision: revisionMessages,
      speed: speedMessages,
      tag: tagMessages,
      mastery: masteryMessages,
      cold: coldMessages,
      fallback: [],
    };
    const leadMessages = triggerMessageMap[activeTrigger.id] || [];
    const secondaryMessages = resolvedPool
      .slice(1)
      .flatMap(t => triggerMessageMap[t.id] || []);

    const allSubheadings = [
      ...dynamicRankMessages, // SHOW Rank-based smart comments FIRST!
      ...leaderboardMessages,
      ...leadMessages,        // Active trigger first — always coherent
      ...secondaryMessages,   // Secondary triggers next
      ...universalMessages,   // Universal pool fills the tail
    ];

    return {
      loading: false,
      isMatureUser,
      intelligence: {
        heading,
        headingSegments,
        subheading: activeTrigger.subheading,
        subheadingSegments: activeTrigger.subheadingSegments,
        topCapsule: {
          label: activeTrigger.label,
          type: activeTrigger.id
        },
        subCapsule1,
        subCapsule2,
        subCapsule3,
        greetings,
        activeTriggers: resolvedPool,
        allSubheadings,
        subCapsule1Streak,
        subCapsule1Coins,
        subCapsule3Accuracy,
        subCapsule3Wmi,
        wmi: Math.round(overallWmi),
        streak: economy?.current_streak_days || localEconomy?.current_streak_days || 0,
        weakestTag,
        weakestCategory,
        strongestCategory
      }
    };
  }, [loading, telemetry, ranks, user, economy]);

  return result;
}
