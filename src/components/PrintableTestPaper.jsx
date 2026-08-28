import React from 'react';
import { createPortal } from 'react-dom';
import { renderMathInHtmlString } from '../lib/ai';
import { useEconomy } from '../context/EconomyContext';
import { useAuth } from '../context/AuthContext';
import { generateRollNumber } from './DigitalAdmitCardModal';
import { formatExamName } from '../lib/globalTestsApi';

export default function PrintableTestPaper({
  test,
  attempt,
  onClose
}) {
  if (!test) return null;

  const { economy } = useEconomy();
  const { user } = useAuth();

  const candidateFullName = attempt?.userName || 
                            economy?.full_name || 
                            user?.user_metadata?.full_name || 
                            user?.user_metadata?.name || 
                            'Civil Services Aspirant';

  const candidateUsername = economy?.username || 
                            user?.user_metadata?.username || 
                            user?.email?.split('@')[0] || 
                            'aspirant';

  const rollNumber = attempt?.rollNumber || generateRollNumber(test.id, user?.id || 'guest');
  const formattedExamTitle = formatExamName(test.exam_id);

  React.useEffect(() => {
    const prevTitle = document.title;
    document.title = `MCQKash by CivilsKash`;
    return () => {
      document.title = prevTitle;
    };
  }, []);

  const questions = attempt?.questionsPayload || test.questions_data || [];
  const userAnswers = attempt?.answers || {};
  const negMark = test.negative_marking ?? 0.25;

  const submittedAt = attempt?.submittedAt ? new Date(attempt.submittedAt) : null;
  const formattedSubmittedAt = submittedAt 
    ? submittedAt.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Completed Online Mock Test';

  const formattedExamWindow = test.window_start && test.window_end
    ? `${new Date(test.window_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — ${new Date(test.window_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : 'National Scheduled Window';

  // Calculate evaluation metrics
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  questions.forEach(q => {
    const userChoice = userAnswers[q.id];
    const correctKey = q.correctId || q.correct_id;
    if (!userChoice) {
      unansweredCount++;
    } else if (String(userChoice).toLowerCase() === String(correctKey || '').toLowerCase()) {
      correctCount++;
    } else {
      wrongCount++;
    }
  });

  const totalAttempted = correctCount + wrongCount;
  const calculatedScore = (correctCount * (test.marks_per_question || 1.0)) - (wrongCount * negMark);
  const netScore = attempt?.score !== undefined && attempt?.score !== null 
    ? attempt.score 
    : Math.max(0, parseFloat(calculatedScore.toFixed(2)));
  const totalQuestionsCount = questions.length > 0 ? questions.length : (test.total_questions || 1);
  const calculatedTotalMarks = totalQuestionsCount * (test.marks_per_question || 1.0);
  const totalMarks = calculatedTotalMarks % 1 === 0 ? calculatedTotalMarks.toFixed(0) : calculatedTotalMarks.toFixed(2);
  const accuracyPct = attempt?.accuracy !== undefined && attempt?.accuracy !== null 
    ? attempt.accuracy 
    : (totalAttempted > 0 ? parseFloat(((correctCount / totalAttempted) * 100).toFixed(1)) : 0);

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div 
      id="mcqkash-print-modal-portal" 
      className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-[999] flex flex-col overflow-y-auto"
    >
      {/* Scoped Strict Print Engine CSS (WYSIWYG Fidelity & Anti-Slicing Page Breaks) */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }

          /* Hide background app so only this A4 document prints */
          #root {
            display: none !important;
          }
          body > *:not(#mcqkash-print-modal-portal) {
            display: none !important;
          }

          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-screen-control-bar {
            display: none !important;
          }

          #mcqkash-print-modal-portal {
            position: static !important;
            display: block !important;
            visibility: visible !important;
            background: #ffffff !important;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: auto !important;
          }

          #mcqkash-printable-paper {
            position: static !important;
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          .print-doc-header {
            display: block !important;
            position: static !important;
            margin-bottom: 12px !important;
          }

          .print-question-block {
            margin-bottom: 10px !important;
          }

          .print-explanation-block {
            margin-top: 6px !important;
          }

          .print-promo-tile {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-doc-footer {
            margin-top: 10px !important;
          }

          /* Color-coded highlighting inside Masterclass Explanations */
          .explanation-content strong,
          .explanation-content b {
            font-weight: 800 !important;
            color: #000000 !important;
          }
          .explanation-content .text-red,
          .explanation-content .text-rose {
            color: #dc2626 !important;
            font-weight: 700 !important;
          }
          .explanation-content .text-blue {
            color: #2563eb !important;
            font-weight: 700 !important;
          }
          .explanation-content .text-emerald,
          .explanation-content .text-green {
            color: #059669 !important;
            font-weight: 700 !important;
          }
          .explanation-content .text-amber,
          .explanation-content .text-orange {
            color: #d97706 !important;
            font-weight: 700 !important;
          }
          .explanation-content .text-purple {
            color: #7c3aed !important;
            font-weight: 700 !important;
          }
        }
      `}</style>

      {/* Screen Control Bar (Hidden during printing) */}
      <div className="print-screen-control-bar sticky top-0 z-20 bg-zinc-900/95 backdrop-blur-md text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xl border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-amber-400 flex items-center gap-2">
            🖨️ Candidate's Report Card (A4 Preview)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            Print / Save PDF (A4)
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Scrollable Stage: Centers realistic A4 Sheet */}
      <div className="flex-1 py-6 sm:py-10 px-3 sm:px-6 flex justify-center items-start print:p-0 print:m-0">
        
        {/* Realistic A4 Page Sheet */}
        <div 
          id="mcqkash-printable-paper" 
          className="w-full max-w-[210mm] min-h-[297mm] bg-white text-zinc-900 shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-sm p-6 sm:p-10 md:p-12 font-serif leading-relaxed border border-zinc-300 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full flex flex-col justify-between"
        >
          
          {/* Main Content Area */}
          <div>
            {/* ═════════ HEADER (Page 1) ═════════ */}
            <div className="print-doc-header border-b-2 border-zinc-900 pb-3 mb-4 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10.5px] font-black uppercase tracking-wider text-amber-900 mb-1.5 font-sans">
                <span>⚡</span>
                <span>MCQKash Official Mock Series</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-zinc-950 font-sans">
                Candidate's Report Card
              </h1>
              <p className="text-xs sm:text-sm font-bold text-zinc-700 mt-1 uppercase tracking-wide font-sans">
                {test.title}
              </p>
              <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                Live Statewide Leaderboard & Analytics at <strong className="text-amber-700 underline font-black">civilskash.in/mcq/</strong>
              </p>
              
              {/* Candidate & Exam Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-sans text-zinc-800 border-t border-zinc-300 pt-3 text-left bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <div>
                  <span className="text-zinc-500 uppercase text-[9.5px] font-bold block">Candidate Name</span>
                  <strong className="text-sm text-black">{candidateFullName}</strong>
                  <span className="text-zinc-500 text-[10px] block">@{candidateUsername}</span>
                </div>
                <div>
                  <span className="text-zinc-500 uppercase text-[9.5px] font-bold block">Roll Number</span>
                  <strong className="text-sm text-black font-mono">{rollNumber}</strong>
                  <span className="text-zinc-500 text-[10px] block font-bold">{formattedExamTitle}</span>
                </div>
                <div>
                  <span className="text-zinc-500 uppercase text-[9.5px] font-bold block">Exam Specifications</span>
                  <strong className="text-black">{questions.length} Questions ({test.duration_mins || 120} Mins)</strong>
                  <span className="text-zinc-500 text-[10px] block">Marking: +{test.marks_per_question || 1.0} / -{negMark}</span>
                </div>
                <div>
                  <span className="text-zinc-500 uppercase text-[9.5px] font-bold block">Attempt Submitted</span>
                  <strong className="text-black">{formattedSubmittedAt}</strong>
                  <span className="text-zinc-500 text-[10px] block">Window: {formattedExamWindow}</span>
                </div>
              </div>

              {/* Evaluated Official Scorecard Summary */}
              <div className="mt-4 p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50/70 font-sans text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-300 pb-2 mb-3">
                  <span className="font-black text-emerald-900 uppercase text-xs tracking-wider">
                    🏆 Official Evaluated Scorecard & Performance Summary
                  </span>
                  <span className="bg-emerald-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider w-fit">
                    Evaluated Attempt
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Final Net Score</span>
                    <span className="text-lg font-black text-emerald-700">{netScore.toFixed(2)} / {totalMarks}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Test Accuracy</span>
                    <span className="text-lg font-black text-emerald-700">{accuracyPct}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Attempt Breakdown</span>
                    <span className="text-xs font-bold text-zinc-800 block mt-1">
                      <span className="text-emerald-700 font-black">{correctCount} Correct</span> • <span className="text-rose-700 font-black">{wrongCount} Wrong</span>
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Negative Marking</span>
                    <span className="text-xs font-black text-rose-700 block mt-1">
                      -{(wrongCount * negMark).toFixed(2)} Marks ({negMark}/wrong)
                    </span>
                  </div>
                </div>
              </div>

              {/* ═════════ TOP MARKETING & AUTHENTICATION STAMP TILE ═════════ */}
              <div className="print-promo-tile mt-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/[0.07] via-orange-500/[0.04] to-amber-500/[0.07] border-2 border-amber-500/30 text-zinc-900 font-sans shadow-sm text-left">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center font-black text-base shadow-md shrink-0 border border-amber-400">
                      🏆
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs sm:text-sm text-black tracking-tight uppercase">
                          MCQKash • National Mock Arena
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 text-[9px] font-black uppercase tracking-wider border border-amber-500/30">
                          Official Exam App
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-[11px] text-zinc-700 font-semibold mt-0.5 leading-snug">
                        10,000+ Topicwise MCQs • ⚔️ 1v1 Battle Duels • 🔄 Spaced Recall SRS • Statewide Merit Lists
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a 
                      href="https://civilskash.in/mcq/"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-white border-2 border-amber-500/50 hover:border-amber-600 text-zinc-900 text-[10.5px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-all group/cta"
                    >
                      <span className="text-zinc-600 font-bold">Portal:</span>
                      <span className="text-amber-600 font-mono underline decoration-amber-500 font-black group-hover/cta:text-amber-700">civilskash.in/mcq/</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* ═════════ QUESTION BY QUESTION LIST WITH COLOR-CODED MASTERCLASS ═════════ */}
            <div className="space-y-3.5">
              {questions.map((q, idx) => {
                const userChoice = userAnswers[q.id];
                const correctKey = q.correctId || q.correct_id;
                const isSelected = !!userChoice;
                const isCorrect = isSelected && String(userChoice).toLowerCase() === String(correctKey || '').toLowerCase();
                const isWrong = isSelected && !isCorrect;

                return (
                  <div key={q.id || idx} className="print-question-block border-b border-zinc-200 pb-3.5">
                    {/* Question Line */}
                    <div className="flex items-start gap-2 text-sm font-bold text-zinc-900">
                      <span className="font-sans font-black text-xs px-2 py-0.5 bg-zinc-200 text-zinc-800 rounded shrink-0">
                        Q.{idx + 1}
                      </span>
                      <div 
                        className="flex-1 font-sans text-zinc-900 leading-snug"
                        dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(q.question) }}
                      />
                      {!isSelected && (
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded border border-zinc-300 uppercase shrink-0">
                          Unattempted
                        </span>
                      )}
                    </div>

                    {/* Options List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pl-8 text-xs font-sans">
                      {(q.options || []).map((opt, oIdx) => {
                        const optId = opt.id || String.fromCharCode(97 + oIdx);
                        const isCandidateChoice = userChoice && String(userChoice).toLowerCase() === String(optId).toLowerCase();
                        const isOfficialCorrect = correctKey && String(correctKey).toLowerCase() === String(optId).toLowerCase();

                        let badgeClass = "border-zinc-300 bg-white text-zinc-800";
                        let statusLabel = null;

                        if (isOfficialCorrect && isCandidateChoice) {
                          badgeClass = "border-emerald-600 bg-emerald-100 text-emerald-950 font-bold";
                          statusLabel = <span className="text-xs font-black text-emerald-800 shrink-0 ml-1">✓</span>;
                        } else if (isOfficialCorrect) {
                          badgeClass = "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold";
                          statusLabel = <span className="text-xs font-black text-emerald-700 shrink-0 ml-1">✓</span>;
                        } else if (isCandidateChoice && !isOfficialCorrect) {
                          badgeClass = "border-rose-500 bg-rose-50 text-rose-900 font-bold";
                          statusLabel = <span className="text-xs font-black text-rose-600 shrink-0 ml-1">✗</span>;
                        }

                        return (
                          <div 
                            key={optId}
                            className={`p-2.5 rounded-lg border flex items-start justify-between gap-2 ${badgeClass}`}
                          >
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <span className="font-black uppercase w-4 shrink-0">
                                {opt.label || optId.toUpperCase()}.
                              </span>
                              <span 
                                className="flex-1"
                                dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(opt.text || '') }}
                              />
                            </div>
                            {statusLabel}
                          </div>
                        );
                      })}
                    </div>

                    {/* Masterclass Explanation with Rich Icon & Color-Coded Insights */}
                    {q.explanation && (
                      <div className="print-explanation-block mt-3.5 pl-3 sm:pl-8">
                        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/70 border-l-4 border-amber-500 border border-amber-200/80 text-xs font-sans text-zinc-900 shadow-sm leading-relaxed">
                          <div className="flex items-center gap-1.5 mb-1.5 text-amber-950 font-black uppercase text-[10.5px] tracking-wider">
                            <span className="text-sm">💡</span>
                            <span>Masterclass Explanation:</span>
                          </div>
                          <div 
                            dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(q.explanation) }}
                            className="explanation-content leading-relaxed font-sans text-zinc-900 font-medium text-[11.5px] space-y-1.5"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═════════ CLOSING MARKETING STAMP & OFFICIAL SEAL ═════════ */}
          <div className="print-doc-footer mt-8 font-sans">
            
            {/* Bottom Official Exam Seal & Marketing Tile */}
            <div className="print-promo-tile p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/[0.07] via-orange-500/[0.04] to-amber-500/[0.07] border-2 border-amber-500/30 text-zinc-900 shadow-sm text-left">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center font-black text-base shadow-md shrink-0 border border-amber-400">
                    ⚡
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-xs sm:text-sm text-black tracking-tight uppercase">
                        Boost Your Preparation on MCQKash
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-900 text-[9px] font-black uppercase tracking-wider border border-emerald-500/30">
                        100% Free
                      </span>
                    </div>
                    <p className="text-[10.5px] sm:text-[11px] text-zinc-700 font-semibold mt-0.5 leading-snug">
                      Join thousands of civil services aspirants practicing daily mocks, challenging opponents in 1v1 battle duels, and tracking merit ranks.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a 
                    href="https://civilskash.in/mcq/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-white border-2 border-amber-500/50 hover:border-amber-600 text-zinc-900 text-[10.5px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-all group/cta"
                  >
                    <span className="text-zinc-600 font-bold">Portal:</span>
                    <span className="text-amber-600 font-mono underline decoration-amber-500 font-black group-hover/cta:text-amber-700">civilskash.in/mcq/</span>
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>,
    document.body
  );
}
