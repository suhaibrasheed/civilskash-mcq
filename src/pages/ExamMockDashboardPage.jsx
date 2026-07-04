import { useParams as useParamsRouter, useNavigate as useNavigateRouter } from 'react-router-dom';
import { EXAM_SERIES } from '../lib/exams';
import ExamMockDashboard from '../components/ExamMockDashboard';
import Header from '../components/Header';
import { AlertCircle } from 'lucide-react';

export default function ExamMockDashboardPage() {
  const { examId } = useParamsRouter();
  const navigate = useNavigateRouter();

  const exam = EXAM_SERIES.find(e => e.id === examId);

  if (!exam) {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-center">
          <AlertCircle size={40} className="text-rose-400 mb-4" />
          <h3 className="font-black text-theme-text text-xl">Exam Series Not Found</h3>
          <p className="text-theme-muted mt-2">The selected exam series could not be found.</p>
          <button onClick={() => navigate('/')} className="mt-6 px-6 py-2.5 bg-theme-primary text-white rounded-xl font-bold text-sm">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col pb-24">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8 w-full">
        <ExamMockDashboard
          key={exam.id}
          exam={exam}
          onBack={() => navigate('/')}
        />
      </main>
    </div>
  );
}
