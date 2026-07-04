/**
 * Utility for IndexedDB operations to store user stats and progress offline.
 * Upgraded to be highly robust, future-proof, and resilient against data corruption.
 */

const DB_NAME = 'MCQKashDB';
const STORE_NAME = 'mock_stats';
const BOOKMARK_STORE = 'bookmarks';
const CATEGORY_PROFILE_STORE = 'category_profile';
const TAG_HEATMAP_STORE = 'tag_heatmap';
const USER_ECONOMY_STORE = 'user_economy';
const COIN_HISTORY_STORE = 'coin_history';
const REVISION_STORE = 'revision_questions';
const PRACTICE_PREFS_STORE = 'practice_preferences';
const SAVED_CHATS_STORE = 'saved_chats';
const SAVED_OUTPUTS_STORE = 'saved_outputs';
const OFFLINE_QUESTIONS_STORE = 'offline_questions';
const SRS_INTERVALS = [1, 3, 7, 15, 30, 60];

const REQUIRED_STORES = [
  STORE_NAME,
  BOOKMARK_STORE,
  CATEGORY_PROFILE_STORE,
  TAG_HEATMAP_STORE,
  USER_ECONOMY_STORE,
  COIN_HISTORY_STORE,
  REVISION_STORE,
  PRACTICE_PREFS_STORE,
  SAVED_CHATS_STORE,
  SAVED_OUTPUTS_STORE,
  OFFLINE_QUESTIONS_STORE,
];

let dbPromise = null;

export const initDB = () => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    try {
      // PROBE Phase: Safely check current DB version without triggering downgrades
      const checkReq = indexedDB.open(DB_NAME);

      checkReq.onsuccess = (e) => {
        const db = e.target.result;
        const currentVersion = db.version;
        // Check if any required stores are missing in the current version
        const storesMissing = REQUIRED_STORES.some(store => !db.objectStoreNames.contains(store));

        db.close();

        // Target version logic: at least version 5, or higher if stores are missing
        let targetVersion = Math.max(7, currentVersion);
        if (storesMissing && currentVersion >= 7) {
          targetVersion = currentVersion + 1;
        }

        const request = indexedDB.open(DB_NAME, targetVersion);

        request.onupgradeneeded = (event) => {
          const upgradeDb = event.target.result;
          if (!upgradeDb.objectStoreNames.contains(STORE_NAME)) {
            upgradeDb.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          }
          if (!upgradeDb.objectStoreNames.contains(BOOKMARK_STORE)) {
            upgradeDb.createObjectStore(BOOKMARK_STORE, { keyPath: 'id' });
          }
          if (!upgradeDb.objectStoreNames.contains(CATEGORY_PROFILE_STORE)) {
            upgradeDb.createObjectStore(CATEGORY_PROFILE_STORE, { keyPath: 'categoryId' });
          }
          if (!upgradeDb.objectStoreNames.contains(TAG_HEATMAP_STORE)) {
            upgradeDb.createObjectStore(TAG_HEATMAP_STORE, { keyPath: 'tagId' });
          }
          if (!upgradeDb.objectStoreNames.contains(USER_ECONOMY_STORE)) {
            const economyStore = upgradeDb.createObjectStore(USER_ECONOMY_STORE, { keyPath: 'id' });
            // Initial state for the default user
            economyStore.put({
              id: 'default_user',
              kash_coins_balance: 100, // Welcome Bonus
              pro_factor: 1.0,
              user_tier: 'FREE',
              current_streak_days: 0,
              last_streak_date: null,
              active_pledges: [],
              available_streak_freezes: 0,
              hint_utility_usage_count: 0,
              total_kc_spent_on_revision: 0,
              revision_shields: 0,
              consecutive_high_scores: 0,
              target_exam: null,
              dnd_focus_active: false,
              smart_dnd_active: true,
              mastered_count: 0,
              badges: []
            });
          }
          if (!upgradeDb.objectStoreNames.contains(COIN_HISTORY_STORE)) {
            upgradeDb.createObjectStore(COIN_HISTORY_STORE, { keyPath: 'date' });
          }
          if (!upgradeDb.objectStoreNames.contains(REVISION_STORE)) {
            upgradeDb.createObjectStore(REVISION_STORE, { keyPath: 'questionId' });
          }
          if (!upgradeDb.objectStoreNames.contains(PRACTICE_PREFS_STORE)) {
            upgradeDb.createObjectStore(PRACTICE_PREFS_STORE, { keyPath: 'id' });
          }
          if (!upgradeDb.objectStoreNames.contains(SAVED_CHATS_STORE)) {
            upgradeDb.createObjectStore(SAVED_CHATS_STORE, { keyPath: 'id', autoIncrement: true });
          }
          if (!upgradeDb.objectStoreNames.contains(SAVED_OUTPUTS_STORE)) {
            upgradeDb.createObjectStore(SAVED_OUTPUTS_STORE, { keyPath: 'id' });
          }
          if (!upgradeDb.objectStoreNames.contains(OFFLINE_QUESTIONS_STORE)) {
            upgradeDb.createObjectStore(OFFLINE_QUESTIONS_STORE, { keyPath: 'id' });
          }
        };

        request.onsuccess = (event) => {
          const finalDb = event.target.result;
          // Global error & close handlers to gracefully reset connection
          finalDb.onclose = () => { dbPromise = null; };
          finalDb.onversionchange = () => { finalDb.close(); dbPromise = null; };
          finalDb.onerror = (errEvent) => {
            console.error("Global DB Error:", errEvent.target.error);
          };
          resolve(finalDb);
        };

        request.onerror = (event) => {
          const err = event.target.error;
          console.error("IndexedDB Open Error:", err);
          reject('IndexedDB error: ' + (err ? err.message : 'Unknown error'));
          dbPromise = null;
        };

        request.onblocked = () => {
          console.warn("IndexedDB open blocked. Please close other tabs of this app.");
        };
      };

      checkReq.onerror = (e) => {
        const err = e.target.error;
        console.error("Failed to probe IndexedDB version:", err);
        reject('IndexedDB probe error: ' + (err ? err.message : 'Unknown error'));
        dbPromise = null;
      };

    } catch (e) {
      console.error("IndexedDB critical failure:", e);
      reject(e.message);
      dbPromise = null;
    }
  });

  return dbPromise;
};

