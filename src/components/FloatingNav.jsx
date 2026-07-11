import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Home, User, Bookmark, X, Search, Zap, AlertCircle, Play, Compass, Award, BookOpen, Terminal } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useEconomy } from '../context/EconomyContext';
import { toggleBookmarkDB, isBookmarkedDB } from '../lib/db';
import { renderMathInHtmlString } from '../lib/ai';
import { StreakModal, CoinsVaultModal } from './EconomyUI';
import { EXAM_SERIES } from '../lib/exams';
import { useAuth } from '../context/AuthContext';
import { getAllCategoryCounts, ALL_STATIC_BANKS_SYNC } from '../lib/dataHub';
import { 
  getFilteredResults, 
  formatCategoryName, 
  SUBJECT_ICONS, 
  SUBJECT_COLORS,
  COMMANDS,
  CATEGORIES
} from '../lib/searchEngine';

const baseNavItems = [
  {
    icon: Search,
    label: 'Search',
    onClick: 'openSearch',
    color: 'rgb(var(--color-primary))',
    bg: 'rgba(var(--color-primary), 0.12)',
  },
  {
    icon: Home,
    label: 'Home',
    to: '/',
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.12)',
  },
  {
    icon: Bookmark,
    label: 'Bookmarks',
    to: '/bookmarks',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
  },
  {
    icon: Award,
    label: 'Leaderboard',
    to: '/leaderboard',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
  },
  {
    icon: User,
    label: 'Profile',
    to: '/profile',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
  },
];

const itemVariants = {
  hidden: { scale: 0, opacity: 0, y: 16 },
  visible: (custom) => {
    const i = typeof custom === 'number' ? custom : (custom?.index || 0);
    return {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.055,
        duration: 0.4,
        ease: [0.34, 1.56, 0.64, 1],
      },
    };
  },
  exit: (custom) => {
    const i = typeof custom === 'number' ? custom : (custom?.index || 0);
    const total = custom?.total || 6;
    return {
      scale: 0,
      opacity: 0,
      y: 8,
      transition: {
        delay: (total - 1 - i) * 0.04,
        duration: 0.22,
        ease: [0.4, 0, 1, 1],
      },
    };
  },
};

function NavTrigger({ isOpen, onClick }) {
  return (
    <button
      id="floating-nav-btn"
      onClick={onClick}
      aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
      className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-float transition-transform duration-300 active:scale-95 overflow-hidden"
      style={{
        background: isOpen
          ? 'var(--color-surface)'
          : 'var(--gradient-primary)',
        backgroundImage: isOpen ? 'none' : 'var(--gradient-primary)',
        border: isOpen ? '2px solid rgba(var(--color-primary), 0.3)' : 'none',
        boxShadow: isOpen
          ? 'var(--shadow-card)'
          : '0 8px 32px rgba(var(--color-primary), 0.45), 0 0 0 1px rgba(var(--color-primary), 0.2)',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ color: 'rgb(var(--color-primary))' }}
          >
            <X size={22} />
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="5.5"  cy="5.5"  r="2" fill="white" />
              <circle cx="12"   cy="5.5"  r="2" fill="white" fillOpacity="0.7" />
              <circle cx="18.5" cy="5.5"  r="2" fill="white" fillOpacity="0.5" />
              <circle cx="5.5"  cy="12"   r="2" fill="white" fillOpacity="0.7" />
              <circle cx="12"   cy="12"   r="2.5" fill="white" />
              <circle cx="18.5" cy="12"   r="2" fill="white" fillOpacity="0.7" />
              <circle cx="5.5"  cy="18.5" r="2" fill="white" fillOpacity="0.5" />
              <circle cx="12"   cy="18.5" r="2" fill="white" fillOpacity="0.7" />
              <circle cx="18.5" cy="18.5" r="2" fill="white" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <span
          className="absolute inset-0 rounded-2xl"
          style={{
            boxShadow: '0 0 0 0 rgba(var(--color-primary), 0.4)',
            animation: 'pulse-ring-fab 3s ease-out infinite',
          }}
        />
      )}
    </button>
  );
}

