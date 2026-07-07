import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

// Singleton notification state — lives at App root, never unmounts on navigation
const NotificationContext = createContext({
  dbNotifications: [],
  setDbNotifications: () => {},
  fetchDbNotifications: async () => {},
});

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [dbNotifications, setDbNotifications] = useState([]);
  const lastFetchTimeRef = useRef(0);

  const fetchDbNotifications = useCallback(async (force = false) => {
    if (!user || !navigator.onLine) return;
    
    // Skip if user has never used/received a friend challenge to save egress
    const hasUsedChallenges = localStorage.getItem(`mcqkash_has_used_challenges_${user.id}`) === 'true';
    if (!hasUsedChallenges && !force) {
      return;
    }

    const now = Date.now();
    // 10 minutes cooldown (600,000 ms) unless forced (e.g., manual settings refresh)
    if (!force && now - lastFetchTimeRef.current < 600000) {
      return;
    }

    lastFetchTimeRef.current = now;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, message, metadata, read')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setDbNotifications(data);
      }
    } catch (err) {
      console.warn('[NotificationContext] Failed to fetch notifications:', err);
    }
  }, [user]);

  // Clear state on logout
  useEffect(() => {
    if (!user) {
      setDbNotifications([]);
    }
  }, [user]);

  // Listen to a custom window event to trigger notification synchronization on demand
  useEffect(() => {
    if (!user) return;
    const handleSync = () => {
      fetchDbNotifications().catch(() => {});
    };
    window.addEventListener('sync-notifications', handleSync);
    return () => {
      window.removeEventListener('sync-notifications', handleSync);
    };
  }, [user, fetchDbNotifications]);

  return (
    <NotificationContext.Provider value={{ dbNotifications, setDbNotifications, fetchDbNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
