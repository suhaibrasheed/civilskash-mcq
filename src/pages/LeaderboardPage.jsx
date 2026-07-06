import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import { Award, Sparkles, MessageSquare, Send, Zap, ChevronUp, Lock, AlertTriangle } from 'lucide-react';
import Avatar from '../components/Avatars';
import { useEconomy } from '../context/EconomyContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';

// Mock users have been moved directly to the Supabase database. No hardcoded arrays needed.

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { economy, toggleProTier, setAiSettingsOpen, refreshEconomy, manualRefreshEconomy } = useEconomy();
  const { showToast } = useToast();

  const [leaderboardType, setLeaderboardType] = useState('coins'); // 'coins' | 'streaks'
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [userRank, setUserRank] = useState(null);

  const [statusText, setStatusText] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Toast alert
  const alert = useCallback((msg) => {
    const lower = msg.toLowerCase();
    let type = 'info';
    if (lower.includes('success') || lower.includes('saved') || lower.includes('cleared')) {
      type = 'success';
    } else if (lower.includes('fail') || lower.includes('error') || lower.includes('missing') || lower.includes('incorrect') || lower.includes('not enough')) {
      type = 'error';
    }
    showToast(msg, type);
  }, [showToast]);

  // Ghost Profile Caching Fetch
  const fetchLeaderboard = async (type) => {
    setLeaderboardLoading(true);
    try {
      const cacheKey = `mcqkash_lb_cache_${type}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setLeaderboardData(data);
          setLeaderboardLoading(false);
          return;
        }
      }

      let finalRows = [];

      if (type === 'shoutout') {
        try {
          const { data: dbRows, error } = await supabase.rpc('get_shoutout_feed');
          if (error) throw error;
          // Filter active Pro users on frontend to handle expired users
          finalRows = (dbRows || []).filter(p => p.pro_expires_at && new Date(p.pro_expires_at) > new Date());
        } catch (shoutoutError) {
          console.warn('get_shoutout_feed RPC failed, falling back to profiles query:', shoutoutError);
          try {
            const { data: dbRows, error } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_id, pro_expires_at, status_message, last_status_update_at')
              .not('status_message', 'is', null)
              .limit(50);
            if (error) throw error;
            // Filter active Pro users on frontend
            finalRows = (dbRows || []).filter(p => p.pro_expires_at && new Date(p.pro_expires_at) > new Date());
          } catch (fallbackError) {
            console.error('Profile query fallback failed:', fallbackError);
            finalRows = [];
          }
        }
        // Sort by update timestamp
        finalRows.sort((a, b) => new Date(b.last_status_update_at || 0) - new Date(a.last_status_update_at || 0));
      } else {
        try {
          const { data: dbRows, error } = await supabase.rpc('get_leaderboard_with_radar', {
            leaderboard_type: type,
            viewer_id: user?.id || null
          });
          if (error) throw error;
          finalRows = dbRows || [];
        } catch (radarError) {
          console.warn('get_leaderboard_with_radar RPC failed, falling back to get_top_leaderboard:', radarError);
          try {
            const { data: dbRows, error } = await supabase.rpc('get_top_leaderboard', {
              leaderboard_type: type
            });
            if (error) throw error;
            finalRows = dbRows || [];
          } catch (oldRpcError) {
            console.error('All RPC retrievals failed:', oldRpcError);
            finalRows = [];
          }
        }

        if (type === 'coins') {
          finalRows.sort((a, b) => b.total_coins - a.total_coins);
        } else {
          finalRows.sort((a, b) => b.streak_days - a.streak_days);
        }

        // Assign ranks dynamically, preserving database ranks when there are gaps (radar)
        let computedRows = [];
        for (let i = 0; i < finalRows.length; i++) {
          const row = finalRows[i];
          let rank = i + 1;
          if (i > 0) {
            const prev = computedRows[i - 1];
            if (row.rank && row.rank > prev.rank + 1 && !String(row.id).startsWith('m')) {
              rank = row.rank;
            } else {
              rank = prev.rank + 1;
            }
          } else {
            rank = (row.rank && !String(row.id).startsWith('m')) ? row.rank : 1;
          }
          computedRows.push({ ...row, rank });
        }
        finalRows = computedRows;
      }

      setLeaderboardData(finalRows);

      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: finalRows
      }));
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setLeaderboardData([]);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const fetchUserRank = async (type) => {
    if (!user) {
      setUserRank(null);
      return;
    }

    const now = Date.now();
    const cacheKey = `mcqkash_ranks_cache_${user.id}`;
    const cached = localStorage.getItem(cacheKey);

    // SWR: Load from cache first for instant load
    if (cached) {
      try {
        const { coinsRank, streakRank } = JSON.parse(cached);
        setUserRank(type === 'coins' ? coinsRank : streakRank);
      } catch (e) { /* fall through */ }
    }

    // Always fetch from Supabase to refresh state and update cache
    try {
      const rpcName = type === 'coins' ? 'get_logged_in_user_coins_rank' : 'get_logged_in_user_streak_rank';
      const { data, error } = await supabase.rpc(rpcName);
      if (error) throw error;
      setUserRank(data);

      // Write-back to unified cache
      let cacheObj = { timestamp: now, coinsRank: null, streakRank: null, totalAspirants: null };
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          cacheObj = { ...cacheObj, ...parsed };
        } catch (e) {}
      }
      cacheObj.timestamp = now;
      if (type === 'coins') {
        cacheObj.coinsRank = data;
      } else {
        cacheObj.streakRank = data;
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheObj));
    } catch (err) {
      console.error('Failed to fetch user rank:', err);
      setUserRank(null);
    }
  };



  useEffect(() => {
    fetchLeaderboard(leaderboardType);
    fetchUserRank(leaderboardType);
  }, [leaderboardType, user]);

  useEffect(() => {
    if (economy?.status_message) {
      setStatusText(economy.status_message);
    } else {
      setStatusText('');
    }
  }, [economy]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (economy?.user_tier !== 'Pro') {
      alert('Unlock status message to speak to the global audience. Go Pro!');
      return;
    }
    if (statusText.length > 50) {
      setStatusError('Max 50 characters allowed.');
      return;
    }
    setStatusError('');
    setIsUpdatingStatus(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status_message: statusText.trim() })
        .eq('id', user.id);

      if (error) throw error;

      showToast('Status message updated on global shoutbox! 📢', 'success');
      localStorage.removeItem(`mcqkash_lb_cache_coins`);
      localStorage.removeItem(`mcqkash_lb_cache_streaks`);
      localStorage.removeItem(`mcqkash_lb_cache_shoutout`);
      fetchLeaderboard(leaderboardType);
      if (leaderboardType !== 'shoutout') {
        fetchLeaderboard('shoutout');
      }
      
      if (refreshEconomy) await refreshEconomy();
    } catch (err) {
      console.error('Shoutbox update failed:', err);
      setStatusError(err.message || 'Updates limited to once every 24 hours. Try again later.');
      showToast(err.message || 'You can only update your status once every 24 hours!', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg pb-32 font-sans">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title & Details (Redesigned) */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-gradient-to-r from-theme-primary/10 to-theme-accent/10 border border-theme-primary/20 rounded-full shadow-inner">
            <Award size={16} className="text-theme-primary animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-theme-primary">
              Global Standings
            </span>
          </div>
        </div>

        {/* Your Status Card — glassmorphic */}
        <div className="mb-2 relative overflow-hidden rounded-2xl border border-theme-border bg-theme-surface/60 backdrop-blur-md"
          style={{
            background: 'linear-gradient(120deg, color-mix(in srgb, var(--color-surface) 88%, transparent) 0%, color-mix(in srgb, var(--color-primary) 6%, var(--color-surface) 82%) 100%)',
            boxShadow: '0 4px 24px color-mix(in srgb, var(--color-primary) 12%, transparent), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Ambient glows */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 65%)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 80%, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 65%)', transform: 'translate(-20%, 20%)' }} />

          <div className="relative z-10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Left: Icon + title + rank */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', border: '1.5px solid color-mix(in srgb, var(--color-primary) 30%, transparent)' }}
              >
                <Award size={22} className="text-theme-primary" />
              </div>
              <div>
                <h4 className="font-black text-sm text-theme-text uppercase tracking-wider leading-none mb-1.5 flex items-center gap-2">
                  Your Global Status
                  {user && (
                    <button
                      onClick={async (e) => {
                        const btn = e.currentTarget;
                        btn.disabled = true;
                        const icon = btn.querySelector('svg');
                        if (icon) icon.classList.add('animate-spin');
                        try {
                          await manualRefreshEconomy();
                          showToast('Global standings synced! Standings and stats updated. 🔄', 'success');
                          setTimeout(() => {
                            window.location.reload();
                          }, 500);
                        } catch (err) {
                          console.error('Failed to sync standings:', err);
                          showToast(err.message || 'Unable to update standings. Please try again.', 'error');
                        } finally {
                          btn.disabled = false;
                          if (icon) icon.classList.remove('animate-spin');
                        }
                      }}
                      title="Sync local profile stats to leaderboard"
                      className="p-1 rounded-lg flex items-center justify-center cursor-pointer transition-all active:scale-90 hover:scale-110"
                      style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 22%, transparent)', color: 'var(--color-primary)' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    </button>
                  )}
                </h4>
                <p className="text-[10px] font-black uppercase tracking-widest leading-none" style={{ color: 'var(--color-primary)' }}>
                  {user ? `${leaderboardType === 'streaks' ? 'Streak' : 'Kash'} Ranked #${userRank !== null ? userRank : '---'}` : 'Locked — Guest Mode'}
                </p>
              </div>
            </div>

            {/* Right: Stats */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-theme-border">
              <div className="text-center px-4 py-2 rounded-xl border border-theme-border bg-theme-bg/60">
                <span className="text-xl font-black text-theme-text tracking-tight leading-none block">
                  {(economy?.kash_coins_balance || 0).toLocaleString()}
                </span>
                <span className="text-[9px] font-black text-theme-muted uppercase tracking-wider leading-none mt-1 block">KashCoins</span>
              </div>
              <div className="text-center px-4 py-2 rounded-xl border border-theme-border bg-theme-bg/60">
                <span className="text-xl font-black text-theme-text tracking-tight leading-none block">
                  {(economy?.current_streak_days || 0).toLocaleString()}
                </span>
                <span className="text-[9px] font-black text-theme-muted uppercase tracking-wider leading-none mt-1 block">Streak Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Shoutbox — glassmorphic */}
        <div className="mb-4 relative overflow-hidden rounded-2xl border border-theme-border bg-theme-surface/60 backdrop-blur-md"
          style={{
            background: 'linear-gradient(120deg, color-mix(in srgb, var(--color-surface) 88%, transparent) 0%, color-mix(in srgb, var(--color-accent) 6%, var(--color-surface) 82%) 100%)',
            boxShadow: '0 4px 24px color-mix(in srgb, var(--color-accent) 12%, transparent), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Ambient glows */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 65%)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 80%, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 65%)', transform: 'translate(-20%, 20%)' }} />

          <div className="relative z-10 p-4">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-theme-border">
              <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted flex items-center gap-1.5">
                <MessageSquare size={13} className="text-theme-primary" /> Global Shoutbox Status
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={
                  economy?.user_tier === 'Pro'
                    ? { background: 'color-mix(in srgb, #f59e0b 12%, transparent)', color: '#f59e0b', border: '1px solid color-mix(in srgb, #f59e0b 25%, transparent)', boxShadow: '0 0 12px color-mix(in srgb, #f59e0b 18%, transparent)' }
                    : { background: 'color-mix(in srgb, var(--color-border) 35%, transparent)', color: 'var(--color-muted)', border: '1px solid color-mix(in srgb, var(--color-border) 55%, transparent)' }
                }
              >
                {economy?.user_tier === 'Pro' ? '★ Active Pro' : 'Free Locked'}
              </span>
            </div>

            {/* Body */}
            <div>
              {user ? (
                economy?.user_tier === 'Pro' ? (
                  <div className="w-full">
                    <form onSubmit={handleUpdateStatus} className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          maxLength={50}
                          value={statusText}
                          onChange={(e) => setStatusText(e.target.value)}
                          placeholder="Write a shoutout to the world…"
                          className="w-full rounded-xl px-4 py-2.5 text-xs font-semibold placeholder:text-theme-muted/40 focus:outline-none pr-12 transition-all"
                          style={{
                            background: 'color-mix(in srgb, var(--color-bg) 65%, transparent)',
                            border: '1.5px solid color-mix(in srgb, var(--color-primary) 25%, transparent)',
                            color: 'var(--color-text)',
                            boxShadow: 'inset 0 2px 6px color-mix(in srgb, black 6%, transparent)',
                          }}
                          onFocus={e => e.target.style.boxShadow = `0 0 0 2.5px color-mix(in srgb, var(--color-primary) 35%, transparent), inset 0 2px 6px color-mix(in srgb, black 6%, transparent)`}
                          onBlur={e => e.target.style.boxShadow = 'inset 0 2px 6px color-mix(in srgb, black 6%, transparent)'}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-theme-muted/50">
                          {statusText.length}/50
                        </span>
                      </div>
                      <button
                        type="submit"
                        disabled={isUpdatingStatus}
                        className="px-4 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 hover:opacity-90 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-accent)))' }}
                      >
                        {isUpdatingStatus ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><Send size={11} /> Update</>
                        )}
                      </button>
                    </form>
                    <p className="text-[10px] font-bold mt-2.5 flex items-center gap-1.5 px-0.5 leading-normal"
                      style={{ color: 'color-mix(in srgb, #f59e0b 90%, var(--color-text))' }}
                    >
                      <AlertTriangle size={12} className="shrink-0" style={{ color: '#f59e0b' }} />
                      <span>Doing promotions, abuse, or spam can lead to ban. You can do shoutout every 24hr</span>
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    style={{ background: 'color-mix(in srgb, var(--color-bg) 45%, transparent)', border: '1px solid color-mix(in srgb, var(--color-border) 45%, transparent)' }}
                  >
                    <p className="text-xs text-theme-muted font-semibold">
                      Unlock Status Message to speak to the global audience. Go Pro.
                    </p>
                    <button
                      onClick={() => showToast('Upgrade to Pro inside settings section of Profile.', 'info')}
                      className="self-start sm:self-center px-4 py-1.5 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:opacity-95 transition-all flex items-center gap-1"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                    >
                      <Zap size={10} fill="currentColor" /> Go Pro
                    </button>
                  </div>
                )
              ) : (
                <div className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  style={{ background: 'color-mix(in srgb, var(--color-bg) 45%, transparent)', border: '1px solid color-mix(in srgb, var(--color-border) 45%, transparent)' }}
                >
                  <p className="text-xs text-theme-muted font-semibold">
                    Sign in or create an account to activate your global shoutbox!
                  </p>
                  <button
                    onClick={() => {
                      navigate('/signin', { state: { from: '/leaderboard' } });
                    }}
                    className="self-start sm:self-center px-4 py-1.5 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:opacity-95 transition-all"
                    style={{ background: 'linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-accent)))' }}
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Leaderboard Feed Block */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-theme-muted flex items-center gap-1.5">
              Rankings list
            </h2>

            {/* TRIPLE-CAPSULE CONTROL TOGGLE */}
            <div className="flex bg-theme-surface border border-theme-border p-1 rounded-xl shadow-sm">
              <button
                onClick={() => setLeaderboardType('coins')}
                className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                  leaderboardType === 'coins' ? 'bg-theme-primary text-white shadow-sm' : 'text-theme-muted'
                }`}
              >
                KashCoins
              </button>
              <button
                onClick={() => setLeaderboardType('streaks')}
                className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                  leaderboardType === 'streaks' ? 'bg-theme-primary text-white shadow-sm' : 'text-theme-muted'
                }`}
              >
                Daily Streaks
              </button>
              <button
                onClick={() => setLeaderboardType('shoutout')}
                className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                  leaderboardType === 'shoutout' ? 'bg-theme-primary text-white shadow-sm' : 'text-theme-muted'
                }`}
              >
                Shoutout Feed
              </button>
            </div>
          </div>

          <div className="bg-theme-surface rounded-3xl border border-theme-border shadow-sm overflow-hidden min-h-[400px] relative">
            {leaderboardLoading ? (
              <div className="absolute inset-0 bg-theme-surface/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
                <div className="w-8 h-8 border-4 border-theme-primary/25 border-t-theme-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Fetching live ranks...</p>
              </div>
            ) : null}

            {leaderboardData.length === 0 ? (
              <div className="py-24 text-center text-theme-muted font-bold text-sm">
                No profiles registered yet.
              </div>
            ) : leaderboardType === 'shoutout' ? (
              /* Premium Shoutout Tiles Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                {leaderboardData.map((profile) => {
                  const isUser = user && profile.id === user.id;
                  const isPro = profile.pro_expires_at && new Date(profile.pro_expires_at) > new Date();

                  return (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[140px] ${
                        isUser
                          ? 'bg-theme-primary/10 border-theme-primary/40 shadow-lg shadow-theme-primary/5'
                          : 'bg-theme-surface/40 backdrop-blur-md border border-theme-border hover:border-theme-primary/30 hover:bg-theme-surface/75 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]'
                      }`}
                    >
                      {/* Decorative Quotation Mark in Background */}
                      <div className="absolute -top-3 -right-1 text-8xl font-serif text-theme-text/5 pointer-events-none select-none">
                        “
                      </div>

                      {/* Message Spot (Focal Point) */}
                      <div className="relative z-10 flex-1 flex items-center mb-4">
                        <p className="text-sm italic font-medium text-theme-text/90 leading-relaxed tracking-wide">
                          "{profile.status_message || 'Studying hard to unlock the next milestone! 🚀'}"
                        </p>
                      </div>

                      {/* Footer Metadata */}
                      <div className="relative z-10 flex items-center justify-between pt-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Small Avatar */}
                          <div className={`w-7 h-7 rounded-full shrink-0 relative ${
                            isPro 
                              ? 'ring-1 ring-amber-400 p-[1px] shadow-[0_0_8px_rgba(245,158,11,0.3)]' 
                              : 'border border-theme-border'
                          }`}>
                            <Avatar id={profile.avatar_id || 1} className="w-full h-full rounded-full bg-theme-bg" />
                          </div>
                          <div className="min-w-0">
                            <span className={`font-black text-[11px] tracking-tight truncate flex items-center gap-1 leading-none ${isUser ? 'text-theme-primary' : 'text-theme-text'}`}>
                              {profile.full_name || 'Aspirant'}
                              {isPro && (
                                <Sparkles size={9} className="text-amber-500 shrink-0 animate-pulse" />
                              )}
                            </span>
                          </div>
                        </div>

                        <span className="text-[9px] font-black text-theme-muted uppercase tracking-wider">
                          {profile.last_status_update_at 
                            ? new Date(profile.last_status_update_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
                            : 'Recent'
                          }
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Existing Coins/Streaks Rankings List */
              <div className="flex flex-col">
                {leaderboardData.map((profile, i) => {
                  const rank = profile.rank || (i + 1);
                  const isUser = user && profile.id === user.id;
                  const isPro = profile.pro_expires_at && new Date(profile.pro_expires_at) > new Date();

                  // Check if there's a rank gap for rendering Rivalry Radar divider
                  const showGap = leaderboardType !== 'shoutout' && i > 0 && profile.rank > leaderboardData[i - 1].rank + 1;

                  return (
                    <React.Fragment key={profile.id}>
                      {showGap && (
                        <div className="px-4 py-2.5 bg-gradient-to-r from-theme-primary/5 via-amber-500/5 to-theme-accent/5 border-y border-white/5 flex items-center justify-center gap-2">
                          <div className="h-[1px] bg-white/5 flex-1" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-theme-primary/80 bg-theme-bg px-3 py-1 rounded-full border border-white/10 shadow-sm flex items-center gap-1">
                            <Zap size={10} className="text-theme-primary animate-pulse" />
                            Competitor Radar
                          </span>
                          <div className="h-[1px] bg-white/5 flex-1" />
                        </div>
                      )}
                      <div 
                        className={`p-4 flex items-center justify-between gap-4 transition-all duration-300 ${
                          isUser 
                            ? 'bg-theme-primary/10 border-l-4 border-theme-primary border-b border-white/10' 
                            : isPro
                              ? 'bg-gradient-to-r from-amber-500/5 to-transparent hover:from-amber-500/10 border-l-4 border-l-amber-500 border-b border-amber-500/10 shadow-[inset_0_1px_0_rgba(245,158,11,0.05)]'
                              : 'hover:bg-theme-surface-hover border-b border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {leaderboardType !== 'shoutout' && (
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-[900] text-xs shrink-0 ${
                              rank === 1 ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-amber-950 shadow-md shadow-amber-500/25' :
                              rank === 2 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 shadow-sm' :
                              rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50 shadow-inner' :
                              'bg-theme-bg/85 border border-theme-border text-theme-muted'
                            }`}>
                              {rank}
                            </div>
                          )}

                          {/* Avatar with glow borders */}
                          <div className={`w-10 h-10 rounded-full shrink-0 relative ${
                            isPro 
                              ? 'ring-2 ring-amber-400 p-[2px] shadow-[0_0_12px_rgba(245,158,11,0.4)]' 
                              : 'p-[1px] border border-theme-border'
                          }`}>
                            <Avatar id={profile.avatar_id || 1} className="w-full h-full rounded-full bg-theme-bg" />
                          </div>

                          <div className="min-w-0 flex flex-col justify-center">
                            <span className={`font-black text-sm tracking-tight truncate flex items-center gap-2 ${isUser ? 'text-theme-primary' : 'text-theme-text'}`}>
                              {profile.full_name || 'Aspirant'}
                              {isPro && (
                                <span className="px-2 py-0.5 rounded-full border border-amber-400/40 bg-amber-500/10 text-amber-500 dark:text-amber-400 text-[8.5px] font-black tracking-wider uppercase select-none shrink-0 flex items-center gap-0.5 animate-pulse">
                                  <Sparkles size={8} className="text-amber-500 shrink-0 fill-amber-500" />
                                  PRO
                                </span>
                              )}
                            </span>

                            {profile.status_message && isPro ? (
                              <span className="flex items-center gap-1.5 bg-amber-500/[0.06] border border-amber-500/15 text-amber-500 dark:text-amber-450 font-bold text-[10.5px] tracking-wide px-2.5 py-1 rounded-lg w-fit mt-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                <Sparkles size={10} className="text-amber-500 shrink-0 fill-amber-500" />
                                {profile.status_message}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {leaderboardType === 'shoutout' ? (
                            <>
                              <div className="text-xs font-bold text-theme-muted tracking-tight">
                                {profile.last_status_update_at 
                                  ? new Date(profile.last_status_update_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                  : 'Recent'
                                }
                              </div>
                              <div className="text-[8px] font-black text-theme-muted uppercase tracking-wider leading-none mt-0.5">
                                Updated
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-base font-black text-theme-text tracking-tight">
                                {leaderboardType === 'coins' 
                                  ? (profile.total_coins || 0).toLocaleString() 
                                  : (profile.streak_days || 0).toLocaleString()
                                }
                              </div>
                              <div className="text-[8px] font-black text-theme-muted uppercase tracking-wider leading-none mt-0.5">
                                {leaderboardType === 'coins' ? 'KashCoins' : 'Day Streak'}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </main>

    </div>
  );
}