// Generic wrapper to handle database transaction errors (e.g. QuotaExceededError, NotFoundError)
const withDBErrorHandler = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    console.error("Database operation failed:", error);
    if (error.name === 'NotFoundError' || error.name === 'InvalidStateError') {
      console.warn("Data store corrupted or missing. Resetting DB connection.");
      dbPromise = null;
    }
    throw error;
  }
};

export const saveMockStats = async (stats) => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add({
        ...stats,
        date: new Date().toISOString()
      });

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  });
};

export const getAllMockStats = async () => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    
    let isPro = false;
    try {
      const econTx = db.transaction([USER_ECONOMY_STORE], 'readonly');
      const econStore = econTx.objectStore(USER_ECONOMY_STORE);
      const econReq = econStore.get('default_user');
      const econResult = await new Promise((resolve) => {
        econReq.onsuccess = () => resolve(econReq.result);
        econReq.onerror = () => resolve(null);
      });
      if (econResult && (econResult.user_tier === 'Pro' || econResult.is_pro)) {
        isPro = true;
      }
    } catch (e) {
      console.warn("Could not read user tier in getAllMockStats:", e);
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const stats = request.result || [];
        if (isPro) {
          stats.forEach(s => {
            if (Array.isArray(s.questions)) {
              s.questions = s.questions.map(q => (q && q.isLockedDummy && q.lockedQuestion) ? q.lockedQuestion : q);
            }
            if (Array.isArray(s.failedQuestions)) {
              s.failedQuestions = s.failedQuestions.map(q => (q && q.isLockedDummy && q.lockedQuestion) ? q.lockedQuestion : q);
            }
          });
        }
        resolve(stats);
      };
      request.onerror = () => reject(request.error);
    });
  });
};

