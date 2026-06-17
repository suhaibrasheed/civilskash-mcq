import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../components/Header';
import { Settings, Layers, Database, X, Command, Trash2, Plus, Wand2, AlertCircle, Edit3, Layout, ChevronDown, ChevronUp, Bold, Italic, Sparkles, Copy, Clipboard, Undo, Check, FileText, Tag, BarChart, Download, Upload, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, RefreshCw, ChevronsUpDown } from 'lucide-react';
import { EXAM_SERIES } from '../lib/exams';
import { DYNAMIC_EXAMS } from '../lib/dataHub';
import { Compass } from 'lucide-react';
import { queryGenerativeAI, queryColorHighlightsForExplanations, applyHighlightsToText, stripCodeFences } from '../lib/ai';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { parseBulkMCQText } from '../lib/mcqParser';

// Exact NoteKash Colors for Text Toolbar
const TEXT_COLORS = [
  { id: 'red', class: 'text-red', hex: '#ff6b6b' },
  { id: 'green', class: 'text-green', hex: '#4ade80' },
  { id: 'blue', class: 'text-blue', hex: '#60a5fa' },
  { id: 'orange', class: 'text-orange', hex: '#ff9f43' },
  { id: 'magenta', class: 'text-magenta', hex: '#f368e0' },
  { id: 'teal', class: 'text-teal', hex: '#00d2d3' },
];

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

const RESIZE_STEPS = [15, 25, 35, 50, 65, 80, 100];

