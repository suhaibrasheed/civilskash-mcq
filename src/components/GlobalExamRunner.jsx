import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldCheck, CheckCircle2, AlertCircle, Info, Maximize2, Minimize2, Coffee, Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEconomy } from '../context/EconomyContext';
import { useToast } from '../context/ToastContext';
import { fetchWeeklyTestById, submitWeeklyScoreTelemetry, checkUserWeeklySubmission, formatExamName } from '../lib/globalTestsApi';
import { saveWeeklyTestAttemptLocally, getWeeklyTestAttemptLocally } from '../lib/db';
import McqCard from './McqCard';
import UniversalModal from './UniversalModal';

export default function GlobalExamRunner() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { economy } = useEconomy();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isUnderPreparation, setIsUnderPreparation] = useState(false);
  const [prepTestMeta, setPrepTestMeta] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [palette, setPalette] = useState([]);
  const [timeLeft, setTimeLeft] = useState(7200); // 120 mins
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [timeSpent, setTimeSpent] = useState({});

  const initialDurationRef = useRef(7200);
  const currentIdxRef = useRef(0);

  // Toggle Fullscreen
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

  // Initialize Palette for questions
  const initializePalette = (qs) => {
    return qs.map((q, i) => ({
      id: i + 1,
      qId: q.id,
      status: i === 0 ? 'not_answered' : 'unseen'
    }));
  };

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
        // 1. Check local vault (instant 0ms)
        const localAttempt = await getWeeklyTestAttemptLocally(testId);
        if (localAttempt) {
          showToast("You have already completed your 1 attempt for this test.", "info");
          navigate('/global-tests', { replace: true });
          return;
        }

        // 2. Fetch static test questions from local bundle
        const meta = location.state?.test;
        let testData = meta;
        if (!testData || !testData.questions_data || testData.questions_data.length === 0) {
          testData = await fetchWeeklyTestById(testId);
        }

        let rawQuestions = testData?.questions_data || testData?.questions || [];
        if (typeof rawQuestions === 'string') {
          try {
            rawQuestions = JSON.parse(rawQuestions);
          } catch (e) {}
        }

        if (!testData || !Array.isArray(rawQuestions) || rawQuestions.length === 0) {
          if (isMounted) {
            setPrepTestMeta(testData || meta || { id: testId, title: 'Weekly Global Mock' });
            setIsUnderPreparation(true);
          }
          return;
        }

        if (isMounted) {
          // Normalize every question with a guaranteed unique ID and correctId
          const normalizedQuestions = rawQuestions.map((q, idx) => ({
            ...q,
            id: q.id || `${testData.id}_q_${idx + 1}`,
            correctId: q.correctId || q.correct_id || 'a'
          }));

          setTest({ ...testData, questions_data: normalizedQuestions });
          setQuestions(normalizedQuestions);
          const initialPal = normalizedQuestions.map((q, i) => ({
            id: i + 1,
            qId: q.id,
            status: i === 0 ? 'not_answered' : 'unseen'
          }));
          setPalette(initialPal);

          const duration = (testData.duration_mins || 120) * 60;
          setTimeLeft(duration);
          initialDurationRef.current = duration;

          // Check if there was an active in-progress draft in localStorage
          const savedProgress = localStorage.getItem(`mcqkash_active_global_${testId}`);
          if (savedProgress) {
            try {
              const parsed = JSON.parse(savedProgress);
              if (parsed.answers) {
                setAnswers(parsed.answers);
                // Update palette status from saved answers
                setPalette(prev => prev.map((p, idx) => {
                  const q = normalizedQuestions[idx];
                  if (q && parsed.answers[q.id]) {
                    return { ...p, status: 'answered' };
                  }
                  return p;
                }));
              }
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

  // Timer Tick & Autosave
  useEffect(() => {
    if (loading || isSubmitted || !test) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(true);
          return 0;
        }
        if (prev % 10 === 0) {
          try {
            localStorage.setItem(`mcqkash_active_global_${testId}`, JSON.stringify({
              answers,
              timeLeft: prev - 1
            }));
          } catch (e) {}
        }
        return prev - 1;
      });

      // Track time spent per question
      if (questions.length > 0) {
        const qId = questions[currentIdxRef.current]?.id;
        if (qId) {
          setTimeSpent(prev => ({ ...prev, [qId]: (prev[qId] || 0) + 1 }));
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isSubmitted, test, answers, testId, questions]);

  const updatePaletteStatus = (status, targetIdx = currentIdx) => {
    setPalette(prev => prev.map((p, i) => 
      i === targetIdx ? { ...p, status } : p
    ));
  };

  const handleSelectOption = (optionId) => {
    const qId = questions[currentIdx]?.id;
    if (!qId) return;

    setAnswers(prev => {
      const nextAnswers = { ...prev, [qId]: optionId };
      return nextAnswers;
    });
    updatePaletteStatus('answered');
  };

  const handleClear = () => {
    const qId = questions[currentIdx]?.id;
    if (!qId) return;

    setAnswers(prev => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
    updatePaletteStatus('not_answered');
  };

  const handleNext = (statusAction = null) => {
    const qId = questions[currentIdx]?.id;
    const isAnswered = qId && answers[qId] !== undefined;

    if (statusAction === 'marked') {
      updatePaletteStatus('marked');
    } else if (!isAnswered) {
      updatePaletteStatus('not_answered');
    } else {
      updatePaletteStatus('answered');
    }

    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      currentIdxRef.current = nextIdx;

      setPalette(prev => prev.map((p, i) => 
        i === nextIdx && p.status === 'unseen' ? { ...p, status: 'not_answered' } : p
      ));
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      setCurrentIdx(prevIdx);
      currentIdxRef.current = prevIdx;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'answered': return 'bg-emerald-500 text-white border-emerald-600';
      case 'marked': return 'bg-purple-500 text-white border-purple-600';
      case 'not_answered': return 'bg-rose-500 text-white border-rose-600';
      default: return 'bg-theme-surface border-theme-border text-theme-text';
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
        const correctChoice = q.correctId || q.correct_id;
        if (!userChoice) {
          unansweredCount++;
        } else if (String(userChoice).toLowerCase() === String(correctChoice).toLowerCase()) {
          correctCount++;
        } else {
          wrongCount++;
        }
      });

      const totalAttempted = correctCount + wrongCount;
      const rawScore = (correctCount * (test.marks_per_question || 1.0)) - (wrongCount * negMark);
      const netScore = Math.max(0, parseFloat(rawScore.toFixed(2)));
      const accuracy = totalAttempted > 0 ? parseFloat(((correctCount / totalAttempted) * 100).toFixed(1)) : 0;
      const totalTimeSpent = initialDurationRef.current - timeLeft;
      const candidateName = economy?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Aspirant';

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
        timeSpentSeconds: totalTimeSpent,
        submittedAt: new Date().toISOString(),
        resultRevealAt: test.result_reveal_at,
        questionsPayload: questions,
        isLocked: true
      };

      await saveWeeklyTestAttemptLocally(attemptVaultRecord);

      // 2. Submit score row to Supabase for global leaderboard ranking
      try {
        await submitWeeklyScoreTelemetry({
          testId: test.id,
          userId: user.id,
          userName: candidateName,
          score: netScore,
          accuracy,
          timeSeconds: totalTimeSpent,
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
        <p className="text-xs text-theme-muted mt-1">Please wait while questions are decrypted from local vault.</p>
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
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-md w-full bg-theme-surface/90 border border-theme-border/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center">
          <div className="relative mb-5">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10 p-5">
              <Coffee size={36} className="animate-bounce" style={{ animationDuration: '2.5s' }} />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-theme-surface"></span>
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 font-black text-[10px] uppercase tracking-wider mb-3">
            <Sparkles size={12} /> {isUpcomingTest ? 'Scheduled Mock • Coming Soon' : 'Curators at Work'}
          </div>

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

  const currentQuestion = questions[currentIdx];
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const markedCount = palette.filter(p => p.status === 'marked').length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col h-screen overflow-hidden select-none">
      {/* Exam Header */}
      <header className="h-14 bg-theme-surface border-b border-theme-border flex items-center justify-between px-3 sm:px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setShowSubmitModal(true)} 
            className="p-1.5 sm:p-2 hover:bg-theme-surface-hover rounded-full text-theme-text transition-colors"
            title="Leave / Submit Test"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-black">
              <ShieldCheck size={16} />
            </div>
            <div className="hidden sm:block">
              <h2 className="font-black text-xs md:text-sm text-theme-text uppercase tracking-tight line-clamp-1 max-w-xs md:max-w-md">
                {test?.title || 'Weekly Global Test'}
              </h2>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setIsInfoModalOpen(true)}
            title="Exam Guidelines"
            className="p-1.5 sm:p-2 hover:bg-theme-surface-hover rounded-full text-theme-muted hover:text-theme-text transition-colors flex items-center justify-center border border-transparent hover:border-theme-border/50"
          >
            <Info size={16} />
          </button>
          <button 
            onClick={toggleFullscreen} 
            title={isFullscreen ? "Exit Full Screen" : "Full Screen Mode"}
            className="p-1.5 sm:p-2 hover:bg-theme-surface-hover rounded-full text-theme-text transition-colors flex items-center justify-center border border-transparent hover:border-theme-border/50"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2 bg-theme-surface-hover px-3 sm:px-4 py-1.5 rounded-full border border-theme-border shadow-inner">
            <Clock size={15} className={timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-amber-500'} />
            <span className={`font-mono font-bold text-sm sm:text-base ${timeLeft < 300 ? 'text-rose-500' : 'text-theme-text'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <button 
            onClick={() => setShowSubmitModal(true)} 
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 sm:px-5 py-1.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex-shrink-0"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Content Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Question Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 sm:p-6 md:p-8 custom-scrollbar">
          {currentQuestion && (
            <div className="max-w-3xl mx-auto">
              <div className="mb-4 text-theme-muted font-bold flex justify-between items-center text-xs">
                <span>Question {currentIdx + 1} of {questions.length}</span>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    +{test?.marks_per_question || 1.0} / -{test?.negative_marking ?? 0.25} Negative
                  </span>
                </div>
              </div>

              {/* Standardized McqCard in Exam Mode */}
              <McqCard 
                key={currentQuestion.id} 
                questionData={currentQuestion} 
                mode="exam" 
                externalSelection={answers[currentQuestion.id] || null}
                onSelect={handleSelectOption}
              />

              {/* Action Buttons */}
              <div className="w-full mt-6 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                  <button 
                    onClick={handlePrev}
                    disabled={currentIdx === 0}
                    className={`px-4 sm:px-5 py-2.5 bg-theme-surface border border-theme-border rounded-xl text-theme-text hover:bg-theme-surface-hover transition-all font-bold text-xs shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => handleNext('marked')} 
                    className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95"
                  >
                    Mark for Review
                  </button>
                  <button 
                    onClick={handleClear} 
                    className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-theme-surface border border-theme-border text-theme-muted hover:text-rose-400 hover:border-rose-500/40 rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95"
                  >
                    Clear
                  </button>
                </div>
                
                <button 
                  onClick={() => handleNext()} 
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  {currentIdx === questions.length - 1 ? 'Save & Review' : 'Save & Next'}
                </button>
              </div>

              {/* Mobile Question Palette */}
              <div className="w-full mt-8 border-t border-theme-border/60 pt-6 lg:hidden">
                <h3 className="font-bold text-theme-text text-xs uppercase tracking-wider mb-3">Question Palette</h3>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] text-theme-muted font-medium mb-3">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Answered ({answeredCount})</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Marked ({markedCount})</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Unanswered ({unansweredCount})</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-theme-surface border border-theme-border inline-block"></span> Unseen</div>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                  {palette.map((q, idx) => (
                    <button 
                      key={q.id} 
                      onClick={() => {
                        setCurrentIdx(idx);
                        currentIdxRef.current = idx;
                      }}
                      className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black border shadow-sm ${getStatusColor(q.status)} hover:scale-105 transition-transform ${currentIdx === idx ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-theme-bg' : ''}`}
                    >
                      {q.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Desktop Question Palette */}
        <div className="w-80 bg-theme-surface border-l border-theme-border hidden lg:flex flex-col shrink-0">
          <div className="p-4 border-b border-theme-border shrink-0 flex items-center justify-between">
            <h3 className="font-black text-xs uppercase tracking-wider text-theme-text">Question Palette</h3>
            <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              {questions.length} MCQs
            </span>
          </div>
          
          <div className="p-4 border-b border-theme-border shrink-0 grid grid-cols-2 gap-2.5 text-xs text-theme-text font-medium">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Answered ({answeredCount})</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span> Marked ({markedCount})</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Unanswered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-theme-bg border border-theme-border inline-block"></span> Unseen</div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-4 gap-2.5">
              {palette.map((q, idx) => (
                <button 
                  key={q.id} 
                  onClick={() => {
                    setCurrentIdx(idx);
                    currentIdxRef.current = idx;
                  }}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black border shadow-sm ${getStatusColor(q.status)} hover:scale-105 transition-transform ${currentIdx === idx ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-theme-bg' : ''}`}
                >
                  {q.id}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-theme-border bg-theme-bg/40">
            <button 
              onClick={() => setShowSubmitModal(true)} 
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/15 active:scale-95"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-theme-surface border border-theme-border rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-black text-lg text-theme-text tracking-tight">Submit Global Mock?</h3>
              <p className="text-xs text-theme-muted mt-1">
                Your score will be permanently sealed in the offline vault and posted to the statewide leaderboard.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] font-bold text-emerald-400 uppercase block">Answered</span>
                <span className="text-base font-black text-emerald-400">{answeredCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-[10px] font-bold text-purple-400 uppercase block">Marked</span>
                <span className="text-base font-black text-purple-400">{markedCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-[10px] font-bold text-rose-400 uppercase block">Unanswered</span>
                <span className="text-base font-black text-rose-400">{unansweredCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl border border-theme-border hover:bg-theme-surface text-theme-muted hover:text-theme-text font-bold text-xs transition-colors"
              >
                Back to Test
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <span>Confirm Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guidelines Modal */}
      <UniversalModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Official Mock Test Guidelines"
      >
        <div className="space-y-3 text-xs text-theme-text text-left leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-theme-surface border border-theme-border flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              🎯
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-theme-text">Marking Policy</h4>
              <p className="text-xs text-theme-muted mt-1">
                +{test?.marks_per_question || 1.0} mark for each correct answer. -{test?.negative_marking ?? 0.25} negative deduction for each incorrect answer.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-theme-surface border border-theme-border flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              📌
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-theme-text">Review Flag</h4>
              <p className="text-xs text-theme-muted mt-1">
                You can mark questions to revisit later before final submission.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-theme-surface border border-theme-border flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              🔒
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-theme-text">Result Declaration</h4>
              <p className="text-xs text-theme-muted mt-1">
                Official statewide rankings and verified master solutions unlock at the synchronized Result Drop time.
              </p>
            </div>
          </div>
        </div>
      </UniversalModal>
    </div>
  );
}