export const toggleBookmarkDB = async (questionData) => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BOOKMARK_STORE], 'readwrite');
      const store = transaction.objectStore(BOOKMARK_STORE);

      const checkRequest = store.get(questionData.id);

      checkRequest.onsuccess = () => {
        if (checkRequest.result) {
          store.delete(questionData.id);
          resolve(false);
        } else {
          store.add({
            ...questionData,
            bookmarkedAt: new Date().toISOString()
          });
          resolve(true);
        }
      };
      checkRequest.onerror = () => reject(checkRequest.error);
    });
  });
};

export const isBookmarkedDB = async (questionId) => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BOOKMARK_STORE], 'readonly');
      const store = transaction.objectStore(BOOKMARK_STORE);
      const request = store.get(questionId);
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => resolve(false);
    });
  });
};

export const getAllBookmarksDB = async () => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BOOKMARK_STORE], 'readonly');
      const store = transaction.objectStore(BOOKMARK_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
};

const cleanQuestionForRevision = (question = {}) => {
  const { _priorityScore, isLockedDummy, revisionRecord, ...clean } = question;
  return clean;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
};

const nextSrsInterval = (current = 1) => {
  const idx = SRS_INTERVALS.indexOf(Number(current));
  if (idx === -1) return 1;
  return SRS_INTERVALS[Math.min(idx + 1, SRS_INTERVALS.length - 1)];
};

const prevSrsInterval = (current = 1) => {
  const idx = SRS_INTERVALS.indexOf(Number(current));
  if (idx <= 0) return null;
  return SRS_INTERVALS[idx - 1];
};

const upsertRevisionRecord = async (question, updater) => {
  if (!question?.id || question.isLockedDummy) return null;

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REVISION_STORE], 'readwrite');
    const store = transaction.objectStore(REVISION_STORE);
    const getReq = store.get(question.id);

    getReq.onsuccess = () => {
      const now = new Date().toISOString();
      const current = getReq.result || {
        questionId: question.id,
        questionData: cleanQuestionForRevision(question),
        status: 'Normal',
        srs_interval: 1,
        next_revision_date: null,
        consecutive_correct: 0,
        resurrected_count: 0,
        resurrection_events: [],
        createdAt: now,
      };

      const updated = updater({
        ...current,
        questionData: cleanQuestionForRevision({ ...current.questionData, ...question }),
        updatedAt: now,
      }, now);

      store.put(updated);
      resolve(updated);
    };
    getReq.onerror = () => reject(getReq.error);
  });
};

export const markQuestionForResurrection = async (question, isResurrectionAttempt = false) => {
  return withDBErrorHandler(async () => {
    if (!question?.id || question.isLockedDummy) return null;

    return upsertRevisionRecord(question, (record, now) => {
      const wasResurrection = record.status === 'Resurrection';
      return {
        ...record,
        status: 'Resurrection',
        srs_interval: 1,
        next_revision_date: null,
        consecutive_correct: 0,
        resurrected_count: (record.resurrected_count || 0) + 1,
        resurrection_events: [...(record.resurrection_events || []), now].slice(-100),
        last_resurrection_date: now,
        last_failed_resurrection_date: (isResurrectionAttempt || wasResurrection) ? now : (record.last_failed_resurrection_date || null),
      };
    });
  });
};

export const markQuestionsForResurrection = async (questions = []) => {
  return withDBErrorHandler(async () => {
    const valid = questions.filter(q => q?.id && !q.isLockedDummy);
    await Promise.all(valid.map(q => markQuestionForResurrection(q)));
    return valid.length;
  });
};

export const getRevisionRecords = async () => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([REVISION_STORE], 'readonly');
      const store = transaction.objectStore(REVISION_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  });
};

