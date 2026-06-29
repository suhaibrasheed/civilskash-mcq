import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Target, Search, GraduationCap, Brain, Zap,
  FileText, Crosshair, Eye, MessageCircle,
  Crown, ArrowRight, BarChart2, Wand2, FlaskConical, Swords
} from 'lucide-react';
import { useEconomy } from '../context/EconomyContext';

import { createPortal } from 'react-dom';

// ─── Feature Tile Data (Uniformly sized cards, 13 features total) ──────────
const FEATURES = [
  {
    id: 'rank-detector',
    name: 'Rank Detector',
    tagline: 'Know where you stand.',
    desc: 'Predict readiness, spot blindspots, and prevent exam day surprises.',
    icon: Target,
    accent: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.18)', text: '#f59e0b', glow: 'rgba(245,158,11,0.1)' },
  },
  {
    id: 'xray-analysis',
    name: 'X-Ray Analysis',
    tagline: 'Find hidden performance gaps.',
    desc: 'Deep diagnostics beyond ordinary performance reports.',
    icon: Search,
    accent: { bg: 'rgba(6,182,212,0.06)', border: 'rgba(6,182,212,0.18)', text: '#22d3ee', glow: 'rgba(6,182,212,0.1)' },
  },
  {
    id: 'advanced-analytics',
    name: 'Exam Intel',
    tagline: 'Your exam warroom.',
    desc: 'This turns every attempt into actionable exam intelligence.',
    icon: BarChart2,
    accent: { bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.18)', text: '#818cf8', glow: 'rgba(99,102,241,0.1)' },
  },
  {
    id: 'personal-coach',
    name: 'Personal Coach',
    tagline: '24/7 AI learning coach.',
    desc: 'Get strategy, plans, mocks, and instant roadblock resolutions.',
    icon: GraduationCap,
    accent: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.18)', text: '#34d399', glow: 'rgba(16,185,129,0.1)' },
  },
  {
    id: 'ai-tutor',
    name: 'AI Tutor',
    tagline: 'Master any MCQ instantly.',
    desc: 'Crisp option analysis, memory tricks, and exam insights.',
    icon: MessageCircle,
    accent: { bg: 'rgba(244,63,94,0.06)', border: 'rgba(244,63,94,0.18)', text: '#fb7185', glow: 'rgba(244,63,94,0.1)' },
  },
  {
    id: 'smart-explainer',
    name: 'Smart Explainer',
    tagline: 'Grasp complex subjects.',
    desc: 'Every concept explained while knowing what suits best for you.',
    icon: Brain,
    accent: { bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.18)', text: '#fb923c', glow: 'rgba(249,115,22,0.1)' },
  },
  {
    id: 'mock-forge',
    name: 'Mock Forge',
    tagline: 'Build custom exam practices.',
    desc: 'Instantly assemble mocks from any combination of custom filters.',
    icon: Zap,
    accent: { bg: 'rgba(168,85,247,0.06)', border: 'rgba(168,85,247,0.18)', text: '#c084fc', glow: 'rgba(168,85,247,0.1)' },
  },
  {
    id: 'smart-mock',
    name: 'Smart Mock',
    tagline: 'Syllabus oriented tests.',
    desc: 'Build AI-powered mocks from any topic, filter, or weak area.',
    icon: FlaskConical,
    accent: { bg: 'rgba(20,184,166,0.06)', border: 'rgba(20,184,166,0.18)', text: '#2dd4bf', glow: 'rgba(20,184,166,0.1)' },
  },
  {
    id: 'smart-notes',
    name: 'Smart Notes',
    tagline: 'Distill mistakes into gold.',
    desc: 'Turn all misjudged MCQs into one revision cheat sheet.',
    icon: FileText,
    accent: { bg: 'rgba(234,179,8,0.06)', border: 'rgba(234,179,8,0.18)', text: '#facc15', glow: 'rgba(234,179,8,0.1)' },
  },
  {
    id: 'gap-hunter',
    name: 'Gap Hunter',
    tagline: 'Target weakest subjects.',
    desc: 'Redemption practice mocks automatically generated for low scores.',
    icon: Crosshair,
    accent: { bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.18)', text: '#fbbf24', glow: 'rgba(217,119,6,0.1)' },
  },
  {
    id: 'trap-finder',
    name: 'Trap Finder',
    tagline: 'Avoid deceptive questions.',
    desc: 'Simulation mocks that clone real test patterns to expose traps.',
    icon: Eye,
    accent: { bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.18)', text: '#a78bfa', glow: 'rgba(139,92,246,0.1)' },
  },
  {
    id: 'battle-insights',
    name: 'Battle Insights',
    tagline: 'Arena performance breakdown.',
    desc: 'Expose tactical mistakes made during head-to-head live battles.',
    icon: Swords,
    accent: { bg: 'rgba(236,72,153,0.06)', border: 'rgba(236,72,153,0.18)', text: '#f472b6', glow: 'rgba(236,72,153,0.1)' },
  },
  {
    id: 'personal-ai',
    name: 'Elite AI Suite',
    tagline: 'Elite suite integration.',
    desc: 'Unlock the full power of your personalized AI study suite.',
    icon: Wand2,
    accent: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.18)', text: '#f59e0b', glow: 'rgba(245,158,11,0.1)' },
  },
];

