import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import McqCard from '../components/McqCard';
import {
  Bookmark, LayoutGrid, X, Compass, SlidersHorizontal, ChevronDown, Filter,
  Trash2, Sparkles, Clock, ChevronRight, CheckCircle, XCircle, Lightbulb,
  Copy, FolderPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllBookmarksDB, getAllSavedOutputs, deleteSavedOutput, saveOfflineQuestions } from '../lib/db';
import { useToast } from '../context/ToastContext';
import { renderMathInHtmlString, formatMentorResponse } from '../lib/ai';
import { ALL_STATIC_BANKS_SYNC } from '../lib/dataHub';

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

const DEFAULT_CATEGORIES = [
  { id: 'accountancy', name: 'Accountancy' },
  { id: 'ancient-history', name: 'Ancient History' },
  { id: 'computer-awareness', name: 'Computer Awareness' },
  { id: 'current-affairs', name: 'Current Affairs' },
  { id: 'english', name: 'English' },
  { id: 'environment', name: 'Environment' },
  { id: 'general-science', name: 'General Science' },
  { id: 'indian-economy', name: 'Indian Economy' },
  { id: 'indian-geography', name: 'Indian Geography' },
  { id: 'indian-polity', name: 'Indian Polity' },
  { id: 'maths', name: 'Maths' },
  { id: 'medieval-history', name: 'Medieval History' },
  { id: 'modern-history', name: 'Modern History' },
  { id: 'physical-geography', name: 'Physical Geography' },
  { id: 'reasoning', name: 'Reasoning' },
  { id: 'static-gk', name: 'Static GK' },
  { id: 'world-geography', name: 'World Geography' },
  { id: 'jk-affairs', name: 'JK Affairs' }
];