export const getResurrectionQuestions = async (excludeCooldown = true) => {
  const records = await getRevisionRecords();
  const now = Date.now();
  const COOLDOWN_MS = 60 * 60 * 1000; // 60 minutes

  return records
    .filter(r => {
      if (r.status !== 'Resurrection') return false;
      if (excludeCooldown && r.last_failed_resurrection_date) {
        const elapsed = now - new Date(r.last_failed_resurrection_date).getTime();
        if (elapsed < COOLDOWN_MS) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.last_resurrection_date || b.updatedAt || 0) - new Date(a.last_resurrection_date || a.updatedAt || 0))
    .map(r => ({ ...r.questionData, status: r.status, revisionRecord: r }));
};

export const getDueSRSQuestions = async (limit = 10) => {
  const now = Date.now();
  const records = await getRevisionRecords();
  const due = records
    .filter(r => r.status === 'SRS' && r.next_revision_date && new Date(r.next_revision_date).getTime() <= now)
    .sort((a, b) => new Date(a.next_revision_date) - new Date(b.next_revision_date))
    .map(r => ({
      ...r.questionData,
      status: r.status,
      srs_interval: r.srs_interval,
      next_revision_date: r.next_revision_date,
      consecutive_correct: r.consecutive_correct || 0,
      revisionRecord: r,
    }));

  return limit ? due.slice(0, limit) : due;
};

export const getRevisionStats = async () => {
  const records = await getRevisionRecords();
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const resurrectedThisWeek = records.reduce((total, record) => {
    const events = record.resurrection_events || [];
    return total + events.filter(ts => new Date(ts).getTime() >= weekAgo).length;
  }, 0);

  const poolCount = records.filter(r => r.status === 'Resurrection').length;
  const srs12Count = records.filter(r => r.status === 'SRS' && (r.srs_interval === 1 || r.srs_interval === 3)).length;
  const srs35Count = records.filter(r => r.status === 'SRS' && (r.srs_interval === 7 || r.srs_interval === 15 || r.srs_interval === 30)).length;
  const srs6Count = records.filter(r => r.status === 'SRS' && r.srs_interval === 60).length;
  const masteredCount = records.filter(r => r.status === 'Mastered').length;

  return {
    totalResurrection: poolCount,
    totalSRS: srs12Count + srs35Count + srs6Count,
    dueSRS: records.filter(r => r.status === 'SRS' && r.next_revision_date && new Date(r.next_revision_date).getTime() <= now).length,
    resurrectedThisWeek,
    poolCount,
    srs12Count,
    srs35Count,
    srs6Count,
    masteredCount,
  };
};

export const getPracticePreferences = async (id) => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PRACTICE_PREFS_STORE], 'readonly');
      const store = transaction.objectStore(PRACTICE_PREFS_STORE);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  });
};

export const savePracticePreferences = async (id, preferences) => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PRACTICE_PREFS_STORE], 'readwrite');
      const store = transaction.objectStore(PRACTICE_PREFS_STORE);
      const request = store.put({
        id,
        ...preferences,
        updatedAt: new Date().toISOString(),
      });
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  });
};

