import React, { useState, useEffect, useRef } from 'react';
import CategoryCard from '../components/CategoryCard';
import ExamMockDashboard from '../components/ExamMockDashboard';
import Header from '../components/Header';
import { BookOpen, ChevronRight, LayoutGrid, CheckCircle2, ShieldCheck, TrendingUp, Compass, Target, Sparkles, ArrowRight, RefreshCw, BarChart3, Flame, Gem, Zap, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEconomy } from '../context/EconomyContext';
import { getAllCategoryCounts } from '../lib/dataHub';
import { getAggregatedStats, getAllFailedQuestionsDB } from '../lib/db';
import { useNavigate, useLocation } from 'react-router-dom';
import { StreakModal, CoinsVaultModal } from '../components/EconomyUI';
import { useHomepageIntelligence } from '../hooks/useHomepageIntelligence';

import { EXAM_SERIES } from '../lib/exams';

// ── Data ───────────────────────────────────────────────────────────

const CATEGORY_LIST = [
  { name: 'Accountancy', slug: 'accountancy' },
  { name: 'Ancient History', slug: 'ancient-history' },
  { name: 'Computer Awareness', slug: 'computer-awareness' },
  { name: 'Current Affairs', slug: 'current-affairs' },
  { name: 'English', slug: 'english' },
  { name: 'Environment', slug: 'environment' },
  { name: 'General Science', slug: 'general-science' },
  { name: 'Indian Economy', slug: 'indian-economy' },
  { name: 'Indian Geography', slug: 'indian-geography' },
  { name: 'Indian Polity', slug: 'indian-polity' },
  { name: 'JK Affairs', slug: 'jk-affairs' },
  { name: 'Maths', slug: 'maths' },
  { name: 'Medieval History', slug: 'medieval-history' },
  { name: 'Modern History', slug: 'modern-history' },
  { name: 'Physical Geography', slug: 'physical-geography' },
  { name: 'Reasoning', slug: 'reasoning' },
  { name: 'Static GK', slug: 'static-gk' },
  { name: 'World Geography', slug: 'world-geography' },
];

