import React from 'react';
import { renderMathInHtmlString } from '../lib/ai';

export default function PrintableTestPaper({
  test,
  attempt,
  onClose
}) {
  if (!test) return null;

  const questions = attempt?.questionsPayload || test.questions_data || [];
  const userAnswers = attempt?.answers || {};
  const score = attempt?.score ?? null;
  const accuracy = attempt?.accuracy ?? null;
  const candidateName = attempt?.userName || 'Candidate';
  const submittedAt = attempt?.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'N/A';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col overflow-y-auto bg-white text-zinc-900 print:p-0 print:m-0 print:bg-white print:text-black">
      {/* Screen Control Bar (Hidden on print) */}
      <div className="sticky top-0 z-10 bg-zinc-900 text-white p-4 flex items-center justify-between shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <span className="font-black text-sm uppercase tracking-wider text-amber-400">🖨️ Print & PDF Preview</span>
          <span className="text-xs text-zinc-400">Use browser print (Cmd+P / Ctrl+P) to save as PDF</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
          >
            Print Now / Save PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="max-w-4xl w-full mx-auto p-8 md:p-12 print:p-4 print:max-w-full font-serif leading-relaxed">
        {/* Official Header */}
        <div className="border-b-2 border-black pb-4 mb-6 text-center">
          <h1 className="text-2xl font-black tracking-tight uppercase text-black font-sans">
            MCQkash Official Question Paper & Evaluation Report
          </h1>
          <p className="text-sm font-bold text-zinc-700 mt-1 uppercase tracking-wide">
            {test.title} ({test.exam_id?.toUpperCase() || 'GLOBAL TEST'})
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs font-sans text-zinc-800 border-t border-zinc-300 pt-3">
            <div><strong>Candidate:</strong> {candidateName}</div>
            <div><strong>Total Qs:</strong> {questions.length}</div>
            <div><strong>Duration:</strong> {test.duration_mins || 120} Mins</div>
            <div><strong>Submitted:</strong> {submittedAt}</div>
            {score !== null && (
              <div className="col-span-2 sm:col-span-4 mt-2 p-2 bg-zinc-100 border border-zinc-300 rounded font-sans text-center">
                <strong>Net Score:</strong> <span className="text-emerald-700 font-black">{score.toFixed(2)} / {test.total_marks || questions.length}</span>
                {accuracy !== null && <span className="ml-4"><strong>Accuracy:</strong> {accuracy}%</span>}
              </div>
            )}
          </div>
        </div>

        {/* Question by Question list */}
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const userChoice = userAnswers[q.id];
            const isCorrect = userChoice && userChoice === q.correct_id;
            const isWrong = userChoice && userChoice !== q.correct_id;
            const isUnanswered = !userChoice;

            return (
              <div key={q.id || idx} className="border-b border-zinc-200 pb-5 break-inside-avoid">
                {/* Question Line */}
                <div className="flex items-start gap-2 text-sm font-bold text-zinc-900">
                  <span className="font-sans font-black text-xs px-2 py-0.5 bg-zinc-200 text-zinc-800 rounded">
                    Q.{idx + 1}
                  </span>
                  <div 
                    className="flex-1 font-sans text-zinc-900 leading-snug"
                    dangerToHTML={{ __html: renderMathInHtmlString(q.question) }}
                    dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(q.question) }}
                  />
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pl-8 text-xs font-sans">
                  {(q.options || []).map((opt, oIdx) => {
                    const optId = opt.id || String.fromCharCode(97 + oIdx);
                    const isSelectedByCandidate = userChoice === optId;
                    const isOfficialCorrect = q.correct_id === optId;

                    let badgeClass = "border-zinc-300 bg-white text-zinc-800";
                    if (isOfficialCorrect) {
                      badgeClass = "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold";
                    } else if (isSelectedByCandidate && !isOfficialCorrect) {
                      badgeClass = "border-rose-500 bg-rose-50 text-rose-900 font-bold line-through";
                    }

                    return (
                      <div 
                        key={optId}
                        className={`p-2 rounded border flex items-start gap-2 ${badgeClass}`}
                      >
                        <span className="font-black uppercase w-4 shrink-0">
                          {opt.label || optId.toUpperCase()}.
                        </span>
                        <span 
                          className="flex-1"
                          dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(opt.text || '') }}
                        />
                        {isOfficialCorrect && <span className="text-[10px] text-emerald-700 font-black">✓ [KEY]</span>}
                        {isSelectedByCandidate && !isOfficialCorrect && <span className="text-[10px] text-rose-700 font-black">✗ [YOUR CHOICE]</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="mt-3 pl-8">
                    <div className="p-3 bg-zinc-50 border-l-2 border-zinc-400 text-xs font-sans text-zinc-700">
                      <strong className="text-zinc-900 block mb-1 font-black uppercase text-[10px] tracking-wider">
                        Masterclass Explanation:
                      </strong>
                      <div 
                        dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(q.explanation) }}
                        className="leading-relaxed"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-zinc-300 text-center text-xs font-sans text-zinc-500">
          Generated via MCQkash (mcqkash.com) • Real-time Exam Mock Engine
        </div>
      </div>
    </div>
  );
}
