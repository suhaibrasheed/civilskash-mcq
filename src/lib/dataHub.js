import { getAllOfflineQuestions } from './db';
import { supabase, isSupabaseConfigured } from './supabase';
import { EXAM_SERIES } from './exams';
import { Compass } from 'lucide-react';
import { CATEGORY_LOADERS } from '../question_bank/registry';
import staticExams from '../question_bank/exams.json';

// Combined static banks — populated asynchronously in the background
export const ALL_STATIC_BANKS_SYNC = [];
export const DYNAMIC_EXAMS = [];

const normalizeSupabaseQuestion = (question) => ({
  id: question.id,
  category_id: question.category_id || 'general',
  tags: Array.isArray(question.tags) ? question.tags : [],
  difficulty: question.difficulty || null,
  question: question.question,
  correctId: question.correct_id || question.correctId || 'a',
  options: Array.isArray(question.options) ? question.options : [],
  explanation: question.explanation || '',
  pyq: question.pyq || null,
});

/**
 * Returns empty array as questions are now compiled at build-time.
 */
const fetchDynamicBank = async (categoryId = null) => {
  return [];
};

/**
 * Load a category dynamic chunk into memory if it hasn't been loaded.
 */
export const ensureCategoryLoaded = async (categoryId) => {
  const loader = CATEGORY_LOADERS[categoryId];
  if (loader) {
    try {
      const module = await loader();
      const questions = module.default || module;
      questions.forEach(q => {
        if (!ALL_STATIC_BANKS_SYNC.some(existing => existing.id === q.id)) {
          ALL_STATIC_BANKS_SYNC.push(normalizeSupabaseQuestion({
            ...q,
            category_id: q.category_id || categoryId
          }));
        }
      });
    } catch (err) {
      console.error(`Failed to dynamic import question bank category "${categoryId}":`, err);
    }
  }
};

/**
 * Background loader to fetch all categories into memory after startup.
 */
export const loadStaticQuestionsInBackground = async () => {
  const categories = Object.keys(CATEGORY_LOADERS);
  categories.forEach(async (catId) => {
    await ensureCategoryLoaded(catId);
  });
};

export const getHybridContentHub = async (requestedCategoryId, tagFilter = null) => {
  // Ensure the requested category is loaded on-demand
  await ensureCategoryLoaded(requestedCategoryId);

  // 1. Process data with general fallbacks (dynamic is always empty now)
  const processedStatic = ALL_STATIC_BANKS_SYNC.map(q => ({
    ...q,
    category_id: q.category_id || "general"
  }));

  // 2. Strict Isolation by Category
  let result = processedStatic.filter(q => q.category_id === requestedCategoryId);

  // 3. Optional tag filter (for tag-based practice pages)
  if (tagFilter) {
    const normalizedTag = tagFilter.toLowerCase();
    result = result.filter(q =>
      Array.isArray(q.tags) && q.tags.some(t => t.toLowerCase() === normalizedTag)
    );
  }

  return result;
};

/**
 * Returns real MCQ count for a single category.
 */
export const getCategoryQuestionCount = (categoryId) => {
  return ALL_STATIC_BANKS_SYNC.filter(q => q.category_id === categoryId).length;
};

/**
 * Returns a map of { categoryId: count } for ALL categories.
 */
export const getAllCategoryCounts = () => {
  const counts = {};
  ALL_STATIC_BANKS_SYNC.forEach(q => {
    const cat = q.category_id || 'general';
    counts[cat] = (counts[cat] || 0) + 1;
  });
  return counts;
};

export const getAllQuestions = async () => {
  return ALL_STATIC_BANKS_SYNC;
};

/**
 * Loads all offline questions from IndexedDB, triggers background static question downloads,
 * and registers compiled exams synchronously.
 */
export const loadOfflineQuestionsIntoSyncBank = async () => {
  try {
    const offlineQuestions = await getAllOfflineQuestions();
    offlineQuestions.forEach(q => {
      if (!ALL_STATIC_BANKS_SYNC.some(existing => existing.id === q.id)) {
        ALL_STATIC_BANKS_SYNC.push(q);
      }
    });

    // Load static exams synchronously on boot (instant config)
    await loadSupabaseExamsIntoSyncBank();

    // Trigger dynamic asset imports asynchronously in background
    loadStaticQuestionsInBackground();
  } catch (err) {
    console.error("Failed to load offline questions into sync bank:", err);
  }
};

/**
 * No-op stub since questions are pre-compiled at build-time.
 */
export const loadSupabaseQuestionsIntoSyncBank = async () => {
  return 0;
};

/**
 * Loads all exams from the statically compiled exams JSON file.
 */
export const loadSupabaseExamsIntoSyncBank = async () => {
  try {
    const visibleExams = (staticExams || []).filter(
      exam => exam.status !== 'hidden' && exam.status !== 'unpublished'
    );
    
    DYNAMIC_EXAMS.length = 0;
    visibleExams.forEach(exam => {
      DYNAMIC_EXAMS.push(exam);
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
    return visibleExams.length;
  } catch (err) {
    console.error("Failed to load static exams into sync bank:", err);
  }
  return 0;
};
