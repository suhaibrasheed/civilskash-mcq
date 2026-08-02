/**
 * Android Outside-App System Push Notifier for MCQ Kash
 * 
 * PERSONALIZED USER RULE: Daily Push Limit set by user in Study Goals (1 to 5 per day).
 * Reads `mcqkash_daily_push_limit` (default: 1).
 * Tracks count for today (`mcqkash_push_count_YYYY-MM-DD`).
 * 
 * Seamlessly links In-App Notification Center (Streaks, Battle Challenges, SRS Revision)
 * to Outside Android System Push Notifications.
 */

export function isAndroidUser() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getUserDailyPushLimit() {
  if (typeof localStorage === 'undefined') return 1;
  const limit = parseInt(localStorage.getItem('mcqkash_daily_push_limit') || '1', 10);
  return Math.max(1, Math.min(5, isNaN(limit) ? 1 : limit));
}

export function getTodayPushCount() {
  if (typeof localStorage === 'undefined') return 0;
  const key = `mcqkash_push_count_${getTodayDateString()}`;
  return parseInt(localStorage.getItem(key) || '0', 10);
}

export function incrementTodayPushCount() {
  if (typeof localStorage === 'undefined') return;
  const key = `mcqkash_push_count_${getTodayDateString()}`;
  const current = getTodayPushCount();
  localStorage.setItem(key, String(current + 1));
}

export async function requestAndroidNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.warn('[AndroidPushNotifier] Permission request failed:', e);
    }
  }

  return false;
}

/**
 * Triggers a Personalized Outside-App Android System Notification linked with In-App Alerts.
 * Respects user's custom daily limit (1-5/day) and DND focus mode.
 */
export async function triggerDailyAndroidPushNotification(title, body, targetUrl = './', notifId = null) {
  if (typeof window === 'undefined' || !isAndroidUser()) return false;

  // Respect DND Focus Mode setting
  const dndActive = localStorage.getItem('civilsKash_dndFocusActive') === 'true';
  if (dndActive) return false;

  const pushLimit = getUserDailyPushLimit();
  const currentCount = getTodayPushCount();

  // STRICT USER DAILY LIMIT GUARD:
  // If user has already reached their 1-5 daily push limit today, STOP IMMEDIATELY!
  if (currentCount >= pushLimit) {
    return false;
  }

  // Deduplication check for specific in-app notification ID
  if (notifId) {
    const sentKey = `mcqkash_sent_push_${notifId}_${getTodayDateString()}`;
    if (localStorage.getItem(sentKey)) return false;
    localStorage.setItem(sentKey, 'true');
  }

  // Check permission
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const options = {
      body: body || 'Your daily 10-minute MCQ test is ready! Protect your streak.',
      icon: 'icon-192.png',
      badge: 'favicon-96x96.png',
      tag: notifId ? `mcqkash-${notifId}` : 'mcqkash-daily-alert',
      renotify: false,
      requireInteraction: false,
      vibrate: [100, 50, 100],
      data: { url: targetUrl || './' }
    };

    // 1-second timeout guard on SW ready promise to guarantee zero-drop notification delivery
    const registration = await Promise.race([
      navigator.serviceWorker?.ready,
      new Promise(resolve => setTimeout(() => resolve(null), 1000))
    ]);

    if (registration && 'showNotification' in registration) {
      incrementTodayPushCount();
      await registration.showNotification(title || 'MCQ Kash — Daily Alert', options);
      return true;
    } else if ('Notification' in window && Notification.permission === 'granted') {
      incrementTodayPushCount();
      new Notification(title || 'MCQ Kash — Daily Alert', options);
      return true;
    }
  } catch (err) {
    console.warn('[AndroidPushNotifier] Failed to trigger Android push:', err);
  }

  return false;
}
