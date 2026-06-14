import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Target, RefreshCw, Lock, Sparkles, CalendarClock, Flame } from 'lucide-react';
import { getDueSRSQuestions, getResurrectionQuestions, getRevisionStats } from '../lib/db';
import { useEconomy } from '../context/EconomyContext';
import { KashCoinIcon } from '../components/EconomyUI';
import Header from '../components/Header';
import { useToast } from '../context/ToastContext';
import { ALL_STATIC_BANKS_SYNC } from '../lib/dataHub';

const CATEGORY_NAMES = {
  'accountancy': 'Accountancy',
  'ancient-history': 'Ancient History',
  'computer-awareness': 'Computer Awareness',
  'current-affairs': 'Current Affairs',
  'english': 'English',
  'environment': 'Environment',
  'general-science': 'Science',
  'indian-economy': 'Indian Economy',
  'indian-geography': 'Indian Geography',
  'indian-polity': 'Polity',
  'jk-affairs': 'JK Affairs',
  'maths': 'Maths',
  'medieval-history': 'Medieval History',
  'modern-history': 'Modern History',
  'physical-geography': 'Physical Geography',
  'reasoning': 'Reasoning',
  'static-gk': 'Static GK',
  'world-geography': 'World Geography'
};

function buildDynamicResurrectionMocks(allQuestions) {
  const mocks = [];
  let remaining = [...allQuestions];

  // Helper to get random padding questions from master bank
  const getPaddingQuestions = (count, requiredCatId = null, preferredTag = null, excludedIds = new Set()) => {
    let pool = ALL_STATIC_BANKS_SYNC.filter(q => !excludedIds.has(q.id));
    if (requiredCatId) {
      const catPool = pool.filter(q => q.category_id === requiredCatId);
      if (catPool.length >= count) pool = catPool;
    }
    if (preferredTag) {
      const tagPool = pool.filter(q => Array.isArray(q.tags) && q.tags.some(t => t === preferredTag));
      if (tagPool.length >= count) pool = tagPool;
    }
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Helper to count tags in a list of questions
  const getTagCounts = (qs) => {
    const counts = {};
    qs.forEach(q => {
      if (Array.isArray(q.tags)) {
        q.tags.forEach(t => {
          if (!t || t.toLowerCase() === '#pro') return;
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  // 1. Process Tag Mocks: search for tags with >= 2 mistakes
  let sortedTags = getTagCounts(remaining);
  while (sortedTags.length > 0 && sortedTags[0][1] >= 2) {
    const [tagName, mistakeCount] = sortedTags[0];
    
    // Get all mistakes with this tag
    const tagMistakes = remaining.filter(q => Array.isArray(q.tags) && q.tags.some(t => t === tagName));
    
    if (tagMistakes.length >= 2) {
      // Take up to 10 mistakes for this tag
      const chunk = tagMistakes.slice(0, 10);
      
      // Remove these from remaining
      const chunkIds = new Set(chunk.map(c => c.id));
      remaining = remaining.filter(q => !chunkIds.has(q.id));

      let finalQuestionData = [...chunk];
      const primaryCatId = chunk[0]?.category_id;

      // We want at least 5 questions of this tag in the mock to call it a Tag Mock.
      // If we have fewer than 5 mistakes of this tag, we pull from the MCQ bank to reach at least 5.
      if (finalQuestionData.length < 5) {
        const neededTagQs = 5 - finalQuestionData.length;
        const excludedIds = new Set(finalQuestionData.map(q => q.id));
        const pads = getPaddingQuestions(neededTagQs, primaryCatId, tagName, excludedIds);
        finalQuestionData.push(...pads);
      }

      // Now we pad the mock to exactly 10 questions.
      if (finalQuestionData.length < 10) {
        // Pad from same category mistakes first
        const extraSameCat = remaining.filter(q => q.category_id === primaryCatId).slice(0, 10 - finalQuestionData.length);
        finalQuestionData.push(...extraSameCat);
        const extraIds = new Set(extraSameCat.map(c => c.id));
        remaining = remaining.filter(q => !extraIds.has(q.id));

        // Pad from any mistakes next
        if (finalQuestionData.length < 10) {
          const extraAny = remaining.slice(0, 10 - finalQuestionData.length);
          finalQuestionData.push(...extraAny);
          const extraAnyIds = new Set(extraAny.map(c => c.id));
          remaining = remaining.filter(q => !extraAnyIds.has(q.id));
        }

        // Lastly pad from master bank
        if (finalQuestionData.length < 10) {
          const needed = 10 - finalQuestionData.length;
          const excludedIds = new Set(finalQuestionData.map(q => q.id));
          const pads = getPaddingQuestions(needed, primaryCatId, tagName, excludedIds);
          finalQuestionData.push(...pads);
        }
      }

      const cleanTagName = tagName.replace(/^#/, '');
      const mockTitle = cleanTagName.toLowerCase().endsWith('mock')
        ? cleanTagName.replace(/mock/i, '').trim() + ' Mock'
        : cleanTagName + ' Mock';

      mocks.push({
        id: `resurrection-tag-${cleanTagName.toLowerCase().replace(/\s+/g, '-')}-${mocks.length + 1}`,
        title: mockTitle,
        questions: 10,
        minutes: 10,
        type: 'resurrection',
        questionData: finalQuestionData
      });
    }

    // Refresh tag counts
    sortedTags = getTagCounts(remaining);
  }

  // 2. Process Category Mocks: search for categories with >= 2 mistakes remaining
  const getCategoryCounts = (qs) => {
    const counts = {};
    qs.forEach(q => {
      const cat = q.category_id || 'uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  let sortedCats = getCategoryCounts(remaining);
  while (sortedCats.length > 0 && sortedCats[0][1] >= 2) {
    const [catId, mistakeCount] = sortedCats[0];
    const catMistakes = remaining.filter(q => q.category_id === catId);

    if (catMistakes.length >= 2) {
      const chunk = catMistakes.slice(0, 10);
      
      const chunkIds = new Set(chunk.map(c => c.id));
      remaining = remaining.filter(q => !chunkIds.has(q.id));

      let finalQuestionData = [...chunk];

      // We want at least 5 questions of this category in the mock.
      // If we have fewer than 5 mistakes of this category, we pull from the MCQ bank to reach at least 5.
      if (finalQuestionData.length < 5) {
        const neededCatQs = 5 - finalQuestionData.length;
        const excludedIds = new Set(finalQuestionData.map(q => q.id));
        const pads = getPaddingQuestions(neededCatQs, catId, null, excludedIds);
        finalQuestionData.push(...pads);
      }

      // Pad to exactly 10 questions.
      if (finalQuestionData.length < 10) {
        // Pad from any remaining mistakes
        const extraAny = remaining.slice(0, 10 - finalQuestionData.length);
        finalQuestionData.push(...extraAny);
        const extraAnyIds = new Set(extraAny.map(c => c.id));
        remaining = remaining.filter(q => !extraAnyIds.has(q.id));

        // Pad from master bank
        if (finalQuestionData.length < 10) {
          const needed = 10 - finalQuestionData.length;
          const excludedIds = new Set(finalQuestionData.map(q => q.id));
          const pads = getPaddingQuestions(needed, catId, null, excludedIds);
          finalQuestionData.push(...pads);
        }
      }

      const categoryName = CATEGORY_NAMES[catId] || catId.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

      mocks.push({
        id: `resurrection-cat-${catId}-${mocks.length + 1}`,
        title: `${categoryName} Mock`,
        questions: 10,
        minutes: 10,
        type: 'resurrection',
        questionData: finalQuestionData
      });
    }

    // Refresh category counts
    sortedCats = getCategoryCounts(remaining);
  }

  // 3. Leftover mixed mistakes
  let mixedIndex = 1;
  while (remaining.length > 0) {
    const chunk = remaining.splice(0, 10);
    let finalQuestionData = [...chunk];

    if (finalQuestionData.length < 10) {
      const needed = 10 - finalQuestionData.length;
      const excludedIds = new Set(finalQuestionData.map(q => q.id));
      const pads = getPaddingQuestions(needed, null, null, excludedIds);
      finalQuestionData.push(...pads);
    }

    mocks.push({
      id: `resurrection-mixed-${mixedIndex}`,
      title: `Mixed Mock`,
      questions: 10,
      minutes: 10,
      type: 'resurrection',
      questionData: finalQuestionData
    });
    mixedIndex++;
  }

  return mocks;
}

function UnlockButton({ onClick, disabled, label = 'Bet', cost = 15 }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all active:scale-95 ${
        disabled
          ? 'bg-theme-surface/40 border-theme-border text-theme-muted opacity-50 cursor-not-allowed'
          : 'bg-theme-accent/15 border-theme-accent/30 text-theme-accent hover:bg-theme-accent hover:text-white shadow-lg shadow-theme-accent/5'
      }`}
    >
      <span>{label} {cost}</span>
      <KashCoinIcon className="w-3.5 h-3.5" />
    </button>
  );
}

function DailyMasteryCard({ dueQuestions, onUnlock }) {
  const dueCount = dueQuestions.length;
  const sessionCount = Math.min(10, dueCount);
  const disabled = dueCount === 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-theme-accent/20 bg-theme-surface/80 backdrop-blur-xl shadow-[0_18px_55px_-42px_rgba(0,0,0,0.65)]"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-theme-accent/10 via-transparent to-theme-primary/8 pointer-events-none" />
      <div className="relative p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-theme-accent/14 border border-theme-accent/25 text-theme-accent flex items-center justify-center shadow-lg shadow-theme-accent/10 shrink-0">
            <Sparkles size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-theme-accent mb-1">
              Daily Mastery
            </p>
            <h2 className="text-xl md:text-2xl font-black text-theme-text tracking-tight leading-tight">
              What's due today
            </h2>
            <p className="text-xs font-bold text-theme-muted mt-1">
              {disabled
                ? 'No SRS due. Resurrection will feed this queue.'
                : `${sessionCount} question${sessionCount === 1 ? '' : 's'} ready.`}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-theme-bg/55 border border-theme-border/60 px-3 py-2">
            <span className="text-2xl font-black text-theme-text leading-none">{dueCount}</span>
            <span className="text-[9px] uppercase tracking-widest text-theme-muted font-black leading-tight">Due</span>
          </div>
          <UnlockButton disabled={disabled} onClick={onUnlock} label="Bet" cost={15} />
        </div>
      </div>
    </motion.section>
  );
}

function ResurrectionMockCard({ mock, onUnlock }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-rose-500/20 bg-theme-surface/70 backdrop-blur-md p-5 shadow-[0_18px_45px_-35px_rgba(244,63,94,0.65)]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-theme-primary/8 opacity-80 pointer-events-none" />
      <div className="relative flex items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-rose-500/12 border border-rose-500/25 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/10">
            <Lock size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black text-theme-text leading-snug">
              {mock.title}
            </h4>
            <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-1 opacity-80">
              {mock.questions} Questions
            </p>
          </div>
        </div>
        <UnlockButton onClick={() => onUnlock(mock)} label="Bet" cost={15} />
      </div>
    </motion.div>
  );
}

export default function ResurrectionMockDashboard() {
  const { showToast } = useToast();
  const alert = (msg) => {
    showToast(msg, msg.toLowerCase().includes('success') ? 'success' : 'error');
  };

  const navigate = useNavigate();
  const { economy, spendRevisionKC } = useEconomy();
  const [resurrectionQuestions, setResurrectionQuestions] = useState([]);
  const [dueQuestions, setDueQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [spendPulse, setSpendPulse] = useState(null);

  const resurrectionMocks = useMemo(
    () => buildDynamicResurrectionMocks(resurrectionQuestions),
    [resurrectionQuestions]
  );

  const dueLevel15 = useMemo(() => dueQuestions.filter(q => (q.srs_interval || 1) < 60), [dueQuestions]);
  const dueLevel6 = useMemo(() => dueQuestions.filter(q => (q.srs_interval || 1) === 60), [dueQuestions]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resurrection, due, revisionStats] = await Promise.all([
        getResurrectionQuestions(),
        getDueSRSQuestions(0),
        getRevisionStats(),
      ]);
      setResurrectionQuestions(resurrection);
      setDueQuestions(due);
      setStats(revisionStats);
    } catch (error) {
      console.error('Failed to load Rank Booster data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const spendAndLaunch = async (mock) => {
    const cost = mock.type === 'mastery' ? 30 : 15;
    if (!economy || economy.kash_coins_balance < cost) {
      alert('Not enough KashCoins for this revision unlock.');
      return;
    }

    const ok = await spendRevisionKC(cost);
    if (!ok) {
      alert('Not enough KashCoins for this revision unlock.');
      return;
    }

    setSpendPulse(cost);
    setTimeout(() => setSpendPulse(null), 900);
    setTimeout(() => {
      navigate('/mock-test', { state: { mock, from: '/resurrection' } });
    }, 180);
  };

  const unlockDailyMastery = () => {
    const sessionQuestions = dueLevel15.slice(0, 10);
    if (sessionQuestions.length === 0) return;

    spendAndLaunch({
      id: `srs-daily-${sessionQuestions.map(q => q.id).join('-')}`,
      index: 1,
      title: 'Daily Mastery',
      questions: sessionQuestions.length,
      minutes: sessionQuestions.length,
      type: 'srs',
      questionData: sessionQuestions,
    });
  };

  const startLevel6Mastery = (question) => {
    spendAndLaunch({
      id: `mastery-${question.id}`,
      index: 1,
      title: 'Mastery Checkpoint',
      questions: 1,
      minutes: 2,
      type: 'mastery',
      questionData: [question],
    });
  };

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col pb-24">
      <Header />

      <AnimatePresence>
        {spendPulse !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.95 }}
            className="fixed top-24 right-6 z-50 flex items-center gap-2 rounded-full border border-theme-accent/30 bg-theme-surface/90 px-4 py-2 text-theme-accent font-black shadow-xl backdrop-blur-xl"
          >
            <KashCoinIcon className="w-5 h-5" />
            -{spendPulse} KC
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-6xl mx-auto px-6 py-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          <div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-theme-muted hover:text-theme-text transition-colors mb-6 group font-bold text-xs uppercase tracking-widest"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </button>

            <div className="flex flex-col md:flex-row md:items-end gap-6 justify-between">
              <div className="flex items-end gap-5">
                <div className="w-16 h-16 rounded-3xl border border-theme-primary/25 flex items-center justify-center text-white shadow-xl bg-gradient-primary">
                  <Flame size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-theme-primary opacity-80 mb-1">
                    Premium Revision Engine
                  </p>
                  <h1 className="text-3xl md:text-4xl font-black text-theme-text tracking-tighter leading-none mb-2">
                    Rank Booster
                  </h1>
                  <p className="text-sm font-bold text-theme-muted opacity-80 max-w-xl">
                    Wager KC to turn mistakes into scheduled mastery. Resurrection feeds SRS; SRS protects memory.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {[
                  { label: 'Mistakes', value: stats?.totalResurrection || 0, Icon: Target },
                  { label: 'Due', value: stats?.dueSRS || 0, Icon: CalendarClock },
                  { label: 'KC Spent', value: economy?.total_kc_spent_on_revision || 0, Icon: Sparkles },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="bg-theme-surface/60 border border-theme-border rounded-2xl px-4 py-3 min-w-[96px] text-center">
                    <Icon size={16} className="text-theme-primary mx-auto mb-2" />
                    <span className="block text-2xl font-black text-theme-text leading-none">{value}</span>
                    <span className="text-[9px] uppercase tracking-widest text-theme-muted font-black mt-1">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24 text-theme-primary">
              <RefreshCw size={32} className="animate-spin" />
            </div>
          ) : (
            <>
              <DailyMasteryCard dueQuestions={dueLevel15} onUnlock={unlockDailyMastery} />

              {/* --- Level 6 Mastery Checkpoints --- */}
              {dueLevel6.length > 0 && (
                <section className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500 mb-1">Double-Wager Mastery Checkpoint</p>
                    <h2 className="text-2xl font-black text-theme-text tracking-tight">Level 6 Mastery Checkpoints</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dueLevel6.map(q => (
                      <div key={q.id} className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-theme-surface/70 backdrop-blur-md p-5 shadow-[0_18px_45px_-35px_rgba(16,185,129,0.65)] flex justify-between items-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-theme-primary/8 opacity-80 pointer-events-none" />
                        <div className="min-w-0 flex-1 mr-4 relative z-10">
                          <h4 className="text-sm font-black text-theme-text leading-snug">
                            {q.question?.replace(/<[^>]*>/g, '').replace(/\$/g, '') || 'Spaced Review Question'}
                          </h4>
                          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-1">
                            {q.tags?.slice(0, 3).join(' • ') || 'Level 6 Mastery Card'}
                          </p>
                        </div>
                        <div className="relative z-10">
                          <UnlockButton onClick={() => startLevel6Mastery(q)} label="Bet" cost={30} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-500 mb-1">Persistence of Mistakes</p>
                    <h2 className="text-2xl font-black text-theme-text tracking-tight">Resurrection Mode</h2>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-theme-muted">
                    {resurrectionQuestions.length} MCQs waiting
                  </span>
                </div>

                {resurrectionMocks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center bg-theme-surface/30 border border-theme-border/50 rounded-3xl"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                      <Target size={36} className="text-emerald-500" />
                    </div>
                    <h3 className="font-black text-theme-text text-xl">No mistakes waiting</h3>
                    <p className="text-theme-muted text-sm mt-3 max-w-sm leading-relaxed">
                      Missed or skipped MCQs from mocks and practice will appear here as paid resurrection sessions.
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {resurrectionMocks.map(mock => (
                        <ResurrectionMockCard key={mock.id} mock={mock} onUnlock={spendAndLaunch} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
