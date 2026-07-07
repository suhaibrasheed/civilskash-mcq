/**
 * mockEngine.js
 * ─────────────────────────────────────────────────────────────────
 * Generates Elite, Quick, and Sectional mocks with:
 *   • Seeded PRNG  → Cross-exam uniqueness (same seed = same shuffle every time)
 *   • Weighted pulls → Quick mocks respect each exam's syllabus weight percentages
 *   • Smart naming → Dominant-tag naming for sectional mocks
 * ─────────────────────────────────────────────────────────────────
 */

import { ALL_STATIC_BANKS_SYNC, DYNAMIC_EXAMS } from './dataHub';

// ─── Seeded PRNG (Mulberry32) ────────────────────────────────────
// Given an integer seed, returns a deterministic random float [0, 1).
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert an exam_id string to a stable integer seed
function examIdToSeed(examId) {
  let hash = 5381;
  for (let i = 0; i < examId.length; i++) {
    hash = ((hash << 5) + hash) ^ examId.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash;
}

// Fisher-Yates shuffle using our PRNG
function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const getQuestionPyq = (q) => {
  if (q.pyq) return q.pyq;
  if (Array.isArray(q.tags)) {
    const legacy = q.tags.find(t => typeof t === 'string' && t.startsWith('PYQ: '));
    if (legacy) return legacy.replace('PYQ: ', '');
  }
  return null;
};

// ─── Exam Configuration Map ──────────────────────────────────────
// weights: [{ categoryId, fraction }]  must sum to 1.0
// categories: list of category_ids to show as filter tabs
export const EXAM_CONFIG = {
  'upsc-pre': {
    label: 'UPSC Pre',
    fullName: 'UPSC Prelims Series',
    categories: [
      'indian-polity',
      'indian-economy',
      'environment',
      'current-affairs',
      'modern-history',
      'ancient-history',
      'general-science',
      'indian-geography',
      'physical-geography',
      'world-geography',
      'medieval-history',
      'art-culture'
    ],
    weights: [
      { categoryId: 'indian-polity', fraction: 0.14 },
      { categoryId: 'indian-economy', fraction: 0.14 },
      { categoryId: 'environment', fraction: 0.12 },
      { categoryId: 'current-affairs', fraction: 0.10 },
      { categoryId: 'modern-history', fraction: 0.08 },
      { categoryId: 'ancient-history', fraction: 0.06 },
      { categoryId: 'general-science', fraction: 0.11 },
      { categoryId: 'indian-geography', fraction: 0.07 },
      { categoryId: 'physical-geography', fraction: 0.07 },
      { categoryId: 'world-geography', fraction: 0.04 },
      { categoryId: 'medieval-history', fraction: 0.03 },
      { categoryId: 'art-culture', fraction: 0.04 }
    ],
    categoryLabels: {
      'indian-polity': 'Polity',
      'indian-economy': 'Economy',
      'environment': 'Environment',
      'current-affairs': 'Current Affairs',
      'modern-history': 'Modern History',
      'ancient-history': 'Ancient History',
      'general-science': 'Science & Tech',
      'indian-geography': 'Indian Geography',
      'physical-geography': 'Physical Geography',
      'world-geography': 'World Geography',
      'medieval-history': 'Medieval History',
      'art-culture': 'Art & Culture'
    },
    difficultyWeights: { easy: 0.15, medium: 0.35, hard: 0.50 }
  },
  'ssc-cgl': {
    label: 'SSC CGL',
    fullName: 'SSC CGL Tier 1 Mock Series',
    categories: [
      'english',
      'maths',
      'reasoning',
      'current-affairs',
      'static-gk',
      'general-science',
      'modern-history',
      'indian-polity',
      'indian-geography',
      'indian-economy'
    ],
    weights: [
      { categoryId: 'english', fraction: 0.25 },
      { categoryId: 'maths', fraction: 0.25 },
      { categoryId: 'reasoning', fraction: 0.25 },
      { categoryId: 'current-affairs', fraction: 0.08 },
      { categoryId: 'static-gk', fraction: 0.05 },
      { categoryId: 'general-science', fraction: 0.04 },
      { categoryId: 'modern-history', fraction: 0.03 },
      { categoryId: 'indian-polity', fraction: 0.02 },
      { categoryId: 'indian-geography', fraction: 0.02 },
      { categoryId: 'indian-economy', fraction: 0.01 }
    ],
    categoryLabels: {
      'english': 'English',
      'maths': 'Maths',
      'reasoning': 'Reasoning',
      'current-affairs': 'Current Affairs',
      'static-gk': 'Static GK',
      'general-science': 'Science & Tech',
      'modern-history': 'Modern History',
      'indian-polity': 'Polity',
      'indian-geography': 'Indian Geography',
      'indian-economy': 'Economy'
    },
    difficultyWeights: { easy: 0.45, medium: 0.45, hard: 0.10 }
  },
  'state-pcs': {
    label: 'State PSC',
    fullName: 'State PSC Prelims Series',
    categories: [
      'indian-polity',
      'modern-history',
      'indian-economy',
      'current-affairs',
      'ancient-history',
      'environment',
      'general-science',
      'indian-geography',
      'physical-geography',
      'world-geography',
      'medieval-history'
    ],
    weights: [
      { categoryId: 'indian-polity', fraction: 0.15 },
      { categoryId: 'modern-history', fraction: 0.13 },
      { categoryId: 'indian-economy', fraction: 0.10 },
      { categoryId: 'current-affairs', fraction: 0.10 },
      { categoryId: 'ancient-history', fraction: 0.10 },
      { categoryId: 'environment', fraction: 0.08 },
      { categoryId: 'general-science', fraction: 0.09 },
      { categoryId: 'indian-geography', fraction: 0.09 },
      { categoryId: 'physical-geography', fraction: 0.06 },
      { categoryId: 'world-geography', fraction: 0.04 },
      { categoryId: 'medieval-history', fraction: 0.06 }
    ],
    categoryLabels: {
      'indian-polity': 'Polity',
      'modern-history': 'Modern History',
      'indian-economy': 'Economy',
      'current-affairs': 'Current Affairs',
      'ancient-history': 'Ancient History',
      'environment': 'Environment',
      'general-science': 'Science & Tech',
      'indian-geography': 'Indian Geography',
      'physical-geography': 'Physical Geography',
      'world-geography': 'World Geography',
      'medieval-history': 'Medieval History'
    },
    difficultyWeights: { easy: 0.30, medium: 0.45, hard: 0.25 }
  }
};


// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Detect dominant tag in an array of questions.
 * A tag is "dominant" when ≥5 out of 10 questions carry it.
 * This intentionally skips internal/meta tags (e.g. '#pro').
 */
function getDominantTag(questions) {
  const tagCount = {};
  questions.forEach(q => {
    (q.tags || []).forEach(t => {
      if (!t || t.toLowerCase() === '#pro') return;
      tagCount[t] = (tagCount[t] || 0) + 1;
    });
  });
  const sorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1]);
  // ≥5 out of 10 questions share a tag → dominant
  if (sorted.length > 0 && sorted[0][1] >= 5) return sorted[0][0];
  return null;
}

