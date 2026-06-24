import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import McqCard from '../components/McqCard';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Filter, X, ChevronDown, SlidersHorizontal, Tag, BookOpen, Search, Zap, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getHybridContentHub, getAllQuestions } from '../lib/dataHub';
import { getPracticePreferences, savePracticePreferences, getResurrectionQuestions } from '../lib/db';
import { useEconomy } from '../context/EconomyContext';
import { getQuestionPyq } from '../lib/mockEngine';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 25;
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard', 'Unmarked'];
const SORT_OPTIONS = [
  { value: 'default', label: 'Default Order' },
  { value: 'random', label: 'Random Order' },
  { value: 'mistakes', label: 'By Mistake' },
  { value: 'difficulty-asc', label: 'Difficulty: Easy → Hard' },
  { value: 'difficulty-desc', label: 'Difficulty: Hard → Easy' },
  { value: 'tags-asc', label: 'Tag Count: Fewer First' },
  { value: 'pyq-desc', label: 'PYQ: Newest First' },
  { value: 'pyq-asc', label: 'PYQ: Oldest First' },
];

const DIFFICULTY_ORDER = { easy: 0, medium: 1, hard: 2, unmarked: 3 };

const seededRandom = (seed) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = value * 16807 % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const hashString = (value) => {
  return String(value).split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
};