// ─── Single Feature Tile ──────────────────────────────────────────────────────
function FeatureTile({ feature }) {
  const Icon = feature.icon;
  const { accent, name, desc } = feature;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 group transition-all duration-200 hover:scale-[1.015] cursor-default h-full flex flex-col justify-between"
      style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(circle at top left, ${accent.glow}, transparent 65%)` }}
      />

      {/* PRO badge */}
      <span
        className="absolute top-3 right-3 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md"
        style={{ background: `${accent.bg}`, border: `1px solid ${accent.border}`, color: accent.text }}
      >
        PRO
      </span>

      <div className="flex flex-col gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
          style={{ background: accent.bg, border: `1px solid ${accent.border}`, color: accent.text }}
        >
          <Icon size={16} />
        </div>
        <div className="space-y-1">
          <h5 className="font-black text-xs uppercase tracking-wider text-theme-text">
            {name}
          </h5>
          <p className="text-[10px] font-semibold leading-relaxed text-theme-muted/75">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function ProUpsellModal() {
  const navigate = useNavigate();
  const { proUpsellOpen, setProUpsellOpen, proUpsellFeature } = useEconomy();

  // Close on ESC
  useEffect(() => {
    if (!proUpsellOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') setProUpsellOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [proUpsellOpen, setProUpsellOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (proUpsellOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [proUpsellOpen]);

  const handleUpgrade = () => {
    setProUpsellOpen(false);
    navigate('/upgrade');
  };

  // Normalize feature name for matching
  const normalizedFeature = proUpsellFeature?.toLowerCase().replace(/[\s_-]+/g, '-') || '';
  const matchedFeatureObject = FEATURES.find(f => {
    // Standard matches or rebrands
    const itemKey = f.name.toLowerCase().replace(/[\s_-]+/g, '-');
    if (itemKey === normalizedFeature) return true;
    if (f.id === 'personal-coach' && (normalizedFeature === 'personal-coach' || normalizedFeature === 'ai-coach')) return true;
    return false;
  });

  return createPortal(
    <AnimatePresence>
      {proUpsellOpen && (
        /* ── Full-screen scroll container — highest z-index ── */
        <div className="fixed inset-0 z-[999999] flex items-start md:items-center justify-center overflow-y-auto py-4 px-4">
          {/* Backdrop */}
          <motion.div
            key="upsell-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setProUpsellOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Panel */}
          <motion.div
            key="upsell-panel"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg md:max-w-2xl my-auto rounded-3xl flex flex-col shadow-[0_32px_80px_rgba(0,0,0,0.75)]"
            style={{
              background: 'rgba(var(--color-surface-rgb, 18,18,28), 0.97)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(245,158,11,0.18)',
            }}
          >
            {/* Ambient top glow */}
            <div className="absolute inset-x-0 top-0 h-48 pointer-events-none rounded-t-3xl overflow-hidden">
              <div style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(245,158,11,0.18), transparent 70%)' }} className="absolute inset-0" />
            </div>

            <div className="relative px-6 pt-8 pb-4 flex-shrink-0">

              <div className="flex flex-col items-center text-center gap-3">
                {/* Crown icon */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1"
                  style={{
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.22)',
                    boxShadow: '0 0 40px rgba(245,158,11,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  <Crown size={30} className="text-amber-400" />
                </div>

                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-primary mb-1">
                  {proUpsellFeature ? `${proUpsellFeature} is Pro Feature` : 'Unlock Pro Tier'}
                </p>

                <h2 className="text-2xl md:text-3xl font-black text-theme-text tracking-tight leading-tight">
                  Be the <span className="text-theme-primary">Elite Aspirant</span>
                </h2>

                <p className="text-xs md:text-sm font-semibold text-theme-muted max-w-sm leading-relaxed">
                  Your competitors read the same books.<br />
                  <span className="text-amber-400 font-black">Only Pro members</span> get an <span className="text-amber-400 font-black">Unfair Intelligence Edge</span>
                </p>
              </div>
            </div>

            {/* Separator */}
            <div className="mx-6 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.15), transparent)' }} />

            {/* ── Active Triggered Feature Card (Symmetrical Full-width Banner) ── */}
            {matchedFeatureObject && (
              <div className="px-6 pt-4 pb-1">
                <div
                  className="relative overflow-hidden rounded-2xl p-5 border border-theme-primary/30"
                  style={{
                    background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb, 219,39,119), 0.12) 0%, rgba(var(--color-surface-rgb, 18,18,28), 0.8) 100%)',
                    boxShadow: '0 8px 30px rgba(var(--color-primary-rgb, 219,39,119), 0.1)'
                  }}
                >
                  {/* Text indicator at the top right instead of badge overlay on mobile */}
                  <div className="text-theme-primary text-[9px] font-black uppercase tracking-wider mb-2">
                    Locked Elite Feature
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-theme-primary/20 border border-theme-primary/30 flex items-center justify-center text-theme-primary shrink-0">
                      {React.createElement(matchedFeatureObject.icon, { size: 20 })}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-black text-sm text-theme-text uppercase tracking-wider flex flex-wrap items-center gap-1.5">
                        <span>{matchedFeatureObject.name}</span>
                        <span className="text-[10px] lowercase tracking-normal font-semibold text-theme-primary animate-pulse">
                          (you tried accessing this)
                        </span>
                      </h4>
                      <p className="text-[11px] font-semibold leading-relaxed text-theme-muted">
                        {matchedFeatureObject.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Feature Grid (Uniform grid layout) ── */}
            <div className="relative px-5 pt-3 pb-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {FEATURES.filter(f => f.id !== matchedFeatureObject?.id).map((f, i) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.2 }}
                    className="col-span-1"
                  >
                    <FeatureTile feature={f} />
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative flex-shrink-0 px-5 pb-6 pt-2">
              {/* Top separator */}
              <div className="h-px mb-4" style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.15), transparent)' }} />

              <div className="flex items-center gap-3 w-full">
                {/* Left Button: Go Free */}
                <button
                  onClick={() => setProUpsellOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-theme-muted hover:text-theme-text transition-all bg-theme-bg/60 hover:bg-theme-surface-hover/50 border border-theme-border/30"
                >
                  Go Free
                </button>

                {/* Right Button: Unlock Elite */}
                <motion.button
                  onClick={handleUpgrade}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-[1.3] py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-white flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: '0 8px 30px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  <Crown size={14} />
                  Unlock Elite
                  <ArrowRight size={14} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