/** Round weights to integers summing exactly to 10 (Hamilton's method) */
function roundWeightsTo10(weights) {
  const raw = weights.map(w => ({ ...w, raw: w.fraction * 10 }));
  const floored = raw.map(w => ({ ...w, count: Math.floor(w.raw) }));
  let remainder = 10 - floored.reduce((s, w) => s + w.count, 0);
  const ranked = [...floored]
    .map((w, i) => ({ ...w, frac: w.raw - w.count, i }))
    .sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remainder; i++) ranked[i].count += 1;
  // Restore original order
  const result = new Array(floored.length);
  ranked.forEach(w => (result[w.i] = w.count));
  return result;
}

/** Allocates total question slots to categories probabilistically using PRNG */
function allocateCategorySlots(weights, total, rng) {
  const targetCounts = weights.map(w => ({
    categoryId: w.categoryId,
    fraction: w.fraction,
    target: w.fraction * total,
    floor: Math.floor(w.fraction * total)
  }));

  const floorSum = targetCounts.reduce((sum, item) => sum + item.floor, 0);
  let remainingSlots = total - floorSum;

  const results = {};
  targetCounts.forEach(item => {
    results[item.categoryId] = item.floor;
  });

  if (remainingSlots > 0) {
    const candidates = targetCounts
      .map(item => ({
        categoryId: item.categoryId,
        remainder: item.target - item.floor
      }))
      .filter(item => item.remainder > 0);

    while (remainingSlots > 0 && candidates.length > 0) {
      const totalRemainder = candidates.reduce((sum, c) => sum + c.remainder, 0);
      if (totalRemainder === 0) break;
      const pick = rng() * totalRemainder;
      let cumSum = 0;
      let selectedIndex = 0;
      for (let i = 0; i < candidates.length; i++) {
        cumSum += candidates[i].remainder;
        if (pick <= cumSum) {
          selectedIndex = i;
          break;
        }
      }
      const selected = candidates[selectedIndex];
      results[selected.categoryId] = (results[selected.categoryId] || 0) + 1;
      candidates.splice(selectedIndex, 1);
      remainingSlots--;
    }

    let idx = 0;
    while (remainingSlots > 0 && targetCounts.length > 0) {
      const catId = targetCounts[idx % targetCounts.length].categoryId;
      results[catId] = (results[catId] || 0) + 1;
      idx++;
      remainingSlots--;
    }
  }

  return results;
}

// ─── Main Generators ─────────────────────────────────────────────

/**
 * generateMocksForExam(examId)
 * Returns:
 *   { eliteMocks, quickMocks, sectionalMocks: { [categoryId]: mock[] } }
 *
 * All arrays are deterministic for the same examId.
 */