export default function PracticeEngine({ isPyqArchive = false }) {
  const { category, tag, examName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromCategory = location.state?.fromCategory;
  const { showToast } = useToast();

  const [allQuestions, setAllQuestions] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const { economy } = useEconomy();
  const { user } = useAuth();
  const [mistakeIds, setMistakeIds] = useState(new Set());
  const [randomSeed, setRandomSeed] = useState(Date.now());
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const handleSelectOption = (question, selectedOptionId) => {
    if (question.isGuestQuestion) {
      navigate('/signin', {
        state: {
          from: location.pathname,
          message: "Sign up to solve FREE Mock Tests and MCQs, and start analyzing your performance!"
        }
      });
      return;
    }

    if (selectedOptionId === question.correctId) {
      setCorrectCount(prev => prev + 1);
    } else {
      setWrongCount(prev => prev + 1);
    }
  };

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [pyqOnly, setPyqOnly] = useState(false);
  const [sortBy, setSortBy] = useState('random');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);

  const categoryLabel = isPyqArchive 
    ? `${examName?.replace(/-/g, ' ')} PYQ Archive` 
    : category?.replace(/-/g, ' ') || 'General Science';
  const isTagMode = Boolean(tag); // true when browsing /mcq/:category/tag/:tag
  const preferenceId = `practice:${category || 'general-science'}:${tag || 'all'}:${examName || 'none'}`;

  useEffect(() => {
    setIsLoading(true);
    setVisibleCount(PAGE_SIZE);
    const fetchQuestions = async () => {
      try {
        let data = [];
        let resurrectionQuestions = [];
        
        if (isPyqArchive && examName) {
           const [allData, resQ] = await Promise.all([
             getAllQuestions(),
             getResurrectionQuestions().catch(() => []),
           ]);
           
           // Filter for PYQ matching examName
           const normalizedExamName = examName.toLowerCase().replace(/-/g, ' ');
           
           data = allData.filter(q => {
             const pyq = getQuestionPyq(q);
             if (!pyq) return false;
             return pyq.toLowerCase().includes(normalizedExamName);
           });

           // Sort descending by year extracted from PYQ field
           data.sort((a, b) => {
             const getYear = (q) => {
                const pyq = getQuestionPyq(q);
                if (!pyq) return 0;
                const match = pyq.match(/\d{4}/);
                return match ? parseInt(match[0]) : 0;
             };
             return getYear(b) - getYear(a);
           });

           resurrectionQuestions = resQ;
        } else {
           const catId = category || 'general-science';
           const [catData, resQ] = await Promise.all([
             getHybridContentHub(catId),
             getResurrectionQuestions().catch(() => []),
           ]);
           data = catData;
           resurrectionQuestions = resQ;
        }

        setAllQuestions(data);
        setMistakeIds(new Set(resurrectionQuestions.map(q => q.id)));
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [category, isPyqArchive, examName]);

  useEffect(() => {
    let mounted = true;
    setPrefsLoaded(false);
    getPracticePreferences(preferenceId).then(prefs => {
      if (!mounted) return;
      setSelectedDifficulties(prefs?.selectedDifficulties || []);
      setSelectedTags(prefs?.selectedTags || []);
      setPyqOnly(prefs?.pyqOnly || false);
      setSortBy(prefs?.sortBy || 'random');
      setRandomSeed(prefs?.randomSeed || Date.now());
      setVisibleCount(PAGE_SIZE);
      setPrefsLoaded(true);
    }).catch(() => setPrefsLoaded(true));
    return () => { mounted = false; };
  }, [preferenceId]);

  useEffect(() => {
    if (!prefsLoaded) return;
    savePracticePreferences(preferenceId, {
      selectedDifficulties,
      selectedTags,
      pyqOnly,
      sortBy,
      randomSeed,
    }).catch(() => {});
  }, [preferenceId, selectedDifficulties, selectedTags, pyqOnly, sortBy, randomSeed, prefsLoaded]);

  // Collect all unique tags from the bank for the filter panel
  const allAvailableTags = useMemo(() => {
    const tagMap = new Map(); // lowercase -> canonical tag name
    allQuestions.forEach(q => {
      q.tags?.forEach(t => {
        if (typeof t !== 'string') return;
        const trimmed = t.trim();
        if (!trimmed) return;
        const lower = trimmed.toLowerCase();
        if (!tagMap.has(lower)) {
          tagMap.set(lower, trimmed);
        } else {
          const existing = tagMap.get(lower);
          // Prefer the one with more uppercase letters (e.g. "JK History" over "Jk history")
          const existingUpper = (existing.match(/[A-Z]/g) || []).length;
          const incomingUpper = (trimmed.match(/[A-Z]/g) || []).length;
          if (incomingUpper > existingUpper) {
            tagMap.set(lower, trimmed);
          }
        }
      });
    });
    return Array.from(tagMap.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [allQuestions]);

  // Apply filters + sort
  const filteredQuestions = useMemo(() => {
    let result = [...allQuestions];

    // Tag-page filter: show only this tag
    if (isTagMode && tag) {
      const normalizedTag = tag.toLowerCase().replace(/-/g, ' ');
      result = result.filter(q =>
        Array.isArray(q.tags) && q.tags.some(t => t.toLowerCase() === normalizedTag)
      );
    }

    // Difficulty filter
    if (selectedDifficulties.length > 0) {
      const selectedDifficultyKeys = selectedDifficulties.map(d => d.toLowerCase());
      result = result.filter(q =>
        selectedDifficultyKeys.includes((q.difficulty || 'unmarked').toLowerCase())
      );
    }

    // Tag filter (from filter panel)
    if (selectedTags.length > 0) {
      const selectedTagsLower = selectedTags.map(st => st.toLowerCase());
      result = result.filter(q =>
        Array.isArray(q.tags) && q.tags.some(t => typeof t === 'string' && selectedTagsLower.includes(t.toLowerCase()))
      );
    }

    // PYQ Only filter
    if (pyqOnly) {
      result = result.filter(q => getQuestionPyq(q) !== null);
    }

    // Sort
    const getPyqYear = (q) => {
      const pyq = getQuestionPyq(q);
      if (!pyq) return 0;
      const match = pyq.match(/\d{4}/);
      return match ? parseInt(match[0]) : 0;
    };

    const matchesTargetExam = (question, examId) => {
      if (!examId || !question) return false;
      let terms = [];
      if (examId === 'upsc-pre') terms = ['upsc', 'civil services'];
      else if (examId === 'ssc-cgl') terms = ['ssc', 'cgl'];
      else if (examId === 'state-pcs') terms = ['pcs', 'state psc', 'psc'];
      else terms = [examId.toLowerCase()];

      const pyq = getQuestionPyq(question);
      if (pyq) {
        const lowerPyq = pyq.toLowerCase();
        if (terms.some(term => lowerPyq.includes(term))) return true;
      }

      if (Array.isArray(question.tags)) {
        return question.tags.some(t => {
          if (typeof t !== 'string') return false;
          const lowerTag = t.toLowerCase();
          return terms.some(term => lowerTag.includes(term));
        });
      }
      return false;
    };

    if (sortBy === 'default' && economy?.target_exam) {
      const examId = economy.target_exam;
      result.sort((a, b) => {
        const aMatches = matchesTargetExam(a, examId);
        const bMatches = matchesTargetExam(b, examId);
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    } else if (sortBy === 'random') {
      const random = seededRandom(Math.abs(randomSeed || hashString(preferenceId)) || 1);
      result = result
        .map(q => ({ q, r: random() }))
        .sort((a, b) => a.r - b.r)
        .map(({ q }) => q);
    } else if (sortBy === 'mistakes') {
      result.sort((a, b) => Number(mistakeIds.has(b.id)) - Number(mistakeIds.has(a.id)));
    } else if (sortBy === 'difficulty-asc') {
      result.sort((a, b) => (DIFFICULTY_ORDER[(a.difficulty || 'unmarked').toLowerCase()] ?? 99) - (DIFFICULTY_ORDER[(b.difficulty || 'unmarked').toLowerCase()] ?? 99));
    } else if (sortBy === 'difficulty-desc') {
      result.sort((a, b) => (DIFFICULTY_ORDER[(b.difficulty || 'unmarked').toLowerCase()] ?? -1) - (DIFFICULTY_ORDER[(a.difficulty || 'unmarked').toLowerCase()] ?? -1));
    } else if (sortBy === 'tags-asc') {
      result.sort((a, b) => (a.tags?.length || 0) - (b.tags?.length || 0));
    } else if (sortBy === 'pyq-desc') {
      result.sort((a, b) => getPyqYear(b) - getPyqYear(a));
    } else if (sortBy === 'pyq-asc') {
      result.sort((a, b) => getPyqYear(a) - getPyqYear(b));
    }

    // Search Term filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(q => {
        const questionMatch = q.question && q.question.toLowerCase().includes(term);
        const optionsMatch = Array.isArray(q.options) && q.options.some(o => o.text && o.text.toLowerCase().includes(term));
        return questionMatch || optionsMatch;
      });

      // For Free users: restrict to 10 search results
      if (economy?.user_tier !== 'Pro' && result.length > 10) {
        result = result.slice(0, 10);
      }
    }

    return result;
  }, [allQuestions, selectedDifficulties, selectedTags, pyqOnly, sortBy, isTagMode, tag, randomSeed, preferenceId, mistakeIds, economy?.target_exam, searchTerm, economy?.user_tier]);

  const totalSearchMatches = useMemo(() => {
    if (searchTerm.trim() === '') return 0;
    let result = [...allQuestions];

    if (isTagMode && tag) {
      const normalizedTag = tag.toLowerCase().replace(/-/g, ' ');
      result = result.filter(q =>
        Array.isArray(q.tags) && q.tags.some(t => t.toLowerCase() === normalizedTag)
      );
    }

    if (selectedDifficulties.length > 0) {
      const selectedDifficultyKeys = selectedDifficulties.map(d => d.toLowerCase());
      result = result.filter(q =>
        selectedDifficultyKeys.includes((q.difficulty || 'unmarked').toLowerCase())
      );
    }

    if (selectedTags.length > 0) {
      const selectedTagsLower = selectedTags.map(st => st.toLowerCase());
      result = result.filter(q =>
        Array.isArray(q.tags) && q.tags.some(t => typeof t === 'string' && selectedTagsLower.includes(t.toLowerCase()))
      );
    }

    if (pyqOnly) {
      result = result.filter(q => getQuestionPyq(q) !== null);
    }

    const term = searchTerm.toLowerCase().trim();
    result = result.filter(q => {
      const questionMatch = q.question && q.question.toLowerCase().includes(term);
      const optionsMatch = Array.isArray(q.options) && q.options.some(o => o.text && o.text.toLowerCase().includes(term));
      return questionMatch || optionsMatch;
    });

    return result.length;
  }, [allQuestions, selectedDifficulties, selectedTags, pyqOnly, isTagMode, tag, searchTerm]);

  const hasActiveFilters = selectedDifficulties.length > 0 || selectedTags.length > 0 || pyqOnly || sortBy !== 'random' || searchTerm.trim() !== '';
  const activeFilterCount = selectedDifficulties.length + selectedTags.length + (pyqOnly ? 1 : 0) + (sortBy !== 'random' ? 1 : 0) + (searchTerm.trim() !== '' ? 1 : 0);

  const loadMore = () => setVisibleCount(prev => prev + PAGE_SIZE);

  const toggleDifficulty = (d) => {
    setSelectedDifficulties(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
    setVisibleCount(PAGE_SIZE);
  };

  const toggleTag = (t) => {
    const tLower = t.toLowerCase();
    setSelectedTags(prev => 
      prev.some(x => x.toLowerCase() === tLower)
        ? prev.filter(x => x.toLowerCase() !== tLower)
        : [...prev, t]
    );
    setVisibleCount(PAGE_SIZE);
  };

  const clearFilters = () => {
    setSelectedDifficulties([]);
    setSelectedTags([]);
    setPyqOnly(false);
    setSortBy('random');
    setRandomSeed(Date.now());
    setSearchTerm('');
    setVisibleCount(PAGE_SIZE);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    if (value === 'random') setRandomSeed(Date.now());
    setVisibleCount(PAGE_SIZE);
  };

  const handleSmartMock = () => {
    if (economy?.user_tier !== 'Pro') {
      showToast("Smart Mock is Elite feature for Pro Users to Elevate their learning to Next level", "error");
      return;
    }

    // Pro User: generate mock using filteredQuestions (which is not sliced since they are Pro!)
    let pool = [...filteredQuestions];

    if (pool.length === 0) {
      showToast("No questions match your current filters. Please adjust filters to generate a Smart Mock.", "warning");
      return;
    }

    let mockQuestions = [];
    const targetMockSize = economy?.smart_mock_limit || 20;

    if (pool.length >= targetMockSize) {
      // Shuffle pool and take targetMockSize
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      mockQuestions = shuffled.slice(0, targetMockSize);
    } else if (pool.length >= 10) {
      // Take all pool questions, shuffled
      mockQuestions = [...pool].sort(() => 0.5 - Math.random());
    } else {
      // pool.length < 10. Pull additional questions from the same category itself (i.e. allQuestions)
      mockQuestions = [...pool];

      const selectedIds = new Set(pool.map(q => q.id));
      const extraPool = allQuestions.filter(q => !selectedIds.has(q.id));
      const shuffledExtra = extraPool.sort(() => 0.5 - Math.random());

      const needed = 10 - pool.length;
      const extraQuestions = shuffledExtra.slice(0, needed);
      mockQuestions = [...mockQuestions, ...extraQuestions];

      // Final shuffle
      mockQuestions = mockQuestions.sort(() => 0.5 - Math.random());
    }

    const mock = {
      id: `smart-mock-${Date.now()}`,
      title: `Smart Mock: ${categoryLabel}`,
      minutes: mockQuestions.length, // 1 minute per question
      questionData: mockQuestions,
      type: 'smart-mock'
    };

    navigate('/mock-test', { state: { mock, from: location.pathname } });
  };

  // Clicking a tag on a McqCard → navigate to tag-filtered page or pyq archive
  const handleTagClick = (clickedTag) => {
    if (typeof clickedTag === 'string' && clickedTag.startsWith('PYQ: ')) {
       // It's a PYQ tag, e.g. "PYQ: JKSSB FAA 2024"
       // We want to extract the exam name. We can strip the year (4 digits at the end) to get the series.
       let examLabel = clickedTag.substring(5).trim();
       examLabel = examLabel.replace(/\s*\d{4}\s*$/, '').trim(); // Remove year
       const pyqSlug = examLabel.toLowerCase().replace(/\s+/g, '-');
       navigate(`/pyq-archive/${pyqSlug}`, { state: { fromCategory: category } });
    } else {
       const tagSlug = clickedTag.toLowerCase().replace(/\s+/g, '-');
       navigate(`/mcq/${category || 'general-science'}/tag/${tagSlug}`);
    }
  };

  const difficultyDotClass = (d) => {
    const key = String(d || 'unmarked').toLowerCase();
    if (key === 'easy') return 'bg-emerald-400 shadow-emerald-400/60';
    if (key === 'medium') return 'bg-blue-400 shadow-blue-400/60';
    if (key === 'hard') return 'bg-rose-400 shadow-rose-400/60';
    return 'bg-slate-400 shadow-slate-400/50';
  };

  const visibleQuestions = filteredQuestions.slice(0, visibleCount);
  
  // Phase 5: Organic Gating Injection
  const gatedFeed = useMemo(() => {
    if (!user) {
      return visibleQuestions.map(q => ({
        ...q,
        isGuestQuestion: true
      }));
    }

    if (!economy || economy.user_tier === 'Pro') return visibleQuestions;
    
    const seed = Math.abs(hashString(`${preferenceId}:${randomSeed}:${visibleQuestions[0]?.id || 'empty'}`)) || 1;
    const random = seededRandom(seed);
    const nextGap = () => 3 + Math.floor(random() * 5);
    const feed = [];
    let questionsSinceLock = 0;
    let lockAfter = nextGap();

    for (let i = 0; i < visibleQuestions.length; i++) {
      const question = visibleQuestions[i];
      feed.push(question);
      questionsSinceLock += 1;

      if (i < visibleQuestions.length - 1 && questionsSinceLock >= lockAfter) {
        feed.push({
          ...question,
          id: `locked-practice-${question?.id || i}-${feed.length}`,
          isLockedDummy: true,
          lockedQuestion: question,
        });
        questionsSinceLock = 0;
        lockAfter = nextGap();
      }
    }

    return feed;
  }, [visibleQuestions, economy, preferenceId, randomSeed, user]);

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <Link
            to={isPyqArchive && fromCategory ? `/mcq/${fromCategory}` : isTagMode ? `/mcq/${category}` : "/"}
            className="inline-flex items-center gap-2 text-theme-muted hover:text-theme-text transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft size={16} /> {isPyqArchive && fromCategory ? `Back to ${fromCategory.replace(/-/g, ' ')}` : isTagMode ? `Back to ${category.replace(/-/g, ' ')}` : "Back to Hub"}
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-theme-text capitalize">{categoryLabel} Practice</h1>
              {isTagMode ? (
                <div className="flex items-center gap-2 mt-2">
                  <Tag size={14} className="text-theme-primary" />
                  <span className="text-theme-muted text-sm">Showing tag: </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-theme-primary text-white">{tag?.replace(/-/g, ' ')}</span>
                  <Link
                    to={`/mcq/${category}`}
                    className="text-xs text-theme-muted hover:text-rose-400 transition-colors ml-1 flex items-center gap-1"
                  >
                    <X size={12} /> Clear tag
                  </Link>
                </div>
              ) : (
                <p className="text-theme-muted mt-1 text-sm">
                  {isLoading ? 'Loading questions...' : `${filteredQuestions.length} question${filteredQuestions.length !== 1 ? 's' : ''} available`}
                </p>
              )}
            </div>

            {/* Filter toggle button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                ${showFilters || hasActiveFilters
                  ? 'bg-theme-primary/10 border border-theme-primary/30 text-theme-primary shadow-sm'
                  : 'bg-white/[0.02] backdrop-blur border border-black/[0.08] dark:border-white/[0.08] text-theme-muted hover:border-theme-primary/30 hover:text-theme-text hover:shadow-[0_4px_15px_rgba(59,130,246,0.04)]'
                }`}
            >
              <SlidersHorizontal 
                size={14} 
                className={`transition-transform duration-500 ${showFilters ? 'rotate-180 text-theme-primary' : 'text-theme-muted'}`} 
              />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md border border-theme-surface">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-theme-surface border border-theme-border rounded-2xl p-6 space-y-5">
                
                {/* Search and Smart Mock Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pb-4 border-b border-theme-border/50">
                  <div className="md:col-span-2 relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setVisibleCount(PAGE_SIZE);
                      }}
                      placeholder="Search for any term / question / topic ..."
                      className="w-full bg-theme-bg border border-theme-border rounded-xl pl-10 pr-10 py-2.5 text-sm font-semibold focus:outline-none focus:border-theme-primary transition-all placeholder:text-theme-muted text-theme-text"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none">
                      <Search size={16} />
                    </div>
                    {searchTerm && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setVisibleCount(PAGE_SIZE);
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div>
                    <button
                      onClick={handleSmartMock}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary border border-theme-primary/20 hover:border-theme-primary/40 active:scale-95"
                    >
                      <Zap size={14} className="fill-current text-theme-primary" />
                      <span>Smart Mock</span>
                      {economy?.user_tier !== 'Pro' && <Lock size={12} className="ml-1 text-theme-primary" />}
                    </button>
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-3 flex items-center gap-1.5">
                    <ChevronDown size={14} /> Sort By
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleSortChange(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                          ${sortBy === opt.value
                            ? 'bg-theme-primary text-white border-theme-primary'
                            : 'bg-theme-bg border-theme-border text-theme-text hover:border-theme-primary/50'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty filter */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-3 flex items-center gap-1.5">
                    <Filter size={14} /> Difficulty
                  </label>
                  <div className="flex gap-2">
                    {DIFFICULTY_OPTIONS.map(d => (
                      <button
                        key={d}
                        onClick={() => toggleDifficulty(d)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                          ${selectedDifficulties.includes(d)
                            ? 'bg-theme-primary text-white border-theme-primary'
                            : 'bg-theme-bg border-theme-border text-theme-text hover:border-theme-primary/50'
                          }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full shadow-md ${difficultyDotClass(d)}`} />
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic/Tag filter */}
                {allAvailableTags.length > 0 && (() => {
                  const visibleTags = showAllTags ? allAvailableTags : allAvailableTags.slice(0, 15);
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
                          <Tag size={14} /> Topics / Tags
                        </label>
                        {allAvailableTags.length > 15 && (
                          <button
                            onClick={() => setShowAllTags(!showAllTags)}
                            className="text-xs font-bold text-theme-primary hover:text-blue-400 transition-colors uppercase tracking-wider"
                          >
                            {showAllTags ? 'Less' : 'More'}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {visibleTags.map(t => (
                          <button
                            key={t}
                            onClick={() => toggleTag(t)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                              ${selectedTags.some(st => st.toLowerCase() === t.toLowerCase())
                                ? 'bg-theme-primary text-white border-theme-primary'
                                : 'bg-theme-bg border-theme-border text-theme-text hover:border-theme-primary/50'
                              }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* PYQ Only Filter */}
                {!isPyqArchive && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-3 flex items-center gap-1.5">
                      <BookOpen size={14} /> Official Papers
                    </label>
                    <button
                      onClick={() => {
                        setPyqOnly(!pyqOnly);
                        setVisibleCount(PAGE_SIZE);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all
                        ${pyqOnly
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-600 hover:bg-amber-500/20 hover:border-amber-500/40'
                        }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${pyqOnly ? 'bg-white' : 'bg-amber-500'}`} />
                      Show PYQs Only
                    </button>
                  </div>
                )}

                {/* Clear filters */}
                {hasActiveFilters && (
                  <div className="pt-2 border-t border-theme-border/50">
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-500 transition-colors"
                    >
                      <X size={12} /> Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question Feed */}
        <div className="space-y-6 pb-20">
          {!isLoading && searchTerm.trim() !== '' && economy?.user_tier !== 'Pro' && totalSearchMatches > 0 && (
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 dark:border-amber-500/30 bg-gradient-to-r from-amber-500/[0.07] via-theme-surface to-purple-500/[0.07] p-5 shadow-[0_8px_30px_rgb(245,158,11,0.06)] backdrop-blur-md max-w-3xl mx-auto w-full transition-all duration-300 hover:shadow-[0_8px_30px_rgb(245,158,11,0.1)]">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/25">
                        Pro Search Limit
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-theme-text leading-snug">
                      Showing {Math.min(totalSearchMatches, 10)} of {totalSearchMatches} MCQs for <span className="text-amber-500 font-bold font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">"{searchTerm}"</span>. Subscribe to Pro to unlock the rest.
                    </p>
                  </div>
                </div>
                <Link
                  to="/upgrade"
                  className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all duration-200 shrink-0 text-center"
                >
                  Go Pro <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}
          {isLoading ? (
            // Skeleton placeholders
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="max-w-3xl mx-auto w-full p-6 rounded-2xl bg-theme-surface border border-theme-border animate-pulse">
                <div className="h-4 bg-theme-border rounded w-1/3 mb-4" />
                <div className="h-6 bg-theme-border rounded w-full mb-2" />
                <div className="h-6 bg-theme-border rounded w-3/4 mb-8" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-12 bg-theme-border rounded-xl" />
                  ))}
                </div>
              </div>
            ))
          ) : filteredQuestions.length === 0 ? (
            // Empty state
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-theme-surface flex items-center justify-center mb-6 border border-theme-border">
                <BookOpen size={36} className="text-theme-muted" />
              </div>
              <h3 className="text-xl font-bold text-theme-text mb-2">
                {hasActiveFilters ? 'No questions match your filters' : 'No questions yet'}
              </h3>
              <p className="text-theme-muted max-w-sm text-sm leading-relaxed">
                {hasActiveFilters
                  ? 'Try adjusting or clearing your filters to see more questions.'
                  : `Questions for "${categoryLabel}" are being prepared. Check back soon!`
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-6 px-6 py-2.5 bg-theme-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Clear Filters
                </button>
              )}
            </motion.div>
          ) : (
            <>
              {gatedFeed.map((q) => (
                <McqCard
                  key={q.id}
                  questionData={q}
                  showExplanationToggle={true}
                  onTagClick={handleTagClick}
                  searchTerm={searchTerm}
                  onSelect={(optionId) => handleSelectOption(q, optionId)}
                />
              ))}

              {searchTerm.trim() !== '' && economy?.user_tier !== 'Pro' && totalSearchMatches > 0 && (
                <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 dark:border-amber-500/30 bg-gradient-to-r from-amber-500/[0.07] via-theme-surface to-purple-500/[0.07] p-5 shadow-[0_8px_30px_rgb(245,158,11,0.06)] backdrop-blur-md max-w-3xl mx-auto w-full transition-all duration-300 hover:shadow-[0_8px_30px_rgb(245,158,11,0.1)] mt-6">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
                        <Sparkles size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/25">
                            Pro Search Limit
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-theme-text leading-snug">
                          Showing {Math.min(totalSearchMatches, 10)} of {totalSearchMatches} MCQs for <span className="text-amber-500 font-bold font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">"{searchTerm}"</span>. Subscribe to Pro to unlock the rest.
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/upgrade"
                      className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all duration-200 shrink-0 text-center"
                    >
                      Go Pro <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              )}

              {/* Load 25 More */}
              {visibleCount < filteredQuestions.length && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center pt-8 border-t border-theme-border/50"
                >
                  <button
                    onClick={loadMore}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-theme-surface border border-theme-border rounded-full text-theme-text font-bold hover:bg-theme-surface-hover hover:border-theme-primary/50 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <ChevronDown size={18} />
                    Load 25 More MCQ's
                  </button>
                </motion.div>
              )}

              {/* All loaded indicator */}
              {visibleCount >= filteredQuestions.length && filteredQuestions.length > 0 && (
                <div className="text-center pt-6 text-theme-muted text-sm">
                  ✓ All {filteredQuestions.length} questions loaded
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Floating Session Score Widget */}
      <AnimatePresence>
        {(correctCount > 0 || wrongCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-emerald-500 dark:text-emerald-400">{correctCount}</span>
              <svg className="w-4 h-4 text-emerald-500 drop-shadow-[0_0_4px_rgba(16,185,129,0.2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="w-[1px] h-4 bg-black/[0.08] dark:bg-white/[0.08]" />
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-rose-500 dark:text-rose-400">{wrongCount}</span>
              <svg className="w-4 h-4 text-rose-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