export const applyRevisionOutcomes = async ({ questions = [], answers = {}, mode = 'normal' }) => {
  return withDBErrorHandler(async () => {
    const summary = {
      mode,
      resurrected: 0,
      promoted: 0,
      reset: 0,
      promotedToCounts: {},
      demoted: 0,
      demotedToCounts: {},
    };

    let hasMastered = false;

    for (const question of questions) {
      if (!question?.id || question.isLockedDummy) continue;

      const answer = answers[question.id];
      const isCorrect = Boolean(answer) && answer === question.correctId;

      // Get current srs_interval of the question record
      let currentInterval = 1;
      if (question.revisionRecord && question.revisionRecord.srs_interval) {
        currentInterval = Number(question.revisionRecord.srs_interval);
      } else if (question.srs_interval) {
        currentInterval = Number(question.srs_interval);
      }

      if (mode === 'mastery') {
        if (isCorrect) {
          await upsertRevisionRecord(question, (record) => ({
            ...record,
            status: 'Mastered',
            next_revision_date: null,
            consecutive_correct: (record.consecutive_correct || 0) + 1,
            masteredAt: new Date().toISOString(),
          }));
          summary.promoted += 1;
          summary.promotedToCounts[60] = (summary.promotedToCounts[60] || 0) + 1;
          hasMastered = true;
        } else {
          await upsertRevisionRecord(question, (record) => ({
            ...record,
            status: 'Resurrection',
            srs_interval: 1,
            next_revision_date: null,
            consecutive_correct: 0,
            last_resurrection_date: new Date().toISOString(),
            resurrected_count: (record.resurrected_count || 0) + 1,
          }));
          summary.reset += 1;
        }
      } else if (mode === 'resurrection') {
        if (isCorrect) {
          await upsertRevisionRecord(question, (record) => ({
            ...record,
            status: 'SRS',
            srs_interval: 1,
            next_revision_date: addDays(new Date(), 1),
            consecutive_correct: 1,
            last_srs_promotion_date: new Date().toISOString(),
          }));
          summary.promoted += 1;
          summary.promotedToCounts[1] = (summary.promotedToCounts[1] || 0) + 1;
        } else {
          await markQuestionForResurrection(question, true);
          summary.resurrected += 1;
        }
      } else if (mode === 'srs') {
        if (isCorrect) {
          if (currentInterval === 60) {
            await upsertRevisionRecord(question, (record) => ({
              ...record,
              status: 'Mastered',
              next_revision_date: null,
              consecutive_correct: (record.consecutive_correct || 0) + 1,
              masteredAt: new Date().toISOString(),
            }));
            summary.promoted += 1;
            summary.promotedToCounts[60] = (summary.promotedToCounts[60] || 0) + 1;
            hasMastered = true;
          } else {
            const updated = await upsertRevisionRecord(question, (record) => {
              const interval = nextSrsInterval(record.srs_interval || question.srs_interval || 1);
              return {
                ...record,
                status: 'SRS',
                srs_interval: interval,
                next_revision_date: addDays(new Date(), interval),
                consecutive_correct: (record.consecutive_correct || 0) + 1,
                last_srs_promotion_date: new Date().toISOString(),
              };
            });
            summary.promoted += 1;
            const interval = updated?.srs_interval || 1;
            summary.promotedToCounts[interval] = (summary.promotedToCounts[interval] || 0) + 1;
          }
        } else {
          const demotedInterval = prevSrsInterval(currentInterval);
          if (demotedInterval) {
            await upsertRevisionRecord(question, (record) => ({
              ...record,
              status: 'SRS',
              srs_interval: demotedInterval,
              next_revision_date: addDays(new Date(), demotedInterval),
              consecutive_correct: 0,
            }));
            summary.reset += 1;
            summary.demoted += 1;
            summary.demotedToCounts[demotedInterval] = (summary.demotedToCounts[demotedInterval] || 0) + 1;
          } else {
            await markQuestionForResurrection(question);
            summary.reset += 1;
            summary.demoted += 1;
            summary.demotedToCounts['resurrection'] = (summary.demotedToCounts['resurrection'] || 0) + 1;
          }
        }
      } else if (!isCorrect) {
        await markQuestionForResurrection(question);
        summary.resurrected += 1;
      }
    }

    if (hasMastered) {
      const economy = await getUserEconomy();
      const currentBadges = Array.isArray(economy.badges) ? economy.badges : [];
      const newBadges = [...currentBadges, 'Level 6 Master'].filter((v, i, self) => self.indexOf(v) === i);
      await updateUserEconomy({
        mastered_count: (economy.mastered_count || 0) + 1,
        badges: newBadges
      });
    }

    return summary;
  });
};

export const getAggregatedStats = async () => {
  try {
    const allStats = await getAllMockStats();
    const totalTests = allStats.length;
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;

    allStats.forEach(stat => {
      totalQuestions += stat.total || 0;
      totalCorrect += stat.correct || 0;
      totalIncorrect += (stat.incorrect || 0) + (stat.skipped || 0);
    });

    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const accuracyRate = accuracy;
    const history = allStats.sort((a, b) => new Date(b.date) - new Date(a.date));

    return { totalTests, totalQuestions, totalCorrect, totalIncorrect, accuracyRate, history };
  } catch (error) {
    console.error("Error aggregating stats:", error);
    return { totalTests: 0, totalQuestions: 0, totalCorrect: 0, totalIncorrect: 0, accuracyRate: 0, history: [] };
  }
};

