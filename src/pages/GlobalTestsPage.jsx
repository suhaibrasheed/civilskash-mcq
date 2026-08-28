import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { Trophy, Clock, Calendar, CheckCircle2, ShieldCheck, AlertCircle, Share2, Printer, ChevronRight, Lock, Sparkles, Award, BarChart3, Users, Zap, ExternalLink, ArrowRight, Filter, Flame, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  fetchWeeklyTests, 
  getCachedWeeklyTestsSync, 
  formatExamName, 
  fetchWeeklyTestById, 
  fetchWeeklyTestLeaderboard, 
  getServerTimestamp,
  getWeeklySyncCooldownRemaining,
  recordWeeklySyncTimestamp
} from '../lib/globalTestsApi';
import { getAllWeeklyTestAttemptsLocally, getWeeklyTestAttemptLocally } from '../lib/db';
import PrintableTestPaper from '../components/PrintableTestPaper';
import DigitalAdmitCardModal from '../components/DigitalAdmitCardModal';
import GuestMockInviteModal from '../components/GuestMockInviteModal';

export default function GlobalTestsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tests, setTests] = useState(() => getCachedWeeklyTestsSync());
  const [localAttempts, setLocalAttempts] = useState({});
  const [loading, setLoading] = useState(() => getCachedWeeklyTestsSync().length === 0);
  const [serverNow, setServerNow] = useState(Date.now());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncCooldownMs, setSyncCooldownMs] = useState(() => getWeeklySyncCooldownRemaining());
  
  // Modals state
  const [admitCardTest, setAdmitCardTest] = useState(null);
  const [guestInviteTest, setGuestInviteTest] = useState(null);
  const [activeLeaderboardModal, setActiveLeaderboardModal] = useState(null); // { testId, testTitle, data: [] }
  const [printableTest, setPrintableTest] = useState(null); // { test, attempt }
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [loadingLeaderboardTestId, setLoadingLeaderboardTestId] = useState(null);

  // Sync cooldown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSyncCooldownMs(getWeeklySyncCooldownRemaining());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Load tests, local attempts, and server clock
  const loadData = async (forceRemote = false) => {
    try {
      if (tests.length === 0 && !forceRemote) setLoading(true);
      const [allTests, localVaultList, nowTimestamp] = await Promise.all([
        fetchWeeklyTests(forceRemote),
        getAllWeeklyTestAttemptsLocally(),
        getServerTimestamp()
      ]);

      const localMap = {};
      (localVaultList || []).forEach(att => {
        if (att && att.testId) {
          localMap[att.testId] = att;
        }
      });

      setTests(allTests || []);
      setLocalAttempts(localMap);
      setServerNow(nowTimestamp);

      // Handle deep-linked testId (?testId=xxx)
      const linkedTestId = searchParams.get('testId');
      if (linkedTestId && (allTests || []).length > 0) {
        const targetTest = allTests.find(t => t.id === linkedTestId);
        if (targetTest) {
          if (!user) {
            setGuestInviteTest(targetTest);
          } else if (!localMap[targetTest.id]) {
            setAdmitCardTest(targetTest);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load global tests page data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Manual Sync Button with 30-Minute Cooldown (Zero Question Egress)
  const handleManualSyncMeta = async () => {
    const cooldownRemaining = getWeeklySyncCooldownRemaining();
    if (cooldownRemaining > 0) {
      const minsLeft = Math.ceil(cooldownRemaining / (60 * 1000));
      showToast(`⏳ Sync cooldown active. You can refresh tests in ${minsLeft} minute${minsLeft > 1 ? 's' : ''}.`, "info");
      return;
    }

    try {
      setIsSyncing(true);
      await loadData(true);
      recordWeeklySyncTimestamp();
      setSyncCooldownMs(getWeeklySyncCooldownRemaining());
      showToast("⚡ Weekly tests metadata synced successfully!", "success");
    } catch (err) {
      showToast("Could not sync metadata. Please check your connection.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // Extract unique categories for filter bar
  const categories = useMemo(() => {
    const set = new Set();
    tests.forEach(t => {
      if (t.exam_id) set.add(t.exam_id);
    });
    return ['all', ...Array.from(set)];
  }, [tests]);

  // Filtered test list
  const filteredTests = useMemo(() => {
    const visibleTests = (tests || []).filter(t => t && t.status !== 'hidden' && t.status !== 'unpublished');
    if (selectedCategory === 'all') return visibleTests;
    return visibleTests.filter(t => t.exam_id === selectedCategory);
  }, [tests, selectedCategory]);

  // Open Leaderboard & Solution viewer
  const handleOpenLeaderboard = async (test) => {
    try {
      setLoadingLeaderboard(true);
      setLoadingLeaderboardTestId(test.id);
      showToast("Fetching live statewide merit list...", "info");

      const leaderboardData = await fetchWeeklyTestLeaderboard(test.id);
      setActiveLeaderboardModal({
        test,
        data: leaderboardData
      });
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      showToast("Could not load leaderboard.", "error");
    } finally {
      setLoadingLeaderboard(false);
      setLoadingLeaderboardTestId(null);
    }
  };

  // Magic 1-Tap Exam Link Share (Psychologically Motivating)
  const handleMagicShareExam = (test, e) => {
    e?.stopPropagation();
    const shareUrl = `${window.location.origin}/#/global-tests?testId=${test.id}`;
    const text = `🎯 *Attempt this Official Statewide Mock Test Live Now on MCQKash!*\n\n📝 Exam: *${test.title}*\n⚡ Single-attempt official test • Statewide Merit List & Percentiles.\n\nTake the free mock test here:\n👉 ${shareUrl}`;

    if (navigator.share) {
      navigator.share({
        title: `MCQKash: ${test.title}`,
        text: text,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      showToast("Magic test link copied to clipboard! Share on WhatsApp or Telegram.", "success");
    }
  };

  // WhatsApp Scorecard Share (Only when result declared)
  const handleShareScorecard = (test, attempt, e) => {
    e?.stopPropagation();
    const score = attempt?.score ?? 0;
    const accuracy = attempt?.accuracy ?? 0;
    const shareUrl = `${window.location.origin}/#/global-tests?testId=${test.id}`;
    const text = `🏆 *MCQKash Weekly Global Test Scorecard*\n\nExam: *${test.title}*\nMy Score: *${score.toFixed(2)} / ${test.total_marks || test.total_questions}*\nAccuracy: *${accuracy}%*\n\nChallenge my score on MCQKash:\n👉 ${shareUrl}`;
    
    if (navigator.share) {
      navigator.share({ title: 'MCQKash Scorecard', text, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      showToast("Scorecard copied to clipboard! Share on WhatsApp.", "success");
    }
  };

  // Trigger test start from Admit Card
  const handleStartExamFromAdmitCard = () => {
    if (!admitCardTest) return;
    const testToStart = admitCardTest;
    setAdmitCardTest(null);
    navigate(`/global-test/${testToStart.id}`, { state: { test: testToStart } });
  };

  const cooldownMinsLeft = Math.ceil(syncCooldownMs / (60 * 1000));

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col pb-24 text-theme-text">
      <Header />

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 w-full flex-1 flex flex-col">
        {/* Sleek, Modern Minimal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-theme-border">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-[10px] uppercase tracking-wider mb-2">
              <Trophy size={13} /> Global Test Arena
            </div>
            <h1 className="font-black text-2xl md:text-3xl tracking-tight text-theme-text">
              Weekly Live Tests
            </h1>
            <p className="text-xs md:text-sm text-theme-muted mt-1 font-medium">
              Official statewide open mocks • 1 attempt only • Results unlock on Result Day
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Sync Metadata Button (30-min Cooldown) */}
            <button
              onClick={handleManualSyncMeta}
              disabled={isSyncing}
              className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                syncCooldownMs > 0
                  ? 'bg-theme-surface/70 border-theme-border text-theme-muted hover:text-theme-text'
                  : 'bg-theme-surface hover:bg-theme-surface-hover border-theme-border hover:border-amber-500/40 text-theme-text active:scale-95'
              }`}
              title={syncCooldownMs > 0 ? `Sync cooldown active (${cooldownMinsLeft}m remaining)` : "Sync latest weekly mock metadata"}
            >
              <RefreshCw size={13} className={`${isSyncing ? 'animate-spin text-amber-500' : 'text-amber-500'}`} />
              <span>
                {isSyncing ? 'Syncing...' : syncCooldownMs > 0 ? `Synced (${cooldownMinsLeft}m)` : 'Sync Mocks'}
              </span>
            </button>

            <div className="px-4 py-2 rounded-2xl bg-theme-surface border border-theme-border text-center shadow-sm">
              <span className="text-[10px] font-bold text-theme-muted uppercase block">Available Tests</span>
              <span className="text-sm font-black text-amber-500">{tests.length} Scheduled</span>
            </div>
          </div>
        </div>

        {/* Category Filter Bar */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 custom-scrollbar no-scrollbar">
            {categories.map(cat => {
              const isActive = selectedCategory === cat;
              const label = cat === 'all' ? 'All Mocks' : formatExamName(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-theme-surface hover:bg-theme-surface-hover text-theme-muted hover:text-theme-text border-theme-border'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Tests Grid */}
        {loading && tests.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-2xl border-4 border-amber-500/20 border-t-amber-500 animate-spin mb-4" />
            <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">Loading Global Tests...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-theme-surface/50 border border-theme-border rounded-3xl p-8">
            <Trophy size={44} className="text-amber-500/30 mb-3" />
            <h3 className="font-black text-lg text-theme-text tracking-tight">No Tests Found in this Category</h3>
            <p className="text-xs text-theme-muted mt-1 max-w-sm">
              Try selecting "All Mocks" to explore all available statewide tests.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTests.map(test => {
              const attempt = localAttempts[test.id];
              const windowStart = new Date(test.window_start).getTime();
              const windowEnd = new Date(test.window_end).getTime();

              const isUpcoming = serverNow < windowStart;
              const isActive = serverNow >= windowStart && serverNow <= windowEnd;
              const isClosed = serverNow > windowEnd;
              const hasAttempted = !!attempt;

              return (
                <div 
                  key={test.id}
                  className={`bg-theme-surface border rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 relative group overflow-hidden ${
                    hasAttempted
                      ? 'border-emerald-500/30 hover:border-emerald-500/60 bg-gradient-to-b from-emerald-500/[0.03] to-theme-surface'
                      : 'border-theme-border hover:border-amber-500/40'
                  }`}
                >
                  {/* Top Bar: Category Pill, Live Status, Magic Share Icon */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-black text-[10px] uppercase tracking-wider">
                        {formatExamName(test.exam_id)}
                      </span>

                      {hasAttempted && (
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 size={10} /> Evaluated
                        </span>
                      )}

                      {!hasAttempted && isActive && (
                        <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /> Live Now
                        </span>
                      )}

                      {!hasAttempted && isUpcoming && (
                        <span className="px-2.5 py-0.5 bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 rounded-full font-black text-[10px] uppercase tracking-wider">
                          ⏳ Upcoming
                        </span>
                      )}

                      {!hasAttempted && isClosed && (
                        <span className="px-2.5 py-0.5 bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 rounded-full font-black text-[10px] uppercase tracking-wider">
                          Concluded
                        </span>
                      )}
                    </div>

                    {/* Magic One-Tap Share Icon Button */}
                    <button
                      onClick={(e) => handleMagicShareExam(test, e)}
                      title="Share test link with friends"
                      className="p-2 rounded-xl bg-theme-bg hover:bg-theme-surface-hover border border-theme-border text-theme-muted hover:text-amber-400 transition-all hover:scale-110 active:scale-95 shadow-sm"
                    >
                      <Share2 size={14} />
                    </button>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <h3 className="font-black text-lg md:text-xl text-theme-text tracking-tight group-hover:text-amber-400 transition-colors">
                      {test.title}
                    </h3>
                  </div>

                  {/* DYNAMIC MORPHING BODY */}
                  <div className="mt-auto">
                    {/* CASE 1: NOT ATTEMPTED - Specs preview */}
                    {!hasAttempted && (
                      <div className="mb-5">
                        <div className="flex items-center gap-3 text-xs text-theme-muted font-medium">
                          <span>{test.total_questions || 120} Questions</span>
                          <span>•</span>
                          <span>{test.duration_mins || 120} Mins</span>
                          <span>•</span>
                          <span className="text-amber-400 font-bold">+{test.marks_per_question || 1.0} / -{test.negative_marking || 0.25}</span>
                        </div>
                      </div>
                    )}

                    {/* CASE 2: ATTEMPTED - Instant Evaluated Scorecard Tile */}
                    {hasAttempted && (() => {
                      const actualQCount = attempt.questionsPayload?.length || test.questions_data?.length || test.total_questions || 1;
                      const marksPerQ = test.marks_per_question || 1.0;
                      const calculatedMax = actualQCount * marksPerQ;
                      const maxPossibleMarks = calculatedMax % 1 === 0 ? calculatedMax.toFixed(0) : calculatedMax.toFixed(2);
                      const formattedScore = attempt.score !== undefined && attempt.score !== null 
                        ? Number(attempt.score).toFixed(2) 
                        : '0.00';

                      return (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                              <Award size={16} /> Official Scorecard
                            </span>
                            <span className="text-sm font-black text-emerald-400">
                              Score: {formattedScore} / {maxPossibleMarks}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-theme-muted">
                            <span>Accuracy: <strong className="text-theme-text">{attempt.accuracy}%</strong></span>
                            <span>Time Spent: <strong className="text-theme-text">{Math.floor((attempt.timeSpentSeconds || 0) / 60)} mins</strong></span>
                          </div>
                          <p className="text-[11px] text-emerald-400/90 font-medium leading-tight pt-1 border-t border-emerald-500/10">
                            💡 <em>Keep checking the leaderboard as more candidates attempt this mock. Share with friends to challenge your rank!</em>
                          </p>
                        </div>
                      );
                    })()}

                    {/* ACTION BUTTON STRIP */}
                    <div className="flex items-center gap-2 pt-1">
                      {/* Active Test & Not Attempted: Clean "Start Test" button */}
                      {!hasAttempted && isActive && (
                        <button
                          onClick={() => {
                            if (!user) {
                              setGuestInviteTest(test);
                              return;
                            }
                            setAdmitCardTest(test);
                          }}
                          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Zap size={16} /> Start Test
                        </button>
                      )}

                      {/* Attempted: Instant Leaderboard, Print PDF, and Share Buttons */}
                      {hasAttempted && (
                        <>
                          <button
                            onClick={() => handleOpenLeaderboard(test)}
                            disabled={loadingLeaderboardTestId === test.id}
                            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-80"
                          >
                            {loadingLeaderboardTestId === test.id ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                                <span>Loading Merit List...</span>
                              </>
                            ) : (
                              <>
                                <Trophy size={14} /> Merit List & Solutions
                              </>
                            )}
                          </button>

                          <button
                            onClick={async () => {
                              let fullTest = test;
                              if (!fullTest.questions_data) {
                                const fetched = await fetchWeeklyTestById(fullTest.id);
                                if (fetched) fullTest = fetched;
                              }
                              setPrintableTest({ test: fullTest, attempt });
                            }}
                            className="p-3 bg-theme-bg hover:bg-theme-surface border border-theme-border text-theme-text rounded-2xl transition-all cursor-pointer"
                            title="Print / Save PDF Scorecard"
                          >
                            <Printer size={16} />
                          </button>

                          <button
                            onClick={(e) => handleShareScorecard(test, attempt, e)}
                            className="p-3 bg-theme-bg hover:bg-theme-surface border border-theme-border text-amber-500 rounded-2xl transition-all cursor-pointer"
                            title="Share Scorecard with Friends"
                          >
                            <Share2 size={16} />
                          </button>
                        </>
                      )}

                      {/* Upcoming Test */}
                      {!hasAttempted && isUpcoming && (
                        <button
                          onClick={() => navigate(`/global-test/${test.id}`, { state: { test } })}
                          className="w-full py-3.5 bg-theme-bg hover:bg-theme-surface border border-theme-border text-theme-muted hover:text-amber-400 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 group/btn cursor-pointer"
                        >
                          <span>⏳ Opens on {new Date(test.window_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          <ChevronRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      )}

                      {/* Closed Test (Not Attempted) */}
                      {!hasAttempted && isClosed && (
                        <button
                          onClick={() => handleOpenLeaderboard(test)}
                          className="w-full py-3.5 bg-theme-bg hover:bg-theme-surface border border-theme-border text-theme-text rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Trophy size={14} /> View Merit List
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Digital Admit Card Modal */}
      {admitCardTest && (
        <DigitalAdmitCardModal
          isOpen={!!admitCardTest}
          onClose={() => setAdmitCardTest(null)}
          onProceed={handleStartExamFromAdmitCard}
          test={admitCardTest}
          user={user}
        />
      )}

      {/* Guest Mock Invite Modal */}
      {guestInviteTest && (
        <GuestMockInviteModal
          isOpen={!!guestInviteTest}
          onClose={() => setGuestInviteTest(null)}
          test={guestInviteTest}
        />
      )}

      {/* Merit List & Solution Key Modal */}
      {activeLeaderboardModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-theme-surface border border-theme-border rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] scale-100 animate-in zoom-in-95 duration-200">
            {/* Modal Top Header */}
            <div className="p-5 sm:p-6 border-b border-theme-border bg-theme-bg/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-[10px] uppercase tracking-wider mb-1.5">
                  <Trophy size={12} /> Official Merit List
                </div>
                <h3 className="font-black text-xl text-theme-text uppercase tracking-tight line-clamp-1">
                  {activeLeaderboardModal.test.title}
                </h3>
              </div>

              {/* Action Buttons: Print & Close */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={async () => {
                    let fullTest = activeLeaderboardModal.test;
                    if (!fullTest.questions_data) {
                      const fetched = await fetchWeeklyTestById(fullTest.id);
                      if (fetched) fullTest = fetched;
                    }
                    setPrintableTest({ 
                      test: fullTest, 
                      attempt: localAttempts[activeLeaderboardModal.test.id] 
                    });
                  }}
                  className="px-3.5 py-2 bg-theme-bg hover:bg-theme-surface border border-theme-border rounded-xl font-bold text-xs text-theme-text flex items-center gap-1.5 transition-all shadow-sm"
                  title="Print / Save PDF"
                >
                  <Printer size={14} className="text-amber-500" />
                  <span className="hidden sm:inline">Print Paper</span>
                </button>
                <button 
                  onClick={() => setActiveLeaderboardModal(null)} 
                  className="p-2 rounded-xl bg-theme-bg hover:bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-theme-bg/40 border-b border-theme-border text-center">
              <div className="p-2.5 rounded-xl bg-theme-surface/70 border border-theme-border">
                <span className="text-[10px] font-bold text-theme-muted uppercase block">Candidates</span>
                <span className="text-sm font-black text-theme-text">{(activeLeaderboardModal.data || []).length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-theme-surface/70 border border-theme-border">
                <span className="text-[10px] font-bold text-theme-muted uppercase block">Top Score</span>
                <span className="text-sm font-black text-emerald-500">
                  {activeLeaderboardModal.data?.[0]?.score ? `${activeLeaderboardModal.data[0].score.toFixed(2)}` : 'N/A'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-theme-surface/70 border border-theme-border">
                <span className="text-[10px] font-bold text-theme-muted uppercase block">Total Marks</span>
                <span className="text-sm font-black text-theme-text">
                  {(() => {
                    const currentTest = activeLeaderboardModal.test;
                    const currentAttempt = localAttempts[currentTest.id];
                    const qCount = currentAttempt?.questionsPayload?.length || currentTest.questions_data?.length || currentTest.total_questions || 1;
                    const marksPerQ = currentTest.marks_per_question || 1.0;
                    const total = qCount * marksPerQ;
                    return total % 1 === 0 ? total.toFixed(0) : total.toFixed(2);
                  })()}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-theme-surface/70 border border-theme-border">
                <span className="text-[10px] font-bold text-theme-muted uppercase block">Avg Accuracy</span>
                <span className="text-sm font-black text-amber-500">
                  {activeLeaderboardModal.data?.length 
                    ? `${(activeLeaderboardModal.data.reduce((acc, r) => acc + (r.accuracy || 0), 0) / activeLeaderboardModal.data.length).toFixed(1)}%` 
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Main Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
              {loadingLeaderboard ? (
                <div className="py-20 text-center text-xs font-bold text-theme-muted uppercase tracking-wider flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin mb-3" />
                  Loading Merit List...
                </div>
              ) : (activeLeaderboardModal.data || []).length === 0 ? (
                <div className="py-20 text-center text-xs font-bold text-theme-muted flex flex-col items-center justify-center">
                  <Trophy size={36} className="text-amber-500/30 mb-2" />
                  <span>No submissions recorded yet for this test.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeLeaderboardModal.data.map((row, idx) => {
                    const isUser = user && row.user_id === user.id;
                    let rankBadge = `${idx + 1}`;
                    let cardBorder = 'border-theme-border bg-theme-bg/50';

                    if (idx === 0) {
                      rankBadge = '🥇 1st';
                      cardBorder = 'border-amber-500/50 bg-amber-500/10 shadow-sm';
                    } else if (idx === 1) {
                      rankBadge = '🥈 2nd';
                      cardBorder = 'border-zinc-400/40 bg-zinc-400/5';
                    } else if (idx === 2) {
                      rankBadge = '🥉 3rd';
                      cardBorder = 'border-amber-700/40 bg-amber-700/5';
                    }

                    if (isUser) {
                      cardBorder = 'border-amber-500 bg-amber-500/15 shadow-md ring-1 ring-amber-500';
                    }

                    return (
                      <div 
                        key={row.id || idx}
                        className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-200 ${cardBorder}`}
                      >
                        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                          <span className="w-12 font-black text-xs sm:text-sm text-center text-amber-500 shrink-0">
                            {rankBadge}
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-theme-text flex items-center gap-2 truncate">
                              <span className="truncate">{row.user_name || 'Aspirant'}</span>
                              {isUser && (
                                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full shrink-0">
                                  You
                                </span>
                              )}
                            </h4>
                            <span className="text-[11px] text-theme-muted block truncate">
                              Time: {Math.floor(row.time_seconds / 60)}m {row.time_seconds % 60}s • Accuracy: {row.accuracy}%
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3">
                          <span className="text-base sm:text-lg font-black text-emerald-500 block leading-tight">
                            {row.score?.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold text-theme-muted uppercase">
                            Score
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Bottom Footer */}
            <div className="p-4 border-t border-theme-border bg-theme-bg/60 flex items-center justify-between">
              <span className="text-xs font-bold text-theme-muted">
                Evaluated with official negative marking scheme
              </span>
              <button
                onClick={() => setActiveLeaderboardModal(null)}
                className="px-6 py-2.5 bg-theme-primary hover:opacity-90 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Sheet Modal */}
      {printableTest && (
        <PrintableTestPaper 
          test={printableTest.test}
          attempt={printableTest.attempt}
          onClose={() => setPrintableTest(null)}
        />
      )}
    </div>
  );
}
