import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Zap, ChevronRight, ChevronDown, Lock, AlertCircle, Target, CheckCircle2, TrendingUp, BookOpen } from 'lucide-react';
import { generateSubjectMocks } from '../lib/mockEngine';
import { getSolvedMocks } from '../lib/db';
import { getScoreBand, normalizeSolvedMocks } from '../lib/mockDashboardUi';
import Header from '../components/Header';

// ─── Sub-components ────────────────────────────────────────────────

function EliteTile({ mock, index, from, solvedMap }) {
  const navigate = useNavigate();
  const solved   = solvedMap?.[mock.id];
  const band     = getScoreBand(solved);

  if (mock.isEmpty) {
    return (
      <div className="group relative rounded-2xl p-5 overflow-hidden mock-locked-tile-3d">
        <div className="relative z-10 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-theme-bg/60 border border-theme-border flex items-center justify-center text-theme-muted">
            <Lock size={18} />
          </div>
          <div>
            <h4 className="font-black text-theme-muted text-sm">Elite Mock {index}</h4>
            <p className="text-[10px] uppercase tracking-[0.15em] text-theme-muted/70 font-bold mt-1">No questions yet</p>
          </div>
        </div>
      </div>
    );
  }

  // Solved badge overlay
  const badge = solved ? (
    <div className={`absolute -top-2 -right-2 z-20 flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md ${band.className} mock-score-badge`}>
      {solved.percentage >= 80 ? <CheckCircle2 size={8} /> : <TrendingUp size={8} />}
      {solved.percentage}%
    </div>
  ) : null;

  return (
    <div className="relative">
      {badge}
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/mock-test', { state: { mock, from } })}
        className={`group relative rounded-2xl p-5 cursor-pointer overflow-hidden transition-all duration-500
          ${band ? `${band.className} mock-score-card border` : 'mock-tile-3d'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-theme-primary/0 to-theme-primary/8 group-hover:to-theme-primary/15 transition-all duration-700 rounded-2xl" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-theme-primary/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-theme-primary/25 transition-colors duration-700" />

        <div className="relative z-10 flex flex-col items-center text-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-400 shadow-md
            ${band ? `${band.className} mock-score-tile border group-hover:scale-110` : 'bg-theme-bg/60 border border-theme-border text-theme-primary group-hover:bg-theme-primary group-hover:text-white group-hover:border-theme-primary group-hover:scale-110'}`}
          >
            {index}
          </div>
          <div>
            <h4 className={`font-black text-sm transition-colors
              ${band ? `${band.className} mock-score-text` : 'text-theme-text group-hover:text-theme-primary'}`}
            >
              Elite Mock {index}
            </h4>
            <p className={`text-[10px] uppercase tracking-[0.15em] font-bold mt-1
              ${band ? `${band.className} mock-score-text opacity-80` : 'text-theme-primary/70'}`}
            >
              {solved ? `Best: ${solved.percentage}%` : `${mock.questions}Q • ${mock.minutes} Min`}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MiniMockRow({ mock, from, solvedMap }) {
  const navigate = useNavigate();
  const solved   = solvedMap?.[mock.id];
  const band     = getScoreBand(solved);

  if (mock.isEmpty) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl mock-locked-tile-3d">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-theme-bg/60 border border-theme-border flex items-center justify-center">
          <Lock size={14} className="text-theme-muted" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-theme-muted">{mock.title}</h4>
          <p className="text-[10px] text-theme-muted uppercase tracking-widest mt-0.5 opacity-60">No questions yet</p>
        </div>
      </div>
    );
  }
  return (
    <motion.div
      layout
      whileHover={{ x: 4 }}
      onClick={() => navigate('/mock-test', { state: { mock, from } })}
      className={`group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300
        ${band ? `${band.className} mock-score-card border` : 'mock-tile-3d'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 shrink-0 rounded-xl font-black text-sm flex items-center justify-center transition-all shadow-sm
          ${band ? `${band.className} mock-score-tile border` : 'bg-theme-bg/60 border border-theme-border text-theme-text group-hover:bg-theme-primary group-hover:text-white group-hover:border-theme-primary'}`}
        >
          {mock.index}
        </div>
        <div>
          <h4 className={`text-sm font-bold leading-tight transition-colors
            ${band ? `${band.className} mock-score-text` : 'text-theme-text group-hover:text-theme-primary'}`}
          >
            {mock.title}
          </h4>
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest mt-0.5 opacity-60">
            {solved ? `Solved · Best ${solved.percentage}%` : `${mock.questions} Qs · ${mock.minutes} Mins`}
          </p>
        </div>
      </div>
      {solved ? (
        <div className={`shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${band.className} mock-score-pill`}>
          {solved.percentage >= 80 ? <CheckCircle2 size={10} /> : <TrendingUp size={10} />}
          {band.label}
        </div>
      ) : (
        <ChevronRight size={16} className="text-theme-muted group-hover:text-theme-primary group-hover:translate-x-1 transition-all shrink-0" />
      )}
    </motion.div>
  );
}

