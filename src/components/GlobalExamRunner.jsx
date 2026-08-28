import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldCheck, CheckCircle2, AlertCircle, HelpCircle, Check, Bookmark, Flag, ChevronLeft, ChevronRight, Maximize2, Minimize2, Eye, Coffee, Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchWeeklyTestById, submitWeeklyScoreTelemetry, checkUserWeeklySubmission, formatExamName } from '../lib/globalTestsApi';
import { saveWeeklyTestAttemptLocally, getWeeklyTestAttemptLocally } from '../lib/db';
import { renderMathInHtmlString } from '../lib/ai';

export default function GlobalExamRunner() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isUnderPreparation, setIsUnderPreparation] = useState(false);
  const [prepTestMeta, setPrepTestMeta] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [visited, setVisited] = useState({ 0: true });
  const [timeLeft, setTimeLeft] = useState(7200); // 120 mins
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaletteMobile, setShowPaletteMobile] = useState(false);

  const initialDurationRef = useRef(7200);
  const currentIdxRef = useRef(0);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  // Load Test & check 1-attempt guard
  useEffect(() => {
    let isMounted = true;
    const initTest = async () => {
      if (!user) {
        navigate('/signin', { state: { message: "Please sign in to participate in the Weekly Global Test." } });
        return;
      }

      try {
        setLoading(true);
        // 1. Check local vault
        const localAttempt = await getWeeklyTestAttemptLocally(testId);
        if (localAttempt) {
          showToast("You have already completed your 1 attempt for this test.", "info");
          navigate('/global-tests', { replace: true });
          return;
        }

        // 2. Check remote submission
        const remoteSub = await checkUserWeeklySubmission(testId, user.id);
        if (remoteSub) {
          showToast("You have already submitted this global test.", "info");
          navigate('/global-tests', { replace: true });
          return;
        }

        // 3. Fetch test data (Always load full test with questions_data)
        const meta = location.state?.test;
        const isUpcoming = meta?.window_start && new Date(meta.window_start).getTime() > Date.now();
        
        // If test is upcoming (future start date), show the Coffee Break upcoming view
        if (isUpcoming) {
          if (isMounted) {
            setPrepTestMeta(meta || { id: testId, title: 'Weekly Global Mock' });
            setIsUnderPreparation(true);
          }
          return;
        }

        let testData = meta;
        if (!testData || !testData.questions_data || testData.questions_data.length === 0) {
          testData = await fetchWeeklyTestById(testId);
        }

        // If questions are still empty / under preparation, show graceful Coffee Break view
        if (!testData || !testData.questions_data || testData.questions_data.length === 0) {
          if (isMounted) {
            setPrepTestMeta(testData || meta || { id: testId, title: 'Weekly Global Mock' });
            setIsUnderPreparation(true);
          }
          return;
        }

        if (isMounted) {
          setTest(testData);
          setQuestions(testData.questions_data);
          const duration = (testData.duration_mins || 120) * 60;
          setTimeLeft(duration);
          initialDurationRef.current = duration;

          // Check if there was an active in-progress draft in localStorage
          const savedProgress = localStorage.getItem(`mcqkash_active_global_${testId}`);
          if (savedProgress) {
            try {
              const parsed = JSON.parse(savedProgress);
              if (parsed.answers) setAnswers(parsed.answers);
              if (parsed.marked) setMarkedForReview(parsed.marked);
              if (parsed.timeLeft) setTimeLeft(parsed.timeLeft);
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error("Failed to load global test:", err);
        if (isMounted) {
          setPrepTestMeta(location.state?.test || { id: testId, title: 'Weekly Global Mock' });
          setIsUnderPreparation(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initTest();
    return () => { isMounted = false; };
  }, [testId, user]);

  // Timer Tick
  useEffect(() => {
    if (loading || isSubmitted || !test) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(true);
          return 0;
        }
        // Save progress every 10 seconds
        if (prev % 10 === 0) {
          try {
            localStorage.setItem(`mcqkash_active_global_${testId}`, JSON.stringify({
              answers,
              marked: markedForReview,
              timeLeft: prev - 1
            }));
          } catch (e) {}
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isSubmitted, test, answers, markedForReview, testId]);

  // Answer selection
  const handleSelectOption = (qId, optionId) => {
    setAnswers(prev => {
      const updated = { ...prev };
      if (updated[qId] === optionId) {
        delete updated[qId]; // toggle off
      } else {
        updated[qId] = optionId;
      }
      return updated;
    });
  };

  const toggleMarkForReview = (qId) => {
    setMarkedForReview(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      const next = currentIdx + 1;
      setCurrentIdx(next);
      currentIdxRef.current = next;
      setVisited(prev => ({ ...prev, [next]: true }));
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      const prev = currentIdx - 1;
      setCurrentIdx(prev);
      currentIdxRef.current = prev;
    }
  };

  // Final Submission with Offline Vault Locking
  const handleFinalSubmit = async (isAuto = false) => {
    if (isSubmitting || isSubmitted) return;
    setIsSubmitting(true);

    try {
      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;
      const negMark = test.negative_marking || 0.25;

      questions.forEach(q => {
        const userChoice = answers[q.id];
        if (!userChoice) {
          unansweredCount++;
        } else if (userChoice === q.correct_id) {
          correctCount++;
        } else {
          wrongCount++;
        }
      });

      const totalAttempted = correctCount + wrongCount;
      const rawScore = (correctCount * 1.0) - (wrongCount * negMark);
      const netScore = Math.max(0, parseFloat(rawScore.toFixed(2)));
      const accuracy = totalAttempted > 0 ? parseFloat(((correctCount / totalAttempted) * 100).toFixed(1)) : 0;
      const timeSpent = initialDurationRef.current - timeLeft;
      const candidateName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Aspirant';

      // 1. Store candidate's attempted test completely into local IndexedDB sealed vault
      const attemptVaultRecord = {
        testId: test.id,
        userId: user.id,
        userName: candidateName,
        answers,
        score: netScore,
        accuracy,
        totalAttempted,
        correctCount,
        wrongCount,
        unansweredCount,
        timeSpentSeconds: timeSpent,
        submittedAt: new Date().toISOString(),
        resultRevealAt: test.result_reveal_at,
        questionsPayload: questions,
        isLocked: true
      };

      await saveWeeklyTestAttemptLocally(attemptVaultRecord);

      // 2. Submit minimal score row to Supabase for global leaderboard ranking
      try {
        await submitWeeklyScoreTelemetry({
          testId: test.id,
          userId: user.id,
          userName: candidateName,
          score: netScore,
          accuracy,
          timeSeconds: timeSpent,
          targetExam: test.exam_id
        });
      } catch (cloudErr) {
        console.warn("Could not sync score telemetry to Supabase right now (will rely on local vault):", cloudErr);
      }

      // Cleanup local active storage
      localStorage.removeItem(`mcqkash_active_global_${testId}`);
      setIsSubmitted(true);
      setShowSubmitModal(false);

      showToast(isAuto ? "Time up! Test submitted successfully." : "🎉 Global Test Submitted Successfully!", "success");
      navigate('/global-tests', { replace: true, state: { justSubmitted: true, testId: test.id } });
    } catch (err) {
      console.error("Submission failed:", err);
      showToast("Error recording submission. Please check your connection.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl border-4 border-amber-500/20 border-t-amber-500 animate-spin mb-4" />
        <h3 className="font-black text-lg text-theme-text uppercase tracking-tight">Initializing Secure Test Environment...</h3>
        <p className="text-xs text-theme-muted mt-1">Please wait while questions are configured.</p>
      </div>
    );
  }

  if (isUnderPreparation) {
    const isUpcomingTest = prepTestMeta?.window_start && new Date(prepTestMeta.window_start).getTime() > Date.now();
    const formattedStartDate = prepTestMeta?.window_start 
      ? new Date(prepTestMeta.window_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

    return (
      <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-md w-full bg-theme-surface/90 border border-theme-border/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center">
          {/* Glowing Coffee Icon */}
          <div className="relative mb-5">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10 p-5">
              <Coffee size={36} className="animate-bounce" style={{ animationDuration: '2.5s' }} />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-theme-surface"></span>
            </span>
          </div>

          {/* Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 font-black text-[10px] uppercase tracking-wider mb-3">
            <Sparkles size={12} /> {isUpcomingTest ? 'Scheduled Mock • Coming Soon' : 'Curators at Work'}
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-black text-theme-text tracking-tight mb-1.5">
            Take a Coffee Break! ☕
          </h2>

          <p className="text-xs font-bold text-amber-400/90 mb-3 uppercase tracking-wide">
            {isUpcomingTest 
              ? `Live Window Opens on ${formattedStartDate}`
              : 'Questions are being prepared & reviewed'
            }
          </p>

          <p className="text-xs text-theme-muted leading-relaxed mb-6 max-w-xs">
            {isUpcomingTest ? (
              <>
                The question paper for <strong className="text-theme-text">{prepTestMeta?.title || 'this mock'}</strong> is being finalized and sealed by our educators for the upcoming live test. Mark your calendar and relax!
              </>
            ) : (
              <>
                The question paper for <strong className="text-theme-text">{prepTestMeta?.title || 'this mock'}</strong> is currently being finalized and verified by our exam experts. It will be ready shortly!
              </>
            )}
          </p>

          {/* Quick Details Capsule */}
          {prepTestMeta && (
            <div className="w-full grid grid-cols-2 gap-2 mb-6 text-center">
              <div className="p-2.5 rounded-2xl bg-theme-bg/60 border border-theme-border text-xs">
                <span className="text-[10px] font-bold text-theme-muted uppercase block">Target Exam</span>
                <span className="font-black text-amber-400">{formatExamName(prepTestMeta.exam_id)}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-theme-bg/60 border border-theme-border text-xs">
                <span className="text-[10px] font-bold text-theme-muted uppercase block">
                  {isUpcomingTest ? 'Start Date' : 'Duration'}
                </span>
                <span className="font-black text-theme-text">
                  {isUpcomingTest && formattedStartDate
                    ? formattedStartDate
                    : `${prepTestMeta.duration_mins || 120} Mins`}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => navigate('/global-tests')}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Trophy size={14} /> Back to Arena
            </button>
            <button
              onClick={() => navigate('/')}
              className="py-3 px-5 bg-theme-bg hover:bg-theme-surface border border-theme-border text-theme-text rounded-2xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx] || null;
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const markedCount = Object.keys(markedForReview).filter(k => markedForReview[k]).length;

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col select-none">
      {/* Top Exam Header */}
      <header className="sticky top-0 z-40 bg-theme-surface/90 backdrop-blur-md border-b border-theme-border px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-black">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="font-black text-xs md:text-sm text-theme-text uppercase tracking-tight line-clamp-1">
              {test?.title || 'Weekly Global Test'}
            </h2>
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
              Official Live Paper • 1 Attempt Only
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer Clock */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-black text-xs border shadow-inner ${timeLeft < 300 ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 animate-pulse' : 'bg-theme-bg text-theme-text border-theme-border'}`}>
            <Clock size={14} className={timeLeft < 300 ? 'text-rose-500' : 'text-amber-500'} />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 hidden md:flex items-center justify-center text-theme-muted hover:text-theme-text border border-theme-border rounded-xl hover:bg-theme-surface transition-all shadow-sm"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Runner Body */}
      <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 md:p-6 gap-6">
        {/* Left Column: Question Area */}
        <section className="flex-1 flex flex-col bg-theme-surface border border-theme-border rounded-3xl p-6 md:p-8 shadow-xl min-h-[500px]">
          {currentQ ? (
            <div className="flex-1 flex flex-col">
              {/* Question Index & Action Strip */}
              <div className="flex items-center justify-between border-b border-theme-border pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-theme-bg border border-theme-border rounded-xl text-xs font-black uppercase text-theme-text">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                    +1.0 / -{test?.negative_marking || 0.25}
                  </span>
                </div>

                <button
                  onClick={() => toggleMarkForReview(currentQ.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${markedForReview[currentQ.id] ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'text-theme-muted border-theme-border hover:bg-theme-bg'}`}
                >
                  <Flag size={13} className={markedForReview[currentQ.id] ? 'text-purple-400 fill-purple-400' : ''} />
                  <span>{markedForReview[currentQ.id] ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="text-base md:text-lg font-bold text-theme-text leading-relaxed mb-6 font-sans">
                <div 
                  dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(currentQ.question) }} 
                  className="space-y-3"
                />
              </div>

              {/* Options */}
              <div className="space-y-3 flex-1 mb-8">
                {(currentQ.options || []).map((opt, oIdx) => {
                  const optId = opt.id || String.fromCharCode(97 + oIdx);
                  const isSelected = answers[currentQ.id] === optId;

                  return (
                    <button
                      key={optId}
                      onClick={() => handleSelectOption(currentQ.id, optId)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 active:scale-[0.99] ${
                        isSelected
                          ? 'border-theme-primary bg-theme-primary/10 shadow-md ring-1 ring-theme-primary'
                          : 'border-theme-border bg-theme-bg/50 hover:bg-theme-bg text-theme-text'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                        isSelected ? 'bg-theme-primary text-white' : 'bg-theme-surface border border-theme-border text-theme-muted'
                      }`}>
                        {opt.label || optId.toUpperCase()}
                      </div>
                      <div 
                        className={`text-sm font-semibold pt-0.5 leading-relaxed ${isSelected ? 'text-theme-primary font-bold' : 'text-theme-text'}`}
                        dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(opt.text || '') }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Navigation Bottom Footer */}
              <div className="pt-4 border-t border-theme-border flex items-center justify-between gap-4">
                <button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  className="px-5 py-2.5 rounded-xl border border-theme-border text-theme-text font-bold text-xs flex items-center gap-1.5 hover:bg-theme-bg disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <button
                  onClick={() => setShowPaletteMobile(true)}
                  className="md:hidden px-3.5 py-2 rounded-xl bg-theme-bg border border-theme-border text-theme-muted text-xs font-bold"
                >
                  Palette ({answeredCount}/{questions.length})
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentIdx === questions.length - 1}
                  className="px-6 py-2.5 rounded-xl bg-theme-primary hover:opacity-90 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md active:scale-95"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* Right Column: Palette & Telemetry */}
        <aside className={`fixed inset-0 z-50 md:relative md:inset-auto md:z-auto bg-theme-surface md:bg-theme-surface/70 border border-theme-border rounded-3xl p-6 shadow-xl md:w-80 flex-col gap-4 ${showPaletteMobile ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex items-center justify-between border-b border-theme-border pb-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-theme-text">Question Palette</h3>
            <button onClick={() => setShowPaletteMobile(false)} className="md:hidden p-1 text-theme-muted">
              ✕
            </button>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-theme-muted border-b border-theme-border pb-3">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-theme-primary text-white" /> Answered ({answeredCount})</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500" /> Marked ({markedCount})</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-theme-bg border border-theme-border" /> Unanswered</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded ring-2 ring-amber-400" /> Current</div>
          </div>

          {/* Grid of buttons */}
          <div className="flex-1 overflow-y-auto max-h-[350px] md:max-h-[450px] custom-scrollbar pr-1">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isMarked = !!markedForReview[q.id];
                const isCurrent = currentIdx === idx;

                let bgClass = "bg-theme-bg border-theme-border text-theme-muted";
                if (isAnswered) {
                  bgClass = "bg-theme-primary text-white border-theme-primary shadow-sm font-black";
                }
                if (isMarked) {
                  bgClass = "bg-purple-600 text-white border-purple-500 shadow-sm font-black";
                }

                return (
                  <button
                    key={q.id || idx}
                    onClick={() => {
                      setCurrentIdx(idx);
                      currentIdxRef.current = idx;
                      setVisited(prev => ({ ...prev, [idx]: true }));
                      setShowPaletteMobile(false);
                    }}
                    className={`h-9 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${bgClass} ${isCurrent ? 'ring-2 ring-amber-400 scale-105' : 'hover:scale-105'}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Submit CTA */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
          >
            Finish & Submit ({answeredCount}/{questions.length})
          </button>
        </aside>
      </main>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-theme-surface border border-theme-border rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-3 border-2 border-emerald-500/30">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="font-black text-lg text-theme-text uppercase tracking-tight">Submit Global Test?</h3>
              <p className="text-xs text-theme-muted mt-1">
                You have only <strong>1 attempt</strong> for this official weekly mock.
              </p>
            </div>

            <div className="p-4 bg-theme-bg border border-theme-border rounded-2xl space-y-2 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-theme-muted">Total Questions:</span>
                <span className="text-theme-text">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Answered:</span>
                <span className="text-emerald-500 font-black">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Unanswered:</span>
                <span className="text-rose-400">{questions.length - answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Marked for Review:</span>
                <span className="text-purple-400">{markedCount}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 bg-theme-bg hover:bg-theme-surface border border-theme-border text-theme-text font-bold text-xs uppercase tracking-wider rounded-xl"
              >
                Back to Test
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
