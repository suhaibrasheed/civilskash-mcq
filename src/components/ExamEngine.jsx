import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Info, Maximize2, Minimize2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import McqCard from './McqCard';
import ResultDashboard from './ResultDashboard';
import { MCQKashLogo } from './Header';
import { useEconomy } from '../context/EconomyContext';
import UniversalModal from './UniversalModal';
import { useToast } from '../context/ToastContext';

export default function ExamEngine() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mock, setMock] = useState(() => {
    if (location.state?.mock) {
      return location.state.mock;
    }
    try {
      const cached = localStorage.getItem('mcqkash_active_mock');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const fromPath = location.state?.from || localStorage.getItem('mcqkash_active_mock_from') || '/';
  const examId = location.state?.examId || localStorage.getItem('mcqkash_active_mock_examId') || '';

  const [answers, setAnswers] = useState(() => {
    if (!mock) return {};
    try {
      const cached = localStorage.getItem(`mcqkash_mock_answers_${mock.id}`);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  const [timeLeft, setTimeLeft] = useState(() => {
    if (!mock) return 600;
    try {
      const cached = localStorage.getItem(`mcqkash_mock_time_${mock.id}`);
      if (cached) return Number(cached);
    } catch {}
    return mock.minutes ? mock.minutes * 60 : 600;
  });

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const { economy } = useEconomy();
  const { showToast } = useToast();
  const [palette, setPalette] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeSpent, setTimeSpent] = useState({});
  const currentIdxRef = React.useRef(0);
  const [used5050, setUsed5050] = useState({});
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
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

  useEffect(() => {
    if (location.state?.mock) {
      localStorage.setItem('mcqkash_active_mock', JSON.stringify(location.state.mock));
      localStorage.setItem('mcqkash_active_mock_from', location.state.from || '/');
      localStorage.setItem('mcqkash_active_mock_examId', location.state.examId || '');
      setMock(location.state.mock);
    }
  }, [location.state]);

  useEffect(() => {
    if (mock) {
      localStorage.setItem(`mcqkash_mock_answers_${mock.id}`, JSON.stringify(answers));
    }
  }, [answers, mock]);

  useEffect(() => {
    if (mock && timeLeft % 10 === 0) {
      localStorage.setItem(`mcqkash_mock_time_${mock.id}`, timeLeft.toString());
    }
  }, [timeLeft, mock]);
  
  useEffect(() => {
    if (!mock || !mock.questionData) {
      navigate('/');
      return;
    }
    
    let selected = [...mock.questionData];
    
    // Phase 5: Gating Logic. Paid revision modes must never receive dummy MCQs.
    const canInjectProLocks = mock.type !== 'resurrection' && mock.type !== 'srs';
    if (economy && economy.user_tier !== 'Pro' && canInjectProLocks) {
      // Dynamic lock percentage between 10% and 20% to create variable FOMO
      const lockPercentage = 0.10 + Math.random() * 0.10;
      const lockCount = Math.max(1, Math.floor(selected.length * lockPercentage));
      
      // Get all indices except the first one (so the very first question is never locked instantly)
      const availableIndices = [];
      for (let i = 1; i < selected.length; i++) availableIndices.push(i);
      
      // Shuffle indices
      for (let i = availableIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
      }
      
      // Pick the first `lockCount` indices
      const indicesToLock = availableIndices.slice(0, lockCount);
      for (const idx of indicesToLock) {
        selected[idx] = {
          ...selected[idx],
          id: `locked-exam-${selected[idx]?.id || idx}`,
          isLockedDummy: true,
          lockedQuestion: selected[idx],
        };
      }
    }

    setQuestions(selected);
    setPalette(selected.map((_, i) => ({
      id: i + 1,
      status: i === 0 ? 'not_answered' : 'unseen'
    })));
  }, [mock, navigate, economy?.user_tier]);

  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsSubmitted(true);
          return 0;
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
  }, [isSubmitted, questions]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'answered': return 'bg-emerald-500 text-white border-emerald-600';
      case 'marked': return 'bg-purple-500 text-white border-purple-600';
      case 'not_answered': return 'bg-rose-500 text-white border-rose-600';
      default: return 'bg-theme-surface border-theme-border text-theme-text';
    }
  };

  const updatePalette = (status) => {
    setPalette(prev => prev.map((p, i) => 
      i === currentIdx ? { ...p, status } : p
    ));
  };

  const handleNext = (status) => {
    updatePalette(status);
    const nextIdx = (currentIdx + 1) % questions.length;
    setCurrentIdx(nextIdx);
    currentIdxRef.current = nextIdx;
    
    // Mark next as not_answered if it was unseen
    setPalette(prev => prev.map((p, i) => 
      i === nextIdx && p.status === 'unseen' ? { ...p, status: 'not_answered' } : p
    ));
  };

  const handleClear = () => {
    updatePalette('not_answered');
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questions[currentIdx].id];
      return newAnswers;
    });
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    if (mock) {
      localStorage.removeItem(`mcqkash_mock_answers_${mock.id}`);
      localStorage.removeItem(`mcqkash_mock_time_${mock.id}`);
      localStorage.removeItem('mcqkash_active_mock');
      localStorage.removeItem('mcqkash_active_mock_from');
      localStorage.removeItem('mcqkash_active_mock_examId');
    }
  };

  if (questions.length === 0) {
    return <div className="min-h-screen bg-theme-bg flex items-center justify-center text-theme-text font-bold">Loading Smart Mock...</div>;
  }

  if (isSubmitted) {
    return <ResultDashboard questions={questions} answers={answers} mock={mock} timeSpent={timeSpent} used5050={used5050} />;
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col h-screen overflow-hidden">
      {/* Exam Header */}
      <header className="h-14 bg-theme-surface border-b border-theme-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => {
            if (mock) {
              localStorage.removeItem(`mcqkash_mock_answers_${mock.id}`);
              localStorage.removeItem(`mcqkash_mock_time_${mock.id}`);
              localStorage.removeItem('mcqkash_active_mock');
              localStorage.removeItem('mcqkash_active_mock_from');
              localStorage.removeItem('mcqkash_active_mock_examId');
            }
            navigate(fromPath, { state: { selectedExamId: examId } });
          }} className="p-2 hover:bg-theme-surface-hover rounded-full text-theme-text transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="scale-75 origin-left">
            <MCQKashLogo onlyIcon={true} />
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleFullscreen} 
            title={isFullscreen ? "Exit Full Screen" : "Full Screen Mode"}
            className="p-2 hover:bg-theme-surface-hover rounded-full text-theme-text transition-colors flex items-center justify-center border border-transparent hover:border-theme-border/50"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <div className="flex items-center gap-2 bg-theme-surface-hover px-4 py-1.5 rounded-full border border-theme-border shadow-inner">
            <Clock size={16} className={timeLeft < 120 ? 'text-rose-500 animate-pulse' : 'text-theme-primary'} />
            <span className={`font-mono font-bold ${timeLeft < 120 ? 'text-rose-500' : 'text-theme-text'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <button onClick={handleSubmit} className="bg-theme-primary hover:bg-blue-600 text-white px-6 py-1.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-theme-primary/10 hover:shadow-theme-primary/30 animate-subtle">
            Submit
          </button>
        </div>
      </header>

      {/* Main Content Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Question Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto mb-4 text-theme-muted font-bold flex justify-between items-center">
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <div className="flex items-center gap-2">
              <span className="bg-theme-primary/10 text-theme-primary px-2 py-1 rounded text-xs">+1 Mark / -0.25 Negative</span>
              <button 
                onClick={() => setIsInfoModalOpen(true)} 
                className="text-theme-muted hover:text-theme-text transition-colors p-1"
                title="Mock Guidelines"
              >
                <Info size={16} />
              </button>
            </div>
          </div>
          
          <McqCard 
            key={currentQuestion.id} 
            questionData={currentQuestion} 
            mode="exam" 
            externalSelection={answers[currentQuestion.id] || null}
            onSelect={(optionId) => {
              setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }));
              updatePalette('answered');
            }}
            onUse5050={() => {
              setUsed5050(prev => ({ ...prev, [currentQuestion.id]: true }));
            }}
          />
          
          {/* Action Buttons */}
          <div className="max-w-3xl mx-auto w-full mt-8 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-1">
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button 
                onClick={() => handleNext('marked')} 
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-theme-surface border border-theme-border rounded-full text-theme-text hover:bg-theme-surface-hover hover:border-purple-500/50 transition-all font-bold text-sm shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap`}
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
            <button 
              onClick={() => handleNext('answered')} 
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-black text-sm transition-all shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-95 whitespace-nowrap"
            >
              Save & Next
            </button>
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
              {palette.map((q, idx) => (
                <button 
                  key={q.id} 
                  onClick={() => {
                    setCurrentIdx(idx);
                    currentIdxRef.current = idx;
                  }}
                  className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold border shadow-sm ${getStatusColor(q.status)} hover:scale-105 transition-transform ${currentIdx === idx ? 'ring-2 ring-theme-primary ring-offset-2 ring-offset-theme-bg' : ''}`}
                >
                  {q.id}
                </button>
              ))}
            </div>

            {/* Mobile Submit Button */}
            <div className="mt-6">
              <button 
                onClick={handleSubmit} 
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-500/10 active:scale-95"
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Palette */}
        <div className="w-80 bg-theme-surface border-l border-theme-border hidden lg:flex flex-col shrink-0">
          <div className="p-4 border-b border-theme-border shrink-0 flex items-center justify-between">
            <h3 className="font-bold text-theme-text">Smart-Mock Palette</h3>
          </div>
          
          {/* Palette Legend */}
          <div className="p-4 border-b border-theme-border shrink-0 grid grid-cols-2 gap-3 text-xs text-theme-text font-medium">
            <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-600 shadow-sm inline-block"></span> Answered</div>
            <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-rose-600 shadow-sm inline-block"></span> Not Answered</div>
            <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-theme-bg border border-theme-border shadow-sm inline-block"></span> Not Visited</div>
            <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-purple-500 border border-purple-600 shadow-sm inline-block"></span> Marked</div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-4 gap-3">
              {palette.map((q, idx) => (
                <button 
                  key={q.id} 
                  onClick={() => {
                    setCurrentIdx(idx);
                    currentIdxRef.current = idx;
                  }}
                  className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold border shadow-sm ${getStatusColor(q.status)} hover:scale-105 transition-transform ${currentIdx === idx ? 'ring-2 ring-theme-primary ring-offset-2 ring-offset-theme-bg' : ''}`}
                >
                  {q.id}
                </button>
              ))}
            </div>
          </div>

          {/* Submit button in Palette */}
          <div className="p-6 border-t border-theme-border">
            <button 
              onClick={handleSubmit} 
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-500/10 active:scale-95 animate-subtle"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>
      
      {/* Smart-Mock Guidelines Modal */}
      <UniversalModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Mock Test Guidelines"
      >
        <div className="space-y-5 text-sm text-theme-text text-left leading-relaxed">
          <div className="space-y-1">
            <h4 className="font-bold text-theme-primary flex items-center gap-1.5">
              <span>📌</span> Mark for Review
            </h4>
            <p className="text-xs text-theme-muted pl-5">
              Highlights the question in purple in your navigation palette so you can quickly jump back to it. It does not affect your score.
            </p>
          </div>

          <div className="space-y-1 border-t border-theme-border/30 pt-3">
            <h4 className="font-bold text-amber-500 flex items-center gap-1.5">
              <span>⚡</span> 50/50 Lifeline Penalty
            </h4>
            <p className="text-xs text-theme-muted pl-5">
              Using the 50/50 lifeline costs 3 KashCoins and eliminates 2 incorrect options. If you answer correctly using 50/50, a penalty of <strong>0.5 marks is deducted</strong> (earning +0.50 net instead of +1.00 for that question).
            </p>
          </div>

          {economy?.user_tier !== 'Pro' ? (
            <div className="space-y-2 border-t border-amber-500/20 bg-amber-500/5 p-3.5 rounded-xl mt-3">
              <h4 className="font-bold text-amber-600 flex items-center gap-1.5">
                <span>🔒</span> Free Tier Scoring Limit
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                Serious aspirants attempt the complete Mock Test. This Test includes locked tricky Pro Questions (10–20%), reducing your maximum achievable score and earning ability as a Free Member. Upgrade to Pro for Full Access.
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
                You have active Pro status. All questions are fully unlocked and scoreable without limits.
              </p>
            </div>
          )}
        </div>
      </UniversalModal>
    </div>
  );
}