function EmptyState({ label }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center col-span-full"
    >
      <div className="w-16 h-16 rounded-2xl bg-theme-surface border border-theme-border flex items-center justify-center mb-4">
        <AlertCircle size={28} className="text-theme-muted" />
      </div>
      <h3 className="font-black text-theme-text text-lg">No mocks available</h3>
      <p className="text-theme-muted text-sm mt-2 max-w-xs leading-relaxed">
        Not enough questions for <span className="font-bold text-theme-text">{label}</span> yet.
      </p>
    </motion.div>
  );
}


function FilterBar({ tabs, activeTab, onTabChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-40 w-full md:w-auto">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:w-auto min-w-[240px] flex items-center justify-between px-5 py-3 rounded-xl bg-theme-surface/80 backdrop-blur-md border border-theme-border/80 text-sm font-black uppercase tracking-wider text-theme-text shadow-sm hover:border-theme-primary/50 transition-all"
      >
        <span className="flex items-center gap-3">
          <span className="text-[10px] text-theme-muted opacity-80">FILTER TOPIC</span>
          <span className="text-theme-primary truncate max-w-[120px]">{activeTab}</span>
        </span>
        <ChevronDown size={18} className={`text-theme-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-theme-primary' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 md:left-auto md:right-0 mt-3 w-full md:w-[400px] bg-theme-surface/95 backdrop-blur-2xl border border-theme-border/60 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-4 z-40 overflow-hidden"
            >
              <div className="flex flex-wrap gap-2">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => {
                      onTabChange(tab);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                      activeTab === tab
                        ? 'bg-theme-primary text-white border-theme-primary shadow-md shadow-theme-primary/30'
                        : 'bg-theme-bg border-theme-border text-theme-muted hover:border-theme-primary/40 hover:text-theme-text'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccomplishmentBar({ mocks, solvedMap, label }) {
  const total = mocks.filter(m => !m.isEmpty).length;
  if (total === 0) return null;

  const solvedCount = mocks.filter(m => !m.isEmpty && solvedMap?.[m.id]).length;
  const pct = Math.round((solvedCount / total) * 100);

  return (
    <div className="mock-progress-glass flex items-center gap-4 rounded-2xl px-4 py-3" aria-label={`${label} completion`}>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-theme-muted">{label} progress</span>
          <span className="text-xs font-black text-theme-text/80 whitespace-nowrap">
            {solvedCount}/{total}
          </span>
        </div>
        <div className="mock-progress-track h-2.5 rounded-full overflow-hidden">
          <div
            className="mock-progress-fill h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="mock-progress-trophy w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center">
        <Trophy size={18} />
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ────────────────────────────────────

export default function SubjectMockDashboard() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [showAllElite, setShowAllElite] = useState(false);
  const [showAllMini, setShowAllMini] = useState(false);
  const [solvedMap, setSolvedMap] = useState({});

  useEffect(() => {
    getSolvedMocks().then(records => setSolvedMap(normalizeSolvedMocks(records))).catch(() => {});
  }, [category]);

  const { topics, mocksByTopic, pyqMocks = [] } = useMemo(
    () => generateSubjectMocks(category),
    [category]
  );

  const formatCategoryName = (slug) => {
    return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };
  const categoryName = formatCategoryName(category);

  if (topics.length === 0 || !mocksByTopic[activeTab]) {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-center">
          <AlertCircle size={40} className="text-rose-400 mb-4" />
          <h3 className="font-black text-theme-text text-xl">Category Empty</h3>
          <p className="text-theme-muted mt-2">No questions found for this subject.</p>
          <button onClick={() => navigate('/')} className="mt-6 px-6 py-2.5 bg-theme-primary text-white rounded-xl font-bold text-sm">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentMocks = mocksByTopic[activeTab];
  const eliteMocks = currentMocks.elite || [];
  const miniMocks = currentMocks.mini || [];
  const allEliteEmpty = eliteMocks.length === 0;
  const allMiniEmpty = miniMocks.length === 0;

  const displayedElite = showAllElite ? eliteMocks : eliteMocks.slice(0, 5);
  const displayedMini = showAllMini ? miniMocks : miniMocks.slice(0, 2);

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col pb-24">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10"
        >
          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
            <div>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-theme-muted hover:text-theme-text transition-colors mb-6 group font-bold text-xs uppercase tracking-widest"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </button>

              <div className="flex items-end gap-5">
                <div className="w-14 h-14 rounded-2xl border border-theme-border/30 flex items-center justify-center text-white shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Target size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-theme-muted opacity-60 mb-1">
                    Subject Mock Tests
                  </p>
                  <h1 className="text-3xl font-black text-theme-text tracking-tighter leading-none">
                    {categoryName}
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="relative flex items-center justify-center">
                      <span className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-xs font-bold text-theme-muted opacity-80">
                      {eliteMocks.length} Elite • {miniMocks.length} Mini Mocks Available
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Filter Bar ── */}
            <FilterBar tabs={topics} activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* ── Elite Full-Length Mocks ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
                  <Trophy size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-theme-text uppercase tracking-tight">
                      Elite Full Mocks
                    </h2>
                    <span className="px-2 py-0.5 rounded-lg bg-theme-primary/15 text-theme-primary text-[9px] font-black border border-theme-primary/25 uppercase tracking-widest">
                      {activeTab}
                    </span>
                  </div>
                  <p className="text-[11px] text-theme-muted font-bold mt-0.5 opacity-70">
                    Comprehensive tests covering selected topics
                  </p>
                </div>
              </div>
              
              {!allEliteEmpty && eliteMocks.length > 5 && (
                <button 
                  onClick={() => setShowAllElite(!showAllElite)}
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text hover:border-theme-primary transition-all shadow-sm"
                >
                  {showAllElite ? 'View Less' : 'View All'}
                </button>
              )}
            </div>

            {!allEliteEmpty && (
              <div className="mb-4">
                <AccomplishmentBar mocks={eliteMocks} solvedMap={solvedMap} label={`${activeTab} Elite`} />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {allEliteEmpty ? (
                <EmptyState label={`${activeTab} Elite Mocks`} />
              ) : (
                <AnimatePresence>
                  {displayedElite.map((mock, i) => (
                    <EliteTile key={mock.id} mock={mock} index={mock.index} from={`/subject-mock/${category}`} solvedMap={solvedMap} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
                  <Zap size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-theme-text uppercase tracking-tight">
                    Mini Mocks
                  </h2>
                  <p className="text-[11px] text-theme-muted font-bold mt-0.5 opacity-70">
                    Quick practice sessions • {activeTab}
                  </p>
                </div>
              </div>
              
              {!allMiniEmpty && miniMocks.length > 2 && (
                <button 
                  onClick={() => setShowAllMini(!showAllMini)}
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text hover:border-theme-primary transition-all shadow-sm"
                >
                  {showAllMini ? 'View Less' : 'View All'}
                </button>
              )}
            </div>

            {!allMiniEmpty && (
              <div className="mb-4">
                <AccomplishmentBar mocks={miniMocks} solvedMap={solvedMap} label={`${activeTab} Mini`} />
              </div>
            )}

            <motion.div
              key={`mini-${activeTab}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {allMiniEmpty ? (
                <EmptyState label={`${activeTab} Mini Mocks`} />
              ) : (
                displayedMini.map(mock => (
                  <MiniMockRow key={mock.id} mock={mock} from={`/subject-mock/${category}`} solvedMap={solvedMap} />
                ))
              )}
            </motion.div>
          </section>

          {/* ── PYQ Masterclass ── */}
          {pyqMocks.length > 0 && (
            <section className="mt-12 pt-10 border-t border-theme-border/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-theme-text uppercase tracking-tight flex items-center gap-2">
                    PYQ Masterclass
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 text-[10px] font-black border border-amber-500/30 tracking-widest">OFFICIAL</span>
                  </h2>
                  <p className="text-xs text-theme-muted font-bold mt-1 opacity-80">
                    Mixed Previous Year Questions for {categoryName}
                  </p>
                </div>
              </div>
              
              <div className="mb-8">
                <AccomplishmentBar
                  mocks={pyqMocks}
                  solvedMap={solvedMap}
                  label="PYQ Masterclass"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pyqMocks.map(mock => (
                  <MiniMockRow
                    key={mock.id}
                    mock={mock}
                    from={`/subject-mock/${category}`}
                    solvedMap={solvedMap}
                  />
                ))}
              </div>
            </section>
          )}

        </motion.div>
      </main>
    </div>
  );
}