function HeroStart() {
  const { isMatureUser, loading, intelligence } = useHomepageIntelligence();
  const isDynamic = isMatureUser && !loading && intelligence;

  const [greetingIndex, setGreetingIndex] = useState(0);
  const [subheadingIndex, setSubheadingIndex] = useState(0);
  const [activeTriggerIndex, setActiveTriggerIndex] = useState(0);
  const [subCapsule2Index, setSubCapsule2Index] = useState(0);

  const [showStreakRank, setShowStreakRank] = useState(() => Math.random() < 0.5);
  const [showWmi, setShowWmi] = useState(() => Math.random() < 0.5);
  const [subCapsuleStep, setSubCapsuleStep] = useState(0);

  const greetings = intelligence?.greetings || [];
  const allSubheadings = intelligence?.allSubheadings || [];
  const activeTriggers = intelligence?.activeTriggers || [];

  const greetingsRef = useRef(greetings);
  const subheadingsRef = useRef(allSubheadings);
  const activeTriggersRef = useRef(activeTriggers);

  useEffect(() => { greetingsRef.current = greetings; }, [greetings]);
  useEffect(() => { subheadingsRef.current = allSubheadings; }, [allSubheadings]);
  useEffect(() => { activeTriggersRef.current = activeTriggers; }, [activeTriggers]);

  const hasInitializedRandom = useRef(false);

  // Initialize indices randomly on dynamic load (refresh) exactly once
  useEffect(() => {
    if (isDynamic && !hasInitializedRandom.current) {
      if (greetings.length > 0) {
        setGreetingIndex(Math.floor(Math.random() * greetings.length));
      }
      if (allSubheadings.length > 0) {
        setSubheadingIndex(Math.floor(Math.random() * allSubheadings.length));
      }
      if (activeTriggers.length > 0) {
        setActiveTriggerIndex(Math.floor(Math.random() * activeTriggers.length));
        setSubCapsule2Index(Math.floor(Math.random() * activeTriggers.length));
      }
      hasInitializedRandom.current = true;
    }
  }, [isDynamic, greetings.length, allSubheadings.length, activeTriggers.length]);

  // 1. Subheading cycles every 8 seconds randomly
  useEffect(() => {
    if (!isDynamic) return;
    const interval = setInterval(() => {
      const len = subheadingsRef.current.length;
      if (len <= 1) return;
      setSubheadingIndex(currentIndex => {
        let nextIndex = Math.floor(Math.random() * len);
        while (nextIndex === currentIndex && len > 1) {
          nextIndex = Math.floor(Math.random() * len);
        }
        return nextIndex;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [isDynamic]);

  // 2. Sub-capsules cycle one by one every 6 seconds (in round-robin)
  useEffect(() => {
    if (!isDynamic) return;
    const interval = setInterval(() => {
      setSubCapsuleStep(step => {
        const nextStep = (step + 1) % 3;
        if (nextStep === 0) {
          // Toggle Subcapsule 1 (Streak vs Coins)
          setShowStreakRank(s => !s);
        } else if (nextStep === 1) {
          // Update Subcapsule 2 (Active Prep trigger)
          const len = activeTriggersRef.current.length;
          if (len > 0) {
            setSubCapsule2Index(currentIndex => {
              if (len <= 1) return 0;
              let nextIndex = Math.floor(Math.random() * len);
              while (nextIndex === currentIndex && len > 1) {
                nextIndex = Math.floor(Math.random() * len);
              }
              return nextIndex;
            });
          }
        } else if (nextStep === 2) {
          // Toggle Subcapsule 3 (WMI / Accuracy)
          setShowWmi(s => !s);
        }
        return nextStep;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [isDynamic]);

  // 3. Heading/Greeting changes every 150 seconds randomly
  useEffect(() => {
    if (!isDynamic) return;
    const interval = setInterval(() => {
      const len = greetingsRef.current.length;
      if (len <= 1) return;
      setGreetingIndex(currentIndex => {
        let nextIndex = Math.floor(Math.random() * len);
        while (nextIndex === currentIndex && len > 1) {
          nextIndex = Math.floor(Math.random() * len);
        }
        return nextIndex;
      });
    }, 150000);
    return () => clearInterval(interval);
  }, [isDynamic]);

  // 4. Active trigger (Main Capsule at the top) changes every 50 seconds randomly
  useEffect(() => {
    if (!isDynamic) return;
    const interval = setInterval(() => {
      const len = activeTriggersRef.current.length;
      if (len <= 1) return;
      setActiveTriggerIndex(currentIndex => {
        let nextIndex = Math.floor(Math.random() * len);
        while (nextIndex === currentIndex && len > 1) {
          nextIndex = Math.floor(Math.random() * len);
        }
        return nextIndex;
      });
    }, 50000);
    return () => clearInterval(interval);
  }, [isDynamic]);

  const renderSegments = (segments) => {
    if (!segments || !Array.isArray(segments)) return null;
    return segments.map((seg, idx) => {
      if (!seg.highlight) {
        return <span key={idx}>{seg.text}</span>;
      }
      switch (seg.type) {
        case 'username':
          return (
            <span
              key={idx}
              className="font-black text-gradient-primary tracking-wide"
            >
              {seg.text}
            </span>
          );
        case 'category':
          return (
            <span
              key={idx}
              className="inline-block px-2 py-0.5 mx-1 font-black uppercase tracking-wider text-[0.88em] rounded-md border border-theme-primary/20 bg-theme-primary/5 text-theme-primary shadow-sm transition-all duration-200 hover:bg-theme-primary/10 select-none pointer-events-none"
            >
              {seg.text}
            </span>
          );
        case 'exam':
          return (
            <span
              key={idx}
              className="inline-block px-2 py-0.5 mx-1 font-black tracking-wide text-[0.88em] rounded-full border border-theme-accent/20 bg-theme-accent/5 text-theme-accent shadow-sm select-none pointer-events-none"
            >
              {seg.text}
            </span>
          );
        case 'data':
          return (
            <span
              key={idx}
              className="font-black text-theme-accent underline decoration-2 decoration-theme-accent/20 underline-offset-4"
            >
              {seg.text}
            </span>
          );
        case 'emphasis':
          return (
            <span
              key={idx}
              className="font-black text-gradient-primary"
            >
              {seg.text}
            </span>
          );
        case 'streak-rank':
          return (
            <span
              key={idx}
              className="font-black text-theme-primary"
            >
              {seg.text}
            </span>
          );
        case 'kash-rank':
          return (
            <span
              key={idx}
              className="font-black text-theme-accent"
            >
              {seg.text}
            </span>
          );
        default:
          return (
            <span
              key={idx}
              className="font-extrabold text-theme-primary"
            >
              {seg.text}
            </span>
          );
      }
    });
  };

  // Resolve greeting + subheading independently from the pools
  const currentGreetingSegments = isDynamic && greetings.length > 0
    ? greetings[greetingIndex % greetings.length]
    : null;

  const currentSubheadingSegments = isDynamic && allSubheadings.length > 0
    ? allSubheadings[subheadingIndex % allSubheadings.length]
    : null;

  const currentActiveTrigger = isDynamic && activeTriggers.length > 0
    ? activeTriggers[activeTriggerIndex % activeTriggers.length]
    : null;

  const subCapsule2Trigger = isDynamic && activeTriggers.length > 0
    ? activeTriggers[subCapsule2Index % activeTriggers.length]
    : null;

  // Top capsule = primary trigger insight
  const topCapsuleText = currentActiveTrigger
    ? currentActiveTrigger.label
    : "Daily MCQ Mock Test";

  const topCapsuleType = currentActiveTrigger
    ? currentActiveTrigger.id
    : "";

  const headingText = isDynamic && currentGreetingSegments
    ? renderSegments(currentGreetingSegments)
    : <>Ready to Ace <span className="text-gradient-primary">your Exam?</span></>;

  const subheadingText = isDynamic && currentSubheadingSegments
    ? renderSegments(currentSubheadingSegments)
    : (
      <>
        Attempt MCQs, Find Weak Zones, Analyze Performance, Improve Daily, and <span className="text-theme-primary opacity-100 font-extrabold">Unlock your Personalized Homepage.</span>
      </>
    );

  const topCapsuleKey = currentActiveTrigger ? currentActiveTrigger.id : "static";
  const subheadingKey = subheadingIndex; // cycles independently through the big pool

  const renderTopIcon = (type) => {
    if (!isDynamic) {
      return (
        <div className="relative flex items-center justify-center">
          <span className="absolute w-3 h-3 rounded-full animate-ping opacity-60" style={{ background: 'var(--gradient-primary)' }} />
          <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gradient-primary)' }} />
        </div>
      );
    }
    if (type === 'revision') {
      return (
        <svg className="w-3.5 h-3.5 text-theme-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
        </svg>
      );
    }
    if (type === 'speed') {
      return (
        <svg className="w-3.5 h-3.5 text-theme-primary shrink-0 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    }
    if (type === 'tag') {
      return (
        <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    }
    if (type === 'mastery') {
      return (
        <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" /><path d="M3 20h18a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 20z" />
        </svg>
      );
    }
    return (
      <svg className="w-3.5 h-3.5 text-theme-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    );
  };

  // Build capsules configuration
  const activeSubCapsule1 = showStreakRank ? intelligence?.subCapsule1Streak : intelligence?.subCapsule1Coins;
  const activeSubCapsule3 = showWmi ? intelligence?.subCapsule3Wmi : intelligence?.subCapsule3Accuracy;

  const dynamicStats = isDynamic ? [
    {
      label: activeSubCapsule1?.label || "Streak Rank",
      key: showStreakRank ? "streak" : "coins",
      renderIcon: () => activeSubCapsule1?.rankType === 'guest' ? (
        <svg className="w-3 h-3 text-theme-muted shrink-0 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ) : (
        <svg className="w-3 h-3 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" /><path d="M12 2a5 5 0 0 0-5 5v5a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
        </svg>
      )
    },
    {
      label: subCapsule2Trigger?.subCapsule2?.label || "Active Prep",
      key: subCapsule2Trigger?.subCapsule2?.metricType || "trigger",
      renderIcon: () => {
        const mt = subCapsule2Trigger?.subCapsule2?.metricType;
        if (mt === 'resurrection') {
          return (
            <svg className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          );
        }
        if (mt === 'speed') {
          return (
            <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          );
        }
        return (
          <svg className="w-3.5 h-3.5 text-theme-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        );
      }
    },
    {
      label: activeSubCapsule3?.label || "Accuracy: --%",
      key: showWmi ? "wmi" : "accuracy",
      renderIcon: () => {
        const isWmi = activeSubCapsule3?.metricType === 'wmi';
        if (isWmi) {
          return (
            <svg className="w-3 h-3 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          );
        }
        return (
          <svg className="w-3 h-3 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" /><line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" />
          </svg>
        );
      }
    }
  ] : [
    { label: '50,000+ Questions', key: 'q50', renderIcon: () => <Sparkles size={11} className="text-theme-primary" /> },
    { label: '20+ Subjects', key: 'sub20', renderIcon: () => <BookOpen size={11} className="text-theme-primary" /> },
    { label: 'All Exams', key: 'examsAll', renderIcon: () => <LayoutGrid size={11} className="text-theme-primary" /> },
  ];

  return (
    <div className="relative w-full overflow-hidden flex flex-col items-center text-center pt-4 pb-6">

      <div className="absolute top-0 right-[15%] w-64 h-64 bg-theme-primary/10 rounded-full blur-[80px] animate-float pointer-events-none" />
      <div className="absolute top-20 left-[15%] w-48 h-48 bg-theme-accent/10 rounded-full blur-[70px] animate-float pointer-events-none" style={{ animationDelay: '-3s' }} />

      <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap justify-center items-center gap-4 mb-3"
        >
          <div className="pointer-events-none select-none relative overflow-hidden min-h-[32px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={topCapsuleKey}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-theme-primary/15 bg-theme-primary/5 backdrop-blur-md shadow-sm"
              >
                {renderTopIcon(topCapsuleType)}
                <span className="text-[12px] font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-theme-primary to-theme-accent truncate max-w-[320px] md:max-w-[420px] block leading-none">
                  {topCapsuleText}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-2.5 mb-3">
          {dynamicStats.map((s, i) => (
            <div key={i} className="relative overflow-hidden min-w-0 max-w-[320px] min-h-[32px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="pointer-events-none select-none px-3.5 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2 w-full"
                  style={{
                    background: 'rgba(var(--color-surface-rgb), 0.5)',
                    border: '1px solid var(--color-border-soft)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                  }}
                >
                  {s.renderIcon()}
                  <span className="text-[10px] font-black uppercase tracking-widest text-theme-text/60 truncate block max-w-[280px] white-space-nowrap overflow-hidden text-ellipsis leading-none">
                    {s.label}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          ))}
        </div>

        <h1 className="text-[36px] md:text-[54px] font-[900] leading-[1] tracking-[-0.04em] mb-2 font-outfit min-h-[44px] md:min-h-[60px] flex items-center justify-center" style={{ color: 'var(--color-text)' }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={greetingIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="block"
            >
              {headingText}
            </motion.span>
          </AnimatePresence>
        </h1>
        
        <p className="text-[14px] md:text-[18px] leading-relaxed font-semibold max-w-2xl text-theme-muted min-h-[40px] md:min-h-[48px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={subheadingKey}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="block"
            >
              {subheadingText}
            </motion.span>
          </AnimatePresence>
        </p>
      </div>
    </div>
  );
}

// ── Section Header — Minimalist & High-End ────────────────────────
function SectionHeader({ icon: Icon, title, subtitle, onToggle, isExpanded, actionLabel }) {
  return (
    <div className="relative mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div className="flex items-center gap-4 group">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md transition-all duration-500 group-hover:rotate-6 group-hover:scale-110"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-[24px] md:text-[28px] font-black leading-none tracking-tight mb-1" style={{ color: 'var(--color-text)' }}>
            {title}
          </h2>
          <p className="text-[11px] font-black opacity-40 uppercase tracking-[0.2em]" style={{ color: 'var(--color-text)' }}>
            {subtitle}
          </p>
        </div>
      </div>

      {onToggle && (
        <button
          onClick={onToggle}
          className="group/action relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-500 overflow-hidden shrink-0"
          style={{
            background: 'rgba(var(--color-surface-rgb), 0.5)',
            border: '1px solid var(--color-border)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(var(--color-primary), 0.3)';
            e.currentTarget.style.background = 'rgba(var(--color-primary), 0.05)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.background = 'rgba(var(--color-surface-rgb), 0.5)';
          }}
        >
          <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.15em] text-theme-primary">
            {isExpanded ? 'View Less' : actionLabel || 'Explore All'}
          </span>
          <ArrowRight size={14} className={`relative z-10 text-theme-primary transition-all duration-500 ${isExpanded ? 'rotate-90' : 'group-hover/action:translate-x-1'}`} />
        </button>
      )}
    </div>
  );
}

// ── Exam Card — Compact & Balanced ─────────────────────────────────
function ExamCard({ exam, idx, onClick }) {
  const Icon = exam.icon || ShieldCheck;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative rounded-[28px] cursor-pointer overflow-hidden p-5 flex flex-col items-center text-center justify-between"
      style={{
        background: 'linear-gradient(135deg, rgba(var(--color-surface-rgb), 0.65) 0%, rgba(var(--color-surface-rgb), 0.45) 100%)',
        border: '1px solid var(--color-border-soft)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 20px -5px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)',
        transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
        minHeight: '210px'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = exam.color ? `${exam.color}40` : 'rgba(var(--color-primary), 0.4)';
        e.currentTarget.style.boxShadow = `0 15px 35px -10px ${exam.color ? `${exam.color}25` : 'rgba(var(--color-primary), 0.2)'}, inset 0 1px 1px rgba(255,255,255,0.1)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border-soft)';
        e.currentTarget.style.boxShadow = '0 4px 20px -5px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)';
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-1000 blur-[60px] pointer-events-none"
        style={{ background: exam.color || 'rgb(var(--color-primary))' }}
      />

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Balanced Badges — Slightly Larger Capsules */}
        <div className="w-full flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/5 backdrop-blur-md">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 opacity-60 animate-ping" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400 leading-none">
              Live
            </span>
          </div>

          <div
            className="text-[10px] font-black uppercase tracking-[0.15em] px-3.5 py-1.5 rounded-full backdrop-blur-md border border-theme-primary/15 bg-theme-primary/5"
            style={{ color: 'rgb(var(--color-primary))' }}
          >
            Elite
          </div>
        </div>

        {/* Center Icon Container */}
        <div className="relative mb-5">
          <div
            className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"
            style={{ background: exam.color || 'rgb(var(--color-primary))' }}
          />
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center relative z-10 transition-all duration-500 group-hover:rotate-[8deg] group-hover:scale-110 shadow-md border border-white/5"
            style={{
              background: exam.color ? `linear-gradient(135deg, ${exam.color}, ${exam.color}dd)` : 'var(--gradient-primary)',
              color: 'white'
            }}
          >
            <Icon size={28} strokeWidth={1.5} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[17px] font-black leading-tight tracking-tight px-2 group-hover:text-theme-primary transition-colors" style={{ color: 'var(--color-text)' }}>
          {exam.name}
        </h3>
      </div>

      {/* Animated Bottom Line */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-0 group-hover:w-[40%] transition-all duration-700 rounded-t-full"
        style={{ background: exam.color || 'var(--gradient-primary)', opacity: 0.8 }}
      />
    </motion.div>
  );
}

function AnalyticsRecoveryWidget({ setStreakModalOpen, setCoinsVaultOpen }) {
  const navigate = useNavigate();
  const { economy } = useEconomy();
  const [stats, setStats] = useState({ totalTests: 0, totalQuestions: 0, failedCount: 0 });

  const formatK = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toString();
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const agg = await getAggregatedStats();
        const failed = await getAllFailedQuestionsDB();
        setStats({
          totalTests: agg.totalTests || 0,
          totalQuestions: agg.totalQuestions || 0,
          failedCount: failed.length
        });
      } catch (e) {
        console.error(e);
      }
    };
    loadStats();
  }, []);

  const BentoTile = ({ num, word1, word2, colorClass, onClick }) => {
    const glowColor = colorClass.includes('amber') 
      ? 'rgba(245, 158, 11, 0.15)' 
      : colorClass.includes('blue') 
      ? 'rgba(59, 130, 246, 0.15)' 
      : 'rgba(16, 185, 129, 0.15)';
      
    const borderColor = colorClass.includes('amber') 
      ? 'rgba(245, 158, 11, 0.25)' 
      : colorClass.includes('blue') 
      ? 'rgba(59, 130, 246, 0.25)' 
      : 'rgba(16, 185, 129, 0.25)';

    return (
      <div 
        onClick={onClick}
        className="group relative rounded-[20px] p-3 sm:p-4 md:p-5 flex items-center cursor-pointer transition-all duration-500 hover:-translate-y-1 active:scale-[0.98] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(var(--color-surface-rgb), 0.6) 0%, rgba(var(--color-surface-rgb), 0.4) 100%)',
          border: '1px solid var(--color-border-soft)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 4px 15px -3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = borderColor;
          e.currentTarget.style.boxShadow = `0 12px 25px -5px ${glowColor}, inset 0 1px 1px rgba(255,255,255,0.1)`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--color-border-soft)';
          e.currentTarget.style.boxShadow = '0 4px 15px -3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)';
        }}
      >
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 15% 50%, ${glowColor} 0%, transparent 70%)`
          }}
        />
        <div className="flex items-center gap-2.5 md:gap-4 w-full min-w-0 relative z-10">
          <div className={`text-3xl sm:text-4xl md:text-5xl font-[900] tracking-tighter leading-none transition-transform duration-500 group-hover:scale-105 ${colorClass}`}>
            {num}
          </div>
          <div className="flex flex-col justify-center flex-1 min-w-0">
            <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.1em] text-theme-muted leading-tight group-hover:text-theme-text/80 transition-colors">{word1}</span>
            <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.1em] text-theme-muted leading-tight group-hover:text-theme-text/80 transition-colors">{word2}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 mb-8 relative z-10 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5">
        <BentoTile 
          num={economy?.current_streak_days || 0}
          word1="Day"
          word2="Streak"
          colorClass="text-amber-500"
          onClick={() => setStreakModalOpen(true)}
        />
        <BentoTile 
          num={formatK(economy?.kash_coins_balance || 0)}
          word1="Kash"
          word2="Coins"
          colorClass="text-amber-500"
          onClick={() => setCoinsVaultOpen(true)}
        />
        <BentoTile 
          num={formatK(stats.totalTests)}
          word1="Mocks"
          word2="Finished"
          colorClass="text-blue-500"
          onClick={() => navigate('/profile', { state: { scrollTo: 'performance-analytics' } })}
        />
        <BentoTile 
          num={formatK(stats.totalQuestions)}
          word1="MCQ's"
          word2="Solved"
          colorClass="text-emerald-500"
          onClick={() => navigate('/profile', { state: { scrollTo: 'war-room-analytics' } })}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Rank Booster */}
        <button
          onClick={() => navigate('/resurrection')}
          className="group relative flex items-center gap-4 px-6 py-3 rounded-full overflow-hidden transition-all duration-500 hover:-translate-y-0.5 active:scale-[0.97] w-[270px]"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--color-surface-rgb), 0.7) 0%, rgba(var(--color-surface-rgb), 0.5) 100%)',
            border: '1px solid rgba(var(--color-primary), 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 4px 15px -3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(var(--color-primary), 0.4)';
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(var(--color-primary), 0.25), inset 0 1px 1px rgba(255,255,255,0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(var(--color-primary), 0.15)';
            e.currentTarget.style.boxShadow = '0 4px 15px -3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)';
          }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" 
               style={{ background: 'var(--gradient-primary)' }} />
          
          <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${stats.failedCount < 10 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            <RefreshCw size={16} strokeWidth={2.5} className="group-hover:rotate-180 transition-transform duration-700" />
          </div>
          
          <div className="relative z-10 flex flex-col text-left flex-1 min-w-0">
            <span className="font-black text-[14px] text-theme-text tracking-tight leading-none mb-1">Rank Booster</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-theme-muted leading-none truncate">
               Fix {stats.failedCount} Mistakes
            </span>
          </div>

          <div className="relative z-10 ml-auto w-6 h-6 rounded-full bg-theme-bg flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform border border-theme-border">
            <ChevronRight size={12} className="text-theme-muted group-hover:text-theme-primary transition-colors" />
          </div>
        </button>

        {/* Battle Arena */}
        <button
          onClick={() => navigate('/battle-arena')}
          className="group relative flex items-center gap-4 px-6 py-3 rounded-full overflow-hidden transition-all duration-500 hover:-translate-y-0.5 active:scale-[0.97] w-[270px]"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--color-surface-rgb), 0.7) 0%, rgba(var(--color-surface-rgb), 0.5) 100%)',
            border: '1px solid rgba(var(--color-accent), 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 4px 15px -3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(var(--color-accent), 0.4)';
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(var(--color-accent), 0.25), inset 0 1px 1px rgba(255,255,255,0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(var(--color-accent), 0.15)';
            e.currentTarget.style.boxShadow = '0 4px 15px -3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)';
          }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" 
               style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-primary) 100%)' }} />
          
          <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 bg-theme-accent/10 text-theme-accent">
            <Swords size={16} strokeWidth={2.5} className="group-hover:rotate-[15deg] transition-transform duration-500" />
          </div>
          
          <div className="relative z-10 flex flex-col text-left flex-1 min-w-0">
            <span className="font-black text-[14px] text-theme-text tracking-tight leading-none mb-1">Battle Arena</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-theme-muted leading-none truncate">
               Beat Real Aspirants
            </span>
          </div>

          <div className="relative z-10 ml-auto w-6 h-6 rounded-full bg-theme-bg flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform border border-theme-border">
            <ChevronRight size={12} className="text-theme-muted group-hover:text-theme-primary transition-colors" />
          </div>
        </button>
      </div>
    </div>
  );
}

// ── Home ───────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedExam, setSelectedExam] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [showAllExams, setShowAllExams] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllSubjectCategories, setShowAllSubjectCategories] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [coinsVaultOpen, setCoinsVaultOpen] = useState(false);

  // Navigation & State Management
  useEffect(() => {
    // If we navigate to home ('/') and don't explicitly pass a selectedExamId,
    // we should reset to the main dashboard. This handles clicking "Home" or the Logo.
    if (location.pathname === '/') {
      if (location.state?.selectedExamId) {
        const exam = EXAM_SERIES.find(e => e.id === location.state.selectedExamId);
        if (exam) setSelectedExam(exam);
      } else {
        // Clear sub-dashboard if no state is present
        setSelectedExam(null);
      }
    }
  }, [location]); // Depend on the whole location object (including key) to catch all navigations

  useEffect(() => {
    setCategoryCounts(getAllCategoryCounts());
  }, []);

  const categories = CATEGORY_LIST.map(cat => ({
    name: cat.name,
    slug: cat.slug,
    mcqCount: categoryCounts[cat.slug] || 0,
  })).sort((a, b) => b.mcqCount - a.mcqCount);

  const visibleExams = showAllExams ? EXAM_SERIES : EXAM_SERIES.slice(0, 4);
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 8);
  const visibleSubjectCategories = showAllSubjectCategories ? categories : categories.slice(0, 8);

  return (
    <div
      className="min-h-screen pb-28 overflow-x-hidden font-sans relative"
    >
      <Header />

      <AnimatePresence mode="wait">
        {!selectedExam ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* ── Page-wide atmospheric depth layer ── */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
              <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.07]" style={{ background: 'rgb(var(--color-primary))' }} />
              <div className="absolute top-[35%] left-[-8%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.05]" style={{ background: 'rgb(var(--color-accent))' }} />
              <div className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] rounded-full blur-[110px] opacity-[0.06]" style={{ background: 'rgb(var(--color-primary))' }} />
            </div>

            <HeroStart />

            <AnalyticsRecoveryWidget setStreakModalOpen={setStreakModalOpen} setCoinsVaultOpen={setCoinsVaultOpen} />

            <main className="max-w-7xl mx-auto px-6 py-6 relative z-10">
              {/* Exam Hub Section */}
              <section className="mb-20">
                <SectionHeader
                  icon={TrendingUp}
                  title="Exam Hub"
                  subtitle="Mocks tailored for high-stakes competition."
                  onToggle={() => setShowAllExams(s => !s)}
                  isExpanded={showAllExams}
                  actionLabel="View All"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <AnimatePresence>
                    {visibleExams.map((exam, idx) => (
                      <ExamCard
                        key={exam.id}
                        exam={exam}
                        idx={idx}
                        onClick={() => setSelectedExam(exam)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              {/* MCQ Zone Section */}
              <section>
                <SectionHeader
                  icon={BookOpen}
                  title="MCQ Zone"
                  subtitle="Practice sets and real-time analytics."
                  onToggle={() => setShowAllCategories(s => !s)}
                  isExpanded={showAllCategories}
                  actionLabel="View All"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {visibleCategories.map((cat, idx) => (
                      <motion.div
                        layout
                        key={cat.slug}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.025, type: 'spring', stiffness: 320, damping: 26 }}
                      >
                        <CategoryCard category={cat} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              {/* Subject Hub Section */}
              <section className="mt-20 mb-20">
                <SectionHeader
                  icon={Target}
                  title="Subject Hub"
                  subtitle="Category & Topic wise mock tests."
                  onToggle={() => setShowAllSubjectCategories(s => !s)}
                  isExpanded={showAllSubjectCategories}
                  actionLabel="View All"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {visibleSubjectCategories.map((cat, idx) => (
                      <motion.div
                        layout
                        key={cat.slug + '-subject'}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.025, type: 'spring', stiffness: 320, damping: 26 }}
                      >
                        <CategoryCard category={cat} routePrefix="/subject-mock" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            </main>
          </motion.div>
        ) : (
          <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
            <ExamMockDashboard
              key={selectedExam.id}
              exam={selectedExam}
              onBack={() => setSelectedExam(null)}
            />
          </main>
        )}
      </AnimatePresence>

      <StreakModal isOpen={streakModalOpen} onClose={() => setStreakModalOpen(false)} />
      <CoinsVaultModal isOpen={coinsVaultOpen} onClose={() => setCoinsVaultOpen(false)} />
    </div>
  );
}