function SearchOverlay({ isOpen, onClose, setStreakModalOpen, setCoinsVaultOpen }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { economy, openProUpsell } = useEconomy();
  
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const drawerRef = useRef(null);
  const resultsContainerRef = useRef(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showAllRecents, setShowAllRecents] = useState(false);
  
  const sortedCategories = useMemo(() => {
    const counts = getAllCategoryCounts();
    return [...CATEGORIES].sort((a, b) => {
      const countA = counts[a.slug] || 0;
      const countB = counts[b.slug] || 0;
      return countB - countA;
    });
  }, [ALL_STATIC_BANKS_SYNC.length]);

  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector('.search-active-item');
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedIndex]);
  
  // Body scroll locking to resolve the double scrollbar bug
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Load cache on open
  useEffect(() => {
    if (isOpen) {
      const cached = localStorage.getItem('mcqkash_recent_searches');
      if (cached) {
        setRecentSearches(JSON.parse(cached));
      }
    }
  }, [isOpen]);
  
  // Check bookmark status of previewQuestion
  useEffect(() => {
    if (previewQuestion) {
      isBookmarkedDB(previewQuestion.id).then(setIsBookmarked);
    }
  }, [previewQuestion]);
  
  // Reset navigation index on filter or query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeTab]);

  // Compute matches using the modular search engine
  const { commands, exams, subjects, tags, questions } = useMemo(() => {
    return getFilteredResults(query);
  }, [query]);

  // Aggregate results in a single flat array for keyboard navigation
  const flatResults = useMemo(() => {
    let list = [];
    if (activeTab === 'all') {
      list = [
        ...commands.slice(0, 5),
        ...exams.slice(0, 3),
        ...subjects.slice(0, 6),
        ...tags.slice(0, 8),
        ...questions.slice(0, 10)
      ];
    } else if (activeTab === 'commands') {
      list = commands;
    } else if (activeTab === 'exams') {
      list = exams;
    } else if (activeTab === 'subjects') {
      list = subjects;
    } else if (activeTab === 'tags') {
      list = tags;
    } else if (activeTab === 'questions') {
      list = questions;
    }
    return list;
  }, [activeTab, commands, exams, subjects, tags, questions]);

  const saveSearchQuery = (term) => {
    if (!term) return;
    const clean = term.trim();
    if (!clean) return;
    // Cache up to 15 searches
    const list = [clean, ...recentSearches.filter(item => item !== clean)].slice(0, 15);
    setRecentSearches(list);
    localStorage.setItem('mcqkash_recent_searches', JSON.stringify(list));
  };

  const handleTriggerItem = (item) => {
    if (item.type === 'command') {
      if (item.isElite) {
        if (economy?.is_pro) {
          saveSearchQuery(item.code);
          onClose();
          if (item.to) {
            navigate(item.to);
          }
        } else {
          openProUpsell(item.title);
          onClose();
        }
        return;
      }
      saveSearchQuery(item.code);
      onClose();
      if (item.to) {
        navigate(item.to);
      } else if (item.action === 'theme') {
        const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'sepia' : 'dark';
        setTheme(nextTheme);
      } else if (item.action === 'streak') {
        setStreakModalOpen(true);
      } else if (item.action === 'coins') {
        setCoinsVaultOpen(true);
      }
    } else if (item.type === 'exam') {
      saveSearchQuery(item.name);
      onClose();
      navigate(`/exam/${item.id}`);
    } else if (item.type === 'subject') {
      saveSearchQuery(item.name);
      onClose();
      navigate(`/subject-mock/${item.slug}`);
    } else if (item.type === 'tag') {
      saveSearchQuery(item.name);
      onClose();
      navigate(`/mcq/${item.category}/tag/${item.name}`);
    } else if (item.type === 'question') {
      saveSearchQuery(query);
      setPreviewQuestion(item);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleOverlayKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (previewQuestion) {
          setPreviewQuestion(null);
        } else if (query) {
          setQuery('');
        } else {
          onClose();
        }
        return;
      }
      
      if (previewQuestion) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          drawerRef.current?.scrollBy({ top: 50, behavior: 'auto' });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          drawerRef.current?.scrollBy({ top: -50, behavior: 'auto' });
        }
        return;
      }
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (flatResults.length > 0 ? (prev + 1) % flatResults.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (flatResults.length > 0 ? (prev - 1 + flatResults.length) % flatResults.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          handleTriggerItem(flatResults[selectedIndex]);
        }
      }
    };
    
    window.addEventListener('keydown', handleOverlayKeyDown, true);
    return () => window.removeEventListener('keydown', handleOverlayKeyDown, true);
  }, [isOpen, flatResults, selectedIndex, previewQuestion, query]);

  const handleToggleBookmark = async () => {
    if (!previewQuestion) return;
    const isBookmarkedNow = await toggleBookmarkDB(previewQuestion);
    setIsBookmarked(isBookmarkedNow);
  };

  const tabs = [
    { id: 'all', label: 'All Results' },
    { id: 'commands', label: 'Commands' },
    { id: 'exams', label: 'Exams' },
    { id: 'subjects', label: 'Subjects' },
    { id: 'tags', label: 'Topics' },
    { id: 'questions', label: 'Questions' }
  ];

  // Logic to compute visible search items (max 4 on closed state, wrapped on open)
  const visibleRecents = useMemo(() => {
    return showAllRecents ? recentSearches : recentSearches.slice(0, 4);
  }, [recentSearches, showAllRecents]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-theme-bg/95 backdrop-blur-2xl flex flex-col items-center pt-12 md:pt-20 px-4 md:px-6 overflow-hidden"
          style={{ background: 'rgba(var(--color-bg-rgb), 0.97)' }}
        >
          {/* Glowing gradients */}
          <div className="absolute top-[-10%] left-[20%] w-[350px] h-[350px] bg-theme-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[20%] w-[350px] h-[350px] bg-theme-accent/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="w-full max-w-6xl flex flex-col h-full relative z-10 max-h-[85vh]">
            
            {/* Sleek Glassmorphic Search Bar & Close buttons */}
            <div className="flex items-center gap-4 mb-6 shrink-0">
              <div className="relative flex-1 group">
                <div className="absolute inset-0 bg-theme-primary/20 blur-2xl rounded-full opacity-20 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="relative flex items-center gap-4 bg-white/[0.02] dark:bg-black/[0.15] border border-white/10 rounded-full px-6 py-4 shadow-2xl backdrop-blur-md focus-within:border-theme-primary/45 focus-within:shadow-[0_0_40px_-5px_rgba(var(--color-primary),0.2)] transition-all duration-300">
                  <Search size={20} className="text-theme-primary shrink-0" />
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Search everything (Cmd+K)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent text-lg font-bold outline-none placeholder:text-theme-muted/30"
                    style={{ color: 'var(--color-text)' }}
                  />
                  {query && (
                    <button 
                      onClick={() => setQuery('')}
                      className="p-1 rounded-full hover:bg-white/10 text-theme-muted hover:text-theme-text transition-all"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[9px] font-black uppercase tracking-wider text-theme-muted">
                    ESC
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-12 h-12 rounded-full bg-white/[0.02] dark:bg-black/[0.15] border border-white/10 hover:border-theme-primary/45 hover:rotate-90 flex items-center justify-center transition-all duration-300 active:scale-95 shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Glassmorphic Chips */}
            <div className="flex flex-wrap gap-2 mb-6 justify-start overflow-x-auto py-1 scrollbar-none shrink-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-theme-primary text-white border-theme-primary/40 shadow-lg shadow-theme-primary/20'
                      : 'bg-white/[0.02] border-white/5 text-theme-muted hover:border-white/15 hover:text-theme-text hover:bg-white/[0.05]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Rich Landing screen Dashboard (No Query) */}
            {!query && (
              <div className="flex-1 overflow-y-auto pr-1 pb-8 space-y-8 custom-scrollbar">
                
                {recentSearches.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-theme-muted opacity-50 mb-3">Recent Searches</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      {visibleRecents.map(term => (
                        <div
                          key={term}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.02] border border-white/5 text-xs font-bold text-theme-text/80 hover:border-theme-primary/30 hover:bg-white/[0.05] transition-all duration-200 group"
                        >
                          <span onClick={() => setQuery(term)} className="cursor-pointer">{term}</span>
                          <button 
                            onClick={() => {
                              const updated = recentSearches.filter(item => item !== term);
                              setRecentSearches(updated);
                              localStorage.setItem('mcqkash_recent_searches', JSON.stringify(updated));
                            }}
                            className="p-0.5 rounded-full hover:bg-white/10 text-theme-muted hover:text-theme-text transition-all"
                            aria-label={`Clear recent search ${term}`}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {recentSearches.length > 4 && (
                        <button
                          onClick={() => setShowAllRecents(!showAllRecents)}
                          className="px-3.5 py-1.5 rounded-full bg-theme-primary/10 border border-theme-primary/20 text-[10px] font-black uppercase tracking-widest text-theme-primary hover:bg-theme-primary hover:text-white transition-all duration-300"
                        >
                          {showAllRecents ? 'Less' : 'More'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Explore Exams */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-theme-muted opacity-50 mb-3">Explore Exam Hubs</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {EXAM_SERIES.map((exam) => {
                      const Icon = exam.icon || Compass;
                      return (
                        <div
                          key={exam.id}
                          onClick={() => handleTriggerItem({ ...exam, type: 'exam' })}
                          className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-theme-primary/35 cursor-pointer transition-all duration-300 flex items-center gap-4 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]"
                        >
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5"
                            style={{ background: `${exam.color}12`, color: exam.color }}
                          >
                            <Icon size={18} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-extrabold text-sm text-theme-text group-hover:text-theme-primary transition-colors leading-tight">{exam.name}</span>
                            <p className="text-[9px] font-black text-theme-muted uppercase tracking-widest mt-0.5">Live Mock Tests</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explore Subjects */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-theme-muted opacity-50 mb-3">Practice Subjects</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {sortedCategories.slice(0, 8).map((sub) => {
                      const Icon = SUBJECT_ICONS[sub.slug] || BookOpen;
                      const color = SUBJECT_COLORS[sub.slug] || '#4361ee';
                      return (
                        <div
                          key={sub.slug}
                          onClick={() => handleTriggerItem({ ...sub, type: 'subject' })}
                          className="p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-theme-primary/35 cursor-pointer transition-all duration-300 flex items-center gap-3 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]"
                        >
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/5"
                            style={{ background: `${color}12`, color: color }}
                          >
                            <Icon size={16} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-extrabold text-xs text-theme-text group-hover:text-theme-primary transition-colors leading-tight truncate block">{sub.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation Commands */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-theme-muted opacity-50 mb-3">Navigation Commands</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {COMMANDS.map((cmd) => {
                      const Icon = cmd.icon || Terminal;
                      return (
                        <div
                          key={cmd.code}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTriggerItem({ ...cmd, type: 'command' }); }}
                          className={`p-4 rounded-2xl border bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-all duration-300 flex items-start gap-4 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] ${
                            cmd.isElite 
                              ? 'border-amber-500/15 hover:border-amber-500/40 hover:shadow-[0_0_20px_-3px_rgba(245,158,11,0.15)]' 
                              : 'border-white/5 hover:border-theme-primary/35'
                          }`}
                        >
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10 shrink-0 border border-white/5"
                            style={{ 
                              background: cmd.isElite ? 'rgba(245,158,11,0.08)' : `${cmd.color}12`, 
                              color: cmd.isElite ? '#fbbf24' : cmd.color 
                            }}
                          >
                            <Icon size={18} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-theme-text leading-tight group-hover:text-theme-primary transition-colors">{cmd.title}</span>
                                {cmd.isElite && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/35 text-[8px] font-black text-amber-500 uppercase tracking-widest leading-none">
                                    Elite
                                  </span>
                                )}
                              </div>
                              <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black text-theme-muted uppercase tracking-wider">{cmd.code}</span>
                            </div>
                            <p className="text-[11px] text-theme-muted font-medium mt-1 leading-snug">{cmd.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* Matching results */}
            {query && (
              <div ref={resultsContainerRef} className="flex-1 overflow-y-auto pr-1 pb-8 space-y-8 custom-scrollbar">
                {flatResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <AlertCircle size={32} className="text-theme-muted opacity-50 mb-3" />
                    <h5 className="font-black text-theme-text text-sm">No matches found</h5>
                    <p className="text-[11px] text-theme-muted mt-1 max-w-xs">Double check spelling or try typing `/` to see app commands.</p>
                  </div>
                ) : (
                  <>
                    {/* Commands List */}
                    {commands.length > 0 && (activeTab === 'all' || activeTab === 'commands') && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-theme-muted opacity-50 mb-3">Commands</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {commands.slice(0, activeTab === 'all' ? 5 : undefined).map((cmd) => {
                            const Icon = cmd.icon || Terminal;
                            const isSelected = flatResults[selectedIndex]?.id === cmd.id;
                            return (
                              <div
                                key={cmd.code}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTriggerItem(cmd); }}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex items-start gap-4 relative overflow-hidden group ${
                                  cmd.isElite ? 'border-amber-500/15' : ''
                                } ${isSelected ? 'search-active-item' : ''}`}
                                style={{
                                  borderColor: isSelected 
                                    ? (cmd.isElite ? 'rgba(245,158,11,0.5)' : 'rgba(var(--color-primary), 0.5)') 
                                    : (cmd.isElite ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)'),
                                  background: isSelected 
                                    ? (cmd.isElite ? 'rgba(245,158,11,0.1)' : 'rgba(var(--color-primary), 0.08)') 
                                    : 'rgba(255,255,255,0.02)',
                                  boxShadow: isSelected 
                                    ? (cmd.isElite ? '0 8px 24px rgba(245,158,11,0.2)' : '0 8px 24px rgba(var(--color-primary), 0.15)') 
                                    : 'none',
                                }}
                              >
                                <div 
                                  className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10 shrink-0 border border-white/5"
                                  style={{ 
                                    background: cmd.isElite ? 'rgba(245,158,11,0.08)' : `${cmd.color}12`, 
                                    color: cmd.isElite ? '#fbbf24' : cmd.color 
                                  }}
                                >
                                  <Icon size={18} strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-sm text-theme-text leading-tight group-hover:text-theme-primary transition-colors">{cmd.title}</span>
                                      {cmd.isElite && (
                                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/35 text-[8px] font-black text-amber-500 uppercase tracking-widest leading-none">
                                          Elite
                                        </span>
                                      )}
                                    </div>
                                    <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black text-theme-muted uppercase tracking-wider">{cmd.code}</span>
                                  </div>
                                  <p className="text-[11px] text-theme-muted font-medium mt-1 leading-snug">{cmd.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Exams List */}
                    {exams.length > 0 && (activeTab === 'all' || activeTab === 'exams') && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-theme-muted opacity-50 mb-3">Exams</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {exams.slice(0, activeTab === 'all' ? 3 : undefined).map((exam) => {
                            const Icon = exam.icon || Compass;
                            const isSelected = flatResults[selectedIndex]?.id === exam.id;
                            return (
                              <div
                                key={exam.id}
                                onClick={() => handleTriggerItem(exam)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex items-center gap-4 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] ${isSelected ? 'search-active-item' : ''}`}
                                style={{
                                  borderColor: isSelected ? 'rgba(var(--color-primary), 0.5)' : 'rgba(255,255,255,0.05)',
                                  background: isSelected ? 'rgba(var(--color-primary), 0.08)' : 'rgba(255,255,255,0.02)',
                                  boxShadow: isSelected ? '0 8px 24px rgba(var(--color-primary), 0.15)' : 'none',
                                }}
                              >
                                <div 
                                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5"
                                  style={{ background: `${exam.color}12`, color: exam.color }}
                                >
                                  <Icon size={18} strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="font-extrabold text-sm text-theme-text leading-tight group-hover:text-theme-primary transition-colors">{exam.name}</span>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">Live</span>
                                    <span className="text-[9px] font-black text-theme-muted uppercase tracking-widest leading-none">• Elite</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Subjects List */}
                    {subjects.length > 0 && (activeTab === 'all' || activeTab === 'subjects') && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-theme-muted opacity-50 mb-3">Subjects</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {subjects.slice(0, activeTab === 'all' ? 6 : undefined).map((sub) => {
                            const Icon = SUBJECT_ICONS[sub.slug] || BookOpen;
                            const color = SUBJECT_COLORS[sub.slug] || '#4361ee';
                            const isSelected = flatResults[selectedIndex]?.id === sub.id;
                            return (
                              <div
                                key={sub.slug}
                                onClick={() => handleTriggerItem(sub)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex items-center gap-4 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] ${isSelected ? 'search-active-item' : ''}`}
                                style={{
                                  borderColor: isSelected ? 'rgba(var(--color-primary), 0.5)' : 'rgba(255,255,255,0.05)',
                                  background: isSelected ? 'rgba(var(--color-primary), 0.08)' : 'rgba(255,255,255,0.02)',
                                  boxShadow: isSelected ? '0 8px 24px rgba(var(--color-primary), 0.15)' : 'none',
                                }}
                              >
                                <div 
                                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5"
                                  style={{ background: `${color}12`, color: color }}
                                >
                                  <Icon size={18} strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="font-extrabold text-sm text-theme-text leading-tight group-hover:text-theme-primary transition-colors">{sub.name}</span>
                                  <p className="text-[9px] font-black text-theme-muted uppercase tracking-widest mt-1">Practice & Mock Mapped</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Tags List */}
                    {tags.length > 0 && (activeTab === 'all' || activeTab === 'tags') && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-theme-muted opacity-50 mb-3">Topics</h4>
                        <div className="flex flex-wrap gap-2">
                          {tags.slice(0, activeTab === 'all' ? 8 : undefined).map((tag) => {
                            const isSelected = flatResults[selectedIndex]?.id === tag.id;
                            return (
                              <button
                                key={tag.name}
                                onClick={() => handleTriggerItem(tag)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                                  isSelected
                                    ? 'bg-theme-primary text-white border-theme-primary/40 shadow-md shadow-theme-primary/20 scale-105 search-active-item'
                                    : 'bg-white/[0.02] border-white/5 text-theme-text hover:border-white/20 hover:bg-white/[0.06]'
                                }`}
                              >
                                <Zap size={10} className={isSelected ? 'text-white' : 'text-theme-primary'} />
                                {tag.name}
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-theme-muted'}`}>
                                  {tag.count}Q
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Questions List */}
                    {questions.length > 0 && (activeTab === 'all' || activeTab === 'questions') && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-theme-muted opacity-50 mb-3">Matching Questions</h4>
                        <div className="space-y-2">
                          {questions.slice(0, activeTab === 'all' ? 10 : undefined).map((q) => {
                            const diffColor = q.difficulty === 'Easy' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/15' : q.difficulty === 'Medium' ? 'text-amber-500 bg-amber-500/10 border-amber-500/15' : 'text-rose-500 bg-rose-500/10 border-rose-500/15';
                            const isSelected = flatResults[selectedIndex]?.id === q.id;
                            return (
                              <div
                                key={q.id}
                                onClick={() => handleTriggerItem(q)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group animate-fadeIn ${isSelected ? 'search-active-item' : ''}`}
                                style={{
                                  borderColor: isSelected ? 'rgba(var(--color-primary), 0.5)' : 'rgba(255,255,255,0.05)',
                                  background: isSelected ? 'rgba(var(--color-primary), 0.08)' : 'rgba(255,255,255,0.02)',
                                  boxShadow: isSelected ? '0 8px 24px rgba(var(--color-primary), 0.15)' : 'none',
                                }}
                              >
                                <div className="flex-1 min-w-0 pr-2">
                                  <p 
                                    className="font-extrabold text-sm text-theme-text leading-snug group-hover:text-theme-primary transition-colors truncate sm:whitespace-normal"
                                    dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(q.question) }}
                                  />
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-theme-muted bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                                      {formatCategoryName(q.category_id)}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${diffColor}`}>
                                      {q.difficulty || 'General'}
                                    </span>
                                    {q.tags && q.tags.slice(0, 2).map(tag => (
                                      <span key={tag} className="text-[9px] font-bold text-theme-muted/70 bg-white/5 px-1.5 py-0.5 rounded-md">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <button className="self-end sm:self-center shrink-0 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-[10px] font-black uppercase tracking-widest text-theme-muted group-hover:text-theme-primary group-hover:border-theme-primary/30 transition-all flex items-center gap-1.5 active:scale-95">
                                  <Play size={10} fill="currentColor" /> Preview
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* MCQ Live Preview Drawer */}
          <AnimatePresence>
            {previewQuestion && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[109] bg-black/60 backdrop-blur-md animate-fadeIn" 
                  onClick={() => setPreviewQuestion(null)} 
                />
                <motion.div
                  ref={drawerRef}
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                  className="fixed right-0 top-0 bottom-0 w-full md:max-w-xl bg-theme-surface/90 border-l border-white/10 z-[110] pt-4 pb-4 px-6 shadow-2xl overflow-y-auto flex flex-col justify-between backdrop-blur-2xl"
                  style={{ background: 'var(--color-surface)' }}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted opacity-80">MCQ Live Preview</span>
                      <button 
                        onClick={() => setPreviewQuestion(null)}
                        className="p-1.5 rounded-xl bg-white/[0.02] border border-white/5 text-theme-muted hover:text-theme-text transition-all"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-theme-primary bg-theme-primary/10 border border-theme-primary/20 px-3 py-1 rounded-full">
                        {formatCategoryName(previewQuestion.category_id)}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-[0.15em] border border-white/5 px-3 py-1 rounded-full ${
                        previewQuestion.difficulty === 'Easy' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/15' : previewQuestion.difficulty === 'Medium' ? 'text-amber-500 bg-amber-500/10 border-amber-500/15' : 'text-rose-500 bg-rose-500/10 border-rose-500/15'
                      }`}>
                        {previewQuestion.difficulty}
                      </span>
                    </div>

                    {/* Question Text */}
                    <h3 
                      className="text-lg font-extrabold text-theme-text leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(previewQuestion.question) }}
                    />

                    {/* Options list */}
                    <div className="space-y-2.5">
                      {previewQuestion.options.map(opt => {
                        const isCorrect = opt.id === previewQuestion.correctId;
                        return (
                          <div 
                            key={opt.id}
                            className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                              isCorrect 
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                                : 'bg-white/[0.02] border-white/5 text-theme-text/80'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center border ${
                                isCorrect ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white/5 border-white/5 text-theme-muted'
                              }`}>
                                {opt.label || opt.id.toUpperCase()}
                              </span>
                              <span className="text-sm font-semibold" dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(opt.text) }} />
                            </div>
                            {isCorrect && (
                              <svg width="16" height="12" viewBox="0 0 10 8" className="text-emerald-500 stroke-current" fill="none">
                                <path d="M1.5 4L4 6.5L8.5 2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {previewQuestion.explanation && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted opacity-60">Explanation</h4>
                        <div 
                          dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(previewQuestion.explanation) }}
                          className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs leading-relaxed text-theme-text/70"
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center gap-3 border-t border-white/5 pt-4 mt-4 shrink-0">
                    <button
                      onClick={handleToggleBookmark}
                      className={`flex-1 py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 ${
                        isBookmarked
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                          : 'bg-white/[0.02] border-white/5 text-theme-muted hover:text-theme-text hover:border-theme-primary/30'
                      }`}
                    >
                      <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
                      {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setPreviewQuestion(null);
                        onClose();
                        navigate(`/mcq/${previewQuestion.category_id}`);
                      }}
                      className="flex-[2] py-3 px-4 rounded-xl bg-theme-primary text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-theme-primary/25 active:scale-95"
                    >
                      <Play size={12} fill="currentColor" />
                      Start Practice
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function FloatingNav() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [coinsVaultOpen, setCoinsVaultOpen] = useState(false);
  const location = useLocation();

  // Dynamically compute navItems depending on guest status
  const navItems = useMemo(() => {
    const items = [...baseNavItems];
    if (!user) {
      // Profile remains integral and unchanged, but we add a new 'Sign In' option for guest users
      items.push({
        icon: User,
        label: 'Sign In',
        to: '/signin',
        color: '#818cf8',
        bg: 'rgba(129,140,248,0.12)',
      });
    }
    return items;
  }, [user]);

  // Keyboard shortcut listener Ctrl/Cmd + K & Esc global close
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const isK = e.key === 'k' || e.key === 'K';
      const isMeta = e.metaKey || e.ctrlKey;
      
      if (isK && isMeta) {
        e.preventDefault();
        
        // Disable search dashboard during exams
        if (window.location.pathname === '/mock-test') return;
        
        setIsSearchOpen(prev => !prev);
        setIsOpen(false);
      }
      
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSearchOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ 
              background: 'rgba(var(--color-bg-rgb), 0.4)', 
              backdropFilter: 'blur(8px)' 
            }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-5 z-50 flex flex-col-reverse items-end gap-3">
        <NavTrigger isOpen={isOpen} onClick={() => setIsOpen(s => !s)} />

        <AnimatePresence>
          {isOpen && (
            <div className="flex flex-col-reverse gap-2.5">
              {navItems.map((item, i) => {
                const Icon = item.icon;
                const isActive = item.to && location.pathname === item.to;
                
                const Component = item.to ? Link : 'button';
                const props = item.to 
                  ? { to: item.to, onClick: () => setIsOpen(false) } 
                  : { onClick: () => { setIsOpen(false); setIsSearchOpen(true); } };

                return (
                  <motion.div
                    key={item.label}
                    custom={{ index: i, total: navItems.length }}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex items-center justify-end gap-3"
                  >
                    <motion.span
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.055 + 0.1, duration: 0.3 }}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl shadow-card select-none backdrop-blur-md"
                      style={{
                        background: 'rgba(var(--color-surface-rgb), 0.9)',
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.label}
                    </motion.span>

                    <Component
                      {...props}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-card shrink-0 backdrop-blur-md"
                      style={{
                        background: isActive ? item.color : 'rgba(var(--color-surface-rgb), 0.9)',
                        border: `1.5px solid ${isActive ? item.color : 'var(--color-border)'}`,
                        color: isActive ? 'white' : item.color,
                      }}
                      aria-label={item.label}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    </Component>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes pulse-ring-fab {
          0%   { box-shadow: 0 0 0 0 rgba(var(--color-primary), 0.4); }
          70%  { box-shadow: 0 0 0 12px rgba(var(--color-primary), 0); }
          100% { box-shadow: 0 0 0 0 rgba(var(--color-primary), 0); }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--color-text-rgb), 0.1);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--color-primary), 0.4);
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)}
        setStreakModalOpen={setStreakModalOpen}
        setCoinsVaultOpen={setCoinsVaultOpen}
      />
      
      <StreakModal isOpen={streakModalOpen} onClose={() => setStreakModalOpen(false)} />
      <CoinsVaultModal isOpen={coinsVaultOpen} onClose={() => setCoinsVaultOpen(false)} />
    </>
  );
}