export const getAllFailedQuestionsDB = async () => {
  try {
    return await getResurrectionQuestions();
  } catch (error) {
    console.error("Error getting failed questions:", error);
    return [];
  }
};

export const getSolvedMocks = async () => {
  try {
    const allStats = await getAllMockStats();
    // Return unique mocks with their best performance
    const solvedMap = new Map();

    allStats.forEach(stat => {
      if (stat.mockId) {
        const existing = solvedMap.get(stat.mockId);
        if (!existing || stat.percentage > existing.percentage) {
          solvedMap.set(stat.mockId, {
            ...stat,
            isGood: stat.percentage >= 40,
          });
        }
      }
    });

    return Array.from(solvedMap.values());
  } catch (error) {
    console.error("Error getting solved mocks:", error);
    return [];
  }
};

export const updateBackgroundIntelligence = async ({ questions, answers, timeSpent = {} }) => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CATEGORY_PROFILE_STORE, TAG_HEATMAP_STORE], 'readwrite');
      const catStore = transaction.objectStore(CATEGORY_PROFILE_STORE);
      const tagStore = transaction.objectStore(TAG_HEATMAP_STORE);

      const categoryDeltas = {};
      const tagDeltas = {};

      questions.forEach(q => {
        const catId = q.category_id || 'uncategorized';
        if (!categoryDeltas[catId]) {
          categoryDeltas[catId] = { attempted: 0, correct: 0, incorrect: 0, timeCorrect: 0, timeIncorrect: 0 };
        }

        const isAttempted = true;
        const isCorrect = answers[q.id] === q.correctId;
        const tSpent = timeSpent[q.id] || 0;

        if (isAttempted) {
          categoryDeltas[catId].attempted += 1;
          if (isCorrect) {
            categoryDeltas[catId].correct += 1;
            categoryDeltas[catId].timeCorrect += tSpent;
          } else {
            categoryDeltas[catId].incorrect += 1;
            categoryDeltas[catId].timeIncorrect += tSpent;
          }

          if (q.tags && Array.isArray(q.tags)) {
            q.tags.forEach(tag => {
              const tagId = tag.toLowerCase().trim();
              if (!tagDeltas[tagId]) tagDeltas[tagId] = { correctCount: 0, incorrectCount: 0 };
              if (isCorrect) tagDeltas[tagId].correctCount += 1;
              else tagDeltas[tagId].incorrectCount += 1;
            });
          }
        }
      });

      Object.keys(categoryDeltas).forEach(catId => {
        const delta = categoryDeltas[catId];
        if (delta.attempted === 0) return;

        const getReq = catStore.get(catId);
        getReq.onsuccess = () => {
          let profile = getReq.result || {
            categoryId: catId,
            totalAttempted: 0, totalCorrect: 0, totalIncorrect: 0,
            timeSpentCorrect: 0, timeSpentIncorrect: 0,
            last10Attempts: [],
          };

          profile.totalAttempted += delta.attempted;
          profile.totalCorrect += delta.correct;
          profile.totalIncorrect += delta.incorrect;
          profile.timeSpentCorrect += delta.timeCorrect;
          profile.timeSpentIncorrect += delta.timeIncorrect;

          const attemptAccuracy = (delta.correct / delta.attempted) * 100;
          profile.last10Attempts.push(attemptAccuracy);
          if (profile.last10Attempts.length > 10) {
            profile.last10Attempts.shift();
          }

          profile.wmi = profile.totalAttempted > 0
            ? ((profile.totalCorrect - (0.33 * profile.totalIncorrect)) / profile.totalAttempted) * 100 : 0;

          profile.accuracyRate = profile.totalAttempted > 0
            ? (profile.totalCorrect / profile.totalAttempted) * 100 : 0;

          if (profile.last10Attempts.length > 1) {
            const mean = profile.last10Attempts.reduce((a, b) => a + b, 0) / profile.last10Attempts.length;
            const variance = profile.last10Attempts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / profile.last10Attempts.length;
            profile.stabilityIndex = variance;
          } else {
            profile.stabilityIndex = 0;
          }

          catStore.put(profile);
        };
      });

      Object.keys(tagDeltas).forEach(tagId => {
        const delta = tagDeltas[tagId];
        const getReq = tagStore.get(tagId);
        getReq.onsuccess = () => {
          let tagData = getReq.result || { tagId, correctCount: 0, incorrectCount: 0 };
          tagData.correctCount += delta.correctCount;
          tagData.incorrectCount += delta.incorrectCount;
          tagStore.put(tagData);
        };
      });

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  });
};