const normalizeTagName = (tag) => {
  return String(tag || '')
    .replace(/^#/, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export default function AdminSubiStudio() {
  const { showToast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const alert = useCallback((msg) => {
    const lower = msg.toLowerCase();
    let type = 'info';
    if (lower.includes('success') || lower.includes('imported') || lower.includes('copied') || lower.includes('reverted') || lower.includes('pushed')) {
      type = 'success';
    } else if (lower.includes('fail') || lower.includes('error') || lower.includes('exceed') || lower.includes('empty') || lower.includes('missing') || lower.includes('incorrect') || lower.includes('blocked') || lower.includes('exceeds') || lower.includes('could not')) {
      type = 'error';
    }
    showToast(msg, type);
  }, [showToast]);

  const editorRef = useRef(null);
  const lastSelectionRangeRef = useRef(null);
  const cmdSearchRef = useRef(null);
  const backupImportRef = useRef(null);
  const cmdPaletteRef = useRef(null);
  const tagPaletteRef = useRef(null);
  const pyqPaletteRef = useRef(null);
  
  // Passcode states
  const [isPasscodeValid, setIsPasscodeValid] = useState(false);
  const [isValidatingStored, setIsValidatingStored] = useState(true);
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [adminFullName, setAdminFullName] = useState('');
  const [adminCheckError, setAdminCheckError] = useState('');

  useEffect(() => {
    const checkStoredPasscode = async () => {
      if (authLoading) return;
      setAdminCheckError('');

      if (!user) {
        localStorage.removeItem('civilsKash_adminPassword');
        setIsAdminUser(false);
        setIsPasscodeValid(false);
        setIsValidatingStored(false);
        return;
      }

      const stored = localStorage.getItem('civilsKash_adminPassword');
      if (!stored) {
        setIsPasscodeValid(false);
        setIsValidatingStored(false);
        return;
      }
      
      if (!isSupabaseConfigured()) {
        localStorage.removeItem('civilsKash_adminPassword');
        setIsPasscodeValid(false);
        setIsValidatingStored(false);
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin, full_name')
          .eq('id', user.id)
          .single();
        if (profileError) throw profileError;

        const adminOk = profile?.is_admin === true;
        setIsAdminUser(adminOk);
        if (adminOk && profile?.full_name) {
          setAdminFullName(profile.full_name);
        }
        if (!adminOk) {
          localStorage.removeItem('civilsKash_adminPassword');
          setIsPasscodeValid(false);
          setAdminCheckError('This doesnt seem to be account of Admin');
          return;
        }

        const { data, error } = await supabase.rpc('verify_admin_passcode', { entered_passcode: stored });
        if (!error && data === true) {
          setIsPasscodeValid(true);
        } else {
          localStorage.removeItem('civilsKash_adminPassword');
          setIsPasscodeValid(false);
        }
      } catch (err) {
        console.error("Passcode verification error:", err);
        localStorage.removeItem('civilsKash_adminPassword');
        setIsAdminUser(false);
        setIsPasscodeValid(false);
        setAdminCheckError('Could not verify admin profile.');
      } finally {
        setIsValidatingStored(false);
      }
    };
    checkStoredPasscode();
  }, [authLoading, user]);

  const [selectedCategory, setSelectedCategory] = useState('general-science');
  const [isUploading, setIsUploading] = useState(false);
  const [parsedMCQs, setParsedMCQs] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  
  // Searchable Command Palette state
  const [cmdPalette, setCmdPalette] = useState({ show: false, selectedIndex: 0, openedViaIcon: false });
  const [cmdPosition, setCmdPosition] = useState({ top: 0, left: 0 });
  const [cmdQuery, setCmdQuery] = useState('');

  // AI Dialog Modals
  const [showAiGenModal, setShowAiGenModal] = useState(false);
  const [aiGenPrompt, setAiGenPrompt] = useState('');
  const [aiGenLoading, setAiGenLoading] = useState(false);

  const [showAiDocModal, setShowAiDocModal] = useState(false);
  const [aiDocText, setAiDocText] = useState('');
  const [aiDocCount, setAiDocCount] = useState(10);
  const [aiDocLoading, setAiDocLoading] = useState(false);

  // AI Quality Reviewer States
  const [preReviewHtml, setPreReviewHtml] = useState('');
  const [reviewBanner, setReviewBanner] = useState({ show: false, score: 0, changes: [] });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [aiReviseLoading, setAiReviseLoading] = useState(false);

  const ALL_COMMANDS = [
    { id: 'convert', label: 'Convert to MCQ', icon: <Wand2 size={14} />, desc: 'Parse text details into standard blocks' },
    { id: 'template', label: 'Insert MCQ Template', icon: <Layers size={14} />, desc: 'Create a blank MCQ template' },
    { id: 'img-insert', label: 'Insert Image by Link', icon: <ImageIcon size={14} />, desc: 'Add image using URL' },
    { id: 'ai-generate', label: 'AI: Generate MCQ', icon: <Sparkles size={14} className="text-amber-500" />, desc: 'Draft an MCQ from a prompt/topic' },
    { id: 'ai-complete', label: 'AI: Complete MCQ & Explanation', icon: <Sparkles size={14} className="text-amber-500" />, desc: 'Autofill remaining options and explanation' },
    { id: 'ai-doc', label: 'AI: Document to MCQs', icon: <FileText size={14} className="text-amber-500" />, desc: 'Bulk generate MCQs from a document' },
    { id: 'ai-color', label: 'AI: Color Explanation', icon: <Sparkles size={14} className="text-amber-500" />, desc: 'Apply bold formatting and theme coloring' },
    { id: 'ai-tag', label: 'AI: Auto-Tag MCQ', icon: <Tag size={14} className="text-amber-500" />, desc: 'Auto-suggest hashtags for category and difficulty' },
    { id: 'ai-review', label: 'AI: Review MCQs Quality', icon: <BarChart size={14} className="text-amber-500" />, desc: 'Audit spelling, grammar, and correctness' },
    { id: 'ai-revise', label: 'AI: Revise MCQ\'s', icon: <Sparkles size={14} className="text-amber-500" />, desc: 'Convert website-copied or messy MCQ text to native MCQ blocks' },
    { id: 'copy', label: 'Copy All (NoteKash)', icon: <Copy size={14} />, desc: 'Copy all MCQs in NoteKash text format' },
    { id: 'paste', label: 'Paste MCQs', icon: <Clipboard size={14} />, desc: 'Paste NoteKash text from clipboard' },
    { id: 'clean', label: 'Clean Editor', icon: <Trash2 size={14} />, desc: 'Keep only native MCQ blocks, clearing all other text and extra spacing' }
  ];

  const filteredCommands = ALL_COMMANDS.filter(cmd => 
    cmd.label.toLowerCase().includes(cmdQuery.toLowerCase()) ||
    cmd.desc.toLowerCase().includes(cmdQuery.toLowerCase())
  );

  // Text Toolbar State
  const [textToolbar, setTextToolbar] = useState({ show: false, top: 0, left: 0 });
  // Image Toolbar State
  const [imgToolbar, setImgToolbar] = useState({ show: false, top: 0, left: 0, targetImg: null, currentWidth: 100 });
  const [activeMode, setActiveMode] = useState('write'); // 'write' | 'exams' | 'review'
  
  // MCQ Review Dashboard States
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewDifficulty, setReviewDifficulty] = useState('all');
  const [checkedIds, setCheckedIds] = useState([]);
  const [pendingQuestionToLoad, setPendingQuestionToLoad] = useState(null);
  const [expandedIds, setExpandedIds] = useState([]);
  const [reviewTagFilter, setReviewTagFilter] = useState('all');
  const [reviewSortOrder, setReviewSortOrder] = useState('latest');

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('civilsKash_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      const cleanedSaved = parsed.filter(c => !['environment-ecology', 'history'].includes(c.id));
      const merged = [...DEFAULT_CATEGORIES];
      cleanedSaved.forEach(c => {
        if (!merged.find(m => m.id === c.id)) merged.push(c);
      });
      return merged;
    }
    return DEFAULT_CATEGORIES;
  });

  const [exams, setExams] = useState(() => {
    const saved = localStorage.getItem('civilsKash_exams');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [categoryTags, setCategoryTags] = useState({});

  useEffect(() => {
    localStorage.setItem('civilsKash_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('civilsKash_exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    const fetchExams = async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const { data, error } = await supabase
          .from('exams')
          .select('*');
        if (error) {
          if (error.code === 'PGRST404') return;
          throw error;
        }
        if (data && data.length > 0) {
          setExams(data);
          localStorage.setItem('civilsKash_exams', JSON.stringify(data));
          data.forEach(exam => {
            if (exam.status === 'hidden' || exam.status === 'unpublished') return;
            if (!DYNAMIC_EXAMS.some(de => de.id === exam.id)) {
              DYNAMIC_EXAMS.push(exam);
            }
            const exists = EXAM_SERIES.find(e => e.id === exam.id);
            if (!exists) {
              EXAM_SERIES.push({
                id: exam.id,
                name: exam.name,
                icon: Compass,
                color: '#8b5cf6'
              });
            }
          });
        }
      } catch (e) {
        console.error("Failed to load exams in studio:", e);
      }
    };
    fetchExams();
  }, []);

  const fetchCategoryTagsFromSupabase = useCallback(async (catId) => {
    if (!isSupabaseConfigured() || !catId) return;
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('tags')
        .eq('category_id', catId);
      
      if (error) throw error;
      
      const tagsSet = new Set();
      if (data) {
        data.forEach(row => {
          if (row.tags && Array.isArray(row.tags)) {
            row.tags.forEach(tag => {
              if (tag) {
                tagsSet.add(normalizeTagName(tag));
              }
            });
          }
        });
      }
      
      const sortedTags = Array.from(tagsSet).sort();
      setCategoryTags(prev => ({
        ...prev,
        [catId]: sortedTags
      }));
    } catch (err) {
      console.error("Error fetching tags from Supabase for category:", catId, err);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryTagsFromSupabase(selectedCategory);
    }
  }, [selectedCategory, fetchCategoryTagsFromSupabase]);

  // Tag Palette State
  const [tagPalette, setTagPalette] = useState({ show: false, query: '', top: 0, left: 0, selectedIndex: 0, results: [] });

  // PYQ Palette State
  const [pyqPalette, setPyqPalette] = useState({ show: false, query: '', top: 0, left: 0, selectedIndex: 0, results: [] });

  useEffect(() => {
    if (cmdPalette.show) {
      const activeEl = document.querySelector('.nk-cmd-item-active');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    }
  }, [cmdPalette.selectedIndex, cmdPalette.show]);

  useEffect(() => {
    if (tagPalette.show) {
      const activeEl = document.querySelector('.nk-tag-item-active');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    }
  }, [tagPalette.selectedIndex, tagPalette.show]);

  useEffect(() => {
    if (pyqPalette.show) {
      const activeEl = document.querySelector('.nk-pyq-item-active');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    }
  }, [pyqPalette.selectedIndex, pyqPalette.show]);

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (cmdPalette.show && cmdPaletteRef.current && !cmdPaletteRef.current.contains(e.target)) {
        setCmdPalette({ show: false, selectedIndex: 0, openedViaIcon: false });
        setCmdQuery('');
      }
      if (tagPalette.show && tagPaletteRef.current && !tagPaletteRef.current.contains(e.target)) {
        setTagPalette(p => ({ ...p, show: false }));
      }
      if (pyqPalette.show && pyqPaletteRef.current && !pyqPaletteRef.current.contains(e.target)) {
        setPyqPalette(p => ({ ...p, show: false }));
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [cmdPalette.show, tagPalette.show, pyqPalette.show]);
  
  // Exam Builder State
  const [newExamName, setNewExamName] = useState('');
  const [selectedExamCats, setSelectedExamCats] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [examIdToDelete, setExamIdToDelete] = useState(null);
  const [deletePasscodeAttempt, setDeletePasscodeAttempt] = useState('');
  const [deletePasscodeError, setDeletePasscodeError] = useState(false);
  const [selectedExamDifficulties, setSelectedExamDifficulties] = useState({
    easy: { selected: true, weight: 0 },
    medium: { selected: true, weight: 0 },
    hard: { selected: true, weight: 0 }
  });

  const toggleExamCat = (catId) => {
    if (selectedExamCats.find(c => c.id === catId)) {
      setSelectedExamCats(selectedExamCats.filter(c => c.id !== catId));
    } else {
      setSelectedExamCats([...selectedExamCats, { id: catId, weight: 0 }]);
    }
  };

  const updateExamCatWeight = (catId, weight) => {
    setSelectedExamCats(selectedExamCats.map(c => 
      c.id === catId ? { ...c, weight: parseInt(weight) || 0 } : c
    ));
  };

  const toggleDifficulty = (diff) => {
    setSelectedExamDifficulties(prev => ({
      ...prev,
      [diff]: { ...prev[diff], selected: !prev[diff].selected }
    }));
  };

  const updateDifficultyWeight = (diff, weight) => {
    setSelectedExamDifficulties(prev => ({
      ...prev,
      [diff]: { ...prev[diff], weight: parseInt(weight) || 0 }
    }));
  };

  const pushExamsToSupabase = async (updatedExams) => {
    if (!isSupabaseConfigured()) return;
    if (!user || !isAdminUser) {
      alert("Blocked: sign in with an account where profiles.is_admin is true before changing exams.");
      return;
    }
    setIsUploading(true);
    try {
      const payload = updatedExams.map(exam => ({
        id: exam.id,
        name: exam.name,
        categories: exam.categories,
        difficulties: exam.difficulties,
        status: exam.status || 'published'
      }));

      const { error } = await supabase
        .from('exams')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
      alert("Exams successfully synced to database!");
    } catch (err) {
      console.error(err);
      alert("Failed to sync exams to Supabase: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteExam = (examId) => {
    setExamIdToDelete(examId);
    setDeletePasscodeAttempt('');
    setDeletePasscodeError(false);
    setShowDeleteModal(true);
  };

  const confirmDeleteExam = async () => {
    if (!examIdToDelete) return;

    let isAuthorized = false;
    if (isSupabaseConfigured()) {
      try {
        if (!user || !isAdminUser) {
          setDeletePasscodeError(true);
          return;
        }
        const { data, error } = await supabase.rpc('verify_admin_passcode', { entered_passcode: deletePasscodeAttempt });
        if (error) throw error;
        isAuthorized = data === true;
      } catch (err) {
        console.error(err);
      }
    }

    if (!isAuthorized) {
      setDeletePasscodeError(true);
      return;
    }

    const examId = examIdToDelete;
    const updated = exams.map(e => e.id === examId ? { ...e, status: 'hidden' } : e);
    setExams(updated);

    // Sync registry
    const idx = DYNAMIC_EXAMS.findIndex(de => de.id === examId);
    if (idx >= 0) DYNAMIC_EXAMS.splice(idx, 1);
    const seriesIdx = EXAM_SERIES.findIndex(e => e.id === examId);
    if (seriesIdx >= 0) EXAM_SERIES.splice(seriesIdx, 1);

    setShowDeleteModal(false);
    setExamIdToDelete(null);

    if (!isSupabaseConfigured()) return;
    try {
      const { error } = await supabase
        .from('exams')
        .update({ status: 'hidden' })
        .eq('id', examId);
      if (error) throw error;
      alert("Exam unpublished successfully. It remains in Supabase for super-admin recovery.");
    } catch (err) {
      console.error(err);
      alert("Failed to unpublish exam in Supabase: " + err.message);
    }
  };

  const handleSaveExam = async () => {
    if (!newExamName.trim() || selectedExamCats.length === 0) return;
    
    let zeroCats = selectedExamCats.filter(c => c.weight === 0);
    let setWeight = selectedExamCats.filter(c => c.weight > 0).reduce((sum, c) => sum + c.weight, 0);
    let finalCats = [...selectedExamCats];

    if (setWeight > 100) {
      alert("Total weight exceeds 100%. Please adjust percentages.");
      return;
    }

    if (zeroCats.length > 0) {
      const remaining = 100 - setWeight;
      const avg = Math.floor(remaining / zeroCats.length);
      let remainder = remaining - (avg * zeroCats.length);
      
      finalCats = finalCats.map(c => {
        if (c.weight === 0) {
           const distributed = avg + (remainder > 0 ? 1 : 0);
           if (remainder > 0) remainder--;
           return { ...c, weight: distributed };
        }
        return c;
      });
    } else if (setWeight !== 100) {
      alert("Total weight must be exactly 100%.");
      return;
    }

    // Weighted Difficulty inclusion validation
    let selectedDiffs = Object.keys(selectedExamDifficulties)
      .filter(k => selectedExamDifficulties[k].selected)
      .map(k => ({ id: k, weight: selectedExamDifficulties[k].weight }));

    if (selectedDiffs.length === 0) {
      alert("Please select at least one difficulty level.");
      return;
    }

    let zeroDiffs = selectedDiffs.filter(d => d.weight === 0);
    let setDiffWeight = selectedDiffs.filter(d => d.weight > 0).reduce((sum, d) => sum + d.weight, 0);

    if (setDiffWeight > 100) {
      alert("Total difficulty weight exceeds 100%.");
      return;
    }

    let finalDiffs = {};
    if (zeroDiffs.length > 0) {
      const remaining = 100 - setDiffWeight;
      const avg = Math.floor(remaining / zeroDiffs.length);
      let remainder = remaining - (avg * zeroDiffs.length);
      
      selectedDiffs.forEach(d => {
        if (d.weight === 0) {
          const distributed = avg + (remainder > 0 ? 1 : 0);
          if (remainder > 0) remainder--;
          finalDiffs[d.id] = distributed / 100;
        } else {
          finalDiffs[d.id] = d.weight / 100;
        }
      });
    } else {
      if (setDiffWeight !== 100) {
        alert("Total difficulty weight must be exactly 100%.");
        return;
      }
      selectedDiffs.forEach(d => {
        finalDiffs[d.id] = d.weight / 100;
      });
    }

    const newExam = {
      id: newExamName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: newExamName,
      categories: finalCats,
      difficulties: finalDiffs,
      status: 'published'
    };

    const updatedExams = [...exams, newExam];
    setExams(updatedExams);
    setNewExamName('');
    setSelectedExamCats([]);
    setSelectedExamDifficulties({
      easy: { selected: true, weight: 0 },
      medium: { selected: true, weight: 0 },
      hard: { selected: true, weight: 0 }
    });

    // Sync registry
    if (!DYNAMIC_EXAMS.some(de => de.id === newExam.id)) {
      DYNAMIC_EXAMS.push(newExam);
    }
    const exists = EXAM_SERIES.find(e => e.id === newExam.id);
    if (!exists) {
      EXAM_SERIES.push({
        id: newExam.id,
        name: newExam.name,
        icon: Compass,
        color: '#8b5cf6'
      });
    }

    await pushExamsToSupabase(updatedExams);
  };

  // -- PARSER LOGIC --
  const finalizeBlock = (block) => {
      const STRIP_OPTION_MARKER = /^\s*(?:[\[\(]\s*[a-zA-Z0-9iIvVxX]+\s*[\]\)]\.?|[a-zA-Z][\.\)\-\:]|[a-eA-E]\s+|[\u2022\u25E6\u25AA\u25CF\u25CB\u2023•◦▪●○‣\-\*]|\d+[\.\)])\s*/;
      const NUMBERED_STATEMENT = /^\s*\d+[\.\)]\s+(?!\s*only\s|\s*all\s|\s*none\s|\s*both\s)/i;

      let qLines = block.qLines ? [...block.qLines] : [];
      while (qLines.length > 0) {
          const line = qLines[0].trim();
          if (line.length === 0) { qLines.shift(); continue; }
          if (NUMBERED_STATEMENT.test(line)) break;
          const isMetadata = /^(MCQ|Question|Q)?[\d\s\.:)]+$/i.test(line);
          if (isMetadata) { qLines.shift(); continue; }
          const leadingMarker = /^(MCQ|Question|Q)?\s*\d+[\.:)]\s*/i;
          if (leadingMarker.test(line)) {
              qLines[0] = line.replace(leadingMarker, '').trim();
          }
          break;
      }

      let cleanQ = qLines.join('<br>').trim();
      const rawOpts = block.oLines || [];
      const cleanOptions = rawOpts.map(o => o.replace(STRIP_OPTION_MARKER, '').trim()).filter(o => o.length > 0);

      if (cleanOptions.length < 2) {
          if (cleanOptions.length === 1 && cleanOptions[0].includes(',')) {
              const split = cleanOptions[0].split(',').map(s => s.trim()).filter(s => s.length > 0);
              if (split.length >= 2) return { question: cleanQ, options: split, explanation: block.explanation, correctAnswerLabel: block.correctAnswerLabel };
          }
          return null;
      }
      return { question: cleanQ, options: cleanOptions, explanation: block.explanation, correctAnswerLabel: block.correctAnswerLabel };
  };

  const parseSingleMcq = (text) => {
      const allLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (allLines.length < 2) return null;

      let parsedExplanationLines = [];
      let parsedAnswerStr = null;
      let mcqLinesEndIndex = allLines.length;
      let inExplanationZone = false;

      for (let i = 0; i < allLines.length; i++) {
          const line = allLines[i];
          const ansMatch = line.match(/^(?:Correct\s+Answer|Answer|Ans)[\s\:\-]+([a-eA-E]|[1-5])(?:\s|$|\.)/i);
          if (ansMatch && !inExplanationZone) {
              parsedAnswerStr = ansMatch[1].trim().toUpperCase();
              if (i < mcqLinesEndIndex) mcqLinesEndIndex = i;
              continue;
          }
          const expMatch = line.match(/^(?:Explanation|Exp|Solution|Sol)[\s\:\-]*(.*)/i);
          if (expMatch && !inExplanationZone) {
              inExplanationZone = true;
              if (i < mcqLinesEndIndex) mcqLinesEndIndex = i;
              if (expMatch[1].trim()) parsedExplanationLines.push(expMatch[1].trim());
              continue;
          }
          if (inExplanationZone) {
              const ansMatchInExp = line.match(/^(?:Correct\s+Answer|Answer|Ans)[\s\:\-]+([a-eA-E]|[1-5])(?:\s|$|\.)/i);
              if (ansMatchInExp) parsedAnswerStr = ansMatchInExp[1].trim().toUpperCase();
              else parsedExplanationLines.push(line);
          }
      }

      let lines = allLines.slice(0, mcqLinesEndIndex);
      if (lines.length < 2) {
          lines = allLines;
          parsedExplanationLines = [];
          parsedAnswerStr = null;
      }

      const LETTER_OPTION = /^\s*(?:[\[\(]\s*[a-zA-Z]\s*[\]\)]|[a-zA-Z][\.\)\-\:]|[a-eA-E]\s+)(?=\s|\d|$)/;
      const ROMAN_OPTION = /^\s*(?:[\[\(]\s*[iIvVxX]+\s*[\]\)]|[iIvVxX]+\s*[\.\)\-])(?:\s+|$)/;
      const BULLET_OPTION = /^\s*[\u2022\u25E6\u25AA\u25CF\u25CB\u2023•◦▪●○‣\-\*]\s+/;
      const NUMBER_BRACKET = /^\s*[\[\(]\s*\d+\s*[\]\)]\.?\s+/;
      const NUMBERED_STATEMENT = /^\s*\d+[\.\)]\s+(?!\s*only\s|\s*all\s|\s*none\s|\s*both\s)/i;

      let optionsStartIndex = -1;
      let consecutiveOptions = 0;
      let lastOptionType = null;

      for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i];
          let currentType = null;
          if (LETTER_OPTION.test(line)) currentType = 'letter';
          else if (ROMAN_OPTION.test(line)) currentType = 'roman';
          else if (NUMBER_BRACKET.test(line)) currentType = 'number_bracket';
          else if (BULLET_OPTION.test(line)) currentType = 'bullet';

          if (currentType) {
              if (lastOptionType === null || lastOptionType === currentType) {
                  consecutiveOptions++; optionsStartIndex = i; lastOptionType = currentType;
              } else {
                  if (consecutiveOptions >= 2) break;
                  else { consecutiveOptions = 1; optionsStartIndex = i; lastOptionType = currentType; }
              }
          } else {
              if (consecutiveOptions >= 2) break;
              else if (consecutiveOptions === 1) {
                  if (NUMBERED_STATEMENT.test(line) && !LETTER_OPTION.test(line) && !NUMBER_BRACKET.test(line)) break;
                  consecutiveOptions = 0; optionsStartIndex = -1; lastOptionType = null;
              }
          }
      }

      let questionLines = [];
      let optionLines = [];

      if (optionsStartIndex > 0 && consecutiveOptions >= 2) {
          questionLines = lines.slice(0, optionsStartIndex);
          optionLines = lines.slice(optionsStartIndex);
      } else {
          const letterIndices = [];
          lines.forEach((l, idx) => { if (LETTER_OPTION.test(l)) letterIndices.push(idx); });
          if (letterIndices.length >= 2) {
              questionLines = lines.slice(0, letterIndices[0]);
              optionLines = lines.slice(letterIndices[0]);
          } else {
              const bulletIndices = [];
              lines.forEach((l, idx) => { if (BULLET_OPTION.test(l)) bulletIndices.push(idx); });
              if (bulletIndices.length >= 2) {
                  questionLines = lines.slice(0, bulletIndices[0]);
                  optionLines = lines.slice(bulletIndices[0]);
              } else {
                  questionLines = [lines[0]];
                  optionLines = lines.slice(1);
              }
          }
      }

      if (questionLines.length === 0 || optionLines.length === 0) return null;
      return finalizeBlock({ qLines: questionLines, oLines: optionLines, explanation: parsedExplanationLines.length > 0 ? parsedExplanationLines.join('<br>') : null, correctAnswerLabel: parsedAnswerStr });
  };

  const parseMcqText = (text) => {
      return parseBulkMCQText(text).map(mcq => ({
        question: String(mcq.question || '').replace(/\n/g, '<br>'),
        options: (mcq.options || []).map(option => option.text || ''),
        explanation: String(mcq.explanation || '').replace(/\n/g, '<br>'),
        correctAnswerLabel: mcq.correctId,
        tags: mcq.tags || []
      }));
  };

  const replaceEditorWithMcqHtml = (html) => {
      if (!editorRef.current) return;
      editorRef.current.innerHTML = html || '<p><br></p>';
  };

  const getEditorPlainText = (rootEl = editorRef.current) => {
      if (!rootEl) return '';
      const blockTags = new Set(['DIV', 'P', 'LI', 'SECTION', 'ARTICLE']);
      const lines = [];
      let buffer = '';

      const flush = () => {
          const clean = buffer.replace(/\u00a0/g, ' ').trimEnd();
          if (clean.trim()) lines.push(clean.trim());
          buffer = '';
      };

      const walk = (node) => {
          if (node.nodeType === Node.TEXT_NODE) {
              buffer += node.nodeValue || '';
              return;
          }

          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const tag = node.tagName;

          if (tag === 'BR') {
              flush();
              return;
          }

          if (blockTags.has(tag) && buffer.trim()) flush();
          Array.from(node.childNodes).forEach(walk);
          if (blockTags.has(tag)) flush();
      };

      Array.from(rootEl.childNodes).forEach(walk);
      flush();

      const structuredText = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
      return structuredText || rootEl.innerText || rootEl.textContent || '';
  };

  const insertMcqHtmlAtRange = (range, html) => {
      if (!range || !editorRef.current?.contains(range.commonAncestorContainer)) {
          replaceEditorWithMcqHtml(html);
          return;
      }

      const temp = document.createElement('div');
      temp.innerHTML = html;
      const fragment = document.createDocumentFragment();
      while (temp.firstChild) fragment.appendChild(temp.firstChild);
      range.deleteContents();
      range.insertNode(fragment);
  };

  const convertImgCodesToTags = (htmlString) => {
    if (!htmlString) return '';
    return htmlString.replace(/(?:^|\s|\b)(img[lrc]?)\s+(https?:\/\/[^\s<"'\u00a0]+)/gi, (match, cmd, url) => {
      let align = 'center';
      const lowerCmd = cmd.toLowerCase();
      if (lowerCmd === 'imgl') align = 'left';
      else if (lowerCmd === 'imgr') align = 'right';
      return ` <img src="${url.trim()}" data-align="${align}" class="nk-mcq-image cursor-pointer my-2 mx-auto block hover:ring-2 hover:ring-theme-primary transition-all" />`;
    });
  };

  const generateMcqHtml = (mcqs) => {
      return mcqs.map(mcq => {
          let correctId = 'a';
          if (mcq.correctAnswerLabel) {
              const lbl = mcq.correctAnswerLabel.toLowerCase();
              if (lbl === '1') correctId = 'a'; else if (lbl === '2') correctId = 'b';
              else if (lbl === '3') correctId = 'c'; else if (lbl === '4') correctId = 'd';
              else if (lbl === '5') correctId = 'e'; else correctId = lbl;
          }

          // Extract tags from explanation
          let tags = [];
          let difficulty = null;
          (mcq.tags || []).forEach(tag => {
              const rawTag = String(tag || '').toLowerCase();
              if (['easy', 'medium', 'hard'].includes(rawTag)) {
                  difficulty = rawTag;
              } else {
                  const normalized = normalizeTagName(tag);
                  if (normalized && !tags.includes(normalized)) tags.push(normalized);
              }
          });
          let exp = mcq.explanation || '';
          const tagRegex = /#([\w_]+)/gi;
          let match;
          while ((match = tagRegex.exec(exp)) !== null) {
              const rawTag = match[1].toLowerCase();
              if (['easy', 'medium', 'hard'].includes(rawTag)) {
                  difficulty = rawTag;
              } else {
                  const normalized = normalizeTagName(match[1]);
                  if (!tags.includes(normalized)) tags.push(normalized);
              }
          }

          const hasTagInText = (text, tag) => {
              const cleaned = tag.toLowerCase().replace(/[^a-z0-9_]/g, '');
              const words = text.toLowerCase().replace(/[^a-z0-9_\s]/g, '').split(/\s+/);
              return words.includes(cleaned);
          };

          if (difficulty && !hasTagInText(exp, difficulty)) {
              exp = exp.trim() + ` #${difficulty}`;
          }

          tags.forEach(t => {
              const tagSlug = t.toLowerCase().replace(/\s+/g, '_');
              if (!hasTagInText(exp, tagSlug) && !hasTagInText(exp, t)) {
                  exp = exp.trim() + ` #${tagSlug}`;
              }
          });

          const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
          const optionsHtml = mcq.options.map((optText, idx) => {
              const id = labels[idx] || 'a';
              const isCorrect = correctId === id;
              const cleanOptText = convertImgCodesToTags(optText);
              return `
              <div class="nk-mcq-option" data-is-correct="${isCorrect ? 'true' : 'false'}">
                  <div class="nk-mcq-option-radio" contenteditable="false"></div>
                  <div class="nk-mcq-option-text" contenteditable="true" data-placeholder="Option ${id.toUpperCase()}">${cleanOptText}</div>
                  <button class="nk-mcq-delete-option" contenteditable="false" title="Remove Option"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              </div>`;
          }).join('');

          const tagsHtml = tags.length > 0 ? ` data-tags="${tags.join(',')}"` : '';
          const difficultyHtml = difficulty ? ` data-difficulty="${difficulty}"` : '';

          const cleanQuestion = convertImgCodesToTags(mcq.question);
          const cleanExplanation = convertImgCodesToTags(exp);

          return `
          <div class="nk-mcq-block" contenteditable="false">
              <div class="nk-mcq-toolbar" contenteditable="false">
                  <button class="nk-mcq-copy-block" title="Copy MCQ"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
                  <button class="nk-mcq-delete-block" title="Delete MCQ"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
              </div>
              <div class="nk-mcq-question" contenteditable="true" data-placeholder="Question text...">${cleanQuestion}</div>
              <div class="nk-mcq-options">${optionsHtml}</div>
              <button class="nk-mcq-add-option" contenteditable="false">+ Add Option</button>
              <div class="nk-mcq-explanation" contenteditable="true" data-placeholder="Add answer explanation (optional)..."${tagsHtml}${difficultyHtml}>${cleanExplanation}</div>
          </div>
          <p><br></p>`;
      }).join('');
  };

  const getEditorBlocks = () => {
    if (!editorRef.current) return [];
    return Array.from(editorRef.current.querySelectorAll('.nk-mcq-block'));
  };

  // normalizeTagName is defined at the top-level

  const getBlockSummary = (block, index) => {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const question = block.querySelector('.nk-mcq-question')?.innerText?.trim() || '';
    const options = Array.from(block.querySelectorAll('.nk-mcq-option')).map((opt, optIndex) => ({
      label: labels[optIndex] || String(optIndex + 1),
      text: opt.querySelector('.nk-mcq-option-text')?.innerText?.trim() || '',
      isCorrect: opt.getAttribute('data-is-correct') === 'true'
    }));
    const explanation = block.querySelector('.nk-mcq-explanation')?.innerText?.trim() || '';
    return { index, question, options, explanation };
  };

  const safeParseAIJson = (text) => JSON.parse(stripCodeFences(text));

  const appendTagsToExplanation = (expEl, difficulty, topic) => {
    if (!expEl) return;
    const cleanDifficulty = ['easy', 'medium', 'hard'].includes(String(difficulty).toLowerCase())
      ? String(difficulty).toLowerCase()
      : 'medium';
    const cleanTopic = normalizeTagName(topic);
    const existingHtml = expEl.innerHTML.replace(/#[\w_-]+/g, '').trim();
    const topicHash = cleanTopic ? `#${cleanTopic.replace(/\s+/g, '_')}` : '';
    expEl.innerHTML = [existingHtml, `#${cleanDifficulty}`, topicHash].filter(Boolean).join(' ').trim();
    expEl.setAttribute('data-difficulty', cleanDifficulty);
    if (cleanTopic) expEl.setAttribute('data-tags', cleanTopic);
  };

  // Text Toolbar Logic
  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editorRef.current?.contains(selection.anchorNode)) {
      setTextToolbar(prev => ({ ...prev, show: false }));
      return;
    }
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();
    
    if (rect.width > 0) {
      // Offscreen constraint
      const toolbarWidth = 260;
      const toolbarHeight = 44;
      
      let top = rect.bottom - editorRect.top + 8;
      let left = rect.left - editorRect.left + (rect.width / 2) - (toolbarWidth / 2);
      
      if (left < 10) {
        left = 10;
      } else if (left + toolbarWidth > editorRect.width - 10) {
        left = editorRect.width - toolbarWidth - 10;
      }
      
      if (top + toolbarHeight > editorRef.current.clientHeight - 10) {
        top = rect.top - editorRect.top - toolbarHeight - 8;
      }
      if (top < 10) top = 10;

      setTextToolbar({ show: true, top, left });
    }
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [handleSelection]);

  useEffect(() => {
    const handleDocumentMouseDown = (e) => {
      if (e.target.tagName === 'IMG' && (e.target.classList.contains('nk-mcq-image') || editorRef.current?.contains(e.target))) {
        e.preventDefault();
        e.stopPropagation();
        
        const imgRect = e.target.getBoundingClientRect();
        const toolbarWidth = 220; 
        let left = (imgRect.left + imgRect.width / 2) - (toolbarWidth / 2);
        let top = imgRect.top - 50; 
        
        if (left < 10) left = 10;
        if (left + toolbarWidth > window.innerWidth - 10) {
            left = window.innerWidth - toolbarWidth - 10;
        }
        if (top < 10) {
            top = imgRect.bottom + 10; 
        }
        
        const currentWidthStr = e.target.style.width || '';
        const currentWidth = parseInt(currentWidthStr) || 100;
        
        setImgToolbar({
            show: true,
            top,
            left,
            targetImg: e.target,
            currentWidth
        });
      } else if (imgToolbar.show && !e.target.closest('.nk-mcq-image-toolbar')) {
        setImgToolbar({ show: false, top: 0, left: 0, targetImg: null });
      }
    };
    
    const handleScroll = () => {
      if (imgToolbar.show) {
        setImgToolbar({ show: false, top: 0, left: 0, targetImg: null });
      }
    };
    
    document.addEventListener('mousedown', handleDocumentMouseDown, true);
    
    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown, true);
      if (editor) {
        editor.removeEventListener('scroll', handleScroll);
      }
    };
  }, [imgToolbar.show]);

  useEffect(() => {
    if (!imgToolbar.show || !imgToolbar.targetImg) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleDeleteImage();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [imgToolbar.show, imgToolbar.targetImg]);

  const applyColor = (colorClass) => {
    document.execCommand('styleWithCSS', false, true);
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const span = document.createElement('span');
    span.className = colorClass;
    span.style.fontWeight = '800'; 
    span.appendChild(selection.getRangeAt(0).extractContents());
    selection.getRangeAt(0).insertNode(span);
    
    setTextToolbar(prev => ({ ...prev, show: false }));
  };

  // Editor Interactions
  const handleEditorInput = (e) => {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const node = selection.anchorNode;
      if (!node) return;

      const text = node.textContent || '';

      // Real-time Image insertion logic: img/imgl/imgr/imgc <url>
      const imgMatch = text.match(/\b(img[lrc]?)\s+(https?:\/\/[^\s\u00a0]+)(?:\s|\u00a0|$)/i);
      if (imgMatch) {
          const fullMatch = imgMatch[0];
          const cmd = imgMatch[1].toLowerCase();
          const url = imgMatch[2];
          const startIndex = text.indexOf(fullMatch);
          
          let align = 'center';
          if (cmd === 'imgl') align = 'left';
          else if (cmd === 'imgr') align = 'right';
          
          const range = document.createRange();
          range.setStart(node, startIndex);
          range.setEnd(node, startIndex + fullMatch.length);
          range.deleteContents();
          
          const img = document.createElement('img');
          img.src = url.trim();
          img.className = 'nk-mcq-image cursor-pointer';
          img.setAttribute('data-align', align);
          img.style.width = (align === 'left' || align === 'right') ? '45%' : '60%';
          
          range.insertNode(img);
          
          const space = document.createTextNode('\u00A0');
          range.setStartAfter(img);
          range.insertNode(space);
          range.setStartAfter(space);
          range.collapse(true);
          
          selection.removeAllRanges();
          selection.addRange(range);
          return;
      }

     // Tag Auto-Suggest Logic (#)
    const hashMatch = text.match(/#([a-zA-Z0-9_]*)$/);
    if (hashMatch) {
        const query = hashMatch[1].toLowerCase().replace(/_/g, ' ');
        const existingTags = categoryTags[selectedCategory] || [];
        const specialTags = ['easy', 'medium', 'hard'];
        const allTags = [...specialTags, ...existingTags];
        
        const results = allTags.filter(t => t.toLowerCase().replace(/_/g, ' ').includes(query));
        
        if (results.length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const editorRect = editorRef.current.getBoundingClientRect();
            
            const pWidth = 192;
            const pHeight = 200;
            let top = rect.bottom - editorRect.top + 10;
            let left = rect.left - editorRect.left;
            
            if (left + pWidth > editorRect.width - 10) {
                left = editorRect.width - pWidth - 10;
            }
            if (left < 10) left = 10;
            
            if (top + pHeight > editorRef.current.clientHeight - 10) {
                top = rect.top - editorRect.top - pHeight - 10;
            }
            if (top < 10) top = 10;

            setTagPalette({ show: true, query, top, left, selectedIndex: 0, results });
            return;
        }
    }
    setTagPalette(p => ({ ...p, show: false }));

    // PYQ Auto-Suggest Logic ([[)
    const pyqMatch = text.match(/\[\[([a-zA-Z0-9_\s]*)$/);
    if (pyqMatch) {
        const query = pyqMatch[1].toLowerCase();
        const results = EXAM_SERIES.filter(e => e.name.toLowerCase().includes(query) || e.id.toLowerCase().includes(query));
        
        if (results.length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const editorRect = editorRef.current.getBoundingClientRect();
            
            const pWidth = 256;
            const pHeight = 200;
            let top = rect.bottom - editorRect.top + 10;
            let left = rect.left - editorRect.left;
            
            if (left + pWidth > editorRect.width - 10) {
                left = editorRect.width - pWidth - 10;
            }
            if (left < 10) left = 10;
            
            if (top + pHeight > editorRef.current.clientHeight - 10) {
                top = rect.top - editorRect.top - pHeight - 10;
            }
            if (top < 10) top = 10;

            setPyqPalette({ show: true, query, top, left, selectedIndex: 0, results });
            return;
        }
    }
    setPyqPalette(p => ({ ...p, show: false }));
    } catch (err) {
      console.error("Error in handleEditorInput:", err);
    }
  };

  const handleEditorPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const executeConvertToMCQ = (useSelection = false) => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;

    let textToParse = '';
    let rangeToReplace = null;
    const selectionInsideEditor = selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode);

    if (useSelection && !selection.isCollapsed && selectionInsideEditor) {
        const range = selection.getRangeAt(0);
        const fragment = range.cloneContents();
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(fragment);
        textToParse = getEditorPlainText(tempDiv);
        rangeToReplace = range;
    } else {
        if (selectionInsideEditor && selection.anchorNode && selection.anchorNode.textContent.endsWith('/')) {
            const range = selection.getRangeAt(0);
            range.setStart(range.startContainer, range.startOffset - 1);
            range.deleteContents();
        }
        
        textToParse = getEditorPlainText().replace(/\/\s*$/, '');
        rangeToReplace = null;
    }

    if (!textToParse.trim()) {
        setCmdPalette({ show: false, selectedIndex: 0 });
        setTextToolbar(prev => ({ ...prev, show: false }));
        return;
    }

    const mcqs = parseMcqText(textToParse);
    if (mcqs.length === 0) {
        alert("Could not extract any MCQs. Ensure proper formatting.");
        setCmdPalette({ show: false, selectedIndex: 0 });
        setTextToolbar(prev => ({ ...prev, show: false }));
        return;
    }

    const fullHtml = generateMcqHtml(mcqs);
    if (rangeToReplace) {
        selection.removeAllRanges();
        selection.addRange(rangeToReplace);
    } else {
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    document.execCommand('insertHTML', false, fullHtml);
    
    setCmdPalette({ show: false, selectedIndex: 0 });
    setTextToolbar(prev => ({ ...prev, show: false }));
  };

  // Fixed template nesting bug
  const executeInsertTemplate = () => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    let currentBlock = null;

    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let node = range.startContainer;
        while (node && node !== editorRef.current) {
          if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('nk-mcq-block')) {
            currentBlock = node;
            break;
          }
          node = node.parentNode;
        }

        if ((range.startContainer.textContent || '').endsWith('/')) {
            range.setStart(range.startContainer, range.startOffset - 1);
            range.deleteContents();
        }
    }

    const id = Date.now();
    const fullHtml = `
        <div class="nk-mcq-block" contenteditable="false" id="template-${id}">
            <div class="nk-mcq-toolbar" contenteditable="false">
                <button class="nk-mcq-copy-block" title="Copy MCQ"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
                <button class="nk-mcq-delete-block" title="Delete MCQ"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            </div>
            <div class="nk-mcq-question" contenteditable="true" data-placeholder="Question text..."></div>
            <div class="nk-mcq-options">
                <div class="nk-mcq-option" data-is-correct="true">
                    <div class="nk-mcq-option-radio" contenteditable="false"></div>
                    <div class="nk-mcq-option-text" contenteditable="true" data-placeholder="Option A"></div>
                    <button class="nk-mcq-delete-option" contenteditable="false" title="Remove Option"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>
                <div class="nk-mcq-option" data-is-correct="false">
                    <div class="nk-mcq-option-radio" contenteditable="false"></div>
                    <div class="nk-mcq-option-text" contenteditable="true" data-placeholder="Option B"></div>
                    <button class="nk-mcq-delete-option" contenteditable="false" title="Remove Option"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>
                <div class="nk-mcq-option" data-is-correct="false">
                    <div class="nk-mcq-option-radio" contenteditable="false"></div>
                    <div class="nk-mcq-option-text" contenteditable="true" data-placeholder="Option C"></div>
                    <button class="nk-mcq-delete-option" contenteditable="false" title="Remove Option"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>
                <div class="nk-mcq-option" data-is-correct="false">
                    <div class="nk-mcq-option-radio" contenteditable="false"></div>
                    <div class="nk-mcq-option-text" contenteditable="true" data-placeholder="Option D"></div>
                    <button class="nk-mcq-delete-option" contenteditable="false" title="Remove Option"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>
            </div>
            <button class="nk-mcq-add-option" contenteditable="false">+ Add Option</button>
            <div class="nk-mcq-explanation" contenteditable="true" data-placeholder="Add answer explanation (optional)..."></div>
        </div>
        <p><br></p>
    `;
    
    if (currentBlock) {
      // Insert below old block instead of inside
      const temp = document.createElement('div');
      temp.innerHTML = fullHtml;
      let lastIns = currentBlock;
      while (temp.firstChild) {
        const toIns = temp.firstChild;
        currentBlock.parentNode.insertBefore(toIns, lastIns.nextSibling);
        lastIns = toIns;
      }
    } else {
      const hasEditorSelection = selection && selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode);
      if (hasEditorSelection) {
        document.execCommand('insertHTML', false, fullHtml);
      } else {
        editorRef.current.insertAdjacentHTML('beforeend', fullHtml);
      }
    }
    
    setCmdPalette({ show: false, selectedIndex: 0 });

    setTimeout(() => {
        const block = document.getElementById(`template-${id}`);
        if (block) {
            block.removeAttribute('id');
            const q = block.querySelector('.nk-mcq-question');
            if (q) {
                const rng = document.createRange();
                rng.selectNodeContents(q);
                rng.collapse(false);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(rng);
            }
        }
    }, 10);
  };

  // --- BULK COPY & PASTE ---
  const handleBulkCopy = () => {
    if (!editorRef.current) return;
    const blocks = editorRef.current.querySelectorAll('.nk-mcq-block');
    if (blocks.length === 0) {
      alert("No MCQ templates or blocks found in editor to copy.");
      return;
    }

    let serializedText = '';
    blocks.forEach((block, index) => {
      const question = block.querySelector('.nk-mcq-question')?.innerText || '';
      const optEls = block.querySelectorAll('.nk-mcq-option');
      let optionsStr = '';
      let correctLabel = 'A';
      
      const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      optEls.forEach((optEl, i) => {
        const isCorrect = optEl.getAttribute('data-is-correct') === 'true';
        const label = alphabet[i] || 'A';
        if (isCorrect) correctLabel = label;
        const text = optEl.querySelector('.nk-mcq-option-text')?.innerText || '';
        optionsStr += `${label}) ${text}\n`;
      });

      const explanationEl = block.querySelector('.nk-mcq-explanation');
      let explanation = explanationEl?.innerText || '';
      
      // Append tag attributes back if present
      const tags = explanationEl?.getAttribute('data-tags');
      if (tags) {
        const tagList = tags.split(',').filter(Boolean);
        tagList.forEach(t => {
          if (!explanation.includes(`#${t}`)) {
            explanation += ` #${t}`;
          }
        });
      }

      serializedText += `${question}\n${optionsStr}Correct Answer: ${correctLabel}\nExplanation: ${explanation}`;
      if (index < blocks.length - 1) {
        serializedText += '\n>>>\n';
      }
    });

    navigator.clipboard.writeText(serializedText)
      .then(() => alert("Bulk MCQs copied to clipboard!"))
      .catch(err => {
        console.error("Bulk copy failed", err);
        alert("Clipboard access blocked. Please grant permissions.");
      });
  };

  const handleBulkPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        alert("Clipboard is empty.");
        return;
      }

      const mcqs = parseMcqText(text);
      if (mcqs.length === 0) {
        alert("Could not parse any valid MCQs in NoteKash text format from clipboard.");
        return;
      }

      const html = generateMcqHtml(mcqs);
      
      // Append to the end of editor
      if (editorRef.current) {
        if (editorRef.current.innerHTML === '<p><br></p>' || editorRef.current.innerHTML === '<p><br></p><p><br></p>') {
          editorRef.current.innerHTML = html;
        } else {
          editorRef.current.insertAdjacentHTML('beforeend', html);
        }
        alert(`Successfully imported ${mcqs.length} MCQs from clipboard!`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to read clipboard. Ensure permission is granted.");
    }
  };

  const handleCleanEditor = () => {
    if (!editorRef.current) return;
    const blocks = Array.from(editorRef.current.querySelectorAll('.nk-mcq-block'));
    
    // Clear editor HTML
    editorRef.current.innerHTML = '';
    
    // Re-append each block and a single following break/paragraph to clean up spacing
    blocks.forEach((block) => {
      const clonedBlock = block.cloneNode(true);
      editorRef.current.appendChild(clonedBlock);
      
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      editorRef.current.appendChild(p);
    });

    // If no blocks, add 1 empty line
    if (blocks.length === 0) {
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      editorRef.current.appendChild(p);
    }
    
    alert("Editor cleaned: Preserved native MCQs and removed irrelevant text/spacing.");
  };

  // --- AI CREATOR TOOLS INTERFACES ---
  const handleExecuteCommand = (commandId) => {
    setCmdPalette({ show: false, selectedIndex: 0, openedViaIcon: false });
    setCmdQuery('');

    // Clear slash if command palette was triggered
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (range.startContainer.textContent && range.startContainer.textContent.endsWith('/')) {
            range.setStart(range.startContainer, range.startOffset - 1);
            range.deleteContents();
        }
    }

    if (commandId === 'copy') {
      handleBulkCopy();
    } else if (commandId === 'paste') {
      handleBulkPaste();
    } else if (commandId === 'convert') {
      executeConvertToMCQ(false);
    } else if (commandId === 'template') {
      executeInsertTemplate();
    } else if (commandId === 'img-insert') {
      setCmdQuery('img ');
      setCmdPalette(p => ({ ...p, show: true }));
      setTimeout(() => {
        if (cmdSearchRef.current) {
          cmdSearchRef.current.focus({ preventScroll: true });
          cmdSearchRef.current.selectionStart = cmdSearchRef.current.selectionEnd = 4;
        }
      }, 50);
    } else if (commandId === 'ai-generate') {
      setShowAiGenModal(true);
    } else if (commandId === 'ai-complete') {
      handleAICompleteMCQ();
    } else if (commandId === 'ai-doc') {
      setShowAiDocModal(true);
    } else if (commandId === 'ai-color') {
      handleAIColorExplanation();
    } else if (commandId === 'ai-tag') {
      handleAIAutoTagMCQ();
    } else if (commandId === 'ai-review') {
      handleAIReviewQuality();
    } else if (commandId === 'ai-revise') {
      handleAIReviseMCQs();
    } else if (commandId === 'clean') {
      handleCleanEditor();
    }
  };

  const handleAlignImage = (align) => {
    if (imgToolbar.targetImg) {
      imgToolbar.targetImg.setAttribute('data-align', align);
      setImgToolbar({ show: false, top: 0, left: 0, targetImg: null });
    }
  };

  const handleResizeImage = (widthPercent) => {
    if (imgToolbar.targetImg) {
      imgToolbar.targetImg.style.width = widthPercent + '%';
      setImgToolbar({ show: false, top: 0, left: 0, targetImg: null });
    }
  };

  const handleDeleteImage = () => {
    if (imgToolbar.targetImg) {
      imgToolbar.targetImg.remove();
      setImgToolbar({ show: false, top: 0, left: 0, targetImg: null });
    }
  };

  // 1. Topic -> MCQ (Bulk 3 MCQs with short color-coded explanations)
  const handleAIGenerateMCQ = async () => {
    if (!aiGenPrompt.trim()) return;
    setShowAiGenModal(false);
    setAiGenLoading(true);
    alert("AI: Generating 3 MCQs in the background... Feel free to continue editing!");
    try {
      const sys = `You are an elite exam content architect. Generate exactly 3 highly relevant, realistic, and challenging Civil Services exam style MCQs based on the topic.
      For each MCQ:
      - The explanation must be very short and precise (maximum 2-3 sentences), focusing only on the most important facts to increase knowledge.
      - We use 6 color codes for explanation highlights: red (warnings/definitions), green (facts/outcomes), blue (dates/names/acts), orange (numbers/stats), magenta (themes/concepts), and teal (geography/science/institutions). Ensure explanations contain clear concepts fitting these categories so they can be highlighted beautifully.
      - Return them in NoteKash text format, separated by >>>:
      
      Question details...
      A) Opt A
      B) Opt B
      C) Opt C
      D) Opt D
      Correct Answer: [Letter]
      Explanation: [Short explanation text] #easy/medium/hard #topicname`;

      const result = await queryGenerativeAI(sys, aiGenPrompt);
      if (result) {
        const mcqs = parseMcqText(result);
        if (mcqs.length > 0) {
          // Highlight explanations in bulk
          const explanations = mcqs.map(m => m.explanation || '');
          const highlightsList = await queryColorHighlightsForExplanations(explanations);
          
          mcqs.forEach((mcq, idx) => {
            const highlights = highlightsList[idx] || [];
            mcq.explanation = applyHighlightsToText(mcq.explanation || '', highlights);
          });

          const html = generateMcqHtml(mcqs);
          editorRef.current.insertAdjacentHTML('beforeend', html);
          alert(`Successfully generated and appended ${mcqs.length} MCQs!`);
        } else {
          alert("AI response format was invalid. Try again.");
        }
      }
    } catch (e) {
      alert("AI Generation failed: " + e.message);
    } finally {
      setAiGenLoading(false);
      setAiGenPrompt('');
    }
  };

  // AI Revise MCQs command
  const handleAIReviseMCQs = async () => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;

    let textToParse = '';
    let rangeToReplace = null;
    const selectionInsideEditor = selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode);

    if (!selection.isCollapsed && selectionInsideEditor) {
        const range = selection.getRangeAt(0);
        const fragment = range.cloneContents();
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(fragment);
        textToParse = getEditorPlainText(tempDiv);
        rangeToReplace = range;
    } else {
        if (selectionInsideEditor && selection.anchorNode && selection.anchorNode.textContent.endsWith('/')) {
            const range = selection.getRangeAt(0);
            range.setStart(range.startContainer, range.startOffset - 1);
            range.deleteContents();
        }
        textToParse = getEditorPlainText().replace(/\/\s*$/, '');
        rangeToReplace = null;
    }

    if (!textToParse.trim()) {
        alert("No text selected or found in the editor to revise. Please write or select the text you want to revise.");
        return;
    }

    setAiReviseLoading(true);
    alert("AI: Started revising and formatting MCQ text in the background... Feel free to continue editing!");

    try {
      const sys = `You are an elite exam content architect and Senior MCQ Editor. Your job is to convert messy, unstructured, or website-copied multiple choice questions (MCQs) into the standardized NoteKash format.
      For each MCQ detected in the input:
      - Clean up the question text, options, and explanation.
      - If options are missing, construct plausible options.
      - If the correct answer is missing, analyze and mark the correct option.
      - If the explanation is missing, generate a short, high-quality, and highly relevant explanation (maximum 2-3 sentences, formatted in a single paragraph).
      - Tag the MCQ with exactly two hashtags at the end of the explanation:
        1. A difficulty tag (#easy, #medium, or #hard) based on your assessment.
        2. A single broad topic tag (only use broad topics e.g climatology in geography is tag, its broad tag like chapter, using lowercase and underscores for spaces).
      
      We use 6 specific color codes to highlight explanations. Make sure your explanations naturally mention key concepts that fit these categories:
      - 'text-red': for critical warnings, pitfalls, or essential definitions.
      - 'text-green': for positive outcomes, successful results, or core facts.
      - 'text-blue': for dates, acts, treaties, or names.
      - 'text-orange': for statistics, numbers, percentages, or secondary details.
      - 'text-magenta': for core themes or philosophical concepts.
      - 'text-teal': for geography, ecology, science terms, or institutions.

      Return the revised MCQs in NoteKash text format, separated by >>>:

      Question text here...
      A) Option A
      B) Option B
      C) Option C
      D) Option D
      Correct Answer: [Letter, e.g., A]
      Explanation: Short explanation text here #difficulty #topic`;

      const result = await queryGenerativeAI(sys, textToParse);
      if (result) {
        const mcqs = parseMcqText(result);
        if (mcqs.length > 0) {
          // Highlight explanations in bulk
          const explanations = mcqs.map(m => m.explanation || '');
          const highlightsList = await queryColorHighlightsForExplanations(explanations);
          
          mcqs.forEach((mcq, idx) => {
            const highlights = highlightsList[idx] || [];
            mcq.explanation = applyHighlightsToText(mcq.explanation || '', highlights);
          });

          const html = generateMcqHtml(mcqs);
          if (rangeToReplace) {
            selection.removeAllRanges();
            selection.addRange(rangeToReplace);
            document.execCommand('insertHTML', false, html);
          } else {
            editorRef.current.insertAdjacentHTML('beforeend', html);
          }
          alert(`Successfully revised and formatted ${mcqs.length} MCQs!`);
        } else {
          alert("AI response format was invalid or could not extract MCQs. Try again.");
        }
      }
    } catch (e) {
      alert("AI Revise failed: " + e.message);
    } finally {
      setAiReviseLoading(false);
    }
  };

  // Helper to find the current active block where cursor sits
  const getActiveMCQBlock = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    let node = selection.getRangeAt(0).startContainer;
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('nk-mcq-block')) {
        return node;
      }
      node = node.parentNode;
    }
    // Fallback: return the last MCQ block in the editor
    const blocks = editorRef.current.querySelectorAll('.nk-mcq-block');
    return blocks.length > 0 ? blocks[blocks.length - 1] : null;
  };

  // 2. Complete active MCQ
  const handleAICompleteMCQ = async () => {
    const activeBlock = getActiveMCQBlock();
    if (!activeBlock) {
      alert("Please insert an MCQ template first, place your cursor in it, and enter a question.");
      return;
    }

    const questionText = activeBlock.querySelector('.nk-mcq-question')?.innerText || '';
    if (!questionText.trim()) {
      alert("Please enter a question in the active MCQ template first so the AI knows what to complete.");
      return;
    }

    // Inspect existing options (maybe correct option is filled)
    const optEls = activeBlock.querySelectorAll('.nk-mcq-option');
    let existingOpts = [];
    optEls.forEach((opt, idx) => {
      const text = opt.querySelector('.nk-mcq-option-text')?.innerText || '';
      const isCorrect = opt.getAttribute('data-is-correct') === 'true';
      if (text.trim()) {
        existingOpts.push({ idx, text, isCorrect });
      }
    });

    setAiGenLoading(true);
    activeBlock.classList.add('nk-mcq-processing');
    alert("AI: Completing the active MCQ options & explanation in the background... Feel free to continue editing!");
    try {
      const sys = `You are a Civil Services exam content designer. You will be given a question and optionally existing answer options. 
      Complete this MCQ by generating 4 plausible option texts (A, B, C, D) and a detailed Explanation.
      Mark exactly ONE correct option. If the user provided a correct option, build distractors around it.
      - The explanation must be very short and precise (maximum 2-3 sentences), focusing only on the most important facts.
      - We use 6 color codes for explanation highlights: red (warnings/definitions), green (facts/outcomes), blue (dates/names/acts), orange (numbers/stats), magenta (themes/concepts), and teal (geography/science/institutions). Ensure the explanation contains clear concepts fitting these categories so they can be highlighted beautifully.
      Generate in NoteKash text format:
      Question: [Original Question]
      A) [Text]
      B) [Text]
      C) [Text]
      D) [Text]
      Correct Answer: [Letter]
      Explanation: [Explanation details]`;

      const userText = `Question: ${questionText}\nExisting Options: ${JSON.stringify(existingOpts)}`;
      const result = await queryGenerativeAI(sys, userText);
      if (result) {
        const mcqs = parseMcqText(result);
        if (mcqs.length > 0) {
          const blockHtml = generateMcqHtml(mcqs);
          // Replace activeBlock with the generated one
          const temp = document.createElement('div');
          temp.innerHTML = blockHtml;
          activeBlock.parentNode.replaceChild(temp.firstElementChild, activeBlock);
        } else {
          alert("AI completion format was incorrect. Try again.");
        }
      }
    } catch (e) {
      alert("AI Completion failed: " + e.message);
    } finally {
      activeBlock.classList.remove('nk-mcq-processing');
      setAiGenLoading(false);
    }
  };

  // 3. Document -> multiple MCQs (with short color-coded explanations)
  const handleAIDocToMCQs = async () => {
    if (!aiDocText.trim()) return;
    setShowAiDocModal(false);
    setAiDocLoading(true);
    alert("AI: Extracting and generating MCQs from document in the background... Feel free to continue editing!");
    try {
      const requestedCount = Math.max(1, Math.min(30, Number(aiDocCount) || 10));
      const sys = `You are an elite exam content architect. Extract and generate exactly ${requestedCount} challenging Civil Services MCQs from the document text provided.
      For each MCQ:
      - The explanation must be very short and precise (maximum 2-3 sentences), focusing only on the most important facts to increase knowledge.
      - Cover different facts from the document; do not repeat the same idea.
      - Add exactly two hashtags in the explanation: one difficulty tag (#easy, #medium, or #hard) and one concise topic tag (only use broad topics e.g climatology in geography is tag, its broad tag like chapter, using lowercase and underscores for spaces).
      - We use 6 color codes for explanation highlights: red (warnings/definitions), green (facts/outcomes), blue (dates/names/acts), orange (numbers/stats), magenta (themes/concepts), and teal (geography/science/institutions). Ensure explanations contain clear concepts fitting these categories so they can be highlighted beautifully.
      - Return them in NoteKash format, separated by >>>:
      
      Question...
      A) ...
      B) ...
      C) ...
      D) ...
      Correct Answer: ...
      Explanation: ... #topic #medium`;

      const result = await queryGenerativeAI(sys, aiDocText);
      if (result) {
        const mcqs = parseMcqText(result);
        if (mcqs.length > 0) {
          // Highlight explanations in bulk
          const explanations = mcqs.map(m => m.explanation || '');
          const highlightsList = await queryColorHighlightsForExplanations(explanations);
          
          mcqs.forEach((mcq, idx) => {
            const highlights = highlightsList[idx] || [];
            mcq.explanation = applyHighlightsToText(mcq.explanation || '', highlights);
          });

          const html = generateMcqHtml(mcqs);
          editorRef.current.insertAdjacentHTML('beforeend', html);
          alert(`Successfully generated and appended ${mcqs.length} MCQs from document!`);
        } else {
          alert("AI could not extract MCQs in correct format.");
        }
      }
    } catch (e) {
      alert("AI Extraction failed: " + e.message);
    } finally {
      setAiDocLoading(false);
      setAiDocText('');
      setAiDocCount(10);
    }
  };

  // 4. Color Explanation Keywords (Uses smart AI highlighting mapping applied inside the app)
  const handleAIColorExplanation = async () => {
    const selectedText = lastSelectionRangeRef.current ? lastSelectionRangeRef.current.toString().trim() : '';
    if (cmdPalette.openedViaIcon && selectedText) {
      setAiGenLoading(true);
      alert("AI: Color coding selected text... Feel free to continue editing!");
      try {
        const highlightsList = await queryColorHighlightsForExplanations([selectedText]);
        const highlights = highlightsList[0] || [];
        const highlightedHtml = applyHighlightsToText(selectedText, highlights);
        
        const selection = window.getSelection();
        if (selection && lastSelectionRangeRef.current) {
          selection.removeAllRanges();
          selection.addRange(lastSelectionRangeRef.current);
          
          lastSelectionRangeRef.current.deleteContents();
          
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = highlightedHtml;
          
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }
          
          lastSelectionRangeRef.current.insertNode(fragment);
          selection.removeAllRanges();
        }
        alert("AI: Color coding successfully applied to selected text!");
      } catch (e) {
        alert("AI Coloring failed: " + e.message);
      } finally {
        setAiGenLoading(false);
      }
      return;
    }

    const blocks = getEditorBlocks();
    if (blocks.length === 0) {
      alert("No MCQs found in the editor.");
      return;
    }

    const explanationItems = blocks
      .map((block, index) => ({ block, index, expEl: block.querySelector('.nk-mcq-explanation') }))
      .filter(item => item.expEl && item.expEl.innerText.trim());

    if (explanationItems.length === 0) {
      alert("No non-empty explanations found to color.");
      return;
    }

    setAiGenLoading(true);
    alert("AI: Color coding explanations in the background... Feel free to continue editing!");
    try {
      const rawTexts = explanationItems.map(item => item.expEl.innerText.trim());
      const highlightsList = await queryColorHighlightsForExplanations(rawTexts);
      explanationItems.forEach((item, idx) => {
        const highlights = highlightsList[idx] || [];
        item.expEl.innerHTML = applyHighlightsToText(rawTexts[idx], highlights);
      });
      alert(`Explanation color coding successfully applied to ${explanationItems.length} MCQs!`);
    } catch (e) {
      alert("AI Coloring failed: " + e.message);
    } finally {
      setAiGenLoading(false);
    }
  };

  // 5. Auto-tag MCQ
  const handleAIAutoTagMCQ = async () => {
    const blocks = getEditorBlocks();
    if (blocks.length === 0) {
      alert("No MCQs found in the editor.");
      return;
    }

    const summaries = blocks.map((block, index) => {
      const summary = getBlockSummary(block, index);
      return { index, question: summary.question.slice(0, 260) };
    }).filter(item => item.question);

    if (summaries.length === 0) {
      alert("No question text found to tag.");
      return;
    }

    setAiGenLoading(true);
    alert("AI: Auto-tagging MCQs in the background... Feel free to continue editing!");
    try {
      const allowedTopics = categoryTags[selectedCategory] || [];
      const sys = `You are a fast MCQ tagging classifier.
      For each item, read ONLY the question and return exactly two tags:
      1. difficulty: one of easy, medium, hard
      2. topic: one main topic within the selected category. Prefer an allowed topic if it fits; otherwise create a short 1-3 word topic.
      Return ONLY valid JSON: { "items": [{ "index": 0, "difficulty": "medium", "topic": "Fundamental Rights" }] }`;

      const userText = JSON.stringify({
        category: selectedCategory,
        allowedTopics: allowedTopics.slice(0, 80),
        items: summaries
      });
      const result = await queryGenerativeAI(sys, userText);
      const data = safeParseAIJson(result);
      const items = Array.isArray(data.items) ? data.items : [];
      let applied = 0;

      items.forEach(item => {
        const block = blocks[item.index];
        const expEl = block?.querySelector('.nk-mcq-explanation');
        if (!expEl) return;
        appendTagsToExplanation(expEl, item.difficulty, item.topic);
        applied += 1;
      });

      const newTagsSet = new Set(categoryTags[selectedCategory] || []);
      items.forEach(item => {
        const topic = normalizeTagName(item.topic);
        if (topic) newTagsSet.add(topic);
      });
      setCategoryTags(prev => ({ ...prev, [selectedCategory]: Array.from(newTagsSet) }));
      alert(`AI auto-tags applied to ${applied} MCQs.`);
    } catch (e) {
      alert("AI Tagging failed: " + e.message);
    } finally {
      setAiGenLoading(false);
    }
  };

  // 6. Quality Reviewer
  const handleAIReviewQuality = async () => {
    if (!editorRef.current) return;
    const blocks = getEditorBlocks();
    if (blocks.length === 0) {
      alert("No MCQs found in the editor to review.");
      return;
    }

    // Cache pre-review HTML for Undo
    setPreReviewHtml(editorRef.current.innerHTML);
    setReviewLoading(true);
    setReviewBanner({ show: false, score: 0, changes: [] });
    alert("AI: Auditing and reviewing MCQ quality in the background... Feel free to continue editing!");

    try {
      const summaries = blocks.map((block, index) => getBlockSummary(block, index));
      const sys = `You are a Senior Editor and Civil Services Quality Inspector. Review MCQs for spelling, grammar, clarity, ambiguity, option quality, and likely factual correctness.
      Keep edits conservative. Do not change correct answers unless clearly necessary.
      Return ONLY valid JSON:
      {
        "score": 92,
        "changes": ["Corrected grammar in Q1"],
        "items": [
          {
            "index": 0,
            "question": "edited plain question text",
            "options": ["A text", "B text", "C text", "D text"],
            "correctLabel": "A",
            "explanation": "edited plain explanation"
          }
        ]
      }
      Include an item only when changes are needed.`;

      const result = await queryGenerativeAI(sys, JSON.stringify({ category: selectedCategory, mcqs: summaries }));
      if (result) {
        const data = safeParseAIJson(result);
        
        if (Array.isArray(data.items)) {
          data.items.forEach(item => {
            const block = blocks[item.index];
            if (!block) return;
            const qEl = block.querySelector('.nk-mcq-question');
            if (qEl && item.question) qEl.innerText = item.question;
            const optEls = Array.from(block.querySelectorAll('.nk-mcq-option'));
            if (Array.isArray(item.options)) {
              item.options.forEach((text, idx) => {
                const optTextEl = optEls[idx]?.querySelector('.nk-mcq-option-text');
                if (optTextEl && typeof text === 'string') optTextEl.innerText = text;
              });
            }
            if (item.correctLabel) {
              const correctIdx = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].indexOf(String(item.correctLabel).toUpperCase());
              if (correctIdx >= 0) {
                optEls.forEach((opt, idx) => opt.setAttribute('data-is-correct', idx === correctIdx ? 'true' : 'false'));
              }
            }
            const expEl = block.querySelector('.nk-mcq-explanation');
            if (expEl && item.explanation) expEl.innerText = item.explanation;
          });
          setReviewBanner({
            show: true,
            score: data.score || 90,
            changes: data.changes || [`Reviewed ${blocks.length} MCQs.`]
          });
        } else {
          throw new Error("Invalid response format.");
        }
      }
    } catch (e) {
      console.error(e);
      alert("AI Quality Audit failed: " + e.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleRevertReview = () => {
    if (preReviewHtml && editorRef.current) {
      editorRef.current.innerHTML = preReviewHtml;
      setReviewBanner({ show: false, score: 0, changes: [] });
      alert("Audit edits successfully reverted!");
    }
  };

  const handleCmdSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setCmdPalette({ show: false, selectedIndex: 0, openedViaIcon: false });
      setCmdQuery('');
      if (editorRef.current) {
        editorRef.current.focus({ preventScroll: true });
        if (lastSelectionRangeRef.current) {
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(lastSelectionRangeRef.current);
          }
        }
      }
      return;
    }

    if (e.key === '/') {
      if (!cmdQuery) {
        e.preventDefault();
        setCmdPalette({ show: false, selectedIndex: 0, openedViaIcon: false });
        setCmdQuery('');
        
        if (editorRef.current) {
          editorRef.current.focus({ preventScroll: true });
          const selection = window.getSelection();
          if (selection && lastSelectionRangeRef.current) {
            selection.removeAllRanges();
            selection.addRange(lastSelectionRangeRef.current);
            document.execCommand('insertText', false, '/');
          }
        }
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredCommands.length > 0) {
        setCmdPalette(p => ({ ...p, selectedIndex: (p.selectedIndex + 1) % filteredCommands.length }));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredCommands.length > 0) {
        setCmdPalette(p => ({ ...p, selectedIndex: (p.selectedIndex - 1 + filteredCommands.length) % filteredCommands.length }));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedQuery = cmdQuery.trim();
      const lowerQuery = trimmedQuery.toLowerCase();
      
      let align = 'center';
      let isImgCommand = false;
      let url = '';
      
      if (lowerQuery.startsWith('imgl ')) {
        align = 'left';
        isImgCommand = true;
        url = trimmedQuery.substring(5).trim();
      } else if (lowerQuery.startsWith('imgr ')) {
        align = 'right';
        isImgCommand = true;
        url = trimmedQuery.substring(5).trim();
      } else if (lowerQuery.startsWith('imgc ')) {
        align = 'center';
        isImgCommand = true;
        url = trimmedQuery.substring(5).trim();
      } else if (lowerQuery.startsWith('img ')) {
        align = 'center';
        isImgCommand = true;
        url = trimmedQuery.substring(4).trim();
      }

      if (isImgCommand && url) {
        setCmdPalette({ show: false, selectedIndex: 0, openedViaIcon: false });
        setCmdQuery('');
        
        if (editorRef.current) {
          editorRef.current.focus({ preventScroll: true });
          const selection = window.getSelection();
          if (selection && lastSelectionRangeRef.current) {
            selection.removeAllRanges();
            selection.addRange(lastSelectionRangeRef.current);
            
            const img = document.createElement('img');
            img.src = url;
            img.className = 'nk-mcq-image cursor-pointer';
            img.setAttribute('data-align', align);
            img.style.width = (align === 'left' || align === 'right') ? '45%' : '60%';
            
            const range = lastSelectionRangeRef.current;
            range.insertNode(img);
            
            const space = document.createTextNode('\u00A0');
            range.setStartAfter(img);
            range.insertNode(space);
            range.setStartAfter(space);
            range.collapse(true);
            
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
        return;
      }

      if (filteredCommands.length > 0) {
        const activeCmd = filteredCommands[cmdPalette.selectedIndex];
        if (activeCmd) {
          handleExecuteCommand(activeCmd.id);
        }
      }
    }
  };

  const handleSelectSuggestedTag = (tag) => {
    const isSpecial = ['easy', 'medium', 'hard'].includes(tag);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        const text = textNode.textContent || '';
        const match = text.match(/#([a-zA-Z0-9_]*)$/);
        if (match) {
            range.setStart(textNode, range.startOffset - match[0].length);
            range.deleteContents();
            const span = document.createElement('span');
            span.className = isSpecial ? (tag==='hard'?'text-rose-500 font-bold':tag==='medium'?'text-blue-500 font-bold':'text-emerald-500 font-bold') : 'text-theme-primary font-medium';
            const tagValue = isSpecial ? tag : tag.replace(/\s+/g, '_');
            span.textContent = `#${tagValue} `;
            range.insertNode(span);
            range.setStartAfter(span);
            range.collapse(true);
            selection.removeAllRanges();
        }
    }
    setTagPalette(p => ({ ...p, show: false }));
  };

  const handleSelectSuggestedPyq = (exam) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        const text = textNode.textContent || '';
        const match = text.match(/\[\[([a-zA-Z0-9_\s]*)$/);
        if (match) {
            range.setStart(textNode, range.startOffset - match[0].length);
            range.deleteContents();
            
            const span = document.createElement('span');
            span.className = 'text-amber-500 font-bold pyq-marker';
            span.textContent = `[[${exam.name} ]]`;
            range.insertNode(span);
            
            range.setStart(span.firstChild, span.textContent.length - 2);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    setPyqPalette(p => ({ ...p, show: false }));
  };

  const handleEditorKeyDown = (e) => {
    if (pyqPalette.show) {
        if (e.key === 'Escape') {
            e.preventDefault();
            setPyqPalette(p => ({ ...p, show: false }));
            return;
        }

        if (pyqPalette.results.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setPyqPalette(p => ({ ...p, selectedIndex: (p.selectedIndex + 1) % p.results.length }));
                return;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setPyqPalette(p => ({ ...p, selectedIndex: (p.selectedIndex - 1 + p.results.length) % p.results.length }));
                return;
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selectedExam = pyqPalette.results[pyqPalette.selectedIndex];
                if (selectedExam) {
                    handleSelectSuggestedPyq(selectedExam);
                }
                return;
            }
        }
    }

    if (tagPalette.show) {
        if (e.key === 'Escape') {
            e.preventDefault();
            setTagPalette(p => ({ ...p, show: false }));
            return;
        }

        if (tagPalette.results.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setTagPalette(p => ({ ...p, selectedIndex: (p.selectedIndex + 1) % p.results.length }));
                return;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setTagPalette(p => ({ ...p, selectedIndex: (p.selectedIndex - 1 + p.results.length) % p.results.length }));
                return;
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selectedTag = tagPalette.results[tagPalette.selectedIndex];
                if (selectedTag) {
                    handleSelectSuggestedTag(selectedTag);
                }
                return;
            }
        }
    }

    if (e.key === '/') {
        if (!cmdPalette.show) {
            e.preventDefault();
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                lastSelectionRangeRef.current = range.cloneRange();
                
                let rect = range.getBoundingClientRect();
                if (rect.width === 0 && rect.height === 0) {
                    const tempSpan = document.createElement('span');
                    tempSpan.appendChild(document.createTextNode('\u200b'));
                    range.insertNode(tempSpan);
                    rect = tempSpan.getBoundingClientRect();
                    const parent = tempSpan.parentNode;
                    if (parent) {
                        parent.removeChild(tempSpan);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
                
                const palWidth = 288;
                const palHeight = 320;
                
                let top = rect.bottom + 10;
                let left = rect.left;
                
                if (left + palWidth > window.innerWidth - 10) {
                    left = window.innerWidth - palWidth - 10;
                }
                if (left < 10) left = 10;
                
                if (top + palHeight > window.innerHeight - 10) {
                    top = rect.top - palHeight - 10;
                }
                if (top < 10) top = 10;

                setCmdPosition({ top, left });
                setCmdQuery('');
                setCmdPalette({ show: true, selectedIndex: 0, openedViaIcon: false });
                setTagPalette(p => ({ ...p, show: false }));
                
                setTimeout(() => {
                  if (cmdSearchRef.current) cmdSearchRef.current.focus();
                }, 30);
            }
            return;
        }
    }

    if (cmdPalette.show) {
        if (e.key === 'Escape') {
            e.preventDefault();
            setCmdPalette({ show: false, selectedIndex: 0, openedViaIcon: false });
            setCmdQuery('');
            return;
        }

        if (filteredCommands.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setCmdPalette(p => ({ ...p, selectedIndex: (p.selectedIndex + 1) % filteredCommands.length }));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setCmdPalette(p => ({ ...p, selectedIndex: (p.selectedIndex - 1 + filteredCommands.length) % filteredCommands.length }));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const activeCmd = filteredCommands[cmdPalette.selectedIndex];
            if (activeCmd) {
              handleExecuteCommand(activeCmd.id);
            }
        }
    }
  };

  const handleEditorMouseUpOrKeyUp = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        lastSelectionRangeRef.current = range.cloneRange();
      }
    }
  };

  const handleOpenCmdPaletteFromIcon = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const pWidth = 288;
    const pHeight = 320;

    // Pinned to the bottom-right relative to the screen viewport above the fixed icon
    let top = window.innerHeight - pHeight - 80;
    let left = window.innerWidth - pWidth - 24;

    // Viewport bounds checking
    if (left + pWidth > window.innerWidth - 10) left = window.innerWidth - pWidth - 10;
    if (left < 10) left = 10;
    if (top + pHeight > window.innerHeight - 10) top = window.innerHeight - pHeight - 10;
    if (top < 10) top = 10;

    setCmdPosition({ top, left });
    setCmdPalette({ show: true, selectedIndex: 0, openedViaIcon: true });
    
    setTimeout(() => {
      if (cmdSearchRef.current) {
        cmdSearchRef.current.focus({ preventScroll: true });
      }
    }, 50);
  };

  const handleEditorClick = (e) => {
    // Radio Click
    if (e.target.classList.contains('nk-mcq-option-radio')) {
        const optionDiv = e.target.closest('.nk-mcq-option');
        if (optionDiv) {
            const block = optionDiv.closest('.nk-mcq-block');
            if (block) {
                block.querySelectorAll('.nk-mcq-option').forEach(opt => {
                    opt.setAttribute('data-is-correct', 'false');
                });
                optionDiv.setAttribute('data-is-correct', 'true');
            }
        }
        return;
    }

    // Delete Option Click
    const delOptBtn = e.target.closest('.nk-mcq-delete-option');
    if (delOptBtn) {
        const optionDiv = delOptBtn.closest('.nk-mcq-option');
        if (optionDiv) {
            const isCorrect = optionDiv.getAttribute('data-is-correct') === 'true';
            const block = optionDiv.closest('.nk-mcq-block');
            optionDiv.remove();
            if (isCorrect && block) {
                const firstOpt = block.querySelector('.nk-mcq-option');
                if (firstOpt) firstOpt.setAttribute('data-is-correct', 'true');
            }
        }
        return;
    }

    // Copy Block Click (Copied HTML to cache and written NoteKash text to clipboard)
    const copyBlockBtn = e.target.closest('.nk-mcq-copy-block');
    if (copyBlockBtn) {
        const block = copyBlockBtn.closest('.nk-mcq-block');
        if (block) {
            const question = block.querySelector('.nk-mcq-question')?.innerText || '';
            const optEls = block.querySelectorAll('.nk-mcq-option');
            const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            let optsStr = '';
            let correct = 'A';
            optEls.forEach((opt, idx) => {
              const isCorr = opt.getAttribute('data-is-correct') === 'true';
              const lbl = labels[idx] || 'A';
              if (isCorr) correct = lbl;
              const text = opt.querySelector('.nk-mcq-option-text')?.innerText || '';
              optsStr += `${lbl}) ${text}\n`;
            });
            const exp = block.querySelector('.nk-mcq-explanation')?.innerText || '';
            const copyStr = `${question}\n${optsStr}Correct Answer: ${correct}\nExplanation: ${exp}`;
            
            navigator.clipboard.writeText(copyStr)
              .then(() => alert("MCQ copied!"))
              .catch(err => console.error(err));
        }
        return;
    }

    // Delete Block Click
    const delBlockBtn = e.target.closest('.nk-mcq-delete-block');
    if (delBlockBtn) {
        const block = delBlockBtn.closest('.nk-mcq-block');
        if (block) block.remove();
        return;
    }

    // Add Option Click
    if (e.target.classList.contains('nk-mcq-add-option')) {
        const block = e.target.closest('.nk-mcq-block');
        if (block) {
            const optsContainer = block.querySelector('.nk-mcq-options');
            if (optsContainer) {
                const numOpts = optsContainer.querySelectorAll('.nk-mcq-option').length;
                const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
                const lbl = labels[numOpts] || `Opt${numOpts+1}`;
                
                const newOptHtml = `
                    <div class="nk-mcq-option" data-is-correct="false">
                        <div class="nk-mcq-option-radio" contenteditable="false"></div>
                        <div class="nk-mcq-option-text" contenteditable="true" data-placeholder="Option ${lbl}"></div>
                        <button class="nk-mcq-delete-option" contenteditable="false" title="Remove Option"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                    </div>`;
                optsContainer.insertAdjacentHTML('beforeend', newOptHtml);
                
                const newEl = optsContainer.lastElementChild.querySelector('.nk-mcq-option-text');
                if (newEl) {
                    const rng = document.createRange();
                    rng.selectNodeContents(newEl);
                    rng.collapse(false);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(rng);
                }
            }
        }
        return;
    }
  };

  const preparePush = () => {
    if (!editorRef.current) return;
    let blocks = editorRef.current.querySelectorAll('.nk-mcq-block');
    if (blocks.length === 0) {
        const rawText = getEditorPlainText();
        const mcqs = parseMcqText(rawText);
        if (mcqs.length === 0) {
            alert("No MCQs found. Paste NoteKash text or use / Convert to MCQ first.");
            return;
        }
        replaceEditorWithMcqHtml(generateMcqHtml(mcqs));
        blocks = editorRef.current.querySelectorAll('.nk-mcq-block');
    }

    const extracted = [];
    blocks.forEach((block) => {
        const dbId = block.getAttribute('data-db-id') || null;
        let qEl = block.querySelector('.nk-mcq-question');
        let questionHtml = qEl ? qEl.innerHTML : '';

        const options = [];
        let correctId = 'a';
        const optEls = block.querySelectorAll('.nk-mcq-option');
        const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
        optEls.forEach((optEl, i) => {
            const id = labels[i] || `opt${i}`;
            const isCorrect = optEl.getAttribute('data-is-correct') === 'true';
            if (isCorrect) correctId = id;
            const textEl = optEl.querySelector('.nk-mcq-option-text');
            options.push({
                id,
                label: id.toUpperCase(),
                text: textEl ? textEl.innerHTML : ''
            });
        });

        const expEl = block.querySelector('.nk-mcq-explanation');
        let explanationHtml = expEl ? expEl.innerHTML : '';
        let tags = [];
        let difficulty = null;
        
        const expText = expEl ? expEl.innerText : '';
        const tagRegex = /#([\w_]+)/gi;
        let match;
        while ((match = tagRegex.exec(expText)) !== null) {
            const rawTag = match[1].toLowerCase();
            if (['easy', 'medium', 'hard'].includes(rawTag)) {
                difficulty = rawTag;
            } else {
                const normalized = normalizeTagName(match[1]);
                if (!tags.includes(normalized)) tags.push(normalized);
            }
        }
        
        tags = tags.filter(t => !['easy', 'medium', 'hard'].includes(t.toLowerCase()));
        explanationHtml = explanationHtml.replace(tagRegex, '').trim();

        let pyqVal = null;
        let questionTextForPyq = qEl ? qEl.innerText : '';
        let expTextForPyq = expEl ? expEl.innerText : '';
        const pyqRegex = /\[\[(.*?)\]\]/g;
        let pyqMatch;

        const normalizePyqContent = (rawText) => {
          if (!rawText) return null;
          const yearMatch = rawText.match(/\b\d{4}\b/);
          const year = yearMatch ? yearMatch[0] : '';
          let namePart = rawText.replace(/\b\d{4}\b/g, '').replace(/[\[\]]/g, '').trim();
          const nameLower = namePart.toLowerCase().replace(/[-_]/g, ' ');
          let officialName = namePart;
          
          if (nameLower.includes('upsc prelim') || nameLower.includes('upsc pre') || nameLower.includes('upsc')) {
            officialName = 'UPSC Prelims';
          } else if (nameLower.includes('ssc cgl') || nameLower.includes('ssc')) {
            officialName = 'SSC CGL Tier 1';
          } else if (nameLower.includes('state pcs') || nameLower.includes('pcs') || nameLower.includes('state psc') || nameLower.includes('psc')) {
            officialName = 'State PSC Prelims';
          }
          
          return year ? `${officialName} ${year}` : officialName;
        };

        const processPyqMatch = (textPart) => {
             while ((pyqMatch = pyqRegex.exec(textPart)) !== null) {
                  const pyqContent = pyqMatch[1].trim(); 
                  if (pyqContent) {
                       pyqVal = normalizePyqContent(pyqContent);
                  }
             }
        };
        processPyqMatch(questionTextForPyq);
        processPyqMatch(expTextForPyq);

        // Filter out any manually entered tags that match the PYQ formatting to avoid tags array pollution
        tags = tags.filter(t => !t.toLowerCase().startsWith('pyq') && !['easy', 'medium', 'hard'].includes(t.toLowerCase()));

        questionHtml = questionHtml.replace(/\[\[.*?\]\]/g, '').trim();
        explanationHtml = explanationHtml.replace(/\[\[.*?\]\]/g, '').trim();

        extracted.push({
            id: dbId,
            question: questionHtml,
            options,
            correctId,
            explanation: explanationHtml,
            tags,
            difficulty,
            pyq: pyqVal
        });
    });

    setParsedMCQs(extracted);
    setShowPreviewModal(true);
  };

  const handlePushToSupabase = async () => {
    setIsUploading(true);
    try {
      if (!isSupabaseConfigured()) {
        alert("Supabase URL is missing. Add VITE_SUPABASE_URL to your environment before pushing MCQs.");
        return;
      }

      if (!user || !isAdminUser) {
        alert("Blocked: sign in with an account where profiles.is_admin is true before pushing MCQs.");
        return;
      }

      if (parsedMCQs.length === 0) {
        alert("No MCQs found to push.");
        return;
      }

      const cleanHtml = (value) => String(value || '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\sdata-(?!align)[\w-]+="[^"]*"/g, '')
        .replace(/\scontenteditable="[^"]*"/g, '')
        .trim();
      const cleanTags = (tags = []) => Array.from(new Set(
        tags
          .map(tag => normalizeTagName(tag))
          .filter(Boolean)
          .filter(tag => !['Easy', 'Medium', 'Hard'].includes(tag))
      ));
      const cleanDifficulty = (difficulty) => {
        const d = String(difficulty || '').toLowerCase();
        return ['easy', 'medium', 'hard'].includes(d) ? d : null;
      };

      const payload = parsedMCQs.map(mcq => {
        const options = (mcq.options || [])
          .map((option, index) => ({
            id: option.id || ['a', 'b', 'c', 'd', 'e', 'f', 'g'][index] || `opt${index}`,
            label: option.label || (['A', 'B', 'C', 'D', 'E', 'F', 'G'][index] || `OPT${index}`),
            text: cleanHtml(option.text)
          }))
          .filter(option => option.text);

        const row = {
          category_id: selectedCategory,
          question: cleanHtml(mcq.question),
          options,
          correct_id: mcq.correctId,
          explanation: cleanHtml(mcq.explanation),
          tags: cleanTags(mcq.tags || []),
          difficulty: cleanDifficulty(mcq.difficulty),
          source: adminFullName || user?.email?.split('@')[0] || 'admin',
          status: 'published',
          pyq: mcq.pyq || null
        };
        if (mcq.id) {
          row.id = mcq.id;
        }
        return row;
      }).filter(row => row.question && row.options.length >= 2);

      if (payload.length !== parsedMCQs.length) {
        alert("Some MCQs are incomplete. Please ensure every MCQ has a question and at least two options.");
        return;
      }

      const { error } = await supabase
        .from('questions')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      alert(`Successfully pushed ${parsedMCQs.length} MCQs to database!`);
      fetchCategoryTagsFromSupabase(selectedCategory);
      if (editorRef.current) {
          editorRef.current.innerHTML = '<p><br></p>';
      }
      setParsedMCQs([]);
      setShowPreviewModal(false);
    } catch (error) {
      console.error(error);
      alert("Error pushing to database: " + (error.message || 'Unknown Supabase error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleTriggerManualSync = async () => {
    if (!isSupabaseConfigured()) {
      alert("Supabase URL is missing. Add VITE_SUPABASE_URL to your environment before syncing.");
      return;
    }
    setSyncLoading(true);
    try {
      const { error } = await supabase
        .from('sync_requests')
        .insert({ status: 'pending' });

      if (error) throw error;

      alert("Syncer initiated successfully! Changes will be live in 1-2 minutes.");
    } catch (error) {
      console.error("Failed to trigger codebase sync:", error);
      alert("Failed to initiate sync: " + (error.message || 'Unknown Supabase error'));
    } finally {
      setSyncLoading(false);
    }
  };
  
  // Reset review tag filter on category change
  useEffect(() => {
    setReviewTagFilter('all');
  }, [selectedCategory]);

  // MCQ Review Dashboard Helper Actions & Effects
  const uniqueTags = React.useMemo(() => {
    return Array.from(
      new Set(
        reviewQuestions
          .flatMap(q => q.tags || [])
          .map(t => t ? normalizeTagName(t) : '')
          .filter(t => t !== '' && !['easy', 'medium', 'hard'].includes(t.toLowerCase()))
      )
    ).sort();
  }, [reviewQuestions]);

  const filteredReviewQuestions = React.useMemo(() => {
    const filtered = reviewQuestions.filter(q => {
      const qText = String(q.question || '').toLowerCase();
      const expText = String(q.explanation || '').toLowerCase();
      const s = reviewSearch.toLowerCase();
      const matchText = qText.includes(s) || expText.includes(s);

      const qDifficultyClean = String(q.difficulty || '').trim().toLowerCase();
      const hasDifficulty = ['easy', 'medium', 'hard'].includes(qDifficultyClean) ||
        (q.tags && q.tags.some(t => t && ['easy', 'medium', 'hard'].includes(t.trim().toLowerCase())));

      const matchDifficulty = reviewDifficulty === 'all' 
        || (reviewDifficulty === 'none' && !hasDifficulty)
        || (qDifficultyClean === reviewDifficulty)
        || (q.tags && q.tags.some(t => t && t.trim().toLowerCase() === reviewDifficulty));

      const topicTags = q.tags ? q.tags.map(t => normalizeTagName(t)).filter(t => t !== '' && !['easy', 'medium', 'hard'].includes(t.toLowerCase())) : [];
      const hasTopicTags = topicTags.length > 0;

      const matchTag = reviewTagFilter === 'all' 
        || (reviewTagFilter === 'none' && !hasTopicTags)
        || (topicTags.some(t => t.toLowerCase() === reviewTagFilter.toLowerCase()));

      return matchText && matchDifficulty && matchTag;
    });

    return filtered.sort((a, b) => {
      const getReviewQuestionTime = (question) => {
        const upTime = question.updated_at ? new Date(question.updated_at).getTime() : 0;
        const creTime = question.created_at ? new Date(question.created_at).getTime() : 0;
        return Math.max(upTime, creTime);
      };
      
      const timeA = getReviewQuestionTime(a);
      const timeB = getReviewQuestionTime(b);
      
      if (reviewSortOrder === 'latest') {
        return timeB - timeA;
      } else {
        return timeA - timeB;
      }
    });
  }, [reviewQuestions, reviewSearch, reviewDifficulty, reviewTagFilter, reviewSortOrder]);

  const getCollapsedExplanationPreview = (q) => {
    const cleanText = (html) => {
      const doc = new DOMParser().parseFromString(html || '', 'text/html');
      return doc.body.textContent || doc.body.innerText || '';
    };
    const plainText = cleanText(q.explanation);
    const tagsList = [];
    if (q.difficulty) {
      tagsList.push(`#${q.difficulty.toLowerCase()}`);
    }
    if (q.tags && q.tags.length > 0) {
      q.tags.forEach(t => {
        tagsList.push(`#${normalizeTagName(t).replace(/\s+/g, '_')}`);
      });
    }
    if (q.pyq) {
      tagsList.push(`[[${q.pyq}]]`);
    }
    return plainText + (tagsList.length > 0 ? ' ' + tagsList.join(' ') : '');
  };

  const formatHtmlStringWithTags = (q) => {
    let rawHtml = q.explanation || '';
    const tagsList = [];
    if (q.difficulty) {
      tagsList.push(`#${q.difficulty.toLowerCase()}`);
    }
    if (q.tags && q.tags.length > 0) {
      q.tags.forEach(t => {
        tagsList.push(`#${normalizeTagName(t).replace(/\s+/g, '_')}`);
      });
    }
    if (q.pyq) {
      tagsList.push(`[[${q.pyq}]]`);
    }

    if (tagsList.length > 0) {
      rawHtml += ' ' + tagsList.map(tag => {
        if (tag.startsWith('#')) {
          const tagLower = tag.toLowerCase();
          let colorStyle = 'color: #c084fc; background: rgba(192, 132, 252, 0.1); border: 1px solid rgba(192, 132, 252, 0.2);';
          if (tagLower === '#easy') colorStyle = 'color: #10b981; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2);';
          else if (tagLower === '#medium') colorStyle = 'color: #3b82f6; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2);';
          else if (tagLower === '#hard') colorStyle = 'color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);';
          
          return `<span class="inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mx-0.5 align-middle" style="${colorStyle}">${tag}</span>`;
        } else if (tag.startsWith('[[') && tag.endsWith(']]')) {
          return `<span class="inline-flex px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 mx-0.5 align-middle">${tag}</span>`;
        }
        return tag;
      }).join(' ');
    }
    return rawHtml;
  };

  const getFullExplanationText = (q) => {
    let exp = q.explanation || '';
    const tagsList = [];
    if (q.difficulty) {
      tagsList.push(`#${q.difficulty.toLowerCase()}`);
    }
    if (q.tags && q.tags.length > 0) {
      q.tags.forEach(t => {
        tagsList.push(`#${normalizeTagName(t).replace(/\s+/g, '_')}`);
      });
    }
    if (q.pyq) {
      tagsList.push(`[[${q.pyq}]]`);
    }
    return exp + (tagsList.length > 0 ? ' ' + tagsList.join(' ') : '');
  };

  const formatExplanationHtml = (text) => {
    if (!text) return '';
    const regex = /(#[a-zA-Z0-9_]+|\[\[.*?\]\])/g;
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      if (part.startsWith('#')) {
        const tagLower = part.toLowerCase();
        let colorClass = 'text-purple-400 bg-purple-500/10 border border-purple-500/20';
        if (tagLower === '#easy') colorClass = 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20';
        else if (tagLower === '#medium') colorClass = 'text-blue-500 bg-blue-500/10 border border-blue-500/20';
        else if (tagLower === '#hard') colorClass = 'text-rose-500 bg-rose-500/10 border border-rose-500/20';
        
        return (
          <span key={idx} className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mx-0.5 align-middle ${colorClass}`}>
            {part}
          </span>
        );
      }
      if (part.startsWith('[[') && part.endsWith(']]')) {
        return (
          <span key={idx} className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 mx-0.5 align-middle">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const fetchReviewQuestions = useCallback(async () => {
    if (!isSupabaseConfigured() || !selectedCategory) return;
    setLoadingReview(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('category_id', selectedCategory)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviewQuestions(data || []);
      setCheckedIds([]);
    } catch (err) {
      console.error("Error fetching review questions:", err);
      alert("Failed to fetch questions: " + err.message);
    } finally {
      setLoadingReview(false);
    }
  }, [selectedCategory, alert]);

  useEffect(() => {
    if (activeMode === 'review') {
      fetchReviewQuestions();
    }
  }, [activeMode, selectedCategory, fetchReviewQuestions]);

  const copyQuestionNoteKash = (q) => {
    try {
      const cleanText = (html) => {
        const doc = new DOMParser().parseFromString(html || '', 'text/html');
        return doc.body.textContent || doc.body.innerText || '';
      };

      let text = cleanText(q.question) + '\n';
      const sortedOptions = [...(q.options || [])].sort((a, b) => a.id.localeCompare(b.id));
      sortedOptions.forEach((opt, idx) => {
        const letter = String.fromCharCode(65 + idx); // A, B, C, D...
        text += `${letter}) ${cleanText(opt.text)}\n`;
      });

      const correctIndex = sortedOptions.findIndex(o => o.id === q.correct_id);
      const correctLetter = correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : 'A';
      text += `Correct Answer: ${correctLetter}\n`;

      let expLine = `Explanation: ${cleanText(q.explanation)}`;
      if (q.difficulty) {
        expLine += ` #${q.difficulty.toLowerCase()}`;
      }
      if (q.tags && q.tags.length > 0) {
        q.tags.forEach(t => {
          expLine += ` #${normalizeTagName(t).replace(/\s+/g, '_')}`;
        });
      }
      if (q.pyq) {
        expLine += ` [[${q.pyq}]]`;
      }
      text += expLine + '\n';

      navigator.clipboard.writeText(text);
      alert("Copied plain-text NoteKash formatting to clipboard!");
    } catch (err) {
      console.error(err);
      alert("Could not copy question text.");
    }
  };

  useEffect(() => {
    if (activeMode === 'write' && pendingQuestionToLoad) {
      const timer = setTimeout(() => {
        if (editorRef.current) {
          const q = pendingQuestionToLoad;
          
          const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
          const optionsHtml = (q.options || []).map((opt, idx) => {
            const id = labels[idx] || 'a';
            const isCorrect = q.correct_id === opt.id;
            return `
            <div class="nk-mcq-option" data-is-correct="${isCorrect ? 'true' : 'false'}">
                <div class="nk-mcq-option-radio" contenteditable="false"></div>
                <div class="nk-mcq-option-text" contenteditable="true" data-placeholder="Option ${id.toUpperCase()}">${opt.text || ''}</div>
                <button class="nk-mcq-delete-option" contenteditable="false" title="Remove Option"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>`;
          }).join('');

          const tagsHtml = q.tags && q.tags.length > 0 ? ` data-tags="${q.tags.map(t => normalizeTagName(t)).join(',')}"` : '';
          const difficultyHtml = q.difficulty ? ` data-difficulty="${q.difficulty}"` : '';
          
          let expText = q.explanation || '';
          
          const hasTagInText = (text, tag) => {
              const cleaned = tag.toLowerCase().replace(/[^a-z0-9_]/g, '');
              const words = text.toLowerCase().replace(/[^a-z0-9_\s]/g, '').split(/\s+/);
              return words.includes(cleaned);
          };

          if (q.difficulty) {
              const diffLower = q.difficulty.toLowerCase();
              if (!hasTagInText(expText, diffLower)) {
                  expText = expText.trim() + ` #${diffLower}`;
              }
          }

          if (q.tags && q.tags.length > 0) {
              q.tags.forEach(t => {
                  const tagSlug = normalizeTagName(t).replace(/\s+/g, '_');
                  if (!hasTagInText(expText, tagSlug) && !hasTagInText(expText, t)) {
                      expText = expText.trim() + ` #${tagSlug}`;
                  }
              });
          }

          if (q.pyq) {
            expText += ` [[${q.pyq}]]`;
          }

          const mcqHtml = `
          <div class="nk-mcq-block" contenteditable="false" data-db-id="${q.id}">
              <div class="nk-mcq-toolbar" contenteditable="false">
                  <button class="nk-mcq-copy-block" title="Copy MCQ"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
                  <button class="nk-mcq-delete-block" title="Delete MCQ"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
              </div>
              <div class="nk-mcq-question" contenteditable="true" data-placeholder="Question text...">${q.question || ''}</div>
              <div class="nk-mcq-options">${optionsHtml}</div>
              <button class="nk-mcq-add-option" contenteditable="false">+ Add Option</button>
              <div class="nk-mcq-explanation" contenteditable="true" data-placeholder="Add answer explanation (optional)..."${tagsHtml}${difficultyHtml}>${expText}</div>
          </div>
          <p><br></p>`;

          editorRef.current.innerHTML = mcqHtml;
          setPendingQuestionToLoad(null);
          alert("Successfully loaded question back into the editor! Make edits and click Review & Push to save changes.");
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeMode, pendingQuestionToLoad, alert]);

  const loadQuestionIntoEditor = (q) => {
    try {
      setPendingQuestionToLoad(q);
      setActiveMode('write');
    } catch (err) {
      console.error(err);
      alert("Could not load question into editor.");
    }
  };

  const handleToggleStatus = async (qId, currentStatus) => {
    const nextStatus = currentStatus === 'published' ? 'unpublished' : 'published';
    try {
      const { error } = await supabase
        .from('questions')
        .update({ status: nextStatus })
        .eq('id', qId);

      if (error) throw error;
      
      setReviewQuestions(prev => prev.map(q => q.id === qId ? { ...q, status: nextStatus } : q));
      alert(`Question status updated to ${nextStatus}!`);
    } catch (err) {
      console.error(err);
      alert("Error updating status: " + err.message);
    }
  };

  const handleBulkToggleStatus = async (targetStatus) => {
    if (checkedIds.length === 0) {
      alert("Select at least one question using checkboxes first.");
      return;
    }
    try {
      const { error } = await supabase
        .from('questions')
        .update({ status: targetStatus })
        .in('id', checkedIds);

      if (error) throw error;

      setReviewQuestions(prev => prev.map(q => checkedIds.includes(q.id) ? { ...q, status: targetStatus } : q));
      setCheckedIds([]);
      alert(`Bulk updated ${checkedIds.length} questions to ${targetStatus}!`);
    } catch (err) {
      console.error(err);
      alert("Error updating status: " + err.message);
    }
  };

  const fetchAllSupabaseRows = async (tableName) => {
    const pageSize = 1000;
    let from = 0;
    let rows = [];

    while (true) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(from, from + pageSize - 1);

      if (error) throw error;
      const chunk = data || [];
      rows = rows.concat(chunk);
      if (chunk.length < pageSize) break;
      from += pageSize;
    }

    return rows;
  };

  const questionSignature = (q) => {
    const clean = (value) => String(value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    return `${clean(q.category_id)}::${clean(q.question)}`;
  };

  const makeCrcTable = () => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i += 1) {
      let c = i;
      for (let k = 0; k < 8; k += 1) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c >>> 0;
    }
    return table;
  };

  const crcTable = makeCrcTable();

  const crc32 = (bytes) => {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i += 1) {
      c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  };

  const writeUint16 = (arr, value) => {
    arr.push(value & 0xff, (value >>> 8) & 0xff);
  };

  const writeUint32 = (arr, value) => {
    arr.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
  };

  const buildZipBlob = (files) => {
    const encoder = new TextEncoder();
    const chunks = [];
    const centralDirectory = [];
    let offset = 0;

    files.forEach(file => {
      const nameBytes = encoder.encode(file.name);
      const dataBytes = encoder.encode(file.content);
      const crc = crc32(dataBytes);
      const localHeader = [];

      writeUint32(localHeader, 0x04034b50);
      writeUint16(localHeader, 20);
      writeUint16(localHeader, 0);
      writeUint16(localHeader, 0);
      writeUint16(localHeader, 0);
      writeUint16(localHeader, 0);
      writeUint32(localHeader, crc);
      writeUint32(localHeader, dataBytes.length);
      writeUint32(localHeader, dataBytes.length);
      writeUint16(localHeader, nameBytes.length);
      writeUint16(localHeader, 0);

      chunks.push(new Uint8Array(localHeader), nameBytes, dataBytes);

      const centralHeader = [];
      writeUint32(centralHeader, 0x02014b50);
      writeUint16(centralHeader, 20);
      writeUint16(centralHeader, 20);
      writeUint16(centralHeader, 0);
      writeUint16(centralHeader, 0);
      writeUint16(centralHeader, 0);
      writeUint16(centralHeader, 0);
      writeUint32(centralHeader, crc);
      writeUint32(centralHeader, dataBytes.length);
      writeUint32(centralHeader, dataBytes.length);
      writeUint16(centralHeader, nameBytes.length);
      writeUint16(centralHeader, 0);
      writeUint16(centralHeader, 0);
      writeUint16(centralHeader, 0);
      writeUint16(centralHeader, 0);
      writeUint32(centralHeader, 0);
      writeUint32(centralHeader, offset);

      centralDirectory.push(new Uint8Array(centralHeader), nameBytes);
      offset += localHeader.length + nameBytes.length + dataBytes.length;
    });

    const centralSize = centralDirectory.reduce((sum, chunk) => sum + chunk.length, 0);
    const endRecord = [];
    writeUint32(endRecord, 0x06054b50);
    writeUint16(endRecord, 0);
    writeUint16(endRecord, 0);
    writeUint16(endRecord, files.length);
    writeUint16(endRecord, files.length);
    writeUint32(endRecord, centralSize);
    writeUint32(endRecord, offset);
    writeUint16(endRecord, 0);

    return new Blob([...chunks, ...centralDirectory, new Uint8Array(endRecord)], { type: 'application/zip' });
  };

  const readUint16LE = (bytes, offset) => bytes[offset] | (bytes[offset + 1] << 8);
  const readUint32LE = (bytes, offset) => (
    (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0
  );

  const parseZipJsonFiles = async (file) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const decoder = new TextDecoder();
    const files = [];
    let offset = 0;

    while (offset + 30 <= bytes.length) {
      const signature = readUint32LE(bytes, offset);
      if (signature !== 0x04034b50) break;

      const compressionMethod = readUint16LE(bytes, offset + 8);
      const compressedSize = readUint32LE(bytes, offset + 18);
      const fileNameLength = readUint16LE(bytes, offset + 26);
      const extraLength = readUint16LE(bytes, offset + 28);
      const nameStart = offset + 30;
      const dataStart = nameStart + fileNameLength + extraLength;
      const dataEnd = dataStart + compressedSize;
      const fileName = decoder.decode(bytes.slice(nameStart, nameStart + fileNameLength));

      if (compressionMethod !== 0) {
        throw new Error("This backup ZIP uses compression that the browser importer cannot read. Re-export from MCQKash and try again.");
      }

      if (fileName.endsWith('.json')) {
        files.push({
          name: fileName,
          data: JSON.parse(decoder.decode(bytes.slice(dataStart, dataEnd)))
        });
      }

      offset = dataEnd;
    }

    return files;
  };

  const handleBulkExportBackup = async () => {
    setBackupLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        alert("Supabase URL is missing. Configure Supabase before exporting.");
        return;
      }

      const questions = await fetchAllSupabaseRows('questions');
      const exportedAt = new Date().toISOString();
      const byCategory = questions.reduce((acc, question) => {
        const categoryId = question.category_id || 'uncategorized';
        if (!acc[categoryId]) acc[categoryId] = [];
        acc[categoryId].push(question);
        return acc;
      }, {});

      const files = Object.entries(byCategory)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([categoryId, rows]) => ({
          name: `questions/${categoryId}.json`,
          content: JSON.stringify({
            app: 'MCQKash',
            schemaVersion: 1,
            exportedAt,
            category_id: categoryId,
            count: rows.length,
            questions: rows
          }, null, 2)
        }));

      files.push({
        name: 'manifest.json',
        content: JSON.stringify({
          app: 'MCQKash',
          schemaVersion: 1,
          exportedAt,
          totalQuestions: questions.length,
          categories: Object.fromEntries(Object.entries(byCategory).map(([categoryId, rows]) => [categoryId, rows.length])),
          workspace: { categories, categoryTags, exams }
        }, null, 2)
      });

      const blob = buildZipBlob(files);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mcqkash-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      alert(`Backup ZIP exported with ${questions.length} MCQs across ${Object.keys(byCategory).length} categories.`);
    } catch (error) {
      console.error(error);
      alert("Bulk export failed: " + error.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const insertQuestionsInChunks = async (rows) => {
    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase.from('questions').insert(chunk);
      if (error) throw error;
    }
  };

  const handleBackupFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBackupLoading(true);
    try {
      let backup = null;
      let backupQuestions = [];
      let workspaceBackup = null;

      if (file.name.toLowerCase().endsWith('.zip')) {
        const jsonFiles = await parseZipJsonFiles(file);
        const manifest = jsonFiles.find(item => item.name === 'manifest.json')?.data;
        workspaceBackup = manifest?.workspace || null;
        backupQuestions = jsonFiles
          .filter(item => item.name.startsWith('questions/') && Array.isArray(item.data?.questions))
          .flatMap(item => item.data.questions);
      } else {
        const text = await file.text();
        backup = JSON.parse(text);
        workspaceBackup = backup?.workspace || null;
        backupQuestions = backup?.tables?.questions || backup?.questions || [];
      }

      if (!Array.isArray(backupQuestions) || backupQuestions.length === 0) {
        alert("Backup file has no questions table.");
        return;
      }

      const existing = await fetchAllSupabaseRows('questions');
      const existingSignatures = new Set(existing.map(questionSignature));
      const seenImportSignatures = new Set();

      const rowsToInsert = backupQuestions
        .filter(q => q && q.question && q.category_id)
        .filter(q => {
          const signature = questionSignature(q);
          if (existingSignatures.has(signature) || seenImportSignatures.has(signature)) return false;
          seenImportSignatures.add(signature);
          return true;
        })
        .map(q => {
          const { id, created_at, updated_at, ...rest } = q;
          return {
            category_id: rest.category_id,
            question: rest.question,
            options: Array.isArray(rest.options) ? rest.options : [],
            correct_id: rest.correct_id || rest.correctId || 'a',
            explanation: rest.explanation || '',
            tags: Array.isArray(rest.tags) ? rest.tags : [],
            difficulty: rest.difficulty || null,
            source: rest.source || 'backup-import',
            status: rest.status || 'published',
          };
        });

      if (rowsToInsert.length > 0) {
        await insertQuestionsInChunks(rowsToInsert);
      }

      if (workspaceBackup?.categoryTags) {
        setCategoryTags(prev => ({ ...prev, ...workspaceBackup.categoryTags }));
      }
      if (Array.isArray(workspaceBackup?.exams)) {
        setExams(prev => {
          const byId = new Map(prev.map(exam => [exam.id, exam]));
          workspaceBackup.exams.forEach(exam => {
            if (exam?.id && !byId.has(exam.id)) byId.set(exam.id, exam);
          });
          return Array.from(byId.values());
        });
      }

      alert(`Backup import complete. Added ${rowsToInsert.length} new MCQs and skipped ${backupQuestions.length - rowsToInsert.length} duplicates.`);
    } catch (error) {
      console.error(error);
      alert("Bulk import failed: " + error.message);
    } finally {
      setBackupLoading(false);
    }
  };

  // Passcode Verification Form
  const handlePasscodeSubmit = async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setPasscodeError(true);
      return;
    }

    if (!user) {
      setPasscodeError(true);
      setAdminCheckError('Sign in first. Ghost sessions cannot access Creator Studio.');
      return;
    }
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, full_name')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;
      if (profile?.is_admin !== true) {
        setIsAdminUser(false);
        setAdminCheckError('This doesnt seem to be account of Admin');
        setPasscodeError(true);
        return;
      }
      if (profile?.full_name) {
        setAdminFullName(profile.full_name);
      }

      const { data, error } = await supabase.rpc('verify_admin_passcode', { entered_passcode: passcodeAttempt });
      if (error) throw error;
      if (data === true) {
        setIsAdminUser(true);
        setIsPasscodeValid(true);
        localStorage.setItem('civilsKash_adminPassword', passcodeAttempt);
        setPasscodeError(false);
        setAdminCheckError('');
      } else {
        setPasscodeError(true);
      }
    } catch (err) {
      console.error(err);
      setIsAdminUser(false);
      setAdminCheckError('Could not verify admin profile.');
      setPasscodeError(true);
    }
  };

  // If we are checking the cached local password, show a glassmorphic loader
  if (isValidatingStored) {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col justify-center items-center px-4 relative font-sans text-theme-text overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-theme-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-theme-accent/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-md bg-theme-surface/75 border border-theme-border rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-xl relative z-10 text-center flex flex-col items-center">
          <div className="relative w-14 h-14 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-theme-primary/20 border-t-theme-primary animate-spin" />
          </div>
          <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">Verifying Session...</p>
        </div>
      </div>
    );
  }

  // If passcode is not validated, show passcode screen
  if (!isPasscodeValid) {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col justify-center items-center px-4 relative font-sans text-theme-text overflow-hidden">
        {/* Glowing background circles */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-theme-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-theme-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-theme-surface/75 border border-theme-border rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-xl relative z-10 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-gradient-to-tr from-theme-primary to-theme-accent text-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-[0_12px_30px_rgba(var(--color-primary),0.3)]">
            <Command size={36} />
          </div>
          
          <h1 className="text-3xl font-black tracking-tight text-theme-text uppercase mb-2">Creator Studio</h1>
          <p className="text-sm text-theme-muted font-medium mb-8">Sign in as a Supabase admin, then enter the administrative passcode.</p>

          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="block text-[10px] font-black uppercase tracking-widest text-theme-muted mb-1 px-1">Passcode</label>
              <input 
                type="password" 
                value={passcodeAttempt}
                onChange={(e) => setPasscodeAttempt(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full bg-theme-bg/60 border rounded-2xl px-5 py-4 text-sm font-semibold outline-none text-center tracking-widest text-theme-text focus:bg-theme-bg focus:border-theme-primary/50 transition-all ${passcodeError ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-theme-border'}`}
              />
              {passcodeError && (
                <p className="text-xs text-rose-500 font-bold text-center mt-2 animate-pulse">Incorrect administrative passcode.</p>
              )}
              {adminCheckError && (
                <p className="text-xs text-amber-500 font-bold text-center mt-2">{adminCheckError}</p>
              )}
              {!user && (
                <p className="text-xs text-amber-500 font-bold text-center mt-2">No signed-in user found. Creator Studio blocks ghost access.</p>
              )}
            </div>
            
            <button 
              type="submit" 
              className="w-full py-4 bg-gradient-to-r from-theme-primary to-theme-primary/80 hover:opacity-95 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-98 shadow-lg shadow-theme-primary/10"
            >
              Verify Passcode
            </button>
          </form>
        </div>
      </div>
    );
  }

  const categoryAllocated = selectedExamCats.filter(c => c.weight > 0).reduce((sum, c) => sum + c.weight, 0);
  const categoryRemaining = 100 - categoryAllocated;
  const categoryUnspecified = selectedExamCats.filter(c => c.weight === 0).length;
  const categoryAutoDist = categoryUnspecified > 0 ? Math.floor(categoryRemaining / categoryUnspecified) : 0;

  const activeDifficulties = Object.keys(selectedExamDifficulties).filter(k => selectedExamDifficulties[k].selected);
  const difficultyAllocated = activeDifficulties.filter(k => selectedExamDifficulties[k].weight > 0).reduce((sum, k) => sum + selectedExamDifficulties[k].weight, 0);
  const difficultyRemaining = 100 - difficultyAllocated;
  const difficultyUnspecified = activeDifficulties.filter(k => selectedExamDifficulties[k].weight === 0).length;
  const difficultyAutoDist = difficultyUnspecified > 0 ? Math.floor(difficultyRemaining / difficultyUnspecified) : 0;

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col text-theme-text font-sans">
      <Header />
      
      <main className={`flex-1 w-full mx-auto px-4 py-6 flex flex-col h-[calc(100vh-64px)] relative transition-all duration-300 ${activeMode === 'review' ? 'max-w-7xl' : 'max-w-4xl'}`}>
        
        {/* Top Bar - Fully Screen Responsive */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 bg-theme-surface border border-theme-border rounded-[1.8rem] p-5 shadow-lg backdrop-blur-xl shrink-0 transition-all hover:shadow-xl">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3 shrink-0 ${activeMode === 'write' ? 'bg-gradient-to-br from-theme-primary to-theme-primary/60' : activeMode === 'review' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-theme-accent to-theme-accent/60'}`}>
              {activeMode === 'write' ? <Command size={22} className="text-white" /> : activeMode === 'review' ? <FileText size={22} className="text-white" /> : <Layers size={22} className="text-white" />}
            </div>
            <div>
              <h1 className="font-black text-xl leading-none tracking-tight text-theme-text uppercase">
                {activeMode === 'write' ? 'Creator Studio' : activeMode === 'review' ? 'MCQ Review Dashboard' : 'Exam Mocks Hub'}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-2 h-2 rounded-full ${activeMode === 'write' ? 'bg-emerald-500 animate-pulse' : activeMode === 'review' ? 'bg-purple-500 animate-pulse' : 'bg-theme-accent animate-pulse'}`} />
                <p className="text-[9px] font-black text-theme-muted uppercase tracking-wider">
                  {activeMode === 'write' ? 'Write Mode' : activeMode === 'review' ? 'Review Mode' : 'Mocks Mode'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 md:flex-initial min-w-[160px]">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-theme-primary shadow-inner appearance-none pr-10 cursor-pointer hover:bg-theme-surface"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-theme-muted">
                <ChevronDown size={14} />
              </div>
            </div>

            <button 
              onClick={() => { setShowSettingsModal(true); }} 
              className="w-10 h-10 flex items-center justify-center text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10 border border-theme-border rounded-xl transition-all shadow-sm shrink-0"
              title="Workspace Mode"
            >
              <Settings size={18} />
            </button>
            
            {activeMode !== 'review' && (
              <button 
                onClick={activeMode === 'write' ? preparePush : () => pushExamsToSupabase(exams)} 
                className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 text-white ${activeMode === 'write' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-theme-accent hover:bg-theme-accent/90'}`}
              >
                  <Database size={15} /> {activeMode === 'write' ? 'Review & Push' : 'Save'}
              </button>
            )}
          </div>
        </div>

        {/* Global AI Quality Review Notification Banner */}
        {reviewBanner.show && (
          <div className="mb-4 p-4 bg-gradient-to-r from-theme-primary/10 via-theme-surface to-purple-500/5 border border-theme-primary/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex gap-3 items-start">
              <Sparkles className="text-amber-500 shrink-0 mt-0.5 animate-pulse" size={18} />
              <div>
                <h4 className="font-bold text-sm text-theme-text">✨ AI Quality Audit Completed (Score: {reviewBanner.score}/100)</h4>
                <ul className="text-xs text-theme-muted list-disc pl-4 mt-1 space-y-0.5">
                  {reviewBanner.changes.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button 
                onClick={handleRevertReview}
                className="px-3.5 py-1.5 bg-theme-bg hover:bg-theme-surface-hover border border-theme-border rounded-xl text-xs font-bold text-theme-text flex items-center gap-1.5 active:scale-95"
              >
                <Undo size={12} /> Undo Audit
              </button>
              <button 
                onClick={() => setReviewBanner({ show: false, score: 0, changes: [] })}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95"
              >
                <Check size={12} /> Accept Edits
              </button>
            </div>
          </div>
        )}

        {/* Floating Non-Blocking Status Badge */}
        {(reviewLoading || aiGenLoading || aiDocLoading || aiReviseLoading) && (
          <div className="fixed bottom-6 right-6 z-50 bg-theme-surface/90 border border-theme-primary/30 shadow-[0_10px_30px_rgba(0,0,0,0.4)] rounded-2xl p-4 flex items-center gap-3.5 max-w-xs animate-in slide-in-from-bottom-5 duration-300 pointer-events-none select-none backdrop-blur-md">
            <div className="relative w-8 h-8 shrink-0 flex items-center justify-center rounded-xl bg-theme-primary/10">
              <div className="absolute inset-0 rounded-xl border-2 border-theme-primary/20 border-t-theme-primary animate-spin" />
              <Sparkles size={14} className="text-theme-primary animate-pulse" />
            </div>
            <div className="flex flex-col min-w-0 pr-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-theme-primary leading-none">AI Running</span>
              <p className="text-[11px] font-semibold text-theme-text mt-1 truncate leading-tight">
                {reviewLoading ? 'Auditing MCQ layout...' : aiDocLoading ? 'Extracting from document...' : aiReviseLoading ? 'Revising MCQ cards...' : 'Drafting MCQ structure...'}
              </p>
            </div>
          </div>
        )}

        {activeMode === 'write' ? (
        <div className="flex-1 relative flex flex-col bg-theme-surface/50 border border-theme-border rounded-2xl shadow-inner focus-within:border-theme-primary/50 focus-within:bg-theme-surface transition-colors">
            
            {/* Floating Image Control Toolbar */}
            {imgToolbar.show && (
                <div 
                    className="fixed z-50 bg-theme-bg border border-theme-border rounded-xl shadow-2xl flex items-center p-1.5 animate-in fade-in slide-in-from-top-2 backdrop-blur-md gap-1 nk-mcq-image-toolbar"
                    style={{ top: imgToolbar.top, left: imgToolbar.left }}
                    contentEditable={false}
                >
                    <button
                        onClick={() => handleAlignImage('left')}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-theme-surface hover:text-theme-primary transition-all active:scale-95 ${imgToolbar.targetImg?.getAttribute('data-align') === 'left' ? 'text-theme-primary bg-theme-primary/10' : 'text-theme-muted'}`}
                        title="Align Left"
                    >
                        <AlignLeft size={15} />
                    </button>
                    <button
                        onClick={() => handleAlignImage('center')}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-theme-surface hover:text-theme-primary transition-all active:scale-95 ${imgToolbar.targetImg?.getAttribute('data-align') === 'center' ? 'text-theme-primary bg-theme-primary/10' : 'text-theme-muted'}`}
                        title="Align Center"
                    >
                        <AlignCenter size={15} />
                    </button>
                    <button
                        onClick={() => handleAlignImage('right')}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-theme-surface hover:text-theme-primary transition-all active:scale-95 ${imgToolbar.targetImg?.getAttribute('data-align') === 'right' ? 'text-theme-primary bg-theme-primary/10' : 'text-theme-muted'}`}
                        title="Align Right"
                    >
                        <AlignRight size={15} />
                    </button>
                    <div className="w-px h-5 bg-theme-border mx-1" />
                    <div className="flex items-center gap-1.5 px-2 py-0.5 select-none">
                        <span className="text-[10px] font-bold text-theme-muted">Size:</span>
                        <input 
                            type="range"
                            min="0"
                            max="6"
                            step="1"
                            value={RESIZE_STEPS.indexOf(RESIZE_STEPS.reduce((p, c) => Math.abs(c - imgToolbar.currentWidth) < Math.abs(p - imgToolbar.currentWidth) ? c : p))}
                            onChange={(e) => {
                                const idx = parseInt(e.target.value);
                                const newWidth = RESIZE_STEPS[idx];
                                if (imgToolbar.targetImg) {
                                    imgToolbar.targetImg.style.width = newWidth + '%';
                                    setImgToolbar(prev => ({ ...prev, currentWidth: newWidth }));
                                }
                            }}
                            className="w-20 h-1 bg-theme-border rounded-lg appearance-none cursor-pointer accent-theme-primary custom-range-slider"
                        />
                        <span className="text-[9px] font-black text-theme-primary min-w-[28px] text-right">{imgToolbar.currentWidth}%</span>
                    </div>
                    <div className="w-px h-5 bg-theme-border mx-1" />
                    <button
                        onClick={handleDeleteImage}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-500/20 text-rose-500 hover:text-rose-600 transition-all active:scale-95"
                        title="Delete Image"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            )}

            {/* Floating Text Color Toolbar */}
            {textToolbar.show && (
                <div 
                    className="absolute z-30 bg-theme-bg border border-theme-border rounded-xl shadow-2xl flex items-center p-1.5 animate-in fade-in slide-in-from-top-2 backdrop-blur-md"
                    style={{ top: textToolbar.top, left: textToolbar.left }}
                >
                    <div className="flex items-center gap-1 border-r border-theme-border pr-2 mr-2">
                        <button
                            onClick={() => {
                                document.execCommand('bold', false, null);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-theme-surface hover:text-theme-primary text-theme-muted hover:scale-105 transition-all active:scale-95"
                            title="Bold"
                        >
                            <Bold size={14} />
                        </button>
                        <button
                            onClick={() => {
                                document.execCommand('italic', false, null);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-theme-surface hover:text-theme-primary text-theme-muted hover:scale-105 transition-all active:scale-95"
                            title="Italic"
                        >
                            <Italic size={14} />
                        </button>
                    </div>

                    <div className="flex items-center gap-1 border-r border-theme-border pr-2 mr-2">
                        {TEXT_COLORS.map(c => (
                            <button 
                                key={c.id} 
                                onClick={() => applyColor(c.class)}
                                className="w-6 h-6 rounded-full border border-theme-border hover:scale-110 transition-all shadow-sm active:scale-95"
                                style={{ backgroundColor: c.hex }}
                                title={`Text ${c.id}`}
                            />
                        ))}
                    </div>
                    
                    <button 
                        onClick={() => executeConvertToMCQ(true)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-theme-primary text-white hover:bg-theme-primary/90 transition-all shadow-md active:scale-95 group"
                        title="Convert to MCQ"
                    >
                        <Wand2 size={14} className="group-hover:rotate-12 transition-transform" />
                    </button>
                </div>
            )}

            <div 
                ref={editorRef}
                className="flex-1 overflow-y-auto p-6 md:p-8 pb-20 outline-none nk-editor-area custom-scrollbar text-[1rem] md:text-[1.05rem]"
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={handleEditorInput}
                onPaste={handleEditorPaste}
                onClick={handleEditorClick}
                onKeyDown={handleEditorKeyDown}
                onMouseUp={handleEditorMouseUpOrKeyUp}
                onKeyUp={handleEditorMouseUpOrKeyUp}
                data-placeholder="Start typing or paste from NoteKash..."
            >
                <p><br/></p>
            </div>

            {/* Floating Command Palette Trigger */}
            <button
              onClick={handleOpenCmdPaletteFromIcon}
              className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-theme-primary hover:bg-theme-primary/95 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-30 border border-theme-primary/20"
              title="Open Command Palette"
            >
              <Command size={20} />
            </button>

            {/* Searchable Command Palette Overlay */}
            {cmdPalette.show && (
              <div 
                ref={cmdPaletteRef}
                className="fixed bg-theme-surface border border-theme-border rounded-xl shadow-2xl p-2 w-72 z-50 animate-in fade-in zoom-in-95"
                style={{ top: cmdPosition.top, left: cmdPosition.left }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Command search input */}
                <div className="relative mb-2">
                  <input
                    ref={cmdSearchRef}
                    type="text"
                    value={cmdQuery}
                    onChange={(e) => setCmdQuery(e.target.value)}
                    placeholder="Search commands..."
                    className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-theme-primary text-theme-text"
                    onKeyDown={handleCmdSearchKeyDown}
                  />
                </div>
                <div className="text-[10px] font-bold text-theme-muted px-3 mb-2 uppercase tracking-wider">Commands</div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
                  {filteredCommands.length === 0 ? (
                    <div className="text-xs text-theme-muted p-3 text-center">No commands found</div>
                  ) : (
                    filteredCommands.map((opt, idx) => (
                      <button 
                        key={opt.id}
                        onClick={() => handleExecuteCommand(opt.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-left font-semibold transition-colors ${cmdPalette.selectedIndex === idx ? 'nk-cmd-item-active bg-theme-bg text-theme-primary' : 'text-theme-text hover:bg-theme-bg/30'}`}
                      >
                        <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${cmdPalette.selectedIndex === idx ? 'bg-theme-primary/20 text-theme-primary' : 'bg-theme-border text-theme-muted'}`}>{opt.icon}</div>
                        <div>
                          <div className="font-bold">{opt.label}</div>
                          <div className="text-[9px] text-theme-muted font-medium mt-0.5">{opt.desc}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tag Palette Popup */}
            {tagPalette.show && (
              <div 
                ref={tagPaletteRef}
                className="absolute z-40 w-48 bg-theme-bg border border-theme-border rounded-xl shadow-2xl py-1 overflow-hidden animate-in fade-in slide-in-from-top-2"
                style={{ top: tagPalette.top, left: tagPalette.left }}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-theme-muted uppercase tracking-wider border-b border-theme-border/50 bg-theme-surface">Suggested Topics</div>
                <div className="max-h-44 overflow-y-auto custom-scrollbar">
                  {tagPalette.results.map((tag, idx) => {
                      const isSpecial = ['easy', 'medium', 'hard'].includes(tag);
                      return (
                          <button 
                              key={tag}
                              onClick={() => handleSelectSuggestedTag(tag)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${tagPalette.selectedIndex === idx ? 'nk-tag-item-active bg-theme-surface text-theme-text' : 'text-theme-muted hover:bg-theme-surface hover:text-theme-text'}`}
                          >
                              {isSpecial ? (
                                  <div className={`w-2 h-2 rounded-full ${tag==='hard'?'bg-rose-500':tag==='medium'?'bg-blue-500':'bg-emerald-500'}`} />
                              ) : (
                                  <span className="text-theme-primary opacity-50">#</span>
                              )}
                              {tag}
                          </button>
                      );
                  })}
                </div>
              </div>
            )}
            
            {/* PYQ Palette Popup */}
            {pyqPalette.show && (
              <div 
                ref={pyqPaletteRef}
                className="absolute z-40 w-64 bg-theme-bg border border-theme-border rounded-xl shadow-2xl py-1 overflow-hidden animate-in fade-in slide-in-from-top-2"
                style={{ top: pyqPalette.top, left: pyqPalette.left }}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-theme-muted uppercase tracking-wider border-b border-theme-border/50 bg-theme-surface">Select PYQ Exam</div>
                <div className="max-h-44 overflow-y-auto custom-scrollbar">
                   {pyqPalette.results.map((exam, idx) => (
                       <button 
                           key={exam.id}
                           onClick={() => handleSelectSuggestedPyq(exam)}
                           className={`w-full flex items-center gap-3 px-3 py-2 text-xs text-left transition-colors ${pyqPalette.selectedIndex === idx ? 'nk-pyq-item-active bg-theme-surface text-theme-text' : 'text-theme-muted hover:bg-theme-surface hover:text-theme-text'}`}
                       >
                          <exam.icon size={14} className="text-amber-500 shrink-0" />
                          {exam.name}
                      </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeMode === 'review' ? (
                 /* MCQ Review Spreadsheet-Style Dashboard */
          <div className="flex-1 relative bg-theme-surface/50 border border-theme-border rounded-2xl shadow-inner p-5 md:p-6 overflow-hidden flex flex-col">
            
            {/* Questions Table wrapper with custom scrollbar */}
            <div className="flex-1 overflow-auto custom-scrollbar border border-theme-border rounded-xl bg-theme-bg/30 pb-20">
              {loadingReview ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-theme-primary/20 border-t-theme-primary animate-spin" />
                  <p className="text-xs text-theme-muted font-bold">Querying Supabase category rows...</p>
                </div>
              ) : (
                (() => {
                  if (filteredReviewQuestions.length === 0) {
                    return (
                      <div className="text-center py-16 text-theme-muted font-semibold text-xs border border-dashed border-theme-border rounded-xl m-4 bg-theme-surface/30">
                        No questions found under this category filter.
                      </div>
                    );
                  }

                  return (
                    <table className="nk-review-table" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr>
                          <th className="w-12 text-center"></th>
                          <th className="w-[40%]">Question</th>
                          <th className="w-[35%]">Explanation</th>
                          <th className="w-[11%] text-center">Status</th>
                          <th className="w-[14%] text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReviewQuestions.map(q => {
                          const isExpanded = expandedIds.includes(q.id);
                          const cleanHtml = (html) => {
                            const d = new DOMParser().parseFromString(html || '', 'text/html');
                            return d.body.textContent || d.body.innerText || '';
                          };
                          const qPreview = cleanHtml(q.question);
                          const collapsedExpPreview = getCollapsedExplanationPreview(q);
                          const expandedExplanationHtml = formatHtmlStringWithTags(q);

                          return (
                            <React.Fragment key={q.id}>
                              <tr className={isExpanded ? 'bg-theme-surface/30 border-b-0' : ''}>
                                <td className="text-center">
                                  <button
                                    onClick={() => setExpandedIds(prev => prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id])}
                                    className="p-1 hover:bg-theme-surface hover:text-theme-primary text-theme-muted hover:text-theme-text rounded-lg transition-all active:scale-95"
                                    title={isExpanded ? "Collapse Question" : "Expand Question"}
                                  >
                                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                  </button>
                                </td>
                                <td>
                                  <div className="truncate font-bold text-theme-text text-xs pr-1 leading-relaxed">
                                    {qPreview}
                                  </div>
                                </td>
                                <td>
                                  <div className="truncate font-semibold text-theme-muted text-xs pr-1 leading-relaxed">
                                    {formatExplanationHtml(collapsedExpPreview)}
                                  </div>
                                </td>
                                <td className="text-center">
                                  <label className="switch-container">
                                    <input 
                                      type="checkbox"
                                      checked={q.status === 'published'}
                                      onChange={() => handleToggleStatus(q.id, q.status)}
                                      className="switch-input"
                                    />
                                    <span className="switch-slider" />
                                  </label>
                                </td>
                                <td className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => copyQuestionNoteKash(q)}
                                      className="w-8 h-8 flex items-center justify-center text-theme-muted hover:text-theme-primary bg-theme-bg hover:bg-theme-surface border border-theme-border rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
                                      title="Copy plain-text NoteKash version"
                                    >
                                      <Copy size={14} />
                                    </button>
                                    <button
                                      onClick={() => loadQuestionIntoEditor(q)}
                                      className="w-8 h-8 flex items-center justify-center text-theme-muted hover:text-emerald-500 bg-theme-bg hover:bg-theme-surface border border-theme-border rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
                                      title="Load question back into writer"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-theme-surface/30 border-t-0 border-b border-theme-border/50">
                                  <td></td>
                                  <td colSpan={2} className="py-4 pr-6">
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                      <div>
                                        <h5 className="text-[10px] font-black uppercase tracking-wider text-theme-muted mb-1">Full Question</h5>
                                        <div 
                                          className="text-xs font-bold text-theme-text leading-relaxed html-render-block"
                                          dangerouslySetInnerHTML={{ __html: q.question }}
                                        />
                                        
                                        {/* Detailed Options rendering inside expanded content */}
                                        <div className="mt-3 pl-4 space-y-2 border-l-2 border-theme-border/60">
                                          {(q.options || []).map((opt) => {
                                            const isCorrect = q.correct_id === opt.id;
                                            return (
                                              <div key={opt.id} className="flex items-start gap-2.5 text-xs font-semibold">
                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${isCorrect ? 'bg-emerald-500 text-white shadow-sm' : 'bg-theme-bg text-theme-muted border border-theme-border'}`}>
                                                  {opt.label || opt.id.toUpperCase()}
                                                </span>
                                                <span 
                                                  className={`mt-0.5 leading-tight html-render-block ${isCorrect ? 'text-emerald-500 font-bold' : 'text-theme-text'}`}
                                                  dangerouslySetInnerHTML={{ __html: opt.text }}
                                                />
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h5 className="text-[10px] font-black uppercase tracking-wider text-theme-muted mb-1">Full Explanation</h5>
                                        <div 
                                          className="text-xs font-semibold text-theme-muted leading-relaxed html-render-block"
                                          dangerouslySetInnerHTML={{ __html: expandedExplanationHtml || '<em class="opacity-40">No explanation added</em>' }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td colSpan={2}></td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()
              )}
            </div>

            {/* Floating controls inside review panel */}
            <div className="fixed bottom-2 right-6 z-30 flex items-center gap-2.5 bg-theme-bg/95 backdrop-blur-md border border-theme-border p-2 rounded-2xl shadow-2xl">
              <input 
                type="text" 
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                placeholder="Search..."
                className="bg-theme-surface border border-theme-border rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-theme-primary text-theme-text placeholder-theme-muted min-w-[180px] max-w-[240px]"
              />
              
              <div className="relative">
                <select
                  value={reviewDifficulty}
                  onChange={(e) => setReviewDifficulty(e.target.value)}
                  className="bg-theme-surface border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-theme-primary appearance-none pr-8 cursor-pointer text-theme-text"
                >
                  <option value="all">All Difficulties</option>
                  <option value="none">No Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-theme-muted">
                  <ChevronDown size={12} />
                </div>
              </div>

              <div className="relative">
                <select
                  value={reviewTagFilter}
                  onChange={(e) => setReviewTagFilter(e.target.value)}
                  className="bg-theme-surface border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-theme-primary appearance-none pr-8 cursor-pointer text-theme-text max-w-[150px] truncate"
                >
                  <option value="all">All Tags</option>
                  <option value="none">No Tags</option>
                  {uniqueTags.map(tag => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-theme-muted">
                  <ChevronDown size={12} />
                </div>
              </div>

              <div className="relative">
                <select
                  value={reviewSortOrder}
                  onChange={(e) => setReviewSortOrder(e.target.value)}
                  className="bg-theme-surface border border-theme-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-theme-primary appearance-none pr-8 cursor-pointer text-theme-text"
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-theme-muted">
                  <ChevronDown size={12} />
                </div>
              </div>

              <button 
                onClick={fetchReviewQuestions}
                className="w-9 h-9 bg-theme-surface border border-theme-border hover:bg-theme-bg hover:text-theme-primary text-theme-muted rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
                title="Reload Questions"
                disabled={loadingReview}
              >
                <RefreshCw size={14} className={loadingReview ? 'animate-spin' : ''} />
              </button>

              {filteredReviewQuestions.length > 0 && (
                <button 
                  onClick={() => {
                    const allExpanded = filteredReviewQuestions.every(q => expandedIds.includes(q.id));
                    if (allExpanded) {
                      const filteredIds = filteredReviewQuestions.map(q => q.id);
                      setExpandedIds(prev => prev.filter(id => !filteredIds.includes(id)));
                    } else {
                      const filteredIds = filteredReviewQuestions.map(q => q.id);
                      setExpandedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
                    }
                  }}
                  className="w-9 h-9 bg-theme-surface border border-theme-border hover:bg-theme-bg hover:text-theme-primary text-theme-muted rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
                  title={filteredReviewQuestions.every(q => expandedIds.includes(q.id)) ? "Collapse All MCQs" : "Expand All MCQs"}
                >
                  <ChevronsUpDown size={14} />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Exam Mock Hub - Fully Screen Responsive grid flex */
        <div className="flex-1 bg-theme-surface/50 border border-theme-border rounded-2xl shadow-inner p-5 md:p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8">
            <div className="w-full space-y-6">
                <div className="bg-theme-bg border border-theme-border p-5 md:p-6 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold text-theme-text mb-5">Create New Exam</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-theme-muted mb-2">Exam Name</label>
                            <input type="text" value={newExamName} onChange={e => setNewExamName(e.target.value)} placeholder="e.g. SSC CGL Mock 2026" className="w-full bg-theme-surface border border-theme-border rounded-xl px-4 py-3 focus:border-theme-primary outline-none text-theme-text font-semibold text-sm" />
                        </div>
                        
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-black uppercase tracking-wider text-theme-muted">Select Categories & Weights</label>
                                {selectedExamCats.length > 0 && (
                                    <div className="text-[11px] font-bold text-theme-muted">
                                        Remaining: <span className={`font-black ${categoryRemaining < 0 ? 'text-rose-500' : 'text-theme-primary'}`}>{categoryRemaining}%</span>
                                        {categoryUnspecified > 0 && (
                                            <span className="opacity-80 ml-1.5">
                                                ({categoryUnspecified} auto-distributed @ ~{Math.max(0, categoryAutoDist)}% each)
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="border border-theme-border rounded-xl p-3 bg-theme-surface grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {categories.map(cat => {
                                const sel = selectedExamCats.find(c => c.id === cat.id);
                                return (
                                <div key={cat.id} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${sel ? 'bg-theme-primary/10 border border-theme-primary/20' : 'hover:bg-theme-bg border border-transparent'}`}>
                                    <input type="checkbox" checked={!!sel} onChange={() => toggleExamCat(cat.id)} className="w-4 h-4 rounded border-theme-border accent-theme-primary" />
                                    <span className="flex-1 font-bold text-xs text-theme-text">{cat.name}</span>
                                    {sel && (
                                    <div className="flex items-center gap-2 bg-theme-bg p-1 rounded-lg border border-theme-border">
                                        <input type="number" min="0" max="100" value={sel.weight} onChange={e => updateExamCatWeight(cat.id, e.target.value)} className="w-12 bg-theme-surface border border-theme-border rounded px-1.5 py-0.5 text-center text-xs text-theme-text focus:border-theme-primary outline-none font-bold" />
                                        <span className="text-[10px] font-bold text-theme-muted">%</span>
                                    </div>
                                    )}
                                </div>
                                );
                            })}
                            </div>
                            <p className="text-[10px] text-theme-muted flex items-center gap-1 mt-2"><AlertCircle size={12} /> Leave weights at 0% for automatic average distribution.</p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-black uppercase tracking-wider text-theme-muted">Difficulty Inclusion</label>
                                {activeDifficulties.length > 0 && (
                                    <div className="text-[11px] font-bold text-theme-muted">
                                        Remaining: <span className={`font-black ${difficultyRemaining < 0 ? 'text-rose-500' : 'text-theme-primary'}`}>{difficultyRemaining}%</span>
                                        {difficultyUnspecified > 0 && (
                                            <span className="opacity-80 ml-1.5">
                                                ({difficultyUnspecified} auto-distributed @ ~{Math.max(0, difficultyAutoDist)}% each)
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="border border-theme-border rounded-xl p-3 bg-theme-surface grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {['easy', 'medium', 'hard'].map(diff => {
                                const item = selectedExamDifficulties[diff];
                                const isSel = item?.selected;
                                return (
                                <div key={diff} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${isSel ? (diff==='hard'?'bg-rose-500/10 border border-rose-500/20':diff==='medium'?'bg-blue-500/10 border border-blue-500/20':'bg-emerald-500/10 border border-emerald-500/20') : 'hover:bg-theme-bg border border-transparent'}`}>
                                    <input type="checkbox" checked={isSel} onChange={() => toggleDifficulty(diff)} className="w-4 h-4 rounded border-theme-border accent-theme-primary" />
                                    <div className={`w-2.5 h-2.5 rounded-full ${diff==='hard'?'bg-rose-500':diff==='medium'?'bg-blue-500':'bg-emerald-500'}`} />
                                    <span className="flex-1 font-bold text-xs text-theme-text capitalize">{diff}</span>
                                    {isSel && (
                                    <div className="flex items-center gap-2 bg-theme-bg p-1 rounded-lg border border-theme-border">
                                        <input type="number" min="0" max="100" value={item.weight} onChange={e => updateDifficultyWeight(diff, e.target.value)} className="w-12 bg-theme-surface border border-theme-border rounded px-1.5 py-0.5 text-center text-xs text-theme-text focus:border-theme-primary outline-none font-bold" />
                                        <span className="text-[10px] font-bold text-theme-muted">%</span>
                                    </div>
                                    )}
                                </div>
                                );
                            })}
                            </div>
                            <p className="text-[10px] text-theme-muted flex items-center gap-1 mt-2"><AlertCircle size={12} /> Leave weights at 0% for automatic average distribution.</p>
                        </div>

                        <button onClick={handleSaveExam} className="w-full bg-theme-primary hover:bg-theme-primary/95 text-white py-3 mt-2 rounded-xl font-bold text-sm transition-colors shadow-md active:scale-95">Create Exam Mock Mapping</button>
                    </div>
                </div>
            </div>
            
            <div className="w-full space-y-4 pt-6 border-t border-theme-border/60">
                <h3 className="font-black text-sm text-theme-muted flex items-center gap-2 uppercase tracking-wider"><Database size={16}/> Existing Exams</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exams.length === 0 ? (
                    <p className="text-xs text-theme-muted text-center py-8 bg-theme-bg rounded-2xl border border-theme-border border-dashed font-semibold">No exams created yet.</p>
                    ) : exams.map(exam => (
                    <div key={exam.id} className="bg-theme-bg border border-theme-border p-4 rounded-xl flex flex-col gap-2 relative group">
                        <button onClick={() => handleDeleteExam(exam.id)} className="absolute top-3.5 right-3.5 text-theme-muted hover:text-amber-500 hover:bg-amber-500/10 p-1.5 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100" title="Unpublish exam"><Trash2 size={14} /></button>
                        <div>
                        <h5 className="font-bold text-theme-text text-sm pr-8 leading-tight">{exam.name}</h5>
                        {(exam.status === 'hidden' || exam.status === 'unpublished') && (
                          <span className="inline-flex mt-1 text-[8px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Hidden</span>
                        )}
                        <div className="flex flex-wrap gap-2 mt-1.5 text-[9px] font-bold text-theme-muted">
                            {Object.entries(exam.difficulties || {}).map(([d, w]) => (
                                <span key={d} className="flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${d==='hard'?'bg-rose-500':d==='medium'?'bg-blue-500':'bg-emerald-500'}`} />
                                    <span className="capitalize">{d} ({Math.round(w * 100)}%)</span>
                                </span>
                            ))}
                        </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                        {exam.categories.map(c => (
                            <span key={c.id} className="text-[10px] font-bold bg-theme-surface border border-theme-border px-2 py-0.5 rounded-md text-theme-text flex items-center gap-1">
                            {categories.find(cat => cat.id === c.id)?.name || c.id} <span className="text-theme-primary">({c.weight}%)</span>
                            </span>
                        ))}
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        </div>
        )}
      </main>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-theme-surface border border-theme-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-theme-border bg-theme-bg/50 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-theme-surface shadow-inner">
                <Database size={28} />
              </div>
              <h3 className="font-bold text-2xl mb-1 text-theme-text">Confirm Push</h3>
              <p className="text-theme-muted text-sm">You are about to push to Supabase.</p>
            </div>
            
            <div className="p-6 bg-theme-bg space-y-4">
              <div className="flex justify-between items-center p-4 bg-theme-surface border border-theme-border rounded-xl">
                <span className="text-theme-muted font-medium text-sm">Category</span>
                <span className="font-bold text-theme-text text-sm">{categories.find(c => c.id === selectedCategory)?.name}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-theme-surface border border-theme-border rounded-xl">
                <span className="text-theme-muted font-medium text-sm">Total MCQs Parsed</span>
                <span className="font-bold text-emerald-500 text-lg">{parsedMCQs.length}</span>
              </div>
            </div>

            <div className="p-6 border-t border-theme-border flex gap-3 bg-theme-surface">
              <button onClick={() => setShowPreviewModal(false)} className="flex-1 py-3 px-4 rounded-xl font-bold text-theme-text bg-theme-bg border border-theme-border text-sm" disabled={isUploading}>Cancel</button>
              <button onClick={handlePushToSupabase} disabled={isUploading} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center gap-2 text-sm">
                {isUploading ? 'Pushing...' : 'Confirm Push'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal - Workspace Mode Switcher */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-theme-surface border border-theme-border rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-theme-border bg-theme-bg/50">
              <h3 className="font-black text-xl text-theme-text flex items-center gap-2 tracking-tight uppercase"><Settings size={22} className="text-theme-primary" /> Workspace Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="p-1 rounded-lg hover:bg-theme-surface text-theme-muted hover:text-theme-text"><X size={20} /></button>
            </div>
            
            <div className="p-6 bg-theme-bg space-y-6">
               <div className="bg-theme-surface border border-theme-border rounded-2xl p-6 shadow-inner">
                  <div className="text-center mb-6">
                    <h4 className="font-black text-lg text-theme-text uppercase tracking-tight mb-1">Switch Workspace Mode</h4>
                    <p className="text-theme-muted text-xs font-semibold">Toggle between writing MCQs and mapping Exam Mocks.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => { setActiveMode('write'); setShowSettingsModal(false); }}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all group ${activeMode === 'write' ? 'border-theme-primary bg-theme-primary/5 shadow-md' : 'border-theme-border hover:border-theme-primary/30 hover:bg-theme-bg/55'}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 group-hover:rotate-6 ${activeMode === 'write' ? 'bg-theme-primary text-white shadow-sm' : 'bg-theme-border text-theme-muted'}`}>
                        <Edit3 size={18} />
                      </div>
                      <div className="text-center">
                        <span className={`block font-black text-xs ${activeMode === 'write' ? 'text-theme-text' : 'text-theme-muted'}`}>Write</span>
                        <span className="text-[7px] uppercase tracking-widest text-theme-muted font-bold mt-0.5 opacity-60">Creator</span>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => { setActiveMode('exams'); setShowSettingsModal(false); }}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all group ${activeMode === 'exams' ? 'border-theme-accent bg-theme-accent/5 shadow-md' : 'border-theme-border hover:border-theme-accent/30 hover:bg-theme-bg/55'}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 group-hover:-rotate-6 ${activeMode === 'exams' ? 'bg-theme-accent text-white shadow-sm' : 'bg-theme-border text-theme-muted'}`}>
                        <Layout size={18} />
                      </div>
                      <div className="text-center">
                        <span className={`block font-black text-xs ${activeMode === 'exams' ? 'text-theme-text' : 'text-theme-muted'}`}>Exams</span>
                        <span className="text-[7px] uppercase tracking-widest text-theme-muted font-bold mt-0.5 opacity-60">Mocks</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => { setActiveMode('review'); setShowSettingsModal(false); }}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all group ${activeMode === 'review' ? 'border-purple-500 bg-purple-500/5 shadow-md' : 'border-theme-border hover:border-purple-500/30 hover:bg-theme-bg/55'}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 group-hover:rotate-12 ${activeMode === 'review' ? 'bg-purple-500 text-white shadow-sm' : 'bg-theme-border text-theme-muted'}`}>
                        <FileText size={18} />
                      </div>
                      <div className="text-center">
                        <span className={`block font-black text-xs ${activeMode === 'review' ? 'text-theme-text' : 'text-theme-muted'}`}>Review</span>
                        <span className="text-[7px] uppercase tracking-widest text-theme-muted font-bold mt-0.5 opacity-60">Database</span>
                      </div>
                    </button>
                  </div>
               </div>

               <div className="bg-theme-surface border border-theme-border rounded-2xl p-4 shadow-inner">
                  <input
                    ref={backupImportRef}
                    type="file"
                    accept="application/json,application/zip,.json,.zip"
                    onChange={handleBackupFileSelected}
                    className="hidden"
                  />

                  <button
                    onClick={handleTriggerManualSync}
                    disabled={syncLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-3 rounded-xl bg-theme-primary hover:opacity-90 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-60"
                  >
                    <RefreshCw size={16} className={syncLoading ? 'animate-spin' : ''} />
                    {syncLoading ? 'Syncing...' : 'Syncer'}
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleBulkExportBackup}
                      disabled={backupLoading}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-theme-bg hover:bg-theme-surface-hover border border-theme-border text-theme-text text-xs font-black uppercase tracking-wider transition-all disabled:opacity-60"
                    >
                      <Download size={16} /> Bulk Export
                    </button>
                    <button
                      onClick={() => backupImportRef.current?.click()}
                      disabled={backupLoading}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-60"
                    >
                      <Upload size={16} /> Bulk Import
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Prompt Modal */}
      {showAiGenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="font-black text-lg text-theme-text flex items-center gap-2 uppercase tracking-tight">
              <Sparkles size={18} className="text-amber-500" /> AI MCQ Generator
            </h3>
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-theme-muted">Prompt or Topic Details</label>
              <textarea
                value={aiGenPrompt}
                onChange={(e) => setAiGenPrompt(e.target.value)}
                placeholder="e.g. Fundamental Rights under Article 21 of the Indian Constitution..."
                className="w-full h-24 bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-semibold outline-none focus:border-theme-primary text-theme-text resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAiGenModal(false)} className="flex-1 py-2.5 bg-theme-bg border border-theme-border rounded-xl text-xs font-bold text-theme-muted hover:text-theme-text">Cancel</button>
              <button onClick={handleAIGenerateMCQ} className="flex-1 py-2.5 bg-theme-primary text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90">Draft MCQ</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Document to MCQ Modal */}
      {showAiDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="font-black text-lg text-theme-text flex items-center gap-2 uppercase tracking-tight">
              <FileText size={18} className="text-amber-500" /> Document to MCQs Generator
            </h3>
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-theme-muted">Paste Document / Article Text</label>
              <textarea
                value={aiDocText}
                onChange={(e) => setAiDocText(e.target.value)}
                placeholder="Paste news articles, textbook chapters, or current affairs notes here to generate multiple MCQs..."
                className="w-full h-48 bg-theme-bg border border-theme-border rounded-xl p-3 text-xs font-semibold outline-none focus:border-theme-primary text-theme-text resize-none custom-scrollbar"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-theme-muted">MCQ Count</label>
              <input
                type="number"
                min="1"
                max="30"
                value={aiDocCount}
                onChange={(e) => setAiDocCount(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-theme-primary text-theme-text"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAiDocModal(false)} className="flex-1 py-2.5 bg-theme-bg border border-theme-border rounded-xl text-xs font-bold text-theme-muted hover:text-theme-text">Cancel</button>
              <button onClick={handleAIDocToMCQs} className="flex-1 py-2.5 bg-theme-primary text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90">Generate MCQs</button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish Exam Passcode Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-theme-surface border border-theme-border rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-theme-border bg-theme-bg/50">
              <h3 className="font-black text-xl text-theme-text flex items-center gap-2 tracking-tight uppercase"><Trash2 size={22} className="text-amber-500" /> Unpublish Exam</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 rounded-lg hover:bg-theme-surface text-theme-muted hover:text-theme-text"><X size={20} /></button>
            </div>
            
            <div className="p-6 bg-theme-bg space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <div className="text-xs font-semibold">
                  This will hide the exam from the app without deleting it from Supabase. A super admin can publish it again from the database.
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-theme-muted">Admin Passcode</label>
                <input
                  type="password"
                  value={deletePasscodeAttempt}
                  onChange={(e) => {
                    setDeletePasscodeAttempt(e.target.value);
                    setDeletePasscodeError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmDeleteExam();
                  }}
                  placeholder="••••••••"
                  className={`w-full bg-theme-surface border ${deletePasscodeError ? 'border-red-500' : 'border-theme-border'} rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-theme-primary text-theme-text`}
                  autoFocus
                />
                {deletePasscodeError && (
                  <p className="text-[10px] font-bold text-red-500 mt-1">Admin account and passcode verification failed. Please try again.</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-theme-border flex gap-3 bg-theme-surface">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="flex-1 py-3 px-4 rounded-xl font-bold text-theme-text bg-theme-bg border border-theme-border text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteExam} 
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 flex items-center justify-center gap-2 text-sm"
              >
                Unpublish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
