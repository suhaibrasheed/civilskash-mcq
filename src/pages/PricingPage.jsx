import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Zap, Shield, Award, AlertCircle,
  BarChart3, Brain, FileCheck, MessageSquare, Check, Infinity,
  TrendingUp, Coins, Unlock, Flame, Send, X, Loader, Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEconomy } from '../context/EconomyContext';
import { useToast } from '../context/ToastContext';
import { useSound } from '../context/SoundContext';
import ScratchCardSection from '../components/ScratchCardSection';
import { KashCoinDisplay } from '../components/EconomyUI';
import Avatar from '../components/Avatars';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL || 'https://eojryhfwtnjyegqhiust.supabase.co'}/functions/v1/razorpay`;

const PLANS = [
  {
    id: 'ONE_WEEK',
    name: '1 Week',
    label: 'Trial',
    price: 99,
    floorPrice: 9,
    originalPrice: 299,
    priceNote: '₹99 / week',
    icon: Flame,
    iconColor: '#f43f5e',
    featured: false,
  },
  {
    id: 'ONE_MONTH',
    name: '1 Month',
    label: 'Starter',
    price: 249,
    floorPrice: 99,
    originalPrice: 499,
    priceNote: '₹249 / month',
    icon: Zap,
    iconColor: '#3b82f6',
    featured: false,
  },
  {
    id: 'THREE_MONTHS',
    name: '3 Months',
    label: 'Super Saver',
    price: 399,
    floorPrice: 249,
    originalPrice: 799,
    priceNote: '₹133 / month',
    icon: BarChart3,
    iconColor: '#10b981',
    featured: false,
  },
  {
    id: 'SIX_MONTHS',
    name: '6 Months',
    label: 'Trending',
    price: 499,
    floorPrice: 349,
    originalPrice: 1199,
    priceNote: '₹83 / month',
    icon: TrendingUp,
    iconColor: '#f59e0b',
    featured: false,
    badge: { text: 'Trending', color: '#f59e0b' },
  },
  {
    id: 'ONE_YEAR',
    name: '1 Year',
    label: 'Popular',
    price: 599,
    floorPrice: 449,
    originalPrice: 1999,
    priceNote: '₹50 / month',
    icon: Award,
    iconColor: '#6366f1',
    featured: false,
    badge: { text: 'Popular', color: '#3b82f6' },
  },
  {
    id: 'LIFETIME',
    name: 'Lifetime',
    label: 'Best Value',
    price: 1149,
    floorPrice: 999,
    originalPrice: 4999,
    priceNote: '₹7 / month equivalent',
    icon: Infinity,
    iconColor: '#a855f7',
    featured: true,
    badge: { text: 'Best Value', color: '#a855f7' },
  },
];

const FEATURES = [
  { icon: Unlock, label: 'Unlock all mock tests & PYQs', desc: 'Full access to current and upcoming exam papers', color: '#10b981' },
  { icon: Coins, label: 'Mint double Kash Coins', desc: 'Earn 2X rewards on correct answers to build streaks', color: '#fbbf24' },
  { icon: MessageSquare, label: 'Master AI Mentor', desc: 'Direct, premium hints & question diagnostic support', color: '#c084fc' },
  { icon: Brain, label: 'Spaced Repetition (SRS)', desc: 'Smart card sets focusing on your weakest areas', color: '#3b82f6' },
  { icon: BarChart3, label: 'Advanced Analytics', desc: 'Track speed index, correct ratios, and accuracy trends', color: '#22d3ee' },
  { icon: Shield, label: 'Ad-Free Interface', desc: 'Fully distraction-free study environment', color: '#f87171' },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { economy, refreshEconomy } = useEconomy();
  const { showToast } = useToast();
  const { playVictory } = useSound();

  const getScratchHistory = () => {
    try {
      const username = economy?.username || 'default';
      const historyKey = `mcqkash_scratch_history_${username}`;
      let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      if (economy && economy.id && economy.id !== 'default_user') {
        let changed = false;
        
        // 1. Sync/Restore Welcome Card
        const hasWelcome = history.some(item => item.type === 'Welcome Card');
        const welcomePending = localStorage.getItem('mcqkash_welcome_coins_pending');
        if (economy.referred_by && !hasWelcome && !welcomePending) {
          history.push({
            id: 'welcome_restored',
            type: 'Welcome Card',
            coins: 150,
            wallet: 0,
            date: 'Welcome'
          });
          changed = true;
        }
        
        // 2. Sync/Restore Referral Cards
        const currentReferralCount = history.filter(item => item.type === 'Referral Card').length;
        const targetReferralCount = Number(economy.scratched_cards_count || 0);
        if (currentReferralCount < targetReferralCount) {
          const diff = targetReferralCount - currentReferralCount;
          for (let i = 0; i < diff; i++) {
            history.push({
              id: `ref_restored_${Date.now()}_${i}`,
              type: 'Referral Card',
              coins: 150,
              wallet: 25,
              date: 'Referred'
            });
          }
          changed = true;
        }
        
        if (changed) {
          localStorage.setItem(historyKey, JSON.stringify(history));
        }
      }
      return history;
    } catch (e) {
      return [];
    }
  };

  const getKashCoinsEarnedFromInvites = () => {
    const history = getScratchHistory();
    if (history.length > 0) {
      return history.reduce((sum, item) => sum + (item.coins || 0), 0);
    }
    return 0;
  };

  const getScratchedReferralCount = () => {
    const history = getScratchHistory();
    // Count only Referral Cards, excluding Welcome Card from invite counts
    return history.filter(item => item.type === 'Referral Card').length;
  };

  const getScratchedWelcomeCount = () => {
    const history = getScratchHistory();
    // Count Welcome Cards scratched
    return history.filter(item => item.type === 'Welcome Card').length;
  };
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [showRewardCenterModal, setShowRewardCenterModal] = useState(false);
  
  // Inviter Card state
  const [inviterData, setInviterData] = useState(null);
  const [inviterLoading, setInviterLoading] = useState(false);

  useEffect(() => {
    if (showRewardCenterModal && economy?.referred_by) {
      const fetchInviterInfo = async () => {
        setInviterLoading(true);
        try {
          const { data, error } = await supabase.rpc('get_public_profile_by_username', {
            target_username: economy.referred_by
          });
          if (!error && data) {
            setInviterData(data);
            setInviterLoading(false);
            return;
          }
        } catch (e) {
          console.warn('RPC failed, falling back to local storage cache');
        }

        // Fallback: search in local leaderboard cache
        try {
          const cacheKey = 'mcqkash_lb_cache_coins';
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { data } = JSON.parse(cached);
            const found = data.find(p => p.username?.toLowerCase() === economy.referred_by.toLowerCase() || p.full_name?.toLowerCase() === economy.referred_by.toLowerCase());
            if (found) {
              setInviterData({
                avatar_id: found.avatar_id || 1,
                rank: found.rank || null,
                full_name: found.full_name || economy.referred_by,
                is_pro: !!found.pro_expires_at && new Date(found.pro_expires_at) > new Date()
              });
              setInviterLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Leaderboard cache search failed');
        }

        setInviterData({ avatar_id: 1, rank: null, full_name: economy.referred_by, is_pro: false });
        setInviterLoading(false);
      };
      fetchInviterInfo();
    }
  }, [showRewardCenterModal, economy?.referred_by]);

  // Body scroll locking when Reward Center is open
  useEffect(() => {
    if (showRewardCenterModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showRewardCenterModal]);
  
  const discount = economy?.premium_discount_earned || 0;

  const handleShareReferral = async () => {
    const shareText = `📚 Preparing for Competitive Exams?\nI'm using MCQkash for topic-wise MCQs, PYQ's, Smart Revision, and exam-focused Mock Test with AI Analysis.\nJoin to compete with me on Leaderboard and USE my referral code "${economy?.username}" when signing up and we'll both earn Jackpot KashCoins + Exclusive FREE Rewards 🎁\n🚀 Click --> https://civilskash.in/mcq`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MCQ Kash',
          text: shareText,
          url: 'https://civilskash.in/mcq'
        });
        showToast("Referral shared successfully! 🚀", "success");
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Web Share failed:", err);
          copyShareFallback(shareText);
        }
      }
    } else {
      copyShareFallback(shareText);
    }
  };

  const copyShareFallback = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Share text copied to clipboard! 📋", "success");
  };

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const handleUpgrade = async (plan) => {
    if (!user) {
      showToast('Sign In to upgrade your account!', 'warning');
      navigate('/profile');
      return;
    }
    if (economy?.user_tier === 'Pro' && economy?.pro_tier === plan.id) {
      showToast('You are already on this plan!', 'info');
      return;
    }
    setLoadingPlan(plan.id);
    try {
      const ok = await loadRazorpay();
      if (!ok) { showToast('Failed to load Razorpay.', 'error'); setLoadingPlan(null); return; }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showToast('Session expired. Sign in again.', 'warning');
        navigate('/profile');
        setLoadingPlan(null);
        return;
      }
      const token = session.access_token;

      const res = await fetch(`${EDGE_FUNCTION_URL}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: plan.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Order failed');
      const { orderId, amount, currency, keyId } = await res.json();

      new window.Razorpay({
        key: keyId, amount, currency,
        name: 'MCQ Kash', description: `${plan.name} Pro Upgrade`,
        order_id: orderId,
        prefill: { email: user.email },
        theme: { color: plan.featured ? '#a855f7' : '#f59e0b' },
        modal: { ondismiss: () => { setLoadingPlan(null); showToast('Cancelled.', 'info'); } },
        handler: async (response) => {
          try {
            const vRes = await fetch(`${EDGE_FUNCTION_URL}/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.id,
              }),
            });
            if (!vRes.ok) throw new Error((await vRes.json()).error);
            const { success } = await vRes.json();
            if (success) {
              confetti({ particleCount: 180, spread: 100, origin: { y: 0.5 }, colors: ['#fbbf24', '#a855f7', '#6366f1', '#10b981', '#f43f5e'] });
              showToast('Welcome to Pro! ★', 'success');
              await refreshEconomy();
              setTimeout(() => navigate('/profile'), 1600);
            }
          } catch (e) { showToast(e.message, 'error'); }
          finally { setLoadingPlan(null); }
        },
      }).open();
    } catch (e) {
      showToast(e.message || 'Checkout failed.', 'error');
      setLoadingPlan(null);
    }
  };

  const isPro = economy?.user_tier === 'Pro';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .pricing-root {
          min-height: 100vh;
          background: #05070a;
          color: #f1f5f9;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          position: relative;
          overflow: hidden;
          padding-bottom: 60px;
        }
        .pricing-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% -10%, rgba(251,191,36,.06) 0%, transparent 55%),
            radial-gradient(ellipse 60% 50% at 80% 110%, rgba(168,85,247,.05) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(67,97,238,.03) 0%, transparent 60%);
          pointer-events: none;
        }

        /* ── NAV ── */
        .pricing-nav {
          position: sticky; top: 0; z-index: 50;
          height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px;
          background: rgba(5,7,10,.75);
          border-bottom: 1px solid rgba(255,255,255,.04);
          backdrop-filter: blur(24px);
        }
        .nav-back {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 16px; border-radius: 12px;
          background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
          color: #94a3b8; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
          cursor: pointer; transition: all .2s;
        }
        .nav-back:hover { background: rgba(255,255,255,.06); color: #f1f5f9; }
        .nav-badge {
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; color: #f59e0b;
        }
        .nav-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #f59e0b;
          box-shadow: 0 0 8px #f59e0b;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

        /* ── HERO ── */
        .pricing-hero {
          text-align: center; padding: 48px 24px 32px;
          max-width: 780px; margin: 0 auto;
        }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 14px; border-radius: 999px;
          background: rgba(251,191,36,.06); border: 1px solid rgba(251,191,36,.15);
          font-size: 10px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase;
          color: #f59e0b; margin-bottom: 18px;
        }
        .hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(34px, 4.5vw, 52px);
          font-weight: 900; line-height: 1.1; letter-spacing: -.03em;
          color: #f8fafc; margin-bottom: 14px;
        }
        .hero-title span {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 40%, #fb923c 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .hero-sub {
          font-family: 'Outfit', sans-serif;
          font-size: 16px; font-weight: 800; letter-spacing: .02em; text-transform: uppercase;
          display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;
        }
        .sub-gopro { color: #fbbf24; }
        .sub-gounlimited { color: #a855f7; }
        .sub-gounstoppable { color: #6366f1; }
        
        .guest-warn {
          display: inline-flex; align-items: center; gap: 8px; margin-top: 18px;
          padding: 10px 16px; border-radius: 14px;
          background: rgba(245,158,11,.04); border: 1px solid rgba(245,158,11,.15);
          font-size: 12px; font-weight: 600; color: rgba(245,158,11,.85); cursor: pointer;
        }
        .guest-warn u { color: #f59e0b; }

        /* ── COMPACT 3-COLUMN CARD STRIP ── */
        .plans-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          max-width: 980px; margin: 0 auto 40px; padding: 0 24px;
        }
        @media(max-width:860px) { .plans-strip { grid-template-columns: repeat(2, 1fr); } }
        @media(max-width:540px) { .plans-strip { grid-template-columns: 1fr; } }

        .plan-card {
          position: relative; border-radius: 18px; padding: 20px;
          background: rgba(255,255,255,.015);
          border: 1px solid rgba(255,255,255,.04);
          display: flex; flex-direction: column; justify-content: space-between;
          gap: 14px;
          transition: all .25s cubic-bezier(.23,1,.32,1);
          cursor: default;
        }
        .plan-card:hover {
          background: rgba(255,255,255,.022);
          border-color: rgba(255,255,255,.1);
          transform: translateY(-2px);
          box-shadow: 0 16px 36px rgba(0,0,0,.3);
        }
        .plan-card.featured {
          background: linear-gradient(145deg, rgba(168,85,247,.05), rgba(99,102,241,.03), rgba(5,7,10,0));
          border-color: rgba(168,85,247,.22);
          box-shadow: 0 0 0 1px rgba(168,85,247,.06), 0 20px 45px rgba(168,85,247,.06);
        }
        .plan-card.featured:hover {
          border-color: rgba(168,85,247,.4);
          box-shadow: 0 0 0 1px rgba(168,85,247,.15), 0 24px 55px rgba(168,85,247,.12);
        }
        .featured-glow {
          position: absolute; inset: -1px; border-radius: 18px;
          background: linear-gradient(135deg, rgba(168,85,247,.1), rgba(99,102,241,.06), transparent 50%);
          pointer-events: none;
        }

        /* Card badge */
        .plan-badge {
          position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
          padding: 2.5px 10px; border-radius: 999px;
          font-size: 8.5px; font-weight: 800; letter-spacing: .15em; text-transform: uppercase;
          white-space: nowrap; display: flex; align-items: center; gap: 4px;
        }
        .badge-amber { background: #f59e0b; color: #05070a; box-shadow: 0 3px 10px rgba(245,158,11,.25); }
        .badge-blue { background: #3b82f6; color: #fff; box-shadow: 0 3px 10px rgba(59,130,246,.25); }
        .badge-purple {
          background: linear-gradient(90deg, #a855f7, #6366f1);
          color: #fff; box-shadow: 0 3px 10px rgba(168,85,247,.3);
        }

        /* Card Header */
        .card-header-row {
          display: flex; align-items: center; justify-content: space-between;
        }
        .plan-meta { display: flex; flex-direction: column; }
        .plan-label {
          font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em;
          color: #475569; margin-bottom: 2px;
        }
        .plan-name {
          font-family: 'Outfit', sans-serif;
          font-size: 18px; font-weight: 800; color: #f1f5f9; letter-spacing: -.02em;
        }
        .plan-card.featured .plan-name {
          background: linear-gradient(135deg, #e9d5ff, #c4b5fd);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .card-icon-wrap {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.05);
        }

        .plan-divider { height: 1px; background: rgba(255,255,255,.03); }

        /* Price details */
        .price-section { display: flex; flex-direction: column; gap: 2px; }
        .price-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
        .price-currency { font-size: 14px; font-weight: 700; color: #64748b; margin-right: 1px; }
        .price-amount {
          font-family: 'Outfit', sans-serif;
          font-size: 34px; font-weight: 900; letter-spacing: -.04em; color: #f8fafc; line-height: 1;
        }
        .plan-card.featured .price-amount {
          background: linear-gradient(135deg, #f0abfc, #a78bfa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .price-strike {
          text-decoration: line-through; color: #475569; font-size: 13.5px; font-weight: 600;
        }
        .price-note {
          font-size: 10px; font-weight: 600; color: #475569; margin-top: 1px;
        }
        .plan-card.featured .price-note { color: #a78bfa; }

        /* Upgrade button */
        .upgrade-btn {
          width: 100%; padding: 9px; border-radius: 12px;
          font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase;
          display: flex; align-items: center; justify-content: center; gap: 5px;
          cursor: pointer; transition: all .2s;
          border: none; outline: none;
        }
        .upgrade-btn:active { transform: scale(.98); }
        .upgrade-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }

        .btn-default {
          background: rgba(255,255,255,.03); color: #cbd5e1;
          border: 1px solid rgba(255,255,255,.05);
        }
        .btn-default:not(:disabled):hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.12); color: #f1f5f9; }

        .btn-featured {
          background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
          color: #fff; box-shadow: 0 4px 18px rgba(168,85,247,.22);
          border: 1px solid rgba(255,255,255,.08);
        }
        .btn-featured:not(:disabled):hover { box-shadow: 0 6px 22px rgba(168,85,247,.35); opacity: .95; }

        .btn-spin {
          width: 12px; height: 12px; border-radius: 50%;
          border: 2px solid currentColor; border-top-color: transparent;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── FEATURES MATRIX PANEL ── */
        .features-panel {
          max-width: 980px; margin: 0 auto 36px; padding: 0 24px;
        }
        .features-box {
          background: rgba(255,255,255,.01);
          border: 1px solid rgba(255,255,255,.04);
          border-radius: 20px; padding: 24px 24px 20px;
          backdrop-filter: blur(12px);
        }
        .features-header {
          display: flex; align-items: center; gap: 8px; margin-bottom: 18px;
        }
        .features-header-title {
          font-family: 'Outfit', sans-serif;
          font-size: 14px; font-weight: 800; color: #f1f5f9; letter-spacing: -.01em;
        }
        .features-header-sub {
          font-size: 10px; color: #475569; font-weight: 600; margin-left: auto;
          text-transform: uppercase; letter-spacing: .1em;
        }
        .features-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
        }
        @media(max-width:680px) { .features-grid { grid-template-columns: 1fr; } }

        .feature-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 10px 12px; border-radius: 12px;
          transition: background .2s;
        }
        .feature-item:hover { background: rgba(255,255,255,.015); }
        .feature-icon-wrap {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          shrink: 0; flex-shrink: 0;
        }
        .feature-text-block { display: flex; flex-direction: column; gap: 2px; }
        .feature-label {
          font-size: 12px; font-weight: 800; color: #cbd5e1;
        }
        .feature-desc {
          font-size: 10px; font-weight: 550; color: #57657a; line-height: 1.4;
        }

        /* ── TRUST FOOTER ── */
        .trust-footer {
          max-width: 980px; margin: 0 auto; padding: 0 24px 36px;
          display: flex; align-items: center; justify-content: center; gap: 32px; flex-wrap: wrap;
          border-top: 1px solid rgba(255,255,255,.03); padding-top: 20px;
        }
        .trust-item { display: flex; align-items: center; gap: 6px; }
        .trust-label { font-size: 10.5px; font-weight: 600; color: #475569; }
      `}</style>

      <div className="pricing-root">

        {/* NAV */}
        <nav className="pricing-nav">
          <button className="nav-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={12} strokeWidth={2.5} /> Back
          </button>
          <div className="nav-badge">
            <div className="nav-dot" />
            Premium Portal
          </div>
        </nav>

        {/* HERO */}
        <section className="pricing-hero">
          <div className="hero-eyebrow">
            <Sparkles size={11} /> Upgrade Plan
          </div>
          <h1 className="hero-title">
            Unlock <span>MCQ Kash Pro</span>
          </h1>
          <div className="hero-sub">
            <span className="sub-gopro">Go Pro.</span>
            <span className="sub-gounlimited">Go Unlimited.</span>
            <span className="sub-gounstoppable">Go Unstoppable.</span>
          </div>
          {!user && (
            <div className="guest-warn" onClick={() => navigate('/profile')}>
              <AlertCircle size={14} />
              <span>You're offline. <u>Sign In</u> to activate your plan.</span>
            </div>
          )}
        </section>

        {/* REFERRAL TILE (Free Users with 0 discount) */}
        {!isPro && discount === 0 && (
          <div className="max-w-[980px] mx-auto px-6 mb-6">
            <div className="bg-gradient-to-r from-cyan-950/20 via-theme-bg/10 to-transparent border border-cyan-500/20 hover:border-cyan-500/35 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative overflow-hidden transition-all duration-300 text-left">
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 pointer-events-none" />
              <div className="space-y-1.5">
                <h4 className="text-lg font-black text-theme-text tracking-tight flex items-center gap-2">
                  <Sparkles size={18} className="text-cyan-400 animate-pulse shrink-0" />
                  Earn your Pro
                </h4>
                <p className="text-xs text-theme-muted font-bold leading-relaxed max-w-[500px]">
                  <strong className="text-cyan-400 font-extrabold">Every friend</strong> you bring makes your <strong className="text-amber-400 font-extrabold">Pro affordable</strong> by <strong className="text-emerald-400 font-extrabold">₹25 per invite</strong>.
                </p>
              </div>
              <button 
                onClick={() => setShowRewardCenterModal(true)}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-500/90 hover:to-blue-600/90 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_4px_14px_rgba(6,182,212,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 flex items-center justify-center gap-1.5"
              >
                <Sparkles size={12} /> Earn Rewards
              </button>
            </div>
          </div>
        )}

        {/* COMPACT PLANS GRID */}
        <div className="plans-strip">
          {PLANS.map((plan) => {
            const isCurrent = isPro && economy?.pro_tier === plan.id;
            const isLoading = loadingPlan === plan.id;
            const PlanIcon = plan.icon;

            const finalPrice = Math.max(plan.floorPrice, plan.price - discount);

            // Recalculate monthly price note if a discount is active
            let activePriceNote = plan.priceNote;
            if (discount > 0) {
              if (plan.id === 'ONE_WEEK') {
                activePriceNote = `₹${finalPrice} / week`;
              } else if (plan.id === 'ONE_MONTH') {
                activePriceNote = `₹${finalPrice} / month`;
              } else if (plan.id === 'THREE_MONTHS') {
                activePriceNote = `₹${Math.round(finalPrice / 3)} / month`;
              } else if (plan.id === 'SIX_MONTHS') {
                activePriceNote = `₹${Math.round(finalPrice / 6)} / month`;
              } else if (plan.id === 'ONE_YEAR') {
                activePriceNote = `₹${Math.round(finalPrice / 12)} / month`;
              } else if (plan.id === 'LIFETIME') {
                activePriceNote = `₹${Math.round(finalPrice / 144)} / month equivalent`;
              }
            }

            return (
              <div
                key={plan.id}
                className={`plan-card${plan.featured ? ' featured' : ''}`}
              >
                {plan.featured && <div className="featured-glow" />}

                {plan.badge && (
                  <div className={`plan-badge ${plan.id === 'LIFETIME' ? 'badge-purple' : plan.id === 'ONE_YEAR' ? 'badge-blue' : 'badge-amber'}`}>
                    <Sparkles size={8} fill="currentColor" />
                    {plan.badge.text}
                  </div>
                )}

                <div className="card-header-row">
                  <div className="plan-meta">
                    <div className="plan-label">{plan.label}</div>
                    <div className="plan-name">{plan.name}</div>
                  </div>
                  <div className="card-icon-wrap">
                    <PlanIcon size={16} style={{ color: plan.iconColor }} />
                  </div>
                </div>

                <div className="plan-divider" />

                <div className="price-section">
                  <div className="price-row">
                    <span className="price-currency">₹</span>
                    <span className="price-amount">{finalPrice}</span>
                    {discount > 0 && finalPrice < plan.price ? (
                      <span className="price-strike">₹{plan.price}</span>
                    ) : (
                      <span className="price-strike">₹{plan.originalPrice}</span>
                    )}
                  </div>
                  <div className="price-note">{activePriceNote}</div>
                  {discount > 0 && finalPrice < plan.price && (
                    <div className="text-[10px] font-bold text-emerald-500 mt-1">
                      Referral Discount Applied: -₹{plan.price - finalPrice}
                    </div>
                  )}
                </div>

                <button
                  className={`upgrade-btn ${plan.featured ? 'btn-featured' : 'btn-default'}`}
                  onClick={() => handleUpgrade(plan)}
                  disabled={isLoading || isCurrent || (loadingPlan !== null)}
                >
                  {isLoading ? (
                    <div className="btn-spin" />
                  ) : isCurrent ? (
                    'Active ✓'
                  ) : (
                    <>
                      <Zap size={10} fill="currentColor" />
                      Upgrade
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* FEATURES PANEL */}
        <div className="features-panel">
          <div className="features-box">
            <div className="features-header">
              <Sparkles size={14} style={{ color: '#f59e0b' }} />
              <span className="features-header-title">Everything included in Pro</span>
              <span className="features-header-sub">Full access benefits</span>
            </div>
            <div className="features-grid">
              {FEATURES.map((f, i) => (
                <div key={i} className="feature-item">
                  <div className="feature-icon-wrap" style={{ background: f.color + '12' }}>
                    <f.icon size={14} style={{ color: f.color }} />
                  </div>
                  <div className="feature-text-block">
                    <span className="feature-label">{f.label}</span>
                    <span className="feature-desc">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TRUST FOOTER */}
        <div className="trust-footer">
          <div className="trust-item">
            <Shield size={12} style={{ color: '#f59e0b' }} />
            <span className="trust-label">Razorpay secured · 128-bit SSL</span>
          </div>
          <div className="trust-item">
            <Zap size={12} style={{ color: '#a78bfa' }} />
            <span className="trust-label">Instant activation after payment</span>
          </div>
          <div className="trust-item">
            <Infinity size={12} style={{ color: '#34d399' }} />
            <span className="trust-label">One-time billing · No auto-renew</span>
          </div>
        </div>

        {/* 🎁 REWARD CENTER MODAL */}
        {showRewardCenterModal && (
          <div 
            className="fixed inset-0 z-[9999] overflow-y-auto overflow-x-hidden custom-scrollbar flex items-start sm:items-center justify-center p-0 sm:p-6 backdrop-blur-md bg-theme-bg/90"
            onClick={(e) => { if (e.target === e.currentTarget) setShowRewardCenterModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-full min-h-screen sm:min-h-0 sm:max-h-[90vh] sm:max-w-md md:max-w-4xl flex flex-col bg-theme-surface border-0 ring-1 ring-theme-border/20 sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative sm:overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="shrink-0 p-6 bg-gradient-to-b from-theme-primary/10 to-transparent flex items-start justify-between relative">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-theme-primary via-theme-accent to-theme-primary opacity-50" />
                <div>
                  <h2 className="text-2xl font-black flex items-center gap-2 text-theme-text italic tracking-tighter">
                    <Sparkles className="text-theme-primary fill-theme-primary animate-pulse" size={24} />
                    Reward Center
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted mt-1 opacity-60">Referral & Milestone Rewards Protocol</p>
                </div>
                <button onClick={() => setShowRewardCenterModal(false)} className="p-2 rounded-full bg-theme-bg/50 hover:bg-theme-bg border border-theme-border/50 transition-all">
                  <X size={18} className="text-theme-muted" />
                </button>
              </div>

              <div className="flex-1 sm:overflow-y-auto sm:custom-scrollbar p-6 sm:p-8 pt-0 flex flex-col md:grid md:grid-cols-2 md:gap-10">
              
              {/* Left Column: Code & Stats */}
              <div className="flex flex-col">
                {/* Inviter Card (if invited by someone) */}
                {economy?.referred_by && (
                  <div className="mb-6 bg-gradient-to-r from-theme-primary/5 via-theme-accent/[0.03] to-transparent border border-theme-primary/20 rounded-3xl p-5 flex items-center justify-between relative overflow-hidden shadow-card hover:shadow-card-hover hover:border-theme-primary/35 hover:scale-[1.01] transition-all duration-350 ease-out group/inviter">
                    <div className="absolute inset-0 bg-grid-white/[0.01] pointer-events-none" />
                    
                    {/* Left Side: Avatar & Inviter Name */}
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-full ring-2 ring-theme-primary/30 group-hover/inviter:ring-theme-primary/50 p-[2px] bg-theme-surface shrink-0 transition-all duration-300">
                        {inviterLoading ? (
                          <div className="w-full h-full rounded-full bg-theme-bg/50 animate-pulse flex items-center justify-center">
                            <Loader size={16} className="text-theme-primary animate-spin" />
                          </div>
                        ) : (
                          <Avatar id={inviterData?.avatar_id || 1} className="w-full h-full rounded-full bg-theme-bg" />
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-primary opacity-90">Invited By</span>
                        <h4 className="font-black text-lg text-theme-text tracking-tight mt-0.5 flex items-center gap-2 leading-none">
                          {inviterLoading ? 'Loading...' : (inviterData?.full_name || economy.referred_by)}
                          {!inviterLoading && inviterData?.is_pro && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[8px] font-black tracking-widest uppercase animate-pulse">PRO</span>
                          )}
                        </h4>
                      </div>
                    </div>

                    {/* Right Side: Trophy Rank Badge */}
                    {!inviterLoading && inviterData?.rank && (
                      <div className="relative z-10 flex items-center gap-1.5 text-[11px] text-amber-500 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/20 font-black shadow-sm shrink-0">
                        <Trophy size={12} className="fill-amber-500" />
                        <span>Rank #{inviterData.rank}</span>
                      </div>
                    )}

                    {/* Visual accent */}
                    <div className="text-4xl font-serif text-theme-primary/10 select-none absolute right-4 top-2 font-bold pointer-events-none">✨</div>
                  </div>
                )}

                {/* Massive Referral Code Box */}
                <div className="flex flex-col items-center justify-center py-6 mb-6 bg-gradient-to-b from-theme-bg/40 to-theme-bg/10 rounded-3xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.15)] border-t border-theme-border/10 ring-1 ring-black/5 dark:ring-white/5 relative overflow-hidden text-center">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-theme-primary/80">Your Referral Code</span>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-theme-text tracking-tighter drop-shadow-2xl mt-3 mb-4 select-all truncate max-w-full px-4 text-center whitespace-nowrap">
                    {economy?.username || '---'}
                  </h1>
                  <button
                    onClick={handleShareReferral}
                    className="px-6 py-2.5 bg-gradient-to-r from-theme-primary to-theme-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md hover:opacity-95 active:scale-98 flex items-center gap-2"
                  >
                    <Send size={12} /> Share Referral
                  </button>
                </div>

                {/* Grid stats */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">Invite Stats</span>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Friends Joined */}
                    <div className="bg-blue-500/[0.03] border border-blue-500/10 rounded-2xl p-4 text-left">
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Friends Joined</span>
                      <div className="text-2xl font-black text-theme-text mt-1">
                        {!economy || economy.id === 'default_user' ? getScratchedReferralCount() : (economy.referral_count || 0)}
                      </div>
                    </div>

                    {/* Earnings */}
                    <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-4 text-left flex flex-col justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Earnings</span>
                      <div className="mt-1">
                        <KashCoinDisplay
                          amount={getKashCoinsEarnedFromInvites()}
                          className="text-2xl font-black text-amber-500"
                          iconClassName="w-[0.9em] h-[0.9em]"
                        />
                      </div>
                    </div>

                    {/* Streak Freeze */}
                    <div className="bg-cyan-500/[0.03] border border-cyan-500/10 rounded-2xl p-4 text-left">
                      <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Streak Freeze</span>
                      <div className="text-2xl font-black text-theme-text mt-1">+{getScratchedReferralCount() + getScratchedWelcomeCount()} Shield</div>
                    </div>

                    {/* Power Surge */}
                    <div className="bg-rose-500/[0.03] border border-rose-500/10 rounded-2xl p-4 text-left">
                      <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Power Surge</span>
                      <div className="text-2xl font-black text-theme-text mt-1">+{(getScratchedReferralCount() * 3) + (getScratchedWelcomeCount() * 7)} Days</div>
                    </div>

                    {/* Wallet Money */}
                    <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl p-4 text-left col-span-2 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Wallet Money</span>
                        <div className="text-2xl font-black text-emerald-500 mt-1">
                          ₹{!economy || economy.id === 'default_user' ? (getScratchedReferralCount() * 25) : (economy.premium_discount_earned || 0)}
                        </div>
                      </div>
                      <span className="text-[9px] text-theme-muted font-bold tracking-wide max-w-[150px] text-right">
                        Applies to premium checkout automatically
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Information & Wallet */}
              <div className="flex flex-col gap-6 mt-6 md:mt-0">
                

                  <ScratchCardSection
                    economy={economy}
                    refreshEconomy={refreshEconomy}
                    showToast={showToast}
                    playVictory={playVictory}
                  />

                  {/* Rewards Program Rules card */}
                  <div className="bg-theme-primary/[0.01] dark:bg-theme-primary/[0.02] backdrop-blur-md border border-theme-primary/15 rounded-3xl p-5 space-y-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">How Referrals Work</span>
                    
                    <div className="space-y-3.5 text-xs text-left">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded bg-theme-primary/10 text-theme-primary flex items-center justify-center font-bold shrink-0 text-[10px]">1</div>
                        <div>
                          <span className="font-extrabold text-theme-text block">Share & Invite</span>
                          <span className="text-theme-muted font-medium text-[11px]">Give your real friends your referral code (i.e username) to sign-up.</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-[10px]">2</div>
                        <div>
                          <span className="font-extrabold text-theme-text block">Friends Get instant benefits</span>
                          <span className="text-theme-muted font-medium text-[11px]">Referees receive a <strong className="text-amber-500">variable 100-250 KashCoins</strong> + <strong className="text-cyan-400">1 Streak Freeze</strong> + <strong className="text-rose-400">7-day Power Surge boost</strong>.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold shrink-0 text-[10px]">3</div>
                        <div>
                          <span className="font-extrabold text-theme-text block">You Get premium rewards</span>
                          <span className="text-theme-muted font-medium text-[11px]">Every referral awards you a <strong className="text-emerald-400">flat ₹25 premium discount</strong> and a <strong className="text-amber-400">Scratch Card</strong> loaded with <strong className="text-amber-500">variable KashCoins</strong>, <strong className="text-cyan-400">freezes</strong>, and <strong className="text-rose-400">surges</strong>!</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 mt-4 pt-3.5 border-t border-theme-border/10 text-[9px] text-red-500 font-extrabold uppercase tracking-widest">
                        <span>⚠️ WARNING: using fake invite emails can result in account ban.</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}

      </div>
    </>
  );
}