export function generateMocksForExam(examId) {
  // 1. Dynamic registration of Supabase-loaded exams
  if (DYNAMIC_EXAMS && Array.isArray(DYNAMIC_EXAMS)) {
    DYNAMIC_EXAMS.forEach(exam => {
      if (!EXAM_CONFIG[exam.id]) {
        EXAM_CONFIG[exam.id] = {
          label: exam.name,
          fullName: `${exam.name} Series`,
          categories: exam.categories.map(c => c.id),
          weights: exam.categories.map(c => ({ categoryId: c.id, fraction: c.weight / 100 })),
          categoryLabels: Object.fromEntries(exam.categories.map(c => [c.id, c.id.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())])),
          difficultyWeights: exam.difficulties || { easy: 0.33, medium: 0.33, hard: 0.34 }
        };
      }
    });
  }

  const config = EXAM_CONFIG[examId];
  if (!config) return { eliteMocks: [], quickMocks: [], sectionalMocks: {} };

  const seed = examIdToSeed(examId);
  const rng = mulberry32(seed);

  // 2. Setup category pools partitioned by difficulty.
  // Unmarked MCQs are kept separate and sampled at low probability: useful content, lower confidence.
  const poolsByCatDiff = {};
  config.categories.forEach(catId => {
    const catQ = ALL_STATIC_BANKS_SYNC.filter(q => q.category_id === catId);
    const shuffled = seededShuffle(catQ, mulberry32(seed ^ examIdToSeed(catId)));
    poolsByCatDiff[catId] = {
      easy: shuffled.filter(q => q.difficulty === 'easy'),
      medium: shuffled.filter(q => q.difficulty === 'medium'),
      hard: shuffled.filter(q => q.difficulty === 'hard'),
      unmarked: shuffled.filter(q => !q.difficulty),
      all: shuffled
    };
  });

  // Flat fallback pool = every question across all categories of this exam.
  const examFallbackPool = config.categories
    .flatMap(cId => poolsByCatDiff[cId]?.all ?? []);

  // Dynamic category weight redistribution
  const activeCats = config.categories.filter(catId => poolsByCatDiff[catId].all.length > 0);
  let adjustedWeights = [];
  if (activeCats.length > 0) {
    const activeWeights = config.weights.filter(w => activeCats.includes(w.categoryId));
    const sumActiveFraction = activeWeights.reduce((sum, w) => sum + w.fraction, 0);
    if (sumActiveFraction > 0) {
      adjustedWeights = activeWeights.map(w => ({
        categoryId: w.categoryId,
        fraction: w.fraction / sumActiveFraction
      }));
    } else {
      adjustedWeights = activeCats.map(catId => ({
        categoryId: catId,
        fraction: 1 / activeCats.length
      }));
    }
  }

  // Difficulty weights helper
  const drawDiff = (difficultyWeights, mockRng) => {
    const weights = { easy: 0.33, medium: 0.33, hard: 0.34, ...(difficultyWeights || {}) };
    const sum = (weights.easy || 0) + (weights.medium || 0) + (weights.hard || 0);
    const unmarkedProbability = 0.06;
    if (mockRng() < unmarkedProbability) return 'unmarked';

    const normalized = {
      easy: (weights.easy || 0) / sum,
      medium: (weights.medium || 0) / sum,
      hard: (weights.hard || 0) / sum
    };
    const pick = mockRng();
    if (pick <= normalized.easy) return 'easy';
    if (pick <= normalized.easy + normalized.medium) return 'medium';
    return 'hard';
  };

  // Helper to select next matching question with fallbacks
  const drawNextQuestion = (catId, targetDiff, easyPtrs, medPtrs, hardPtrs, unmarkedPtrs, genPtrs, usedIds) => {
    const subPools = poolsByCatDiff[catId];
    if (!subPools || subPools.all.length === 0) return null;

    const order = [targetDiff, 'medium', 'easy', 'hard', 'unmarked'].filter((v, i, self) => self.indexOf(v) === i);
    let question = null;

    for (const d of order) {
      const pool = subPools[d];
      if (pool && pool.length > 0) {
        let ptrVal;
        if (d === 'easy') ptrVal = easyPtrs[catId];
        else if (d === 'medium') ptrVal = medPtrs[catId];
        else if (d === 'hard') ptrVal = hardPtrs[catId];
        else if (d === 'unmarked') ptrVal = unmarkedPtrs[catId];

        // Search the pool sequentially for the first question that is NOT in usedIds
        for (let attempt = 0; attempt < pool.length; attempt++) {
          const candidate = pool[(ptrVal + attempt) % pool.length];
          if (!usedIds.has(candidate.id)) {
            question = candidate;
            const nextPtr = ptrVal + attempt + 1;
            if (d === 'easy') easyPtrs[catId] = nextPtr;
            else if (d === 'medium') medPtrs[catId] = nextPtr;
            else if (d === 'hard') hardPtrs[catId] = nextPtr;
            else if (d === 'unmarked') unmarkedPtrs[catId] = nextPtr;
            break;
          }
        }
        if (question) break;
      }
    }

    if (!question) {
      const pool = subPools.all;
      if (pool && pool.length > 0) {
        const ptrVal = genPtrs[catId];
        for (let attempt = 0; attempt < pool.length; attempt++) {
          const candidate = pool[(ptrVal + attempt) % pool.length];
          if (!usedIds.has(candidate.id)) {
            question = candidate;
            genPtrs[catId] = ptrVal + attempt + 1;
            break;
          }
        }
      }
    }

    return question;
  };

  // ── Elite Full-Length Mocks (10 free Full + 30 Elite Pro mocks) ──────────────
  const ELITE_COUNT = 40;
  const ELITE_Q = 100;

  const eliteEasyPtrs = {};
  const eliteMedPtrs = {};
  const eliteHardPtrs = {};
  const eliteUnmarkedPtrs = {};
  const eliteGenPtrs = {};
  config.categories.forEach(catId => {
    eliteEasyPtrs[catId] = 0;
    eliteMedPtrs[catId] = 0;
    eliteHardPtrs[catId] = 0;
    eliteUnmarkedPtrs[catId] = 0;
    eliteGenPtrs[catId] = 0;
  });

  const eliteMocks = Array.from({ length: ELITE_COUNT }, (_, mockIdx) => {
    const qs = [];
    const usedIds = new Set();
    if (adjustedWeights.length > 0) {
      const mockRng = mulberry32(seed ^ (mockIdx + 5000));
      const counts = allocateCategorySlots(adjustedWeights, ELITE_Q, mockRng);

      adjustedWeights.forEach(w => {
        const catId = w.categoryId;
        const take = counts[catId] || 0;
        for (let i = 0; i < take; i++) {
          const targetDiff = drawDiff(config.difficultyWeights, mockRng);
          const q = drawNextQuestion(catId, targetDiff, eliteEasyPtrs, eliteMedPtrs, eliteHardPtrs, eliteUnmarkedPtrs, eliteGenPtrs, usedIds);
          if (q) {
            qs.push(q);
            usedIds.add(q.id);
          }
        }
      });
    }

    // Pad Elite Mock with unique questions from fallback pool if category slots were depleted
    if (qs.length < ELITE_Q) {
      const padSeed = (seed ^ (mockIdx + 5000)) ^ 0xCAFEBABE;
      const padPool = seededShuffle(examFallbackPool, mulberry32(padSeed));
      for (const q of padPool) {
        if (qs.length >= ELITE_Q) break;
        if (!usedIds.has(q.id)) {
          qs.push(q);
          usedIds.add(q.id);
        }
      }
    }

    const isFree = mockIdx < 10;
    const displayName = isFree ? `Full Mock ${mockIdx + 1}` : `Elite Mock ${mockIdx - 9}`;

    const shuffleSeed = seed ^ (mockIdx + 99999);
    const shuffledQs = seededShuffle(qs, mulberry32(shuffleSeed));

    return {
      id: `${examId}-elite-${mockIdx + 1}`,
      index: mockIdx + 1,
      title: `${config.label} ${displayName}`,
      questions: shuffledQs.length,
      minutes: shuffledQs.length,
      type: 'elite',
      questionData: shuffledQs,
      isEmpty: shuffledQs.length === 0,
    };
  });

  // ── Quick Mocks (150 × 10 questions, weighted) ─────────────────
  const QUICK_COUNT = 150;
  const QUICK_Q = 10;

  const quickEasyPtrs = {};
  const quickMedPtrs = {};
  const quickHardPtrs = {};
  const quickUnmarkedPtrs = {};
  const quickGenPtrs = {};
  config.categories.forEach(catId => {
    quickEasyPtrs[catId] = 0;
    quickMedPtrs[catId] = 0;
    quickHardPtrs[catId] = 0;
    quickUnmarkedPtrs[catId] = 0;
    quickGenPtrs[catId] = 0;
  });

  const quickMocks = Array.from({ length: QUICK_COUNT }, (_, mockIdx) => {
    const qs = [];
    const usedIds = new Set();
    if (adjustedWeights.length > 0) {
      const mockRng = mulberry32(seed ^ mockIdx);
      const counts = allocateCategorySlots(adjustedWeights, QUICK_Q, mockRng);

      adjustedWeights.forEach(w => {
        const catId = w.categoryId;
        const take = counts[catId] || 0;
        for (let i = 0; i < take; i++) {
          const targetDiff = drawDiff(config.difficultyWeights, mockRng);
          const q = drawNextQuestion(catId, targetDiff, quickEasyPtrs, quickMedPtrs, quickHardPtrs, quickUnmarkedPtrs, quickGenPtrs, usedIds);
          if (q) {
            qs.push(q);
            usedIds.add(q.id);
          }
        }
      });
    }

    // Pad Quick Mock with unique questions from fallback pool if category slots were depleted
    if (qs.length < QUICK_Q) {
      const padSeed = (seed ^ mockIdx) ^ 0xCAFEBABE;
      const padPool = seededShuffle(examFallbackPool, mulberry32(padSeed));
      for (const q of padPool) {
        if (qs.length >= QUICK_Q) break;
        if (!usedIds.has(q.id)) {
          qs.push(q);
          usedIds.add(q.id);
        }
      }
    }

    const shuffleSeed = seed ^ (mockIdx + 88888);
    const shuffledQs = seededShuffle(qs, mulberry32(shuffleSeed));

    return {
      id: `${examId}-quick-${mockIdx + 1}`,
      index: mockIdx + 1,
      title: `${config.label} Quick Mock ${mockIdx + 1}`,
      questions: shuffledQs.length,
      minutes: shuffledQs.length,
      type: 'quick',
      questionData: shuffledQs,
      isEmpty: shuffledQs.length === 0,
    };
  });

  // ── Sectional Mocks (50 per category × 10 questions) ─────────
  //
  // Algorithm:
  //  For each mock slot i, generate an independent seeded shuffle of the
  //  category pool using a unique seed (examSeed ⊕ catSeed ⊕ mockIndex×prime).
  //  Taking the first 10 from each fresh shuffle gives maximum variety while
  //  staying fully deterministic.
  //
  //  Padding guarantee: if the category pool has fewer than 10 questions,
  //  we pad from a cross-category fallback pool (all questions in the exam,
  //  minus the ones already chosen) using a secondary shuffle. This ensures
  //  every single mock always contains exactly 10 questions.
  //
  //  Naming: clean, simple "[Category] [Exam] Mock N" — no tag logic.
  //
  const SECT_COUNT = 90;
  const SECT_Q     = 10;
  const sectionalMocks = {};

  config.categories.forEach(catId => {
    const catPool = poolsByCatDiff[catId].all;
    const label   = config.categoryLabels?.[catId] || catId;
    const mocks   = [];

    for (let i = 0; i < SECT_COUNT; i++) {
      // Each mock gets its own independent shuffle so every mock is unique.
      // The prime multiplier (31337) spreads seeds well across mock indices.
      const mockSeed = seed ^ examIdToSeed(catId) ^ (i * 31337);
      const shuffled = seededShuffle(catPool, mulberry32(mockSeed));

      const qs      = shuffled.slice(0, Math.min(SECT_Q, shuffled.length));
      const usedIds = new Set(qs.map(q => q.id));

      // ── Padding: reach exactly SECT_Q even when category pool is tiny ──
      if (qs.length < SECT_Q) {
        // Shuffle the exam-wide fallback with a distinct sub-seed
        const padSeed    = mockSeed ^ 0xCAFEBABE;
        const padPool    = seededShuffle(examFallbackPool, mulberry32(padSeed));
        for (const q of padPool) {
          if (qs.length >= SECT_Q) break;
          if (!usedIds.has(q.id)) {
            qs.push(q);
            usedIds.add(q.id);
          }
        }
      }

      const finalQs = seededShuffle(qs, mulberry32(mockSeed ^ 0xFEEDFACE));

      mocks.push({
        id:           `${examId}-sect-${catId}-${i + 1}`,
        index:        i + 1,
        title:        `${label} ${config.label} Mock ${i + 1}`,
        questions:    finalQs.length,
        minutes:      10,
        type:         'sectional',
        categoryId:   catId,
        questionData: finalQs,
        isEmpty:      finalQs.length === 0,
      });
    }
    sectionalMocks[catId] = mocks;
  });

  // ── PYQ Masterclass Mocks (Grouped by Year, 10Q each) ────────
  const pyqMocks = {};
  const normalizedExamName = config.label.toLowerCase().replace(/-/g, ' ');
  
  const allPyqForExam = ALL_STATIC_BANKS_SYNC.filter(q => {
    const pyq = getQuestionPyq(q);
    if (!pyq) return false;
    return pyq.toLowerCase().includes(normalizedExamName);
  });

  const pyqByYear = {};
  allPyqForExam.forEach(q => {
    const pyq = getQuestionPyq(q);
    const match = pyq ? pyq.match(/\d{4}/) : null;
    const year = match ? match[0] : 'Unknown';
    if (!pyqByYear[year]) pyqByYear[year] = [];
    pyqByYear[year].push(q);
  });

  Object.keys(pyqByYear).sort((a,b) => b.localeCompare(a)).forEach(year => {
    const qs = pyqByYear[year];
    const shuffled = seededShuffle(qs, mulberry32(seed ^ parseInt(year === 'Unknown' ? 0 : year)));
    const mocksForYear = [];
    for (let i = 0; i < shuffled.length; i += 10) {
      const chunk = shuffled.slice(i, i + 10);
      if (chunk.length === 0) break;
      mocksForYear.push({
        id: `${examId}-pyq-${year}-${mocksForYear.length + 1}`,
        index: mocksForYear.length + 1,
        title: `${config.label} PYQ ${year} ${mocksForYear.length > 0 ? `Pt. ${mocksForYear.length + 1}` : ''}`.trim(),
        questions: chunk.length,
        minutes: chunk.length,
        type: 'quick',
        year: year,
        questionData: chunk,
      });
    }
    pyqMocks[year] = mocksForYear;
  });

  return { eliteMocks, quickMocks, sectionalMocks, pyqMocks };
}

