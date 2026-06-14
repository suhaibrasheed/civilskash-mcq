import React from 'react';
import { ChevronRight, BookOpen, Briefcase, Calculator, Landmark, Shield, Gavel, Cpu, Book, Layers, Map, Target, Globe, Activity, Database, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Professional icons mapped by subject slug
const SUBJECT_ICONS = {
  'accountancy':         Briefcase,
  'ancient-history':     Landmark,
  'computer-awareness':  Cpu,
  'current-affairs':     Globe,
  'english':             BookOpen,
  'environment':         Target,
  'general-science':     Activity,
  'indian-economy':      Database,
  'indian-geography':    Map,
  'indian-polity':       Gavel,
  'maths':               Calculator,
  'medieval-history':    Shield,
  'modern-history':      Book,
  'physical-geography':  Globe,
  'reasoning':           Layers,
  'static-gk':           FileText,
  'world-geography':     Map,
};

// Subject specific accent tints (8 group colors for 18 categories)
const SUBJECT_COLORS = {
  // Group 1 (History - 1 color: Amber-Yellow)
  'ancient-history':     '#d97706',
  'medieval-history':    '#d97706',
  'modern-history':      '#d97706',

  // Group 2 (Geography - Emerald Green)
  'indian-geography':    '#10b981',
  'physical-geography':  '#10b981',
  'world-geography':     '#10b981',

  // Group 3 (Languages & Technology - Soft Red)
  'english':             '#ef4444',
  'computer-awareness':  '#ef4444',

  // Group 4 (Aptitude & Logic - Cyan/Teal)
  'maths':               '#06b6d4',
  'reasoning':           '#06b6d4',

  // Group 5 (News, Polity & Affairs - Violet/Purple)
  'current-affairs':     '#a78bfa',
  'indian-polity':       '#a78bfa',

  // Group 6 (Finance & Business - Orange)
  'indian-economy':      '#f97316',
  'accountancy':         '#f97316',

  // Group 7 (General & Regional GK - Royal Blue)
  'static-gk':           '#4361ee',
  'jk-affairs':          '#4361ee',

  // Group 8 (Science & Nature - Pink/Rose)
  'general-science':     '#ec4899',
  'environment':         '#ec4899',
};

export default function CategoryCard({ category, routePrefix = '/mcq' }) {
  const navigate = useNavigate();
  const slug     = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
  const count    = category.mcqCount || 0;
  const isSubjectMode = routePrefix.includes('subject-mock');
  const testCount = Math.ceil(count / 90) + Math.ceil(count / 9); // Estimated total tests
  
  let label = '';
  if (isSubjectMode) {
    if (count === 0) {
      label = "Coming Soon";
    } else if (testCount < 9) {
      label = "Some Tests";
    } else {
      label = `${testCount} Tests`;
    }
  } else {
    label = count > 0 ? `${count} Questions` : "Some MCQ's";
  }

  const accent   = SUBJECT_COLORS[slug] || '#4361ee';

  const IconComponent = SUBJECT_ICONS[slug] || BookOpen;

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      onClick={() => navigate(`${routePrefix}/${slug}`, { state: { from: window.location.pathname } })}
      className="group relative rounded-3xl cursor-pointer overflow-hidden flex items-center p-4 sm:p-5 card-3d"
      style={{
        minHeight: '110px',
        background: 'linear-gradient(135deg, rgba(var(--color-surface-rgb), 0.65) 0%, rgba(var(--color-surface-rgb), 0.45) 100%)',
        border: '1px solid var(--color-border-soft)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 15px -3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)',
        transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${accent}40`;
        e.currentTarget.style.boxShadow = `0 12px 25px -5px ${accent}20, inset 0 1px 1px rgba(255,255,255,0.1)`;
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border-soft)';
        e.currentTarget.style.boxShadow = '0 4px 15px -3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)';
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
      }}
    >
      {/* Subject-specific background tint on hover */}
      <motion.div 
        variants={{
          rest: { opacity: 0 },
          hover: { opacity: 0.12 },
          tap: { opacity: 0.18 }
        }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: accent }}
      />
      
      {/* Content wrapper */}
      <div className="flex items-center gap-3.5 sm:gap-5 relative z-10 flex-1 min-w-0">
        {/* Icon Container */}
        <div 
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110 shrink-0 shadow-sm border border-white/5"
          style={{ 
            background: `${accent}15`,
            color: accent
          }}
        >
          <IconComponent className="w-5 h-5 sm:w-[26px] sm:h-[26px]" strokeWidth={1.5} />
        </div>
        
        {/* Text & Pill */}
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <h3
            className="font-black leading-tight tracking-tight mb-2 transition-colors truncate text-[16px] sm:text-[17px]"
            style={{ color: 'var(--color-text)' }}
            title={category.name}
          >
            {category.name === 'Computer Awareness' 
              ? 'Computer' 
              : category.name === 'Physical Geography' 
              ? 'Physical Geo' 
              : category.name}
          </h3>
          <div 
            className="inline-flex items-center px-3 py-1 rounded-full w-max backdrop-blur-sm"
            style={{ 
              background: `${accent}10`,
              border: `1px solid ${accent}25`
            }}
          >
            <span 
              className="text-[11px] font-black uppercase tracking-widest"
              style={{ color: accent }}
            >
              {label}
            </span>
          </div>
        </div>
      </div>

      {/* Clean Right Chevron */}
      <div className="relative z-10 ml-4 pr-1">
        <motion.div
          variants={{
            rest: { x: 0, color: accent, opacity: 1 },
            hover: { x: 4, color: accent, opacity: 1 },
            tap: { x: 4, color: accent, opacity: 1 }
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <ChevronRight size={24} strokeWidth={2.5} />
        </motion.div>
      </div>
    </motion.div>
  );
}
