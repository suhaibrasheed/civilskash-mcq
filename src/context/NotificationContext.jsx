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
  const notifFetchedRef = useRef(false);

  const fetchDbNotifications = useCallback(async () => {
    if (!user || !navigator.onLine) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
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

  // Fetch ONCE per login session — the ref persists because this provider never unmounts
  useEffect(() => {
    if (!user) {
      // Reset on logout so next login gets a fresh fetch
      notifFetchedRef.current = false;
      setDbNotifications([]);
      return;
    }
    if (notifFetchedRef.current) return;
    notifFetchedRef.current = true;
    fetchDbNotifications();
  }, [user, fetchDbNotifications]);

  // Pure WebSocket broadcast channel — ZERO hidden HTTP fetches
  // Stays open for the entire session (provider never unmounts)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notif_broadcast_${user.id}`, {
        config: { broadcast: { self: false } }
      })
      .on('broadcast', { event: 'new_notification' }, ({ payload }) => {
        if (!payload) return;
        if (!payload.read) {
          setDbNotifications(prev => [payload, ...prev.filter(x => x.id !== payload.id)]);
          showToast(`⚔️ New Alert: ${payload.message || 'Notification received'}`, 'info');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, showToast]);

  return (
    <NotificationContext.Provider value={{ dbNotifications, setDbNotifications, fetchDbNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
