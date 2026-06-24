import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Home from './pages/Home';
import ExamEngine from './components/ExamEngine';
import PracticeEngine from './pages/PracticeEngine';
import AdminSubiStudio from './pages/AdminSubiStudio';
import FloatingNav from './components/FloatingNav';
import BookmarksDashboard from './pages/BookmarksDashboard';
import ProfileDashboard from './pages/ProfileDashboard';
import SubjectMockDashboard from './pages/SubjectMockDashboard';
import ResurrectionMockDashboard from './pages/ResurrectionMockDashboard';
import LeaderboardPage from './pages/LeaderboardPage';
import PricingPage from './pages/PricingPage';
import BattleArena from './pages/BattleArena';
import SetupProfile from './pages/SetupProfile';
import { useEconomy } from './context/EconomyContext';


import { useAuth } from './context/AuthContext';
import { parseVideoUrl } from './lib/video';

function OnboardingGuard({ children }) {
  const { user, loading } = useAuth();
  const { economy } = useEconomy();
  const location = useLocation();

  if (loading || (user && (!economy || economy.id !== user.id))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg text-theme-text">
        <div className="btn-spin w-8 h-8 border-4 border-theme-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is authenticated but not onboarded, redirect to /setup-profile
  if (user && economy && !economy.onboarded && location.pathname !== '/setup-profile') {
    return <Navigate to="/setup-profile" replace />;
  }

  return children;
}

function NavigationWrapper() {
  const location = useLocation();
  const hideNav = location.pathname === '/mock-test' || location.pathname.startsWith('/admin/') || location.pathname === '/battle-arena' || location.pathname === '/setup-profile';
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
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/profile" state={{ message: "Sign up to start this Mock test and start Analyzing performance!" }} replace />;
  }

  const mockId = location.state?.mock?.id ?? 'no-mock';
  return <ExamEngine key={mockId} />;
}

function AppLoadingSplash({ isFadingOut }) {
  return (
    <div className={`mcqkash-splash ${isFadingOut ? 'fade-out' : ''}`} role="status" aria-live="polite" aria-label="Loading MCQ Kash">
      <div className="mcqkash-splash-card">
        <h1>MCQ Kash</h1>
        <div className="mcqkash-splash-bar" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}

import { EconomyProvider } from './context/EconomyContext';
import { SoundProvider } from './context/SoundContext';
import { ToastProvider } from './context/ToastContext';
import { loadOfflineQuestionsIntoSyncBank } from './lib/dataHub';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { economy } = useEconomy();
  const [contentReady, setContentReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadQuestionSources = async () => {
      await loadOfflineQuestionsIntoSyncBank();
      if (mounted) {
        setContentReady(true);
      }
    };
    loadQuestionSources();
    return () => { mounted = false; };
  }, []);

  // Ensure questions, Auth, and Economy are fully resolved before hiding the splash screen
  const isFullyLoaded = contentReady && !authLoading && (!user || (economy && economy.id === user.id));

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
            wrapper.innerHTML = `<iframe src="${parsed.embedUrl}" class="absolute inset-y-0 w-full h-full rounded-xl" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen allowtransparency="true" style="border: none; color-scheme: dark; background: #15202b; max-width: 550px; left: 0; right: 0; margin: 0 auto;"></iframe>`;
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
            wrapper.innerHTML = `<iframe src="${parsed.embedUrl}" class="absolute inset-y-0 w-full h-full rounded-xl" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen allowtransparency="true" style="border: none; color-scheme: dark; background: #15202b; max-width: 550px; left: 0; right: 0; margin: 0 auto;"></iframe>`;
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
      <BrowserRouter basename={window.location.pathname.startsWith('/mcq') ? '/mcq' : '/'}>
        <Routes>
          <Route path="/" element={<OnboardingGuard><Home key={isFullyLoaded ? "ready" : "loading"} /></OnboardingGuard>} />
          <Route path="/mock-test" element={<OnboardingGuard><ExamEngineWrapper /></OnboardingGuard>} />
          <Route path="/mcq/:category" element={<OnboardingGuard><PracticeEngine /></OnboardingGuard>} />
          <Route path="/mcq/:category/tag/:tag" element={<OnboardingGuard><PracticeEngine /></OnboardingGuard>} />
          <Route path="/pyq-archive/:examName" element={<OnboardingGuard><PracticeEngine isPyqArchive /></OnboardingGuard>} />
          <Route path="/admin/mapper" element={<Navigate to="/admin/subistudio" replace />} />
          <Route path="/admin/subistudio" element={<AdminSubiStudio />} />
          <Route path="/bookmarks" element={<OnboardingGuard><BookmarksDashboard /></OnboardingGuard>} />
          <Route path="/profile" element={<OnboardingGuard><ProfileDashboard /></OnboardingGuard>} />
          <Route path="/leaderboard" element={<OnboardingGuard><LeaderboardPage /></OnboardingGuard>} />
          <Route path="/subject-mock/:category" element={<OnboardingGuard><SubjectMockDashboard /></OnboardingGuard>} />
          <Route path="/resurrection" element={<OnboardingGuard><ResurrectionMockDashboard /></OnboardingGuard>} />
          <Route path="/upgrade" element={<OnboardingGuard><PricingPage /></OnboardingGuard>} />
          <Route path="/battle-arena" element={<OnboardingGuard><BattleArena /></OnboardingGuard>} />
          <Route path="/setup-profile" element={<SetupProfile />} />
        </Routes>
        <NavigationWrapper />
      </BrowserRouter>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SoundProvider>
        <EconomyProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </EconomyProvider>
      </SoundProvider>
    </ThemeProvider>
  );
}

export default App;