/**
 * generateSubjectMocks(categoryId)
 * Generates subject-wise mocks grouped by Topics (tags).
 * Number of mocks strictly depends on available MCQs.
 * Elite mocks: 100 questions. Mini mocks: 10 questions.
 */
export function generateSubjectMocks(categoryId, targetExamId = null) {
  const catPool = ALL_STATIC_BANKS_SYNC.filter(q => q.category_id === categoryId);

  // Extract unique topics (tags)
  const topicSet = new Set();
  catPool.forEach(q => {
    (q.tags || []).forEach(t => {
      if (t && t.toLowerCase() !== '#pro') topicSet.add(t);
    });
  });
  const topics = ['All', ...Array.from(topicSet).sort()];

  const mocksByTopic = {};
  topics.forEach(topic => {
    mocksByTopic[topic] = { elite: [], mini: [] };
  });

  // 1. Generate Elite Mocks for each topic (and All)
  topics.forEach(topic => {
    let qs = catPool;
    if (topic !== 'All') {
      const lowerTopic = topic.toLowerCase();
      qs = catPool.filter(q => (q.tags || []).some(t => t.toLowerCase() === lowerTopic));
    }

    const seed = examIdToSeed(`subject-${categoryId}-${topic}`);
    const shuffled = seededShuffle(qs, mulberry32(seed));
    const eliteMocks = [];

    for (let i = 0; i < shuffled.length; i += 90) {
      const chunk = shuffled.slice(i, i + 100);
      if (chunk.length === 0) break;
      eliteMocks.push({
        id: `subj-${categoryId}-${topic}-elite-${eliteMocks.length + 1}`,
        index: eliteMocks.length + 1,
        title: `${topic === 'All' ? 'Full Subject' : topic} Elite Mock ${eliteMocks.length + 1}`,
        questions: chunk.length,
        minutes: chunk.length,
        type: 'elite',
        categoryId,
        topic,
        questionData: chunk,
      });
      if (i + 100 >= shuffled.length) break;
    }

    mocksByTopic[topic].elite = eliteMocks;
  });

  // 2. Generate Mini Mocks via Unified Clustering
  const allMiniMocks = [];
  const globalShuffled = seededShuffle(catPool, mulberry32(examIdToSeed(`subject-${categoryId}-all-mini`)));
  let remaining = [...globalShuffled];

  const getTagCounts = (qs) => {
    const counts = {};
    qs.forEach(q => {
      if (Array.isArray(q.tags)) {
        q.tags.forEach(t => {
          if (!t || t.toLowerCase() === '#pro') return;
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  let sortedTags = getTagCounts(remaining);

  while (sortedTags.length > 0 && sortedTags[0][1] >= 3) {
    const [tagName, tagCount] = sortedTags[0];
    const matchingQs = remaining.filter(q => Array.isArray(q.tags) && q.tags.some(t => t === tagName));

    for (let i = 0; i < matchingQs.length; i += 10) {
      const chunk = matchingQs.slice(i, i + 10);
      if (chunk.length === 0) break;

      const chunkIds = new Set(chunk.map(c => c.id));
      remaining = remaining.filter(q => !chunkIds.has(q.id));

      let finalQuestionData = [...chunk];

      if (finalQuestionData.length < 10) {
        const extra = remaining.slice(0, 10 - finalQuestionData.length);
        finalQuestionData.push(...extra);
        const extraIds = new Set(extra.map(e => e.id));
        remaining = remaining.filter(q => !extraIds.has(q.id));
      }

      if (finalQuestionData.length < 10) {
        const needed = 10 - finalQuestionData.length;
        const excluded = new Set(finalQuestionData.map(q => q.id));
        const pads = globalShuffled.filter(q => !excluded.has(q.id)).slice(0, needed);
        finalQuestionData.push(...pads);
      }

      const cleanTagName = tagName.replace(/^#/, '');
      const mockTitle = cleanTagName.toLowerCase().endsWith('mock')
        ? cleanTagName.replace(/mock/i, '').trim() + ' Mock'
        : cleanTagName + ' Mock';

      const localCount = allMiniMocks.filter(m => m.topic === tagName).length + 1;

      allMiniMocks.push({
        id: `subj-${categoryId}-${cleanTagName.toLowerCase().replace(/\s+/g, '-')}-mini-${localCount}`,
        index: allMiniMocks.length + 1,
        title: `${mockTitle} ${localCount}`,
        questions: 10,
        minutes: 10,
        type: 'quick',
        categoryId,
        topic: tagName,
        questionData: finalQuestionData,
      });
    }

    sortedTags = getTagCounts(remaining);
  }

  let mixedMockCount = 1;
  for (let i = 0; i < remaining.length; i += 10) {
    const chunk = remaining.slice(i, i + 10);
    if (chunk.length === 0) break;

    let finalQuestionData = [...chunk];
    if (finalQuestionData.length < 10 && globalShuffled.length >= 10) {
      const needed = 10 - finalQuestionData.length;
      const excluded = new Set(finalQuestionData.map(q => q.id));
      const pads = globalShuffled.filter(q => !excluded.has(q.id)).slice(0, needed);
      finalQuestionData.push(...pads);
    }

    allMiniMocks.push({
      id: `subj-${categoryId}-mixed-mini-${mixedMockCount}`,
      index: allMiniMocks.length + 1,
      title: `Mixed Mock ${mixedMockCount}`,
      questions: finalQuestionData.length,
      minutes: finalQuestionData.length,
      type: 'quick',
      categoryId,
      topic: 'Mixed',
      questionData: finalQuestionData,
    });
    mixedMockCount++;
  }

  // Populate mocksByTopic['All']
  mocksByTopic['All'].mini = allMiniMocks;

  // Distribute mini mocks to their specific topic tabs
  allMiniMocks.forEach(mock => {
    if (mock.topic && mocksByTopic[mock.topic]) {
      const localIdx = mocksByTopic[mock.topic].mini.length + 1;
      mocksByTopic[mock.topic].mini.push({
        ...mock,
        index: localIdx,
      });
    }
  });

  // ── Subject PYQ Masterclass ──────────
  const subjectPyqPool = catPool.filter(q => getQuestionPyq(q) !== null);
  const pyqMocks = [];

  let pyqShuffled;
  if (targetExamId) {
    const terms = [targetExamId.toLowerCase(), targetExamId.replace(/-/g, ' ').toLowerCase()];
    const matchesTarget = (q) => {
      const pyq = getQuestionPyq(q);
      if (pyq) {
        const lowerPyq = pyq.toLowerCase();
        if (terms.some(t => lowerPyq.includes(t))) return true;
      }
      if (Array.isArray(q.tags)) {
        if (q.tags.some(t => typeof t === 'string' && terms.some(term => t.toLowerCase().includes(term)))) return true;
      }
      return false;
    };
    const matching = subjectPyqPool.filter(matchesTarget);
    const nonMatching = subjectPyqPool.filter(q => !matchesTarget(q));

    const shuffledMatching = seededShuffle(matching, mulberry32(examIdToSeed(`subject-${categoryId}-pyq-match`)));
    const shuffledNonMatching = seededShuffle(nonMatching, mulberry32(examIdToSeed(`subject-${categoryId}-pyq-nonmatch`)));

    pyqShuffled = [...shuffledMatching, ...shuffledNonMatching];
  } else {
    pyqShuffled = seededShuffle(subjectPyqPool, mulberry32(examIdToSeed(`subject-${categoryId}-pyq`)));
  }

  const getExamName = (q) => {
    const pyqText = getQuestionPyq(q);
    if (!pyqText) return null;
    return pyqText.replace(/\b\d{4}\b/g, '').replace(/\s+/g, ' ').trim();
  };

  const getExamCounts = (qs) => {
    const counts = {};
    qs.forEach(q => {
      const name = getExamName(q);
      if (name) {
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  let remainingPyqs = [...pyqShuffled];
  let sortedExams = getExamCounts(remainingPyqs);

  if (targetExamId && sortedExams.length > 0) {
    const terms = [targetExamId.toLowerCase(), targetExamId.replace(/-/g, ' ').toLowerCase()];
    const targetIdx = sortedExams.findIndex(([examName]) => terms.some(t => examName.toLowerCase().includes(t)));
    if (targetIdx !== -1) {
      const [target] = sortedExams.splice(targetIdx, 1);
      sortedExams.unshift(target);
    }
  }

  while (sortedExams.length > 0 && sortedExams[0][1] >= 2) {
    const [examName, count] = sortedExams[0];
    const matching = remainingPyqs.filter(q => getExamName(q) === examName);

    for (let i = 0; i < matching.length; i += 10) {
      const chunk = matching.slice(i, i + 10);
      if (chunk.length === 0) break;

      const chunkIds = new Set(chunk.map(c => c.id));
      remainingPyqs = remainingPyqs.filter(q => !chunkIds.has(q.id));

      let finalQuestionData = [...chunk];

      if (finalQuestionData.length < 10) {
        const extra = remainingPyqs.slice(0, 10 - finalQuestionData.length);
        finalQuestionData.push(...extra);
        const extraIds = new Set(extra.map(e => e.id));
        remainingPyqs = remainingPyqs.filter(q => !extraIds.has(q.id));
      }

      if (finalQuestionData.length < 10) {
        const needed = 10 - finalQuestionData.length;
        const excluded = new Set(finalQuestionData.map(q => q.id));
        const pads = pyqShuffled.filter(q => !excluded.has(q.id)).slice(0, needed);
        finalQuestionData.push(...pads);
      }

      const examSprintCount = pyqMocks.filter(m => m.title.startsWith(examName)).length + 1;

      pyqMocks.push({
        id: `subj-${categoryId}-pyq-${pyqMocks.length + 1}`,
        index: pyqMocks.length + 1,
        title: `${examName} PYQ Sprint ${examSprintCount}`,
        questions: 10,
        minutes: 10,
        type: 'quick',
        categoryId,
        questionData: finalQuestionData,
      });
    }

    sortedExams = getExamCounts(remainingPyqs);
    if (targetExamId && sortedExams.length > 0) {
      const terms = [targetExamId.toLowerCase(), targetExamId.replace(/-/g, ' ').toLowerCase()];
      const targetIdx = sortedExams.findIndex(([examName]) => terms.some(t => examName.toLowerCase().includes(t)));
      if (targetIdx !== -1) {
        const [target] = sortedExams.splice(targetIdx, 1);
        sortedExams.unshift(target);
      }
    }
  }

  let mixedCount = 1;
  for (let i = 0; i < remainingPyqs.length; i += 10) {
    const chunk = remainingPyqs.slice(i, i + 10);
    if (chunk.length === 0) break;

    let finalQuestionData = [...chunk];
    if (finalQuestionData.length < 10 && pyqShuffled.length >= 10) {
      const needed = 10 - finalQuestionData.length;
      const excluded = new Set(finalQuestionData.map(q => q.id));
      const pads = pyqShuffled.filter(q => !excluded.has(q.id)).slice(0, needed);
      finalQuestionData.push(...pads);
    }

    pyqMocks.push({
      id: `subj-${categoryId}-pyq-${pyqMocks.length + 1}`,
      index: pyqMocks.length + 1,
      title: `Mixed PYQ Sprint ${mixedCount++}`,
      questions: finalQuestionData.length,
      minutes: finalQuestionData.length,
      type: 'quick',
      categoryId,
      questionData: finalQuestionData,
    });
  }

  const activeTopics = topics.filter(topic => {
    if (topic === 'All') return true;
    const miniCount = mocksByTopic[topic]?.mini?.length || 0;
    const eliteCount = mocksByTopic[topic]?.elite?.length || 0;
    return miniCount > 0 || eliteCount > 0;
  });

  return { topics: activeTopics, mocksByTopic, pyqMocks };
}

/**
 * getNextUnsolvedMiniMock(currentMock, solvedMap)
 * Finds the next 10-question mock after currentMock that has NOT been solved.
 * Works for both Exam (quick / sectional) and Subject (mini) mocks.
 * Always returns a 10Q mock — never an Elite mock.
 *
 * @param {object} currentMock  - the mock just completed
 * @param {object} solvedMap    - { [mockId]: { percentage, isGood } } from getSolvedMocks()
 * @returns {object|null}       - next unsolved mock or null
 */
export function getNextUnsolvedMiniMock(currentMock, solvedMap) {
  if (!currentMock?.id) return null;

  const isSolved = (id) => {
    if (!solvedMap) return false;
    if (Array.isArray(solvedMap)) {
      return solvedMap.some(m => (m.mockId || m.id) === id);
    }
    return !!solvedMap[id];
  };

  // ── EXAM-based mocks (jkssb-faa-*, ssc-cgl-*, etc.) ──────────────
  const examIds = Object.keys(EXAM_CONFIG);
  const matchedExamId = examIds.find(id => currentMock.id.startsWith(id + '-'));

  if (matchedExamId) {
    const { quickMocks, sectionalMocks } = generateMocksForExam(matchedExamId);

    // If this was a SECTIONAL mock, stay in the same section first
    if (currentMock.id.includes('-sect-')) {
      // Parse category from id: examId-sect-catId-N  (catId may contain hyphens)
      const prefix = matchedExamId + '-sect-';
      const rest = currentMock.id.slice(prefix.length); // e.g. "computer-awareness-12"
      const lastDash = rest.lastIndexOf('-');
      const catId = rest.slice(0, lastDash); // strip trailing index number

      const sectionMocks = sectionalMocks[catId] || [];
      const currentIndex = sectionMocks.findIndex(m => m.id === currentMock.id);
      // Look from NEXT position onward
      const nextInSection = sectionMocks.slice(currentIndex + 1).find(m => !m.isEmpty && !isSolved(m.id));
      if (nextInSection) return nextInSection;
    }

    // Fallback: next unsolved quick mock (may wrap around starting from quick mock's index)
    const currentQIdx = quickMocks.findIndex(m => m.id === currentMock.id);
    const startSearch = currentQIdx >= 0 ? currentQIdx + 1 : 0;
    // Search from next position, then from beginning
    const nextQuick =
      quickMocks.slice(startSearch).find(m => !m.isEmpty && !isSolved(m.id)) ||
      quickMocks.slice(0, startSearch).find(m => !m.isEmpty && !isSolved(m.id));
    return nextQuick || null;
  }

  // ── SUBJECT-based mocks (subj-*) ──────────────────────────────────
  if (currentMock.id.startsWith('subj-')) {
    const catId = currentMock.categoryId;
    const topic = currentMock.topic;

    if (catId && topic) {
      const { mocksByTopic } = generateSubjectMocks(catId);
      const miniList = mocksByTopic[topic]?.mini || [];
      const currentIdx = miniList.findIndex(m => m.id === currentMock.id);
      const startSearch = currentIdx >= 0 ? currentIdx + 1 : 0;
      const nextMini =
        miniList.slice(startSearch).find(m => !isSolved(m.id)) ||
        miniList.slice(0, startSearch).find(m => !isSolved(m.id));
      return nextMini || null;
    }
  }

  return null;
}
