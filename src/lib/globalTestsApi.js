import { supabase, isSupabaseConfigured } from './supabase';
import staticCatalog from '../question_bank/weekly_catalog.json';
import { WEEKLY_TEST_LOADERS } from '../question_bank/weekly_registry';

/**
 * Fetches current server time to prevent local client clock tampering.
 */
export const getServerTimestamp = async () => {
  if (!isSupabaseConfigured()) return Date.now();
  try {
    const { data, error } = await supabase.rpc('get_current_time');
    if (!error && data) {
      return new Date(data).getTime();
    }
  } catch {
    // Fallback: use client time if RPC is not present
  }
  return Date.now();
};

let _cachedWeeklyTests = null;

/**
 * Cleanly formats exam slugs like 'jkssb-faa' or 'jk-psi' into 'JKSSB FAA' or 'JK PSI'
 */
export const formatExamName = (examId) => {
  if (!examId) return 'GLOBAL MOCK';
  return examId
    .replace(/[-_]+/g, ' ')
    .trim()
    .toUpperCase();
};

/**
 * Returns cached weekly tests synchronously for instantaneous UI rendering (0ms flash).
 */
export const getCachedWeeklyTestsSync = () => {
  if (_cachedWeeklyTests && _cachedWeeklyTests.length > 0) {
    return _cachedWeeklyTests;
  }
  const staticList = Array.isArray(staticCatalog) ? staticCatalog : [];
  return staticList;
};

/**
 * Fetches all published global weekly tests (Static-first with 0 database egress + Stale-While-Revalidate).
 */
export const fetchWeeklyTests = async () => {
  const staticList = Array.isArray(staticCatalog) ? staticCatalog : [];
  if (!isSupabaseConfigured()) {
    _cachedWeeklyTests = staticList;
    return staticList;
  }

  try {
    const { data, error } = await supabase
      .from('weekly_tests')
      .select('id, exam_id, title, total_questions, total_marks, duration_mins, negative_marking, window_start, window_end, result_reveal_at, status, created_at')
      .order('window_start', { ascending: false });

    if (error) {
      console.warn('Notice: Using static weekly catalog. Supabase notice:', error.message);
      _cachedWeeklyTests = staticList;
      return staticList;
    }

    // Merge static and remote (remote overrides or adds fresh unsynced tests)
    const combined = [...staticList];
    (data || []).forEach(remote => {
      const idx = combined.findIndex(c => c.id === remote.id);
      if (idx !== -1) {
        combined[idx] = { ...combined[idx], ...remote };
      } else {
        combined.unshift(remote);
      }
    });

    _cachedWeeklyTests = combined;
    return combined;
  } catch (err) {
    console.warn('Failed to fetch remote weekly tests, using static catalog:', err);
    _cachedWeeklyTests = staticList;
    return staticList;
  }
};

/**
 * Fetches a single weekly test by ID (Strict Zero-Database-Egress: Questions load ONLY via static bundles).
 * If the mock has not been compiled/synced into the codebase by admins, this returns null so candidates
 * are gracefully greeted by the 'Coffee Break / Curators at Work' state without incurring Supabase database egress.
 */
export const fetchWeeklyTestById = async (testId) => {
  // Static code-split loader (0 MB database egress!)
  if (WEEKLY_TEST_LOADERS && typeof WEEKLY_TEST_LOADERS[testId] === 'function') {
    try {
      const mod = await WEEKLY_TEST_LOADERS[testId]();
      const testData = mod?.default || mod;
      if (testData && testData.questions_data && testData.questions_data.length > 0) {
        return testData;
      }
    } catch (e) {
      console.warn(`Could not load static weekly test ${testId}:`, e);
    }
  }

  // Strict Zero-Egress Policy: Never stream massive question blobs from Supabase to thousands of candidates.
  return null;
};

/**
 * Checks if a user has already submitted a specific test on Supabase.
 */
export const checkUserWeeklySubmission = async (testId, userId) => {
  if (!isSupabaseConfigured() || !userId || !testId) return null;

  try {
    const { data, error } = await supabase
      .from('weekly_test_leaderboard')
      .select('id, test_id, user_id, score, accuracy, time_seconds, submitted_at')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('Error checking user submission:', error);
    }
    return data || null;
  } catch (err) {
    console.error('Failed to check user weekly submission:', err);
    return null;
  }
};

/**
 * Submits minimal score telemetry to Supabase.
 * NOTE: Zero question blobs or raw answers are sent here to save bandwidth.
 */
export const submitWeeklyScoreTelemetry = async ({
  testId,
  userId,
  userName,
  score,
  accuracy,
  timeSeconds,
  targetExam
}) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, skipping remote telemetry.');
    return { success: true, offlineOnly: true };
  }

  try {
    const payload = {
      test_id: testId,
      user_id: userId,
      user_name: userName || 'Aspirant',
      score: parseFloat(score) || 0,
      accuracy: parseFloat(accuracy) || 0,
      time_seconds: parseInt(timeSeconds, 10) || 0,
      submitted_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('weekly_test_leaderboard')
      .upsert(payload, { onConflict: 'test_id,user_id' })
      .select();

    if (error) {
      console.error('Error submitting score telemetry:', error);
      throw error;
    }
    return { success: true, data };
  } catch (err) {
    console.error('Failed to submit score telemetry:', err);
    throw err;
  }
};

/**
 * Fetches the leaderboard for a specific test on Result Day.
 */
export const fetchWeeklyTestLeaderboard = async (testId) => {
  if (!isSupabaseConfigured() || !testId) return [];

  try {
    const { data, error } = await supabase
      .from('weekly_test_leaderboard')
      .select('id, user_id, user_name, score, accuracy, time_seconds, submitted_at')
      .eq('test_id', testId)
      .order('score', { ascending: false })
      .order('time_seconds', { ascending: true });

    if (error) {
      console.warn(`Error fetching leaderboard for test ${testId}:`, error);
      return [];
    }

    // Compute rank & percentile client-side
    const totalParticipants = (data || []).length;
    return (data || []).map((row, idx) => {
      const rank = idx + 1;
      const percentile = totalParticipants > 1
        ? (((totalParticipants - rank) / totalParticipants) * 100).toFixed(1)
        : '100.0';
      return {
        ...row,
        rank,
        percentile
      };
    });
  } catch (err) {
    console.error('Failed to fetch test leaderboard:', err);
    return [];
  }
};

/**
 * Creates or updates a weekly test from Creator Studio.
 */
export const publishWeeklyTestToSupabase = async (testPayload) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase
    .from('weekly_tests')
    .upsert(testPayload, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('Supabase error publishing weekly test:', error);
    throw error;
  }
  return data;
};
