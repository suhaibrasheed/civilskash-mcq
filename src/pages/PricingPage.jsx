import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Zap, Shield, Award, AlertCircle,
  BarChart3, Brain, FileCheck, MessageSquare, Check, Infinity,
  TrendingUp, Coins, Unlock, Flame, Send, X, Loader, Trophy, Clock, Tag, Crown
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

// Charm Pricing Math: Rounds calculated discount to an integer ending in 9
const calculateCharmPrice = (mrp, discountPercent) => {
  if (!discountPercent || discountPercent <= 0) return mrp;
  const rawPrice = mrp * (1 - discountPercent / 100);
  if (rawPrice <= 9) return 9;
  return Math.floor(rawPrice / 10) * 10 + 9;
};

// Compute plan pricing enforcing rules for Heavy Coupons (>75%) vs Moderate Coupons (<=75%)
const computePlanPrice = (plan, appliedCoupon, walletDiscountAmount) => {
  const baseMrp = plan.originalPrice || plan.price;
  const couponDiscountPercent = appliedCoupon ? Number(appliedCoupon.discount_percent) : 0;
  const couponPrice = calculateCharmPrice(baseMrp, couponDiscountPercent);
  const floor = typeof plan.floorPrice === 'number' ? plan.floorPrice : 9;

  // Heavy Coupons (> 75% OFF): Wallet discount is 0 for price calculation & Floor Price can be breached!
  if (couponDiscountPercent > 75) {
    return {
      baseMrp,
      couponDiscountPercent,
      couponPrice,
      effectiveWalletDiscount: 0,
      finalPrice: couponPrice,
      isHeavyCoupon: true,
    };
  }

  // Moderate Coupons (<= 75% OFF) or No Coupon: Wallet discount applies, capped by floor price
  const rawWalletDiscount = walletDiscountAmount > 0 ? walletDiscountAmount : 0;
  const finalPrice = Math.max(floor, couponPrice - rawWalletDiscount);
  const effectiveWalletDiscount = Math.max(0, couponPrice - finalPrice);

  return {
    baseMrp,
    couponDiscountPercent,
    couponPrice,
    effectiveWalletDiscount,
    finalPrice,
    isHeavyCoupon: false,
  };
};

