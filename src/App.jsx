import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Home from './pages/Home';
import ExamEngine from './components/ExamEngine';
import PracticeEngine from './pages/PracticeEngine';
import FloatingNav from './components/FloatingNav';
import SignInPage from './pages/SignInPage';
import ProUpsellModal from './components/ProUpsellModal';
import { useEconomy } from './context/EconomyContext';
import { Sparkles } from 'lucide-react';
import NotFoundPage from './pages/NotFoundPage';

const AdminSubiStudio = React.lazy(() => import('./pages/AdminSubiStudio'));
const BookmarksDashboard = React.lazy(() => import('./pages/BookmarksDashboard'));
const ProfileDashboard = React.lazy(() => import('./pages/ProfileDashboard'));
const SubjectMockDashboard = React.lazy(() => import('./pages/SubjectMockDashboard'));
const ResurrectionMockDashboard = React.lazy(() => import('./pages/ResurrectionMockDashboard'));
const LeaderboardPage = React.lazy(() => import('./pages/LeaderboardPage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const BattleArena = React.lazy(() => import('./pages/BattleArena'));
const ExamMockDashboardPage = React.lazy(() => import('./pages/ExamMockDashboardPage'));



import { useAuth } from './context/AuthContext';
import { parseVideoUrl } from './lib/video';

function OnboardingGuard({ children }) {
  const { user } = useAuth();
  const { economy } = useEconomy();

  // FIX-02 (BUG-02): Secondary signal — written immediately after DB onboarding write succeeds.
  // Prevents a redirect loop when economy context still holds the stale cached profile
  // (onboarded: false) before the forced refresh has propagated.
  const isLocallyOnboarded = user
    ? localStorage.getItem(`mcqkash_onboarded_${user.id}`) === 'true'
    : false;

  if (user && economy && economy.id === user.id && economy.onboarded === false && !isLocallyOnboarded) {
    return <Navigate to="/signin" replace />;
  }
  return children;
}

function NavigationWrapper() {
  const location = useLocation();
  const { user } = useAuth();
  const { economy } = useEconomy();

  const isLocallyOnboarded = user
    ? localStorage.getItem(`mcqkash_onboarded_${user.id}`) === 'true'
    : false;
  const isNotOnboarded = user && economy && economy.id === user.id && economy.onboarded === false && !isLocallyOnboarded;
  const hideNav = location.pathname === '/mock-test' ||
                  location.pathname.startsWith('/admin/') ||
                  location.pathname === '/battle-arena' ||
                  location.pathname === '/signin' ||
                  isNotOnboarded;
  return !hideNav ? <FloatingNav /> : null;
}

/**
 * Keys ExamEngine to the mock's ID so React fully unmounts + remounts it
 * whenever the user navigates to a NEW mock (e.g., via the Continue button).
 * Without this, React reuses the existing ExamEngine instance and its stale
 * isSubmitted=true / answers state immediately shows the old ResultDashboard.
 */
function ExamEngineWrapper() {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) return null; // Wait for initial session loading to complete

  if (!user) {
    if (location.state?.mock) {
      try {
        localStorage.setItem('mcqkash_active_mock', JSON.stringify(location.state.mock));
        if (location.state.from) {
          localStorage.setItem('mcqkash_active_mock_from', location.state.from);
        }
        if (location.state.examId) {
          localStorage.setItem('mcqkash_active_mock_examId', location.state.examId);
        }
      } catch (e) {}
    }
    return <Navigate to="/signin" state={{ message: "Sign up to solve FREE Mock Tests and MCQs, and start analyzing your performance!" }} replace />;
  }

  let mockId = location.state?.mock?.id;
  if (!mockId) {
    try {
      const cached = localStorage.getItem('mcqkash_active_mock');
      if (cached) {
        const parsed = JSON.parse(cached);
        mockId = parsed.id;
      }
    } catch (e) {}
  }
  mockId = mockId ?? 'no-mock';

  return <ExamEngine key={mockId} />;
}

function AppLoadingSplash({ isFadingOut }) {
  return (
    <div className={`mcqkash-splash ${isFadingOut ? 'fade-out' : ''}`} role="status" aria-live="polite" aria-label="Loading MCQ Kash">
      <div className="mcqkash-splash-card">
        <h1 className="tracking-widest font-black">MCQ Kash</h1>
        <div className="mcqkash-splash-bar" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}

import { EconomyProvider } from './context/EconomyContext';
import { SoundProvider } from './context/SoundContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { loadOfflineQuestionsIntoSyncBank } from './lib/dataHub';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { economy } = useEconomy();
  const [contentReady, setContentReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [safetyTimeoutTriggered, setSafetyTimeoutTriggered] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadQuestionSources = async () => {
      try {
        await loadOfflineQuestionsIntoSyncBank();
      } catch (err) {
        console.warn("Failed to load question sources:", err);
      } finally {
        if (mounted) {
          setContentReady(true);
        }
      }
    };
    loadQuestionSources();

    // Safety guard: force load after 5 seconds to prevent indefinite hang
    const timer = setTimeout(() => {
      if (mounted) {
        setSafetyTimeoutTriggered(true);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Ensure questions, Auth, and Economy are fully resolved before hiding the splash screen
  const isFullyLoaded = safetyTimeoutTriggered || (contentReady && !authLoading && economy !== null && (!user || economy.id === user.id));

  useEffect(() => {
    if (isFullyLoaded) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 600); // sync with CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isFullyLoaded]);

  useEffect(() => {
    const handleVideoClick = (e) => {
      const wrapper = e.target.closest('.nk-video-wrapper');
      const playBtn = e.target.closest('.nk-video-play-btn');
      if (wrapper && !wrapper.querySelector('iframe') && !wrapper.querySelector('video')) {
        // If clicking play button, allow play anywhere. Otherwise prevent inside editor.
        if (!playBtn && wrapper.closest('[contenteditable="true"]')) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        const url = wrapper.getAttribute('data-video-url');
        const parsed = parseVideoUrl(url);
        if (parsed) {
          if (parsed.platform === 'native') {
            wrapper.innerHTML = `<video src="${parsed.embedUrl}" controls autoplay class="absolute inset-0 w-full h-full rounded-xl object-cover bg-black" style="border: none;"></video>`;
          } else {
            wrapper.innerHTML = `<iframe src="${parsed.embedUrl}" class="absolute inset-y-0 w-full h-full rounded-xl" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen allowtransparency="true" style="border: none; color-scheme: dark; background: #15202b;"></iframe>`;
          }
        }
      }
    };
    document.addEventListener('click', handleVideoClick, true);

    // Auto-load X.com (Twitter) embeds immediately
    const autoLoadTwitterEmbeds = () => {
      const wrappers = document.querySelectorAll('.nk-video-wrapper[data-video-platform="x"]');
      wrappers.forEach(wrapper => {
        if (!wrapper.querySelector('iframe')) {
          const url = wrapper.getAttribute('data-video-url');
          const parsed = parseVideoUrl(url);
          if (parsed) {
            wrapper.innerHTML = `<iframe src="${parsed.embedUrl}" class="absolute inset-y-0 w-full h-full rounded-xl" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen allowtransparency="true" style="border: none; color-scheme: dark; background: #15202b;"></iframe>`;
          }
        }
      });
    };

    autoLoadTwitterEmbeds();

    const observer = new MutationObserver(autoLoadTwitterEmbeds);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('click', handleVideoClick, true);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      {showSplash && (
        <AppLoadingSplash isFadingOut={isFullyLoaded} />
      )}
      <HashRouter>
        <React.Suspense fallback={
          <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg)' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-theme-primary" style={{ borderTopColor: 'rgb(var(--color-primary))' }}></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<OnboardingGuard><Home key={isFullyLoaded ? "ready" : "loading"} /></OnboardingGuard>} />
            <Route path="/mock-test" element={<OnboardingGuard><ExamEngineWrapper /></OnboardingGuard>} />
            <Route path="/mcq/:category" element={<OnboardingGuard><PracticeEngine /></OnboardingGuard>} />
            <Route path="/:category" element={<OnboardingGuard><PracticeEngine /></OnboardingGuard>} />
            <Route path="/mcq/:category/tag/:tag" element={<OnboardingGuard><PracticeEngine /></OnboardingGuard>} />
            <Route path="/:category/tag/:tag" element={<OnboardingGuard><PracticeEngine /></OnboardingGuard>} />
            <Route path="/pyq-archive/:examName" element={<OnboardingGuard><PracticeEngine isPyqArchive /></OnboardingGuard>} />
            <Route path="/admin/mapper" element={<Navigate to="/admin/subistudio" replace />} />
            <Route path="/admin/subistudio" element={<AdminSubiStudio />} />
            <Route path="/bookmarks" element={<OnboardingGuard><BookmarksDashboard /></OnboardingGuard>} />
            <Route path="/profile" element={<ProfileDashboard />} />
            <Route path="/leaderboard" element={<OnboardingGuard><LeaderboardPage /></OnboardingGuard>} />
            <Route path="/subject-mock/:category" element={<OnboardingGuard><SubjectMockDashboard /></OnboardingGuard>} />
            <Route path="/exam/:examId" element={<OnboardingGuard><ExamMockDashboardPage /></OnboardingGuard>} />
            <Route path="/resurrection" element={<OnboardingGuard><ResurrectionMockDashboard /></OnboardingGuard>} />
            <Route path="/upgrade" element={<OnboardingGuard><PricingPage /></OnboardingGuard>} />
            <Route path="/battle-arena" element={<OnboardingGuard><BattleArena /></OnboardingGuard>} />
            <Route path="/arena/challenge" element={<OnboardingGuard><BattleArena /></OnboardingGuard>} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </React.Suspense>
        <NavigationWrapper />
        {/* 🔒 UNIFIED PRO UPSELL MODAL — globally mounted so it is active even on custom router/header unmounted views */}
        <ProUpsellModal />
      </HashRouter>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SoundProvider>
        <EconomyProvider>
          <ToastProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </ToastProvider>
        </EconomyProvider>
      </SoundProvider>
    </ThemeProvider>
  );
}

export default App;