export const getWarRoomStats = async () => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CATEGORY_PROFILE_STORE, TAG_HEATMAP_STORE], 'readonly');
      const catStore = transaction.objectStore(CATEGORY_PROFILE_STORE);
      const tagStore = transaction.objectStore(TAG_HEATMAP_STORE);

      let categories = [];
      let tags = [];

      const catReq = catStore.getAll();
      catReq.onsuccess = () => { categories = catReq.result; };

      const tagReq = tagStore.getAll();
      tagReq.onsuccess = () => { tags = tagReq.result; };

      transaction.oncomplete = () => resolve({ categories, tags });
      transaction.onerror = () => reject(transaction.error);
    });
  });
};

export const getUserEconomy = async () => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([USER_ECONOMY_STORE], 'readonly');
      const store = transaction.objectStore(USER_ECONOMY_STORE);
      const request = store.get('default_user');

      request.onsuccess = () => {
        const defaults = {
          id: 'default_user',
          kash_coins_balance: 100,
          pro_factor: 1.0,
          user_tier: 'FREE',
          current_streak_days: 0,
          last_streak_date: null,
          active_pledges: [],
          available_streak_freezes: 0,
          hint_utility_usage_count: 0,
          total_kc_spent_on_revision: 0,
          revision_shields: 0,
          consecutive_high_scores: 0,
          target_exam: null,
          dnd_focus_active: false,
          smart_dnd_active: true,
          mastered_count: 0,
          badges: []
        };

        if (request.result) resolve({ ...defaults, ...request.result });
        else resolve(defaults);
      };
      request.onerror = () => reject(request.error);
    });
  });
};

export const updateUserEconomy = async (updates) => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    const current = await getUserEconomy();
    const updated = { ...current, ...updates };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([USER_ECONOMY_STORE], 'readwrite');
      const store = transaction.objectStore(USER_ECONOMY_STORE);
      const request = store.put(updated);

      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  });
};

export const transactKC = async (amount) => {
  const current = await getUserEconomy();
  const newBalance = Math.max(0, current.kash_coins_balance + amount);
  return updateUserEconomy({ kash_coins_balance: newBalance });
};

export const spendRevisionKC = async (amount) => {
  const current = await getUserEconomy();
  if (!current || current.kash_coins_balance < amount) return false;
  return updateUserEconomy({
    kash_coins_balance: current.kash_coins_balance - amount,
    total_kc_spent_on_revision: (current.total_kc_spent_on_revision || 0) + amount,
  });
};

export const toggleProTier = async (isPro) => {
  return updateUserEconomy({
    user_tier: isPro ? 'Pro' : 'FREE',
    pro_factor: isPro ? 1.5 : 1.0
  });
};

// --- Coin History Functions ---

export const logCoinSnapshot = async (balance) => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([COIN_HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(COIN_HISTORY_STORE);

      const getReq = store.get(date);
      getReq.onsuccess = () => {
        const record = getReq.result || { date, earned_from_mocks: 0 };
        record.balance = balance;
        record.timestamp = Date.now();
        store.put(record);
        resolve(true);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  });
};

export const logCoinEarnedFromMocks = async (amount) => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    const date = new Date().toISOString().split('T')[0];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([COIN_HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(COIN_HISTORY_STORE);

      const getReq = store.get(date);
      getReq.onsuccess = () => {
        const record = getReq.result || { date, balance: 0, timestamp: Date.now() };
        record.earned_from_mocks = (record.earned_from_mocks || 0) + amount;
        store.put(record);
        resolve(true);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  });
};