function SavedOutputCard({ output, onDelete, onImportClick }) {
  const [localMcqs, setLocalMcqs] = useState(() => (output.mcqs || []).map(m => ({ ...m, selectedOption: null })));
  const [isExpanded, setIsExpanded] = useState(false);
  const { showToast } = useToast();

  const handleCopyCardMcqs = () => {
    if (!output.mcqs || output.mcqs.length === 0) {
      showToast("No MCQs found in this card.", "error");
      return;
    }
    let serializedText = '';
    output.mcqs.forEach((mcq, index) => {
      const question = mcq.question || '';
      let optionsStr = '';
      let correctLabel = 'A';
      const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      
      (mcq.options || []).forEach((opt, i) => {
        const label = alphabet[i] || 'A';
        if (opt.id === mcq.correctId) {
          correctLabel = label;
        }
        optionsStr += `${label}) ${opt.text || ''}\n`;
      });
      
      let explanation = mcq.explanation || '';
      if (mcq.difficulty) {
        explanation += ` #${mcq.difficulty.toLowerCase()}`;
      }
      if (mcq.tags && Array.isArray(mcq.tags)) {
        mcq.tags.forEach(t => {
          const normTag = t.toLowerCase().replace(/\s+/g, '-');
          if (!explanation.toLowerCase().includes(`#${normTag}`)) {
            explanation += ` #${normTag}`;
          }
        });
      }
      
      serializedText += `${question}\n${optionsStr}Correct Answer: ${correctLabel}\nExplanation: ${explanation}`;
      if (index < output.mcqs.length - 1) {
        serializedText += '\n>>>\n';
      }
    });

    navigator.clipboard.writeText(serializedText)
      .then(() => {
        showToast("Copied for notekash.com", "success");
      })
      .catch(err => {
        console.error("Clipboard copy failed", err);
        showToast("Failed to copy to clipboard.", "error");
      });
  };



  const handleAnswerMCQ = (mcqIdx, optionId) => {
    setLocalMcqs(prev => prev.map((m, idx) => {
      if (idx === mcqIdx) {
        return { ...m, selectedOption: optionId };
      }
      return m;
    }));
  };

  const modeInfo = {
    mcq: { emoji: '🎯', label: 'MCQ Creator', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
    plan: { emoji: '📅', label: 'Study Plan', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
    report: { emoji: '📊', label: 'Report Card', bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20' },
    learn: { emoji: '💡', label: 'Learn Stuff', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  }[output.mode] || { emoji: '🤖', label: 'AI Output', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' };

  const date = new Date(output.savedAt || output.timestamp);
  const dateStr = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      onClick={() => setIsExpanded(!isExpanded)}
      className="mcq-glass-card rounded-[1.35rem] p-4 md:p-5 transition-all space-y-3 relative overflow-hidden text-sm font-medium text-theme-text cursor-pointer"
    >


      {/* CARD HEADER */}
      <div className="relative flex items-center justify-between border-b border-theme-border pb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${modeInfo.bg} ${modeInfo.text} ${modeInfo.border}`}>
            {modeInfo.emoji} {modeInfo.label}
          </span>
          <span className="text-[10px] text-theme-muted font-bold">
            {dateStr} · {timeStr}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {output.mode === 'mcq' && (
            <>
              {/* Copy Icon */}
              <button
                onClick={handleCopyCardMcqs}
                title="Copy for notekash.com"
                className="p-2 rounded-xl bg-theme-bg/60 border border-theme-border text-theme-muted hover:text-theme-text hover:bg-theme-primary/10 hover:border-theme-primary/30 transition-all"
              >
                <Copy size={14} />
              </button>

              {/* Add to Category Icon */}
              <button
                onClick={() => onImportClick(output)}
                title="Add to category bank"
                className="p-2 rounded-xl bg-theme-bg/60 border border-theme-border text-theme-muted hover:text-theme-text hover:bg-theme-primary/10 hover:border-theme-primary/30 transition-all"
              >
                <FolderPlus size={14} />
              </button>
            </>
          )}

          {/* Expand Icon */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse card" : "Expand card"}
            className="p-2 rounded-xl bg-theme-bg/60 border border-theme-border text-theme-muted hover:text-theme-text transition-all"
          >
            <ChevronDown size={14} className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => onDelete(output.id)}
            title="Delete from library"
            className="p-2 rounded-xl bg-theme-bg/60 border border-theme-border hover:border-rose-500/30 hover:bg-rose-500/10 text-theme-muted hover:text-rose-500 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* CARD TITLE */}
      {output.title && (
        <h3 className="relative text-base font-extrabold text-theme-text tracking-tight flex items-center justify-between">
          <span>{output.title}</span>
          {!isExpanded && (
            <span className="text-[10px] text-theme-muted bg-theme-bg/50 px-2 py-0.5 rounded-md border border-theme-border shrink-0 ml-4 font-bold uppercase tracking-wider">
              {output.mode === 'mcq' ? `${localMcqs?.length || 0} MCQs` : 'View'}
            </span>
          )}
        </h3>
      )}

      {/* CARD CONTENT */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative overflow-hidden pt-2 border-t border-theme-border space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {localMcqs && localMcqs.length > 0 ? (
              <div className="space-y-6 pt-2">
                {localMcqs.map((mcq, idx) => (
                  <div key={idx} className="mcq-inner-card rounded-[1.1rem] p-5 md:p-6 transition-all space-y-4">
                    
                    {/* Header Badges */}
                    <div className="flex items-center justify-between text-[10px] font-semibold tracking-widest uppercase mb-1">
                      <span className="text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/15">
                        MCQ {idx + 1}
                      </span>
                      <span className={`px-3 py-1 rounded-full border ${
                        (mcq.difficulty || 'Medium').toLowerCase() === 'hard'
                          ? 'text-rose-500 bg-rose-500/10 border-rose-500/10'
                          : (mcq.difficulty || 'Medium').toLowerCase() === 'easy'
                            ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/10'
                            : 'text-blue-500 bg-blue-500/10 border-blue-500/10'
                      }`}>
                        {mcq.difficulty || 'Medium'}
                      </span>
                    </div>

                    {/* Question Text */}
                    <p className="nk-mcq-question font-bold text-theme-text text-[15px] leading-relaxed tracking-tight" dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(mcq.question) }} />
                    
                    {/* Options */}
                    <div className="space-y-2.5">
                      {mcq.options.map(opt => {
                        const isSelected = mcq.selectedOption === opt.id;
                        const isCorrect = opt.id === mcq.correctId;
                        const hasAnswered = !!mcq.selectedOption;
                        
                  let btnClass = 'mcq-option-row w-full text-left p-3.5 rounded-[0.95rem] transition-all duration-200 flex items-center justify-between text-xs text-theme-text font-semibold group';
                  let bubbleStyle = 'mcq-letter text-theme-muted group-hover:text-theme-primary';
                  if (hasAnswered) {
                    if (isCorrect) {
                      btnClass = 'mcq-option-correct w-full text-left p-3.5 rounded-[0.95rem] text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-between pointer-events-none text-xs';
                      bubbleStyle = 'mcq-letter bg-emerald-500 text-white';
                    } else if (isSelected) {
                      btnClass = 'mcq-option-wrong w-full text-left p-3.5 rounded-[0.95rem] text-rose-700 dark:text-rose-300 font-bold flex items-center justify-between pointer-events-none text-xs';
                      bubbleStyle = 'mcq-letter bg-rose-500 text-white';
                    } else {
                      btnClass = 'mcq-option-muted w-full text-left p-3.5 rounded-[0.95rem] text-theme-muted pointer-events-none text-xs opacity-35';
                      bubbleStyle = 'mcq-letter text-theme-muted';
                    }
                  }
                  
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={hasAnswered}
                      onClick={() => handleAnswerMCQ(idx, opt.id)}
                      className={btnClass}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 shrink-0 ${bubbleStyle}`}>
                          {opt.id.toUpperCase()}
                        </span>
                        <span className="text-[13px] md:text-sm" dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(opt.text) }} />
                      </span>
                      {hasAnswered && isCorrect && <CheckCircle className="text-emerald-500 w-5 h-5 shrink-0" />}
                      {hasAnswered && isSelected && !isCorrect && <XCircle className="text-rose-500 w-5 h-5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
                    
                    {mcq.selectedOption && (
                      <div className="mcq-explanation-panel p-5 rounded-[1.1rem] space-y-4 mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-theme-border">
                          <h4 className="flex items-center gap-2 font-bold text-theme-primary">
                            <Lightbulb size={18} /> Explanation
                          </h4>
                        </div>
                        <div className="leading-relaxed text-xs text-theme-text font-medium mentor-response" dangerouslySetInnerHTML={{ __html: renderMathInHtmlString(mcq.explanation) }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="mentor-response prose max-w-none text-theme-text leading-relaxed text-sm pt-1"
                dangerouslySetInnerHTML={{ __html: output.html }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BookmarksDashboard() {
  const { showToast } = useToast();

  // Tab: 'mcq' | 'library'
  const [activeTab, setActiveTab] = useState('mcq');

  // MCQ Bookmarks
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);
  const [isLoadingMcq, setIsLoadingMcq] = useState(true);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState('random');

  // Saved AI Outputs
  const [savedOutputs, setSavedOutputs] = useState([]);
  const [isLoadingOutputs, setIsLoadingOutputs] = useState(true);

  // Import Modal State
  const [importingOutput, setImportingOutput] = useState(null);
  const [selectedImportCategory, setSelectedImportCategory] = useState(DEFAULT_CATEGORIES[0].id);
  const [importTopic, setImportTopic] = useState('');

  const handleOpenImportModal = (output) => {
    setImportingOutput(output);
    setSelectedImportCategory(DEFAULT_CATEGORIES[0].id);
    setImportTopic(output.title || '');
  };

  const handleImportToCategory = async () => {
    try {
      if (!importingOutput || !importingOutput.mcqs || importingOutput.mcqs.length === 0) {
        showToast("No MCQs found in this card.", "error");
        return;
      }

      const categoryName = DEFAULT_CATEGORIES.find(c => c.id === selectedImportCategory)?.name || selectedImportCategory;
      const topicName = importTopic.trim() || 'General';

      const formattedQuestions = importingOutput.mcqs.map((mcq, idx) => {
        const difficulty = mcq.difficulty 
          ? mcq.difficulty.charAt(0).toUpperCase() + mcq.difficulty.slice(1).toLowerCase() 
          : 'Medium';
          
        return {
          id: `offline_${selectedImportCategory}_${Date.now()}_${idx}`,
          category_id: selectedImportCategory,
          difficulty: difficulty,
          tags: [topicName, 'Personal AI'],
          question: mcq.question,
          correctId: mcq.correctId || 'a',
          options: mcq.options.map(opt => ({
            id: opt.id,
            label: opt.id.toUpperCase(),
            text: opt.text
          })),
          explanation: mcq.explanation || '',
          isOffline: true
        };
      });

      // Save to IndexedDB
      await saveOfflineQuestions(formattedQuestions);

      // Add to in-memory sync bank immediately
      formattedQuestions.forEach(q => {
        if (!ALL_STATIC_BANKS_SYNC.some(existing => existing.id === q.id)) {
          ALL_STATIC_BANKS_SYNC.push(q);
        }
      });

      showToast(`Imported ${formattedQuestions.length} MCQs to ${categoryName}!`, "success");
      setImportingOutput(null);
    } catch (e) {
      console.error(e);
      showToast("Failed to import MCQs.", "error");
    }
  };

  // Load MCQ bookmarks
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const saved = await getAllBookmarksDB();
        setBookmarkedQuestions(saved);
      } catch (e) {
        console.error('Failed to load bookmarks', e);
      } finally {
        setIsLoadingMcq(false);
      }
    };
    loadBookmarks();
    window.addEventListener('bookmarksUpdated', loadBookmarks);
    return () => window.removeEventListener('bookmarksUpdated', loadBookmarks);
  }, []);

  // Load saved outputs
  const loadOutputs = async () => {
    try {
      setIsLoadingOutputs(true);
      const data = await getAllSavedOutputs();
      const resetData = (data || []).map(o => o.mcqs ? { ...o, mcqs: o.mcqs.map(m => ({ ...m, selectedOption: null })) } : o);
      setSavedOutputs(resetData);
    } catch (e) {
      console.error('Failed to load saved outputs', e);
    } finally {
      setIsLoadingOutputs(false);
    }
  };

  useEffect(() => {
    loadOutputs();
    window.addEventListener('savedOutputsUpdated', loadOutputs);
    return () => window.removeEventListener('savedOutputsUpdated', loadOutputs);
  }, []);

  const handleDeleteOutput = async (id) => {
    try {
      await deleteSavedOutput(id);
      setSavedOutputs(prev => prev.filter(o => o.id !== id));
      showToast('Saved output deleted.', 'success');
    } catch (e) {
      showToast('Failed to delete output.', 'error');
    }
  };

  // MCQ filter/sort
  const availableCategories = useMemo(() => {
    const cats = new Set();
    bookmarkedQuestions.forEach(q => { if (q.category_id) cats.add(q.category_id); });
    return Array.from(cats).sort();
  }, [bookmarkedQuestions]);

  const filteredQuestions = useMemo(() => {
    let result = [...bookmarkedQuestions];
    if (selectedDifficulties.length > 0) result = result.filter(q => q.difficulty && selectedDifficulties.includes(q.difficulty));
    if (selectedCategories.length > 0) result = result.filter(q => q.category_id && selectedCategories.includes(q.category_id));
    if (sortBy === 'random') {
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.bookmarkedAt || 0) - new Date(a.bookmarkedAt || 0));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.bookmarkedAt || 0) - new Date(a.bookmarkedAt || 0));
    } else if (sortBy === 'difficulty-hard') {
      const order = { hard: 1, medium: 2, easy: 3 };
      result.sort((a, b) => (order[a.difficulty?.toLowerCase()] || 4) - (order[b.difficulty?.toLowerCase()] || 4));
    } else if (sortBy === 'difficulty-easy') {
      const order = { easy: 1, medium: 2, hard: 3 };
      result.sort((a, b) => (order[a.difficulty?.toLowerCase()] || 4) - (order[b.difficulty?.toLowerCase()] || 4));
    }
    return result;
  }, [bookmarkedQuestions, selectedDifficulties, selectedCategories, sortBy]);

  const hasActiveFilters = selectedDifficulties.length > 0 || selectedCategories.length > 0 || sortBy !== 'random';
  const activeFilterCount = selectedDifficulties.length + selectedCategories.length + (sortBy !== 'random' ? 1 : 0);

  const difficultyDotClass = (d) => {
    if (d === 'Easy') return 'bg-emerald-400 shadow-emerald-400/60';
    if (d === 'Medium') return 'bg-blue-400 shadow-blue-400/60';
    if (d === 'Hard') return 'bg-rose-400 shadow-rose-400/60';
    return 'bg-theme-muted';
  };

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col pb-24">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">

        {/* Page header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Bookmark size={24} fill="currentColor" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-theme-text tracking-tight">Your Library</h1>
                <p className="text-theme-muted mt-0.5 text-sm font-medium">
                  {bookmarkedQuestions.length} saved {bookmarkedQuestions.length === 1 ? 'question' : 'questions'} · {savedOutputs.length} saved {savedOutputs.length === 1 ? 'output' : 'outputs'}
                </p>
              </div>
            </div>

            {/* Filter button — only on MCQ tab */}
            {activeTab === 'mcq' && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all duration-200
                  ${showFilters || hasActiveFilters
                    ? 'bg-theme-primary text-white border-theme-primary shadow-lg shadow-theme-primary/30'
                    : 'bg-theme-surface border-theme-border text-theme-text hover:border-theme-primary/50'
                  }`}
              >
                <SlidersHorizontal size={16} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-theme-bg">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-theme-surface border border-theme-border rounded-2xl p-1.5 w-fit">
            <button
              onClick={() => setActiveTab('mcq')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'mcq'
                  ? 'bg-theme-primary text-white shadow-md'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              <Bookmark size={15} />
              MCQ Bookmarks
              {bookmarkedQuestions.length > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === 'mcq' ? 'bg-white/20' : 'bg-theme-surface-hover'}`}>
                  {bookmarkedQuestions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'library'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              <Sparkles size={15} />
              AI Library
              {savedOutputs.length > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === 'library' ? 'bg-white/20' : 'bg-theme-surface-hover'}`}>
                  {savedOutputs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── MCQ BOOKMARKS TAB ── */}
        {activeTab === 'mcq' && (
          <>
            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-theme-surface border border-theme-border rounded-2xl p-6 space-y-6 shadow-sm">
                    {/* Sort */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-theme-muted mb-3 flex items-center gap-1.5">
                        <ChevronDown size={14} /> Sort By
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'random', label: 'Random Shuffle' },
                          { value: 'newest', label: 'Recently Added' },
                          { value: 'oldest', label: 'Oldest First' },
                          { value: 'difficulty-hard', label: 'Hardest First' },
                          { value: 'difficulty-easy', label: 'Easiest First' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setSortBy(opt.value)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all
                              ${sortBy === opt.value
                                ? 'bg-theme-primary text-white border-theme-primary'
                                : 'bg-theme-bg border-theme-border text-theme-text hover:border-theme-primary/50 hover:bg-theme-bg'
                              }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px w-full bg-theme-border/50" />

                    {/* Difficulty */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-theme-muted mb-3 flex items-center gap-1.5">
                        <Filter size={14} /> Difficulty
                      </label>
                      <div className="flex gap-2">
                        {DIFFICULTY_OPTIONS.map(d => (
                          <button
                            key={d}
                            onClick={() => setSelectedDifficulties(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all
                              ${selectedDifficulties.includes(d)
                                ? 'bg-theme-primary text-white border-theme-primary'
                                : 'bg-theme-bg border-theme-border text-theme-text hover:border-theme-primary/50'
                              }`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${difficultyDotClass(d)}`} />
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {availableCategories.length > 0 && (
                      <>
                        <div className="h-px w-full bg-theme-border/50" />
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-theme-muted mb-3 flex items-center gap-1.5">
                            <LayoutGrid size={14} /> Categories
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {availableCategories.map(catId => (
                              <button
                                key={catId}
                                onClick={() => setSelectedCategories(prev => prev.includes(catId) ? prev.filter(x => x !== catId) : [...prev, catId])}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all capitalize
                                  ${selectedCategories.includes(catId)
                                    ? 'bg-theme-primary text-white border-theme-primary'
                                    : 'bg-theme-bg border-theme-border text-theme-text hover:border-theme-primary/50'
                                  }`}
                              >
                                {catId.replace(/-/g, ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {hasActiveFilters && (
                      <div className="pt-2 border-t border-theme-border/50 flex justify-end">
                        <button
                          onClick={() => { setSelectedDifficulties([]); setSelectedCategories([]); setSortBy('random'); }}
                          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors bg-rose-500/10 px-4 py-2 rounded-xl"
                        >
                          <X size={14} /> Clear Filters
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question feed */}
            <div className="space-y-6">
              {isLoadingMcq ? (
                <div className="text-center py-20 text-theme-muted font-bold animate-pulse">Loading Bookmarks…</div>
              ) : bookmarkedQuestions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-24 text-center bg-theme-surface rounded-3xl border border-theme-border shadow-sm"
                >
                  <div className="w-20 h-20 rounded-full bg-theme-bg flex items-center justify-center mb-6 border border-theme-border">
                    <Bookmark size={32} className="text-theme-muted" />
                  </div>
                  <h3 className="text-xl font-black text-theme-text mb-2">No bookmarks yet</h3>
                  <p className="text-theme-muted max-w-sm text-sm font-medium leading-relaxed mb-6">
                    When you find an important or difficult question while practicing, click the bookmark icon to save it here for later review.
                  </p>
                </motion.div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-20 text-theme-text font-bold bg-theme-surface rounded-3xl border border-theme-border">
                  No bookmarks match your current filters.
                </div>
              ) : (
                <AnimatePresence>
                  {filteredQuestions.map(q => (
                    <motion.div key={q.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <McqCard questionData={q} showExplanationToggle={true} mode="practice" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </>
        )}

        {/* ── AI LIBRARY TAB ── */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            {isLoadingOutputs ? (
              <div className="text-center py-20 text-theme-muted font-bold animate-pulse">Loading library…</div>
            ) : savedOutputs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center bg-theme-surface rounded-3xl border border-theme-border shadow-sm"
              >
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                  <Sparkles size={32} className="text-amber-500" />
                </div>
                <h3 className="text-xl font-black text-theme-text mb-2">Your AI Library is empty</h3>
                <p className="text-theme-muted max-w-sm text-sm font-medium leading-relaxed">
                  Open <strong>Personal AI Mentor</strong> on your Profile page and click the bookmark icon on any card to save it here.
                </p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {savedOutputs.map(output => (
                  <SavedOutputCard
                    key={output.id}
                    output={output}
                    onDelete={handleDeleteOutput}
                    onImportClick={handleOpenImportModal}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        )}

      </main>

      {/* Screen-Centered Import Modal */}
      <AnimatePresence>
        {importingOutput && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setImportingOutput(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.15 }}
              className="bg-theme-surface border border-theme-border rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-theme-text"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-2 border-b border-theme-border/30">
                <h3 className="text-base font-black text-theme-text uppercase tracking-tight">
                  Import to Category Bank
                </h3>
                <button 
                  onClick={() => setImportingOutput(null)}
                  className="p-1 rounded-lg hover:bg-theme-bg/60 text-theme-muted hover:text-theme-text transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-theme-muted font-bold leading-normal">
                Select a category and specify a topic tag to save these {importingOutput.mcqs?.length || 0} MCQs. They will be integrated natively into practice sets and mocktests.
              </p>

              {/* Category Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-theme-muted">
                  Target Category
                </label>
                <div className="relative">
                  <select
                    value={selectedImportCategory}
                    onChange={(e) => setSelectedImportCategory(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-theme-primary appearance-none pr-10 cursor-pointer text-theme-text"
                  >
                    {DEFAULT_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-theme-muted">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {/* Topic Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-theme-muted">
                  Topic Name (Suggested)
                </label>
                <input
                  type="text"
                  value={importTopic}
                  onChange={(e) => setImportTopic(e.target.value)}
                  placeholder="e.g. Fundamental Rights"
                  className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-theme-primary text-theme-text"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setImportingOutput(null)}
                  className="flex-1 py-2.5 bg-theme-bg border border-theme-border rounded-xl text-xs font-black text-theme-text hover:bg-theme-surface transition-all active:scale-98"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportToCategory}
                  className="flex-1 py-2.5 bg-theme-primary text-white rounded-xl text-xs font-black hover:bg-theme-primary/95 transition-all active:scale-98 shadow-md"
                >
                  Save & Import
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