const PLANS = [
  {
    id: 'ONE_WEEK',
    name: '1 Week',
    label: 'Trial',
    price: 49,
    floorPrice: 19,
    originalPrice: 149,
    priceNote: '₹49 / week',
    icon: Flame,
    iconColor: '#f43f5e',
    featured: false,
    days: 7,
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
    days: 30,
  },
  {
    id: 'THREE_MONTHS',
    name: '3 Months',
    label: 'Super Saver',
    price: 399,
    floorPrice: 199,
    originalPrice: 1199,
    priceNote: '₹133 / month',
    icon: BarChart3,
    iconColor: '#10b981',
    featured: false,
    days: 90,
  },
  {
    id: 'SIX_MONTHS',
    name: '6 Months',
    label: 'Trending',
    price: 499,
    floorPrice: 299,
    originalPrice: 1669,
    priceNote: '₹83 / month',
    icon: TrendingUp,
    iconColor: '#f59e0b',
    featured: false,
    days: 180,
    badge: { text: 'Trending', color: '#f59e0b' },
  },
  {
    id: 'ONE_YEAR',
    name: '1 Year',
    label: 'Popular',
    price: 599,
    floorPrice: 399,
    originalPrice: 1999,
    priceNote: '₹50 / month',
    icon: Award,
    iconColor: '#6366f1',
    featured: false,
    days: 365,
    badge: { text: 'Popular', color: '#3b82f6' },
  },
  {
    id: 'LIFETIME',
    name: 'Lifetime (10 Yrs)',
    label: 'Best Value',
    price: 1149,
    floorPrice: 699,
    originalPrice: 3499,
    priceNote: '₹4 / month equivalent',
    icon: Infinity,
    iconColor: '#a855f7',
    featured: true,
    days: 3650,
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

  const scratchHistory = useMemo(() => {
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
  }, [economy?.username, economy?.id, economy?.referred_by, economy?.scratched_cards_count]);

  const getKashCoinsEarnedFromInvites = () => {
    if (scratchHistory.length > 0) {
      return scratchHistory.reduce((sum, item) => sum + (item.coins || 0), 0);
    }
    return 0;
  };

  const getScratchedReferralCount = () => {
    return scratchHistory.filter(item => item.type === 'Referral Card').length;
  };

  const getScratchedWelcomeCount = () => {
    return scratchHistory.filter(item => item.type === 'Welcome Card').length;
  };
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [showRewardCenterModal, setShowRewardCenterModal] = useState(false);
  const [buyingCoins, setBuyingCoins] = useState(false);
  const [isGoingPro, setIsGoingPro] = useState(false);

  // Inviter Card state
  const [inviterData, setInviterData] = useState(null);
  const [inviterLoading, setInviterLoading] = useState(false);

  // Dynamic Coupon State & Logic
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [expiredNotice, setExpiredNotice] = useState(null);

  // 1. Load active applied coupon from localStorage on mount & check anti-cheat device memory
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mcqkash_applied_coupon');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.expires_at && Date.now() > parsed.expires_at) {
          localStorage.removeItem('mcqkash_applied_coupon');
          setExpiredNotice({ code: parsed.code, discount_percent: parsed.discount_percent });
          showToast(`Sorry, your offer period for '${parsed.code}' has expired.`, 'warning');
        } else {
          setAppliedCoupon(parsed);
          if (parsed?.code) setCouponInput(parsed.code);
        }
      }
    } catch (e) {
      console.warn('Failed to load saved coupon state:', e);
    }
  }, []);

  // 2. Countdown Timer Effect for Expiring Coupons
  useEffect(() => {
    if (!appliedCoupon?.expires_at) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const diff = appliedCoupon.expires_at - Date.now();
      if (diff <= 0) {
        setExpiredNotice({ code: appliedCoupon.code, discount_percent: appliedCoupon.discount_percent });
        setAppliedCoupon(null);
        setCouponInput('');
        localStorage.removeItem('mcqkash_applied_coupon');
        setTimeLeft(null);
        showToast(`Sorry, your offer for '${appliedCoupon.code}' has expired!`, 'warning');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [appliedCoupon]);

  // 3. Handle Apply Coupon Code (Anti-Cheat Device Expiry Memory)
  const handleApplyCoupon = async (codeToApply) => {
    const cleanCode = (codeToApply || '').trim().toUpperCase();
    if (!cleanCode) {
      showToast('Please enter a coupon code.', 'warning');
      return;
    }

    setCouponLoading(true);
    setCouponInput(cleanCode);

    // Static In-App Default Fallback (45% OFF works offline)
    if (cleanCode === 'KASH45' || cleanCode === 'KASH35' || cleanCode === 'WELCOME35') {
      const couponObj = {
        code: 'KASH45',
        discount_percent: 45,
        valid_days: 9999,
        expires_at: null,
      };
      setAppliedCoupon(couponObj);
      setExpiredNotice(null);
      localStorage.setItem('mcqkash_applied_coupon', JSON.stringify(couponObj));
      showToast('🎉 In-App 45% OFF Coupon Applied Successfully!', 'success');
      if (playVictory) playVictory();
      setCouponLoading(false);
      return;
    }

    // 100% Pure Dynamic Supabase Query for All Other Coupons
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', cleanCode)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        const validDays = Number(data.valid_days || 15);
        
        // Anti-Cheat Check: Look up saved device-level first-activation expiry timestamp
        const expiryStorageKey = `mcqkash_coupon_expiry_${data.code}`;
        const savedDeviceExpiry = localStorage.getItem(expiryStorageKey);
        let expiresAt = null;

        if (savedDeviceExpiry) {
          const parsedExpiry = Number(savedDeviceExpiry);
          if (Date.now() > parsedExpiry) {
            // Anti-Cheat: User already activated and burned their 15 days on this device!
            setAppliedCoupon(null);
            setExpiredNotice({ code: data.code, discount_percent: Number(data.discount_percent) });
            showToast(`Sorry, your ${validDays}-day offer for '${data.code}' has expired on this device.`, 'error');
            setCouponLoading(false);
            return;
          }
          expiresAt = parsedExpiry;
        } else {
          // First time activating this code on this device! Lock in permanent expiration timestamp
          expiresAt = validDays < 900 ? Date.now() + (validDays * 24 * 60 * 60 * 1000) : null;
          if (expiresAt) {
            localStorage.setItem(expiryStorageKey, String(expiresAt));
          }
        }

        const couponObj = {
          code: data.code,
          discount_percent: Number(data.discount_percent),
          valid_days: validDays,
          expires_at: expiresAt,
        };
        setAppliedCoupon(couponObj);
        setExpiredNotice(null);
        localStorage.setItem('mcqkash_applied_coupon', JSON.stringify(couponObj));
        showToast(`🎉 ${data.discount_percent}% OFF Coupon '${data.code}' Applied!`, 'success');
        if (playVictory) playVictory();
      } else {
        showToast('Invalid or expired coupon code. Join Telegram for today\'s active code!', 'error');
      }
    } catch (err) {
      showToast('Failed to validate coupon. Please try again.', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    localStorage.removeItem('mcqkash_applied_coupon');
    showToast('Coupon removed.', 'info');
  };

  const handleBuyKashCoins = async () => {
    if (!user) {
      showToast('Sign In to purchase KashCoins!', 'warning');
      navigate('/signin');
      return;
    }

    const walletBalance = Number(economy?.premium_discount_earned ?? (getScratchedReferralCount() * 25));
    const appliedDiscount = Math.min(walletBalance, 40);
    const expectedPayPaise = Math.max(900, (49 - appliedDiscount) * 100);

    setBuyingCoins(true);

    try {
      const ok = await loadRazorpay();
      if (!ok) {
        showToast('Failed to load Razorpay SDK.', 'error');
        setBuyingCoins(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showToast('Session expired. Sign in again.', 'warning');
        navigate('/profile');
        setBuyingCoins(false);
        return;
      }
      const token = session.access_token;

      let orderId = null;
      let returnedAmount = null;
      let currency = 'INR';
      let keyId = 'rzp_live_SxuAK5B53kL3qS';

      try {
        const res = await fetch(`${EDGE_FUNCTION_URL}/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ planId: 'BUY_KASH_COINS_1000', discount: appliedDiscount }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.orderId) orderId = data.orderId;
          if (data.amount) returnedAmount = Number(data.amount);
          currency = data.currency || 'INR';
          if (data.keyId) keyId = data.keyId;
        }
      } catch (e) {
        console.warn('Order creation fallback warning:', e);
      }

      const razorpayOptions = {
        key: keyId,
        amount: expectedPayPaise,
        currency: currency,
        name: 'MCQ Kash',
        description: 'Get 1,000 KashCoins Boost',
        prefill: { email: user.email },
        theme: { color: '#f59e0b' },
        modal: { ondismiss: () => { setBuyingCoins(false); showToast('Cancelled.', 'info'); } },
        handler: async (response) => {
          try {
            const vRes = await fetch(`${EDGE_FUNCTION_URL}/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id || orderId || 'test_coins',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature || 'test_sig',
                planId: 'BUY_KASH_COINS_1000',
              }),
            });

            let isVerified = false;
            if (vRes && vRes.ok) {
              isVerified = true;
            } else if (response.razorpay_payment_id) {
              // Resilient fallback: payment ID received, credit 1000 KashCoins via RPC
              const { error: coinsErr } = await supabase.rpc('transact_coins_rpc', { amount: 1000 });
              if (!coinsErr) {
                isVerified = true;
              }
            }

            if (isVerified) {
              if (appliedDiscount > 0 && user?.id) {
                const currentWallet = Number(
                  economy?.premium_discount_earned !== undefined && economy?.premium_discount_earned !== null
                    ? economy.premium_discount_earned
                    : (getScratchedReferralCount() * 25)
                );
                const newWalletBalance = Math.max(0, currentWallet - appliedDiscount);
                try {
                  await supabase
                    .from('profiles')
                    .update({ premium_discount_earned: newWalletBalance })
                    .eq('id', user.id);
                } catch (walletErr) {
                  console.warn('Wallet balance deduction notice:', walletErr);
                }
              }

              confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 }, colors: ['#fbbf24', '#f59e0b', '#10b981'] });
              const successMsg = appliedDiscount > 0
                ? `Payment Successful! ₹${appliedDiscount} Wallet Discount applied. +1,000 KashCoins credited! 🪙`
                : 'Payment Successful! +1,000 KashCoins credited! 🪙';
              showToast(successMsg, 'success');
              if (playVictory) playVictory();
              await refreshEconomy(true);
              window.dispatchEvent(new Event('sync-profile-stats'));
            } else {
              throw new Error('Payment verification failed.');
            }
          } catch (e) {
            showToast(e.message || 'Verification failed.', 'error');
          } finally {
            setBuyingCoins(false);
          }
        }
      };

      if (orderId && returnedAmount === expectedPayPaise) razorpayOptions.order_id = orderId;
      setIsGoingPro(true);
      new window.Razorpay(razorpayOptions).open();
    } catch (e) {
      showToast(e.message || 'Purchase failed.', 'error');
      setBuyingCoins(false);
      setIsGoingPro(false);
    }
  };

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
                is_pro: (found.pro_expiration ? new Date(found.pro_expiration) > new Date() : !!found.is_pro)
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
  
  // Preload Razorpay SDK on mount to eliminate checkout load delay
  useEffect(() => {
    loadRazorpay();
  }, []);

  const discount = economy?.premium_discount_earned || 0;

  const handleShareReferral = async () => {
    const inviteUrl = window.location.origin + (window.location.pathname.startsWith('/mcq') ? '/mcq' : '') + '/signin?ref=' + encodeURIComponent(economy?.username || '');
    const shareText = `📚 Preparing for Competitive Exams?\nI'm using MCQkash for topic-wise MCQs, PYQs, Smart Revision, and exam-focused Mock Test with Expert Analysis.\n\nJoin me on Leaderboard and USE my referral code "${economy?.username}" when signing up and we'll both earn Jackpot Money + Exclusive FREE Rewards 🎁\n\nJoin me here --> ${inviteUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MCQ Kash',
          text: shareText,
          url: inviteUrl
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
      navigate('/signin');
      return;
    }
    if (economy?.user_tier === 'Pro' && economy?.pro_tier === plan.id) {
      showToast('You are already on this plan!', 'info');
      return;
    }
    setLoadingPlan(plan.id);

    // Watchdog safety timer: reset loading state if Razorpay fails to launch or popup is blocked
    const safetyTimer = setTimeout(() => {
      setLoadingPlan(prev => (prev === plan.id ? null : prev));
    }, 8000);

    try {
      const ok = await loadRazorpay();
      if (!ok) {
        clearTimeout(safetyTimer);
        showToast('Failed to load Razorpay.', 'error');
        setLoadingPlan(null);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        clearTimeout(safetyTimer);
        showToast('Session expired. Sign in again.', 'warning');
        navigate('/profile');
        setLoadingPlan(null);
        return;
      }
      const token = session.access_token;

      // Real-time pre-checkout discount sync: update Supabase profiles DB instantly before order creation
      const currentDiscount = Number(economy?.premium_discount_earned ?? (getScratchedReferralCount() * 25));
      try {
        await supabase
          .from('profiles')
          .update({ premium_discount_earned: currentDiscount })
          .eq('id', user.id);
      } catch (syncErr) {
        console.warn('Pre-checkout discount sync notice:', syncErr);
      }

      let orderId = null;
      let returnedAmount = null;
      let currency = 'INR';
      let keyId = 'rzp_live_SxuAK5B53kL3qS';

      const { baseMrp, couponDiscountPercent, couponPrice, effectiveWalletDiscount, finalPrice } = computePlanPrice(plan, appliedCoupon, currentDiscount);
      const expectedAmountPaise = finalPrice * 100;

      try {
        const res = await fetch(`${EDGE_FUNCTION_URL}/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ planId: plan.id, discount: effectiveWalletDiscount, couponCode: appliedCoupon?.code, couponDiscount: couponDiscountPercent }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.orderId) orderId = data.orderId;
          if (data.amount) returnedAmount = Number(data.amount);
          currency = data.currency || 'INR';
          if (data.keyId) keyId = data.keyId;
        } else {
          console.warn("Remote Edge Function create-order returned non-200, using client amount calculation...");
        }
      } catch (edgeErr) {
        console.warn("Remote Edge Function create-order network error, using client amount calculation...", edgeErr);
      }

      const razorpayOptions = {
        key: keyId,
        amount: expectedAmountPaise,
        currency: currency || 'INR',
        name: 'MCQ Kash',
        description: `${plan.name} Pro Upgrade`,
        prefill: { email: user.email },
        theme: { color: plan.featured ? '#a855f7' : '#f59e0b' },
        modal: {
          ondismiss: () => {
            clearTimeout(safetyTimer);
            setLoadingPlan(null);
            showToast('Cancelled.', 'info');
          }
        },
        handler: async (response) => {
          clearTimeout(safetyTimer);
          setIsGoingPro(true);
          try {
            let isSuccess = false;
            let vRes = null;
            let vError = null;

            try {
              vRes = await fetch(`${EDGE_FUNCTION_URL}/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id || orderId || 'test_order_1day',
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature || 'test_sig',
                  planId: plan.id,
                }),
              });
            } catch (netErr) {
              vError = netErr;
              console.warn("Network fetch to verify-payment failed:", netErr.message);
            }

            if (vRes && vRes.ok) {
              const { success } = await vRes.json();
              isSuccess = success;
            } else {
              const errJson = vRes ? await vRes.json().catch(() => ({})) : {};
              console.warn("Backend verify-payment non-200 or network error, attempting client fallback profile sync...", errJson, vError);
              
              // Resilient Fallback: If Razorpay payment succeeded (payment_id present), upgrade user locally
              if (response.razorpay_payment_id) {
                const expDate = new Date();
                const daysToAdd = plan.days || ((plan.id === 'ONE_DAY' || plan.id === 'ONE_HOUR') ? 1 : 30);
                expDate.setTime(expDate.getTime() + Math.round(daysToAdd * 24 * 60 * 60 * 1000));
                const isoExp = expDate.toISOString();

                // Save local Pro override so user gets instant Pro access
                localStorage.setItem(`mcqkash_pro_override_${user.id}`, JSON.stringify({
                  is_pro: true,
                  pro_tier: plan.id,
                  pro_expiration: isoExp,
                }));

                const validDbTier = (plan.id === 'ONE_DAY' || plan.id === 'ONE_HOUR') ? 'ONE_DAY' : plan.id;

                const { error: clientUpdateErr } = await supabase
                  .from('profiles')
                  .update({
                    is_pro: true,
                    pro_tier: validDbTier,
                    pro_expiration: isoExp,
                  })
                  .eq('id', user.id);

                if (clientUpdateErr) {
                  console.warn("Client DB update notice (handled by local override):", clientUpdateErr.message);
                }
                isSuccess = true;
              } else {
                throw new Error(errJson.error || vError?.message || 'Payment verification failed.');
              }
            }

            if (isSuccess) {
              if (currentDiscount > 0 && user?.id) {
                const actualDiscountApplied = Math.min(currentDiscount, Math.max(0, plan.price - (typeof plan.floorPrice === 'number' ? plan.floorPrice : 9)));
                const newWalletBalance = Math.max(0, currentDiscount - actualDiscountApplied);
                try {
                  await supabase
                    .from('profiles')
                    .update({ premium_discount_earned: newWalletBalance })
                    .eq('id', user.id);
                } catch (walletErr) {
                  console.warn('Wallet balance deduction notice on Pro upgrade:', walletErr);
                }
              }

              const expDate = new Date();
              const daysToAdd = plan.days || 30;
              expDate.setTime(expDate.getTime() + Math.round(daysToAdd * 24 * 60 * 60 * 1000));
              const isoExp = expDate.toISOString();

              // Instant optimistic local Pro activation
              localStorage.setItem(`mcqkash_pro_override_${user.id}`, JSON.stringify({
                is_pro: true,
                pro_tier: plan.id,
                pro_expiration: isoExp,
              }));

              // Clear all profile & leaderboard caches so UI updates instantly across all views
              localStorage.removeItem(`mcqkash_profile_cache_${user.id}`);
              localStorage.removeItem(`mcqkash_ranks_cache_${user.id}`);
              localStorage.removeItem('mcqkash_lb_cache_coins');
              localStorage.removeItem('mcqkash_lb_cache_streaks');

              confetti({ particleCount: 180, spread: 100, origin: { y: 0.5 }, colors: ['#fbbf24', '#a855f7', '#6366f1', '#10b981', '#f43f5e'] });
              showToast('Welcome to Pro! ★', 'success');
              await refreshEconomy(true);
              window.dispatchEvent(new Event('sync-profile-stats'));
              setTimeout(() => navigate('/profile'), 1200);
            }
          } catch (e) { showToast(e.message || 'Verification failed.', 'error'); }
          finally { setLoadingPlan(null); setIsGoingPro(false); }
        },
      };

      if (orderId && returnedAmount === expectedAmountPaise) {
        razorpayOptions.order_id = orderId;
      }

      try {
        const rzp = new window.Razorpay(razorpayOptions);
        rzp.on('payment.failed', function (res) {
          clearTimeout(safetyTimer);
          setLoadingPlan(null);
          showToast(res.error?.description || 'Payment failed.', 'error');
        });
        rzp.open();
      } catch (rzpErr) {
        clearTimeout(safetyTimer);
        setLoadingPlan(null);
        showToast('Could not open Razorpay checkout popup. Please try again.', 'error');
      }
    } catch (e) {
      clearTimeout(safetyTimer);
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
            <div className="guest-warn" onClick={() => navigate('/signin')}>
              <AlertCircle size={14} />
              <span>You're offline. <u>Sign In</u> to activate your plan.</span>
            </div>
          )}
        </section>

        {/* 1. URGENCY COUNTDOWN BANNER (Masterpiece Luxury Fintech Style) */}
        {appliedCoupon && appliedCoupon.expires_at && (
          <div className="max-w-[980px] mx-auto px-6 mb-6">
            <div className="bg-gradient-to-r from-slate-900/95 via-amber-950/40 to-slate-900/95 border border-amber-500/35 rounded-2xl p-4 sm:p-4.5 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-2xl shadow-[0_12px_40px_rgba(245,158,11,0.18)] relative overflow-hidden group">
              {/* Luminous Top Shimmer Border */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent pointer-events-none opacity-80" />
              {/* Background ambient glow flare */}
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Left Info Group */}
              <div className="flex items-center gap-3.5 text-left relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                  <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                      YOUR EXCLUSIVE{' '}
                      <span className="text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 font-black px-2.5 py-0.5 rounded-md shadow-[0_2px_12px_rgba(245,158,11,0.4)] tracking-wide text-xs">
                        {appliedCoupon.discount_percent}% OFF
                      </span>{' '}
                      IS LIVE
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-300 font-medium mt-1 leading-snug">
                    Your coupon is active. <span className="text-amber-300 font-bold underline decoration-amber-500/40 underline-offset-2">Complete your upgrade before this offer expires.</span>
                  </p>
                </div>
              </div>

              {/* Right Countdown Timer Vault Display */}
              {timeLeft && (
                <div className="flex items-center gap-3 bg-slate-950/90 border border-amber-500/30 px-4 py-2.5 rounded-xl shrink-0 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] relative z-10">
                  <div className="flex flex-col items-center min-w-[28px]">
                    <span className="text-base font-black text-amber-400 font-mono leading-none drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">{timeLeft.days}d</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">DAYS</span>
                  </div>
                  <span className="text-amber-500/60 font-black text-sm animate-pulse">:</span>
                  <div className="flex flex-col items-center min-w-[28px]">
                    <span className="text-base font-black text-amber-400 font-mono leading-none drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">{String(timeLeft.hours).padStart(2, '0')}h</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">HRS</span>
                  </div>
                  <span className="text-amber-500/60 font-black text-sm animate-pulse">:</span>
                  <div className="flex flex-col items-center min-w-[28px]">
                    <span className="text-base font-black text-amber-400 font-mono leading-none drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">MIN</span>
                  </div>
                  <span className="text-amber-500/60 font-black text-sm animate-pulse">:</span>
                  <div className="flex flex-col items-center min-w-[28px]">
                    <span className="text-base font-black text-amber-400 font-mono leading-none drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">SEC</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. EXPIRED COUPON BANNER (Masterpiece Rose Luxury Banner) */}
        {!appliedCoupon && expiredNotice && (
          <div className="max-w-[980px] mx-auto px-6 mb-6">
            <div className="bg-gradient-to-r from-rose-950/60 via-slate-900/95 to-rose-950/60 border border-rose-500/35 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-2xl shadow-[0_10px_35px_rgba(244,63,94,0.15)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent pointer-events-none opacity-80" />
              <div className="flex items-center gap-3.5 text-left relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/40 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
                  <Clock className="w-5 h-5 text-rose-400 opacity-80" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                      SPECIAL OFFER HAS EXPIRED{' '}
                      <span className="text-rose-200 bg-rose-500/20 font-black px-2 py-0.5 rounded-md border border-rose-500/30 text-xs">
                        {expiredNotice.code}
                      </span>
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-300 font-medium mt-1 leading-snug">
                    Sorry, your <span className="text-white font-bold">{expiredNotice.discount_percent}% OFF</span> offer period has ended for this device. Standard pricing applies.
                  </p>
                </div>
              </div>
              <a
                href="https://t.me/+gGtCAlVgB3I5ZTBl"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-black tracking-wide transition-all flex items-center gap-2 shrink-0 relative z-10"
              >
                <span>Get New Code on Telegram</span>
              </a>
            </div>
          </div>
        )}

        {/* 3. REFERRAL / EARN REWARDS TILE (Placed BEFORE Pricing Grid) */}
        {!isPro && (
          <div className="max-w-[980px] mx-auto px-6 mb-8">
            <div className="bg-gradient-to-r from-cyan-950/40 via-cyan-900/20 to-slate-900/60 border border-cyan-500/30 hover:border-cyan-500/50 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] relative overflow-hidden transition-all duration-300 text-left">
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 pointer-events-none" />
              <div className="space-y-1.5">
                <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Sparkles size={18} className="text-cyan-400 animate-pulse shrink-0" />
                  Earn your Pro
                </h4>
                <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-[500px]">
                  <strong className="text-cyan-400 font-extrabold">Every friend</strong> you bring makes your <strong className="text-amber-400 font-extrabold">Pro affordable</strong> by <strong className="text-emerald-400 font-extrabold">₹25 per invite</strong>.
                </p>
              </div>
              <button 
                onClick={() => setShowRewardCenterModal(true)}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_4px_14px_rgba(6,182,212,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
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

            const { baseMrp, couponDiscountPercent, couponPrice, effectiveWalletDiscount, finalPrice, isHeavyCoupon } = computePlanPrice(plan, appliedCoupon, discount);

            // Recalculate monthly price note if a discount is active
            let activePriceNote = plan.priceNote;
            if (finalPrice < baseMrp) {
              if (plan.id === 'ONE_DAY' || plan.id === 'ONE_HOUR') {
                activePriceNote = `₹${finalPrice} / 1 day pass`;
              } else if (plan.id === 'ONE_WEEK') {
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
                activePriceNote = `₹4 / month equivalent`;
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
                  <div className="price-row flex items-baseline gap-1.5 flex-wrap">
                    <span className="price-currency">₹</span>
                    <span className="price-amount">{finalPrice}</span>
                    {effectiveWalletDiscount > 0 && couponDiscountPercent > 0 && finalPrice < couponPrice && couponPrice < baseMrp ? (
                      <>
                        <span className="line-through text-amber-400/90 font-bold text-xs sm:text-sm">
                          ₹{couponPrice}
                        </span>
                        <span className="price-strike opacity-60 text-xs">
                          ₹{baseMrp}
                        </span>
                      </>
                    ) : couponDiscountPercent > 0 && finalPrice < baseMrp ? (
                      <span className="price-strike opacity-60 text-xs">
                        ₹{baseMrp}
                      </span>
                    ) : effectiveWalletDiscount > 0 && finalPrice < plan.price ? (
                      <>
                        <span className="line-through text-amber-400/90 font-bold text-xs sm:text-sm">
                          ₹{plan.price}
                        </span>
                        <span className="price-strike opacity-60 text-xs">
                          ₹{baseMrp}
                        </span>
                      </>
                    ) : finalPrice < baseMrp ? (
                      <span className="price-strike">₹{baseMrp}</span>
                    ) : null}
                  </div>
                  <div className="price-note">{activePriceNote}</div>
                  {couponDiscountPercent > 0 && (
                    <div className="text-[10px] font-extrabold text-amber-400 mt-1 flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-400 animate-pulse shrink-0" />
                      <span>{couponDiscountPercent}% Coupon Applied ({appliedCoupon.code})</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="text-[10px] font-extrabold text-emerald-400 mt-0.5 flex items-center gap-1">
                      <Coins size={11} className="text-emerald-400 shrink-0" />
                      <span>{isHeavyCoupon ? 'No wallet discount for Mega Coupons' : `Wallet Discount: -₹${effectiveWalletDiscount}`}</span>
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

        {/* 4. BEHAVIORAL FOMO NOTE BELOW PLAN TILES (Masterpiece Luxury Banner) */}
        {appliedCoupon && appliedCoupon.expires_at && (
          <div className="max-w-[980px] mx-auto px-6 mt-4 mb-2">
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900/95 to-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 backdrop-blur-xl shadow-[0_4px_20px_rgba(245,158,11,0.1)] relative overflow-hidden">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Zap size={14} className="text-amber-400 fill-amber-400/30" />
                </div>
                <p className="text-[11px] text-slate-300 font-medium leading-normal">
                  Discount Code <strong className="text-amber-300 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/25">{appliedCoupon.code}</strong> Active · Upgrade before the countdown timer ends to lock in these special prices before they revert to original MRP.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. PREMIUM COUPON CARD (Placed BELOW Pricing Grid) */}
        <div className="max-w-[980px] mx-auto px-6 mt-8 mb-10">
          <div className="bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/95 border border-amber-500/25 hover:border-amber-500/40 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 backdrop-blur-xl shadow-[0_4px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(245,158,11,0.07)] space-y-3.5 relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/45 to-transparent pointer-events-none" />

            {/* Row 1: Title + Subtitle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Tag size={15} className="text-amber-400" />
                </div>
                <h4 className="text-[13px] font-black text-white tracking-tight">Apply Your Discount Coupon?</h4>
              </div>
              <p className="text-[11px] text-slate-400 font-medium sm:text-right pl-[42px] sm:pl-0">Enter your Special Offer Coupon from Telegram</p>
            </div>

            {/* Subtle divider */}
            <div className="h-px bg-slate-800/70" />

            {/* Row 2: Full-width Input + Apply */}
            <div className="flex items-stretch gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon(couponInput)}
                  placeholder="ENTER CODE"
                  className="w-full h-11 bg-slate-950/80 border border-slate-700/60 focus:border-amber-500/50 rounded-xl px-4 text-[11px] font-mono font-bold text-white uppercase tracking-widest placeholder:text-slate-600 placeholder:normal-case placeholder:tracking-normal outline-none transition-all"
                />
                {appliedCoupon && (
                  <button
                    onClick={handleRemoveCoupon}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-rose-400 hover:text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded-md border border-rose-500/20 transition-all"
                  >✕</button>
                )}
              </div>
              <button
                onClick={() => handleApplyCoupon(couponInput)}
                disabled={couponLoading || !couponInput.trim()}
                className="h-11 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_16px_rgba(245,158,11,0.3)] shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                {couponLoading ? <Loader size={12} className="animate-spin" /> : 'Apply'}
              </button>
            </div>

            {/* Row 3: Quick-action buttons OR Applied badge */}
            {!appliedCoupon ? (
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => handleApplyCoupon('KASH45')}
                  title="Tap to apply 45% discount instantly"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black text-amber-400 hover:text-amber-300 transition-all active:scale-95 cursor-pointer"
                  style={{ background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.28)' }}
                >
                  <Sparkles size={12} className="animate-pulse shrink-0" />
                  Use KASH45 (45% OFF)
                </button>
                <a
                  href="https://t.me/+gGtCAlVgB3I5ZTBl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black text-cyan-400 hover:text-cyan-300 transition-all active:scale-95"
                  style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.25)' }}
                >
                  <Send size={12} className="shrink-0" />
                  Get Coupon on Telegram
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-emerald-400 text-[11px] font-black mx-auto w-fit" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Check size={13} className="shrink-0" />
                <span><strong>{appliedCoupon.code}</strong> Applied — {appliedCoupon.discount_percent}% OFF Active</span>
              </div>
            )}

          </div>
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
              <div className="shrink-0 p-6 bg-gradient-to-b from-cyan-500/10 to-transparent flex items-start justify-between relative">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 opacity-50" />
                <div>
                  <h2 className="text-2xl font-black flex items-center gap-2 text-white italic tracking-tighter">
                    <Sparkles className="text-cyan-400 fill-cyan-400 animate-pulse" size={24} />
                    Reward Center
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 opacity-80">Referral & Milestone Rewards Protocol</p>
                </div>
                <button onClick={() => setShowRewardCenterModal(false)} className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 transition-all">
                  <X size={18} className="text-slate-300" />
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
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 opacity-90">Invited By</span>
                        <h4 className="font-black text-lg text-white tracking-tight mt-0.5 flex items-center gap-2 leading-none">
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
                    <div className="text-4xl font-serif text-cyan-500/10 select-none absolute right-4 top-2 font-bold pointer-events-none">✨</div>
                  </div>
                )}

                {/* Massive Referral Code Box */}
                <div className="flex flex-col items-center justify-center py-6 mb-6 bg-slate-900/60 rounded-3xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] border border-slate-800 relative overflow-hidden text-center">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">Your Referral Code</span>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tighter drop-shadow-2xl mt-3 mb-4 select-all truncate max-w-full px-4 text-center whitespace-nowrap">
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
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Invite Stats</span>
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* 1. Wallet Money (FIRST TILE - Full Width col-span-2) */}
                    <div className="bg-emerald-500/[0.03] border border-emerald-500/20 rounded-2xl p-4 text-left col-span-2 flex items-center justify-between">
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                          Wallet Money
                        </span>
                        <div className="text-3xl font-black text-emerald-400 mt-1 tracking-tight">
                          ₹{(() => {
                            if (!economy || economy.id === 'default_user') {
                              return (getScratchedReferralCount() * 25) + 25;
                            }
                            const sc = Number(economy.scratched_cards_count || 0);
                            const welcomeBonus = (economy.referred_by || localStorage.getItem('mcqkash_welcome_coins_pending')) ? 25 : 0;
                            const maxEarned = (sc * 25) + welcomeBonus;
                            const dbBal = economy.premium_discount_earned !== undefined && economy.premium_discount_earned !== null
                              ? Number(economy.premium_discount_earned)
                              : maxEarned;
                            return dbBal;
                          })()}
                        </div>
                      </div>

                      {/* 15 Days Left Badge (Clean, No Emojis, No wrapping) */}
                      {(() => {
                        const lastInviteTime = localStorage.getItem('mcqkash_last_referral_time')
                          ? Number(localStorage.getItem('mcqkash_last_referral_time'))
                          : Date.now();
                        const expiryTime = lastInviteTime + (15 * 24 * 60 * 60 * 1000);
                        const diffMs = expiryTime - Date.now();
                        const daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

                        return (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider shrink-0">
                            <Clock size={12} className="text-rose-400 shrink-0" />
                            <span>{daysLeft} Days Left</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Friends Joined */}
                    <div className="bg-blue-500/[0.03] border border-blue-500/10 rounded-2xl p-4 text-left">
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Friends Joined</span>
                      <div className="text-2xl font-black text-white mt-1">
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
                      <div className="text-2xl font-black text-white mt-1">+{getScratchedReferralCount() + getScratchedWelcomeCount()} Shield</div>
                    </div>

                    {/* Power Surge */}
                    <div className="bg-rose-500/[0.03] border border-rose-500/10 rounded-2xl p-4 text-left">
                      <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Power Surge</span>
                      <div className="text-2xl font-black text-white mt-1">+{(getScratchedReferralCount() * 3) + (getScratchedWelcomeCount() * 7)} Days</div>
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
                  <div className="bg-theme-surface/50 backdrop-blur-md border border-theme-border/40 rounded-3xl p-5 space-y-4 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">How Referrals Work</span>
                    
                    <div className="space-y-3.5 text-xs text-left">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 flex items-center justify-center font-bold shrink-0 text-[10px]">1</div>
                        <div>
                          <span className="font-extrabold text-theme-text block">Share & Invite</span>
                          <span className="text-theme-muted font-medium text-[11px]">Give your real friends your referral code (i.e username) to sign-up.</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 text-[10px]">2</div>
                        <div>
                          <span className="font-extrabold text-theme-text block">Friends Get instant benefits</span>
                          <span className="text-theme-muted font-medium text-[11px]">Referees receive <strong className="text-amber-500">150 KashCoins</strong> + <strong className="text-emerald-500 dark:text-emerald-400">₹25 Wallet Money</strong> + <strong className="text-cyan-500 dark:text-cyan-400">1 Freeze</strong> + <strong className="text-rose-500 dark:text-rose-400">7-day Surge</strong>.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded bg-purple-500/10 text-purple-500 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 text-[10px]">3</div>
                        <div>
                          <span className="font-extrabold text-theme-text block">You Get premium rewards</span>
                          <span className="text-theme-muted font-medium text-[11px]">Every referral awards you a <strong className="text-emerald-500 dark:text-emerald-400">flat ₹25 premium discount</strong> and a <strong className="text-amber-500 dark:text-amber-400">Scratch Card</strong> loaded with rewards!</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 mt-4 pt-3.5 border-t border-theme-border/10 text-[9px] text-red-500 font-extrabold uppercase tracking-widest">
                        <span>⚠️ WARNING: using fake invite emails can result in account ban.</span>
                      </div>
                    </div>
                  </div>

                  {/* How Wallet Works Card */}
                  <div className="bg-slate-900/60 backdrop-blur-md border border-emerald-500/20 rounded-3xl p-5 space-y-3.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-emerald-400" />
                        How Wallet Works
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                        Use It Or Lose It
                      </span>
                    </div>
                    
                    <div className="space-y-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-[10px]">1</div>
                        <div>
                          <span className="font-extrabold text-white block">Earn ₹25 Per Invite & Joining</span>
                          <span className="text-slate-300 font-medium text-[11px]">Inviting a friend adds <strong className="text-emerald-400">₹25 to your Wallet</strong>, and the invited friend also gets <strong className="text-emerald-400">₹25 Wallet Money</strong> on joining!</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold shrink-0 text-[10px]">2</div>
                        <div>
                          <span className="font-extrabold text-white block">Reduces Pro Price & Buys KashCoins</span>
                          <span className="text-slate-300 font-medium text-[11px]">Wallet money automatically reduces your <strong className="text-cyan-400">Pro membership price</strong> at checkout, and can buy <strong className="text-amber-400">KashCoins</strong> in the Coins Vault!</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold shrink-0 text-[10px]">3</div>
                        <div>
                          <span className="font-extrabold text-white block">15-Day Expiry (Resets On Each Invite)</span>
                          <span className="text-slate-300 font-medium text-[11px]">Wallet balance has a <strong className="text-rose-400">15-day "Use It or Lose It" timer</strong>. Every new invite <strong className="text-amber-400">resets your 15-day timer</strong> back to full to keep adding money!</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Minimalist Visual Checkout & Going Premium Loading Overlay */}
        <AnimatePresence>
          {(loadingPlan !== null || buyingCoins || isGoingPro) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl"
            >
              <motion.div
                initial={{ scale: 0.85, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 15 }}
                className="bg-slate-900/95 border border-amber-500/40 rounded-3xl p-8 max-w-xs w-full shadow-[0_30px_90px_rgba(245,158,11,0.25)] text-center flex flex-col items-center gap-5 relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 animate-pulse" />
                
                {/* Visual Shield / Crown & Rotating Ring */}
                <div className="relative w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.3)]">
                  {isGoingPro ? (
                    <Crown className="w-10 h-10 text-amber-400 animate-bounce" style={{ filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.8))' }} />
                  ) : (
                    <Shield className="w-10 h-10 text-amber-400 animate-pulse" />
                  )}
                  <div className="absolute inset-0 rounded-3xl border-2 border-amber-400/60 border-t-transparent animate-spin" />
                </div>

                {/* Animated Heading & Text */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-white font-outfit uppercase tracking-tight flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>{isGoingPro ? `${user?.user_metadata?.full_name || economy?.full_name || 'Aspirant'} going Premium` : 'Securing Checkout'}</span>
                  </h3>
                  <p className="text-[11px] font-medium text-amber-200/90 leading-relaxed">
                    {isGoingPro 
                      ? 'Activating 1.5x KashCoins Boost, Unlocking Full Mocks & Golden Badge...' 
                      : 'Connecting to 256-bit SSL encrypted payment gateway...'}
                  </p>
                </div>

                {/* Minimal Clean Text Badge */}
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/25 shadow-sm">
                  <Sparkles size={12} className="animate-spin text-amber-400 shrink-0" />
                  <span>{isGoingPro ? 'Instant Activation' : 'Razorpay Secured'}</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