export const getCoinHistory = async (days = 30) => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([COIN_HISTORY_STORE], 'readonly');
      const store = transaction.objectStore(COIN_HISTORY_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        // Sort by date and limit
        const sorted = results.sort((a, b) => new Date(a.date) - new Date(b.date));
        resolve(sorted.slice(-days));
      };
      request.onerror = () => reject(request.error);
    });
  });
};

// ─── Saved AI Chats ────────────────────────────────────────────────────────

/**
 * Save an AI Mentor chat session to IndexedDB.
 * @param {object} session - { title, messages: [{sender, text}], savedAt }
 * @returns {Promise<number>} The auto-generated id of the saved record.
 */
export const saveChatSession = async (session) => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SAVED_CHATS_STORE], 'readwrite');
      const store = transaction.objectStore(SAVED_CHATS_STORE);
      const record = {
        ...session,
        savedAt: new Date().toISOString(),
      };
      // Remove 'id' so autoIncrement works
      delete record.id;
      const request = store.add(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
};

/**
 * Retrieve all saved AI Mentor chat sessions, newest first.
 * @returns {Promise<object[]>}
 */
export const getAllSavedChats = async () => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SAVED_CHATS_STORE], 'readonly');
      const store = transaction.objectStore(SAVED_CHATS_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const results = (request.result || []).sort(
          (a, b) => new Date(b.savedAt) - new Date(a.savedAt)
        );
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  });
};

/**
 * Delete a saved chat session by its id.
 * @param {number} id
 */
export const deleteSavedChat = async (id) => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SAVED_CHATS_STORE], 'readwrite');
      const store = transaction.objectStore(SAVED_CHATS_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  });
};

/**
 * Save an AI Mentor output to IndexedDB (bookmarks / library).
 * @param {object} output - { id, mode, title, html, mcqs, savedAt }
 */
export const saveOutput = async (output) => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SAVED_OUTPUTS_STORE], 'readwrite');
      const store = transaction.objectStore(SAVED_OUTPUTS_STORE);
      const record = {
        ...output,
        savedAt: new Date().toISOString(),
      };
      const request = store.put(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
};

/**
 * Retrieve all saved AI Mentor outputs, newest first.
 * @returns {Promise<object[]>}
 */
export const getAllSavedOutputs = async () => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SAVED_OUTPUTS_STORE], 'readonly');
      const store = transaction.objectStore(SAVED_OUTPUTS_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const results = (request.result || []).sort(
          (a, b) => new Date(b.savedAt) - new Date(a.savedAt)
        );
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  });
};

/**
 * Delete a saved AI Mentor output by its id.
 * @param {number|string} id
 */
export const deleteSavedOutput = async (id) => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SAVED_OUTPUTS_STORE], 'readwrite');
      const store = transaction.objectStore(SAVED_OUTPUTS_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  });
};

/**
 * Retrieve all user-saved offline questions.
 * @returns {Promise<object[]>}
 */
export const getAllOfflineQuestions = async () => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(OFFLINE_QUESTIONS_STORE)) {
        resolve([]);
        return;
      }
      const transaction = db.transaction([OFFLINE_QUESTIONS_STORE], 'readonly');
      const store = transaction.objectStore(OFFLINE_QUESTIONS_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  });
};

/**
 * Bulk save user-generated offline questions to IndexedDB.
 * @param {object[]} questions
 * @returns {Promise<boolean>}
 */
export const saveOfflineQuestions = async (questions) => {
  return withDBErrorHandler(async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(OFFLINE_QUESTIONS_STORE)) {
        reject(new Error("Store offline_questions is not initialized yet."));
        return;
      }
      const transaction = db.transaction([OFFLINE_QUESTIONS_STORE], 'readwrite');
      const store = transaction.objectStore(OFFLINE_QUESTIONS_STORE);
      
      let errorOccurred = null;
      questions.forEach(q => {
        const request = store.put(q);
        request.onerror = () => { errorOccurred = request.error; };
      });
      
      transaction.oncomplete = () => {
        if (errorOccurred) reject(errorOccurred);
        else resolve(true);
      };
      transaction.onerror = () => reject(transaction.error);
    });
  });
};
