import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { AlertTriangle, User, Mail, Lock, Sparkles, Check, Gift, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useEconomy } from '../context/EconomyContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { updateUserEconomy, getUserEconomy } from '../lib/db';
import Avatar, { avatarsList } from '../components/Avatars';

export default function SignInPage() {
  const { user, signIn, signUp, signInWithGoogle, loading } = useAuth();
  const { refreshEconomy } = useEconomy();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const hasFiredReferralToastRef = useRef(false);

  // Synchronously detect referral code on component instantiation
  const getInitialReferralCode = () => {
    try {
      if (typeof window !== 'undefined') {
        const searchRef = new URLSearchParams(window.location.search).get('ref');
        if (searchRef) return searchRef.trim();

        const hash = window.location.hash || '';
        if (hash.includes('?')) {
          const hashRef = new URLSearchParams(hash.substring(hash.indexOf('?'))).get('ref');
          if (hashRef) return hashRef.trim();
        }
      }
      return localStorage.getItem('mcqkash_pending_referral_code') || '';
    } catch (e) {
      return '';
    }
  };

  const initialRef = getInitialReferralCode();

  // Basic Credentials
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isLogin, setIsLogin] = useState(() => !initialRef);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  // Step state:
  // 'credentials': Enter Email & Password
  // 'onboarding': Complete profile settings (username, full name, referral) after initial registration
  const [activeStep, setActiveStep] = useState('credentials');
  const [tempUser, setTempUser] = useState(null); // stores user instance temporarily during onboarding transition
  const [signupProvider, setSignupProvider] = useState('email'); // 'email' | 'google'

  // Profile Onboarding State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [referredBy, setReferredBy] = useState(initialRef);
  const [onboardingPassword, setOnboardingPassword] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking' | 'valid' | 'invalid' | null
  const [usernameError, setUsernameError] = useState('');
  // FIX-01 (BUG-07): useRef avoids re-render cascade on every keystroke
  const checkingTimeoutRef = useRef(null);
  const [selectedAvatarId, setSelectedAvatarId] = useState(1);
  const [selectedGender, setSelectedGender] = useState('male');

  // Inviter Profile State for Rich Referral Banner
  const [inviterProfile, setInviterProfile] = useState(null);
  const [inviterLoading, setInviterLoading] = useState(false);

  useEffect(() => {
    if (!referredBy || !referredBy.trim()) {
      setInviterProfile(null);
      return;
    }

    let isMounted = true;
    const fetchInviterInfo = async () => {
      setInviterLoading(true);
      try {
        // Try RPC get_public_profile_by_username first
        const { data, error } = await supabase.rpc('get_public_profile_by_username', {
          target_username: referredBy.trim()
        });

        let rankVal = data?.rank || null;
        if (!rankVal) {
          try {
            const cached = localStorage.getItem('mcqkash_lb_cache_coins');
            if (cached) {
              const { data: lbData } = JSON.parse(cached);
              const found = (lbData || []).find(p => p.username?.toLowerCase() === referredBy.toLowerCase() || p.full_name?.toLowerCase() === referredBy.toLowerCase());
              if (found) rankVal = found.rank || null;
            }
          } catch (e) {}
        }

        if (!error && data && isMounted) {
          setInviterProfile({
            avatar_id: data.avatar_id || 1,
            full_name: data.full_name || `@${referredBy}`,
            username: data.username || referredBy,
            rank: rankVal,
            is_pro: (data.pro_expiration ? new Date(data.pro_expiration) > new Date() : !!data.is_pro)
          });
          setInviterLoading(false);
          return;
        }

        // Direct table fallback query by username
        const { data: profData, error: profError } = await supabase
          .from('profiles')
          .select('avatar_id, full_name, username, pro_expiration, is_pro')
          .ilike('username', referredBy.trim())
          .maybeSingle();

        if (!profError && profData && isMounted) {
          setInviterProfile({
            avatar_id: profData.avatar_id || 1,
            full_name: profData.full_name || `@${referredBy}`,
            username: profData.username || referredBy,
            rank: rankVal,
            is_pro: (profData.pro_expiration ? new Date(profData.pro_expiration) > new Date() : !!profData.is_pro)
          });
        } else if (isMounted) {
          setInviterProfile({
            avatar_id: 1,
            full_name: `@${referredBy}`,
            username: referredBy,
            rank: rankVal,
            is_pro: false
          });
        }
      } catch (e) {
        if (isMounted) {
          setInviterProfile({
            avatar_id: 1,
            full_name: `@${referredBy}`,
            username: referredBy,
            rank: null,
            is_pro: false
          });
        }
      } finally {
        if (isMounted) setInviterLoading(false);
      }
    };

    fetchInviterInfo();
    return () => { isMounted = false; };
  }, [referredBy]);

  // FIX-04 (BUG-04): Single-fire guard — prevents double Supabase fetch when both user + loading change
  const hasHandledAuthRef = useRef(false);

  const fromPath = location.state?.from || '/';
  const customMessage = location.state?.message || '';

  // FIX-04 (BUG-04): Single-fire guard prevents double Supabase call when user + loading both change
  useEffect(() => {
    // Reset guard on logout so re-login in same session still works
    if (!user) {
      hasHandledAuthRef.current = false;
      return;
    }
    if (!loading && !hasHandledAuthRef.current) {
      hasHandledAuthRef.current = true;
      const checkOnboardingStatus = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarded, username, full_name')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          if (data.onboarded) {
            navigate(fromPath, { replace: true });
          } else {
            // OAuth or un-onboarded user needs to configure profile onboarding
            setTempUser(user);
            // FIX-03 (BUG-03) + REGRESSION-01: Use Supabase app_metadata to correctly detect provider.
            // This avoids overwriting 'email' signupProvider when auth state fires after email signup.
            // Supabase sets app_metadata.provider = 'email' for email signups, 'google' for OAuth.
            const provider = user.app_metadata?.provider || 'email';
            setSignupProvider(provider === 'email' ? 'email' : 'google');
            const suggested = (user.user_metadata?.username || user.email.split('@')[0])
              .replace(/[^a-zA-Z0-9_]/g, '')
              .toLowerCase();
            setUsername(suggested);
            setFullName(user.user_metadata?.full_name || '');
            setOnboardingPassword('');
            setIsLogin(false);
            setActiveStep('onboarding');
          }
        } else {
          // Default fallback: already onboarded, redirect
          navigate(fromPath, { replace: true });
        }
      };
      checkOnboardingStatus();
    }
  }, [user, loading, navigate, fromPath]);

  // Display custom message & parse referral parameter
  useEffect(() => {
    const parseAndSaveReferral = async () => {
      let refCode = null;

      // 1. Check React Router location.search
      if (location.search) {
        refCode = new URLSearchParams(location.search).get('ref');
      }

      // 2. Check window.location.search (before hash in HashRouter URLs like /mcq/signin?ref=xyz)
      if (!refCode && typeof window !== 'undefined' && window.location.search) {
        refCode = new URLSearchParams(window.location.search).get('ref');
      }

      // 3. Check window.location.hash (if query params are inside hash like /mcq/#/signin?ref=xyz)
      if (!refCode && typeof window !== 'undefined' && window.location.hash?.includes('?')) {
        const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?'));
        refCode = new URLSearchParams(hashQuery).get('ref');
      }

      // 4. Check redirect state 'from' path
      if (!refCode && location.state?.from) {
        try {
          const queryStartIndex = location.state.from.indexOf('?');
          if (queryStartIndex !== -1) {
            const redirectParams = new URLSearchParams(location.state.from.substring(queryStartIndex));
            refCode = redirectParams.get('ref');
          }
        } catch (e) {
          console.warn('Failed to parse referral from redirect state:', e);
        }
      }

      if (refCode) {
        refCode = refCode.trim();
        localStorage.setItem('mcqkash_pending_referral_code', refCode);
        setReferredBy(refCode);
        setIsLogin(false); // Directly switch to Join / Sign Up tab for new invitees!
        
        if (!hasFiredReferralToastRef.current) {
          hasFiredReferralToastRef.current = true;
          showToast(`🎁 Referral code "@${refCode}" applied automatically!`, 'info', 4000);
        }

        try {
          await updateUserEconomy({ pending_referral_code: refCode });
        } catch (dbErr) {
          console.error('Failed to save referral to IndexedDB:', dbErr);
        }
      } else {
        if (customMessage && !hasFiredReferralToastRef.current) {
          hasFiredReferralToastRef.current = true;
          showToast(customMessage, 'info', 5000);
        }

        // Fallback: Restore saved referral code from localStorage or IndexedDB if user navigated around
        let savedRef = localStorage.getItem('mcqkash_pending_referral_code');
        if (savedRef) {
          setReferredBy(savedRef);
        } else {
          try {
            const econ = await getUserEconomy();
            if (econ && econ.pending_referral_code) {
              setReferredBy(econ.pending_referral_code);
              localStorage.setItem('mcqkash_pending_referral_code', econ.pending_referral_code);
            }
          } catch (dbErr) {
            console.error('Failed to read referral from IndexedDB:', dbErr);
          }
        }
      }
    };

    parseAndSaveReferral();
  }, [customMessage, location.search, location.state, showToast]);

  // Adjust default avatar selection when onboarding gender toggles
  useEffect(() => {
    const currentAvatar = avatarsList.find(av => av.id === selectedAvatarId);
    if (currentAvatar && currentAvatar.gender !== selectedGender) {
      if (selectedGender === 'male') {
        setSelectedAvatarId(1);
      } else {
        setSelectedAvatarId(6);
      }
    }
  }, [selectedGender]);

  // FIX-01 (BUG-07): Debounced uniqueness check — timer in useRef, not useState
  useEffect(() => {
    if (isLogin || activeStep !== 'onboarding' || !username.trim()) {
      setUsernameStatus(null);
      return;
    }

    if (checkingTimeoutRef.current) clearTimeout(checkingTimeoutRef.current);

    const isLocalValid = validateUsernameLocal(username);
    if (!isLocalValid) return;

    setUsernameStatus('checking');

    const timeout = setTimeout(async () => {
      try {
        const { data: isUnique, error } = await supabase.rpc('check_username_unique', {
          username_to_check: username.trim()
        });

        if (error) throw error;

        if (isUnique) {
          setUsernameStatus('valid');
          setUsernameError('');
        } else {
          setUsernameStatus('invalid');
          setUsernameError('This username is already taken.');
        }
      } catch (err) {
        console.error('Username check failed:', err);
        setUsernameStatus(null);
      }
    }, 400);

    checkingTimeoutRef.current = timeout;
    return () => clearTimeout(checkingTimeoutRef.current);
  }, [username, isLogin, activeStep]);

  const validateUsernameLocal = (val) => {
    if (val.length < 3) {
      setUsernameStatus('invalid');
      setUsernameError('Must be at least 3 characters.');
      return false;
    }
    if (val.length > 20) {
      setUsernameStatus('invalid');
      setUsernameError('Cannot exceed 20 characters.');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(val)) {
      setUsernameStatus('invalid');
      setUsernameError('Letters, numbers, underscores only.');
      return false;
    }
    return true;
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    setIsAuthSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google Auth error:', err);
      setAuthError(err.message || 'Google Sign-in failed.');
      showToast(err.message || 'Google Sign-in failure.', 'error');
      setIsAuthSubmitting(false);
    }
  };

  // Stage 1: Basic Register (Email & Password only) or Sign In
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Email and Password are required.');
      return;
    }
    setAuthError('');
    setIsAuthSubmitting(true);

    try {
      if (isLogin) {
        await signIn(authEmail, authPassword);
        showToast('Successfully logged in! 👋', 'success');
      } else {
        // Sign Up (email + password only) to make it less intimidating
        const signupData = await signUp(authEmail, authPassword);
        const signedUpUser = signupData?.user;

        if (!signedUpUser) {
          throw new Error('Registration failed. Please check your credentials.');
        }

        setTempUser(signedUpUser);
        setSignupProvider('email'); // FIX-03 (BUG-03): mark as email signup so password field stays hidden in step 2
        // Pre-fill suggested username
        const suggest = authEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        setUsername(suggest);
        setFullName(suggest.charAt(0).toUpperCase() + suggest.slice(1));
        setOnboardingPassword(authPassword); // prefill with registration password

        // Advance to step 2: Onboarding Setup
        showToast('Account registered! Now let\'s set up your profile.', 'success');
        setActiveStep('onboarding');
      }
    } catch (err) {
      console.error('Auth submit error:', err);
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
      showToast(err.message || 'Auth failure.', 'error');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Stage 2: Configure Onboarding (Username, Display Name, Referral)
  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    const targetUser = tempUser || user;
    if (!targetUser) return;

    if (usernameStatus !== 'valid') {
      setAuthError('Please select a valid unique username.');
      return;
    }

    // FIX-03 (BUG-03): Only validate optional password for Google users if they typed something
    if (signupProvider === 'google' && onboardingPassword && onboardingPassword.trim().length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setAuthError('');
    setIsAuthSubmitting(true);

    try {
      // 0. Update User Password in Supabase auth (only if it has changed from the registration password, or is a new password for Google users)
      const isPasswordChanged = !tempUser || onboardingPassword.trim() !== authPassword;
      if (isPasswordChanged && onboardingPassword.trim()) {
        const { error: pwdError } = await supabase.auth.updateUser({
          password: onboardingPassword.trim()
        });
        if (pwdError) throw pwdError;
      }

      // 1. Apply Referral Code
      if (referredBy.trim()) {
        try {
          const { data: refResult, error: refError } = await supabase.rpc('apply_referral_code', {
            referrer_username: referredBy.trim()
          });
          if (!refError && refResult && refResult.success) {
            localStorage.setItem('mcqkash_welcome_coins_pending', refResult.coins_rewarded.toString());
          }
        } catch (e) {
          console.error('Referral RPC failed:', e);
        }
      }

      // 2. Complete Profile Onboarding
      const getDeviceInfo = () => {
        try {
          return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            platform: navigator.platform,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            deviceMemory: navigator.deviceMemory || null,
            cpuCores: navigator.hardwareConcurrency || null,
            touchSupport: ('maxTouchPoints' in navigator) ? navigator.maxTouchPoints > 0 : false,
            prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
          };
        } catch (e) {
          return { error: 'Failed to capture device info: ' + e.message };
        }
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          full_name: fullName.trim() || username.trim(),
          avatar_id: selectedAvatarId,
          onboarded: true,
          device_info: getDeviceInfo()
        })
        .eq('id', targetUser.id);

      if (profileError) throw profileError;

      // FIX-02 (BUG-02): Bust the stale profile cache immediately so OnboardingGuard reads fresh data
      localStorage.setItem(`mcqkash_onboarded_${targetUser.id}`, 'true');
      localStorage.removeItem(`mcqkash_profile_cache_${targetUser.id}`);

      showToast('Profile configured successfully! Welcome aboard \uD83D\uDE80', 'success');
      // Await refresh without swallowing errors — navigate only after context is fresh
      try { await refreshEconomy(true); } catch (_) { /* non-fatal; navigate anyway */ }
      navigate(fromPath, { replace: true });
    } catch (err) {
      console.error('Onboarding failed:', err);
      setAuthError(err.message || 'Profile setup failed. Please try again.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans">
      {activeStep !== 'onboarding' && <Header />}
      
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-theme-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-theme-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-[540px] w-full flex flex-col items-center relative z-10 mx-auto px-2">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-theme-surface/50 backdrop-blur-xl rounded-[2.2rem] border border-theme-border p-6 md:p-12 shadow-2xl relative overflow-y-auto flex flex-col justify-between max-h-[90dvh] md:max-h-none"
          >
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-theme-accent/5 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="w-full">
              {/* Centralized Capsule & Small Heading */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-theme-primary/10 border border-theme-primary/20 text-theme-primary text-[10px] md:text-xs font-black uppercase tracking-wider mb-3">
                  <Sparkles size={12} className="animate-pulse" />
                  Next-Gen Learning
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-theme-text tracking-tight uppercase">
                  {activeStep === 'onboarding' 
                    ? 'Configure Profile' 
                    : isLogin 
                      ? 'Sign In to MCQKash' 
                      : 'Join MCQKash'}
                </h1>
                <p className="text-xs md:text-sm text-theme-muted font-bold mt-2 max-w-[340px] mx-auto leading-normal">
                  {activeStep === 'onboarding'
                    ? 'Set up your unique identity on MCQKash to unlock leaderboards and rewards.'
                    : 'Get practice questions, elite explanations, and compete globally.'}
                </p>
              </div>

              {authError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs md:text-sm font-semibold text-center mb-6 flex items-center justify-center gap-1.5 relative z-10">
                  <AlertTriangle size={16} />
                  {authError}
                </div>
              )}

              <AnimatePresence mode="wait" initial={false}>
                {activeStep === 'credentials' ? (
                  <motion.div
                    key="step-credentials"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Form Tabs (Hidden during onboarding stage) */}
                    <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-theme-bg/60 border border-theme-border/50 rounded-xl relative z-10">
                      <button
                        type="button"
                        onClick={() => { setIsLogin(true); setAuthError(''); }}
                        className={`py-3 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider transition-all ${
                          isLogin ? 'bg-theme-primary text-white shadow-sm' : 'text-theme-muted hover:text-theme-text'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsLogin(false); setAuthError(''); }}
                        className={`py-3 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider transition-all ${
        !isLogin ? 'bg-theme-primary text-white shadow-sm' : 'text-theme-muted hover:text-theme-text'
                        }`}
                      >
                        Register
                      </button>
                    </div>

                    {!isLogin && referredBy && (
                      <div className="relative mb-6 rounded-3xl p-6 pt-7 sm:px-8 sm:pt-7 sm:pb-6 bg-theme-surface/90 dark:bg-[#12161f] border-t border-t-amber-500/50 border-b border-b-amber-500/20 border-x border-x-amber-500/30 text-amber-500 shadow-[0_10px_30px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-top-2 duration-300 z-10 overflow-hidden group">
                        {/* Warm amber radial glow behind avatar/name area */}
                        <div className="absolute -top-12 -left-12 w-56 h-56 bg-amber-500/12 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-amber-500/[0.05] rounded-full blur-2xl pointer-events-none" />

                        {/* Content Container */}
                        <div className="relative z-10">
                          {/* Top Section: Avatar + Name & Unified Pills */}
                          <div className="flex items-center gap-5 min-w-0">
                            
                            {/* Avatar with attached PRO badge */}
                            <div className="relative shrink-0">
                              <div className="w-[56px] h-[56px] sm:w-[62px] sm:h-[62px] rounded-full ring-[3px] ring-amber-500/40 p-0.5 bg-theme-surface shadow-md">
                                {inviterLoading ? (
                                  <div className="w-full h-full rounded-full bg-amber-500/20 animate-pulse flex items-center justify-center">
                                    <Sparkles size={16} className="text-amber-500 animate-spin" />
                                  </div>
                                ) : (
                                  <Avatar id={inviterProfile?.avatar_id || 1} className="w-full h-full rounded-full bg-theme-bg" />
                                )}
                              </div>

                              {!inviterLoading && inviterProfile?.is_pro && (
                                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[7.5px] font-black px-1.5 py-[2px] rounded-full border border-theme-surface shadow-md uppercase tracking-wider">
                                  PRO
                                </div>
                              )}
                            </div>

                            {/* Name Block & Unified Badge System */}
                            <div className="flex flex-col justify-center min-w-0 flex-1">
                              {/* Primary Name */}
                              <h4 className="font-extrabold text-lg sm:text-xl text-theme-text tracking-tight truncate leading-snug">
                                {inviterLoading ? `@${referredBy}` : (inviterProfile?.full_name || `@${referredBy}`)}
                              </h4>

                              {/* Unified Badge System Row */}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {!inviterLoading && inviterProfile?.rank && (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-black text-amber-400 uppercase tracking-wider shadow-sm h-6">
                                    <Trophy size={11} className="fill-amber-400 text-amber-400 shrink-0" />
                                    <span>Rank #{inviterProfile.rank}</span>
                                  </div>
                                )}

                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-black text-amber-400 uppercase tracking-wider shadow-sm h-6">
                                  <Sparkles size={11} className="text-amber-400 shrink-0" />
                                  <span>invited you</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="mt-6 mb-5 h-[1px] bg-amber-500/15 w-full" />

                          {/* Bottom CTA — Visual Anchor */}
                          <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-amber-400 tracking-normal">
                            <Gift size={18} className="shrink-0 text-amber-400 animate-bounce" />
                            <span>Sign up to claim Jackpot Money & Rewards</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleAuthSubmit} className="space-y-5 relative z-10">
                      <div className="space-y-1">
                        <label htmlFor="authEmail" className="sr-only">
                          {isLogin ? "Email or Username" : "Email Address"}
                        </label>
                        <input
                          id="authEmail"
                          name="authEmail"
                          autoComplete={isLogin ? "username" : "email"}
                          type="text"
                          required
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder={isLogin ? "Enter Email or Username" : "Enter Email Address"}
                          style={{ color: 'var(--color-text)' }}
                          className="w-full bg-theme-bg border border-theme-border rounded-xl px-5 py-4 text-xs md:text-sm font-semibold focus:outline-none focus:border-theme-primary placeholder:text-theme-muted/50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="authPassword" className="sr-only">
                          Password
                        </label>
                        <input
                          id="authPassword"
                          name="authPassword"
                          autoComplete={isLogin ? "current-password" : "new-password"}
                          type="password"
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="Enter Password"
                          style={{ color: 'var(--color-text)' }}
                          className="w-full bg-theme-bg border border-theme-border rounded-xl px-5 py-4 text-xs md:text-sm font-semibold focus:outline-none focus:border-theme-primary placeholder:text-theme-muted/50"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthSubmitting}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-theme-primary to-theme-accent text-white font-black text-xs md:text-sm uppercase tracking-widest shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-98"
                      >
                        {isAuthSubmitting ? (
                          <div className="btn-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          isLogin ? 'Sign In To Sync' : 'Continue'
                        )}
                      </button>

                      <div className="relative my-6 flex items-center justify-center">
                        <hr className="w-full border-theme-border/50" />
                        <span className="absolute bg-theme-surface px-3 text-[10px] font-bold uppercase tracking-wider text-theme-muted">Or</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={isAuthSubmitting}
                        className="w-full py-4 rounded-xl border border-theme-border hover:border-theme-primary/30 text-theme-text font-black text-xs md:text-sm uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 bg-theme-bg"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        Continue with Google
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step-onboarding"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form onSubmit={handleOnboardingSubmit} className="space-y-6 relative z-10">
                      <div className="space-y-2 mb-4">
                        <label htmlFor="fullName" className="text-[10px] md:text-[11px] font-bold text-theme-muted uppercase tracking-wider block pl-1">Full Name</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted/70">
                            <User size={16} />
                          </div>
                          <input
                            id="fullName"
                            name="name"
                            autoComplete="name"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your Display Name"
                            style={{ color: 'var(--color-text)' }}
                            className="w-full bg-theme-bg border border-theme-border rounded-xl pl-11 pr-5 py-4 text-xs md:text-sm font-semibold focus:outline-none focus:border-theme-primary placeholder:text-theme-muted/50 transition-all"
                          />
                        </div>
                        <p className="text-[9px] md:text-[10px] text-theme-muted/60 pl-1 mt-0.5">Optional display name for global leaderboards</p>
                      </div>

                      {/* Choose Unique Username */}
                      <div className="space-y-2 mb-4">
                        <label htmlFor="username" className="text-[10px] md:text-[11px] font-bold text-theme-muted uppercase tracking-wider block pl-1">Choose Unique Username *</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted font-bold text-xs md:text-sm select-none">
                            @
                          </div>
                          <input
                            id="username"
                            name="username"
                            autoComplete="username"
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                            placeholder="topper_ias"
                            style={{ color: 'var(--color-text)' }}
                            className="w-full bg-theme-bg border border-theme-border rounded-xl pl-10 pr-10 py-4 text-xs md:text-sm font-semibold focus:outline-none focus:border-theme-primary placeholder:text-theme-muted/50 transition-all"
                          />
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                            {usernameStatus === 'checking' && (
                              <div className="w-3.5 h-3.5 border-2 border-theme-primary border-t-transparent rounded-full animate-spin" />
                            )}
                            {usernameStatus === 'valid' && (
                              <Check className="text-emerald-500" size={14} />
                            )}
                            {usernameStatus === 'invalid' && (
                              <AlertTriangle className="text-rose-500" size={14} />
                            )}
                          </div>
                        </div>
                        {usernameError && usernameStatus === 'invalid' && (
                          <p className="text-[10px] md:text-xs text-rose-500 font-bold pl-1 mt-0.5">{usernameError}</p>
                        )}
                        <p className="text-[9px] md:text-[10px] text-theme-muted/60 pl-1 mt-0.5">Username is permanent & can't be changed later</p>
                      </div>

                      {/* Choose Avatar Character */}
                      <div className="space-y-2 mb-4">
                        <label className="text-[10px] md:text-[11px] font-bold text-theme-muted uppercase tracking-wider block pl-1">Choose Avatar Character *</label>
                        
                        {/* Gender tabs */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-theme-bg/60 border border-theme-border/50 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGender('male');
                              setSelectedAvatarId(1);
                            }}
                            className={`py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider transition-all ${
                              selectedGender === 'male' 
                                ? 'bg-theme-primary/10 border border-theme-primary/20 text-theme-primary' 
                                : 'text-theme-muted hover:text-theme-text'
                            }`}
                          >
                            Male
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGender('female');
                              setSelectedAvatarId(6);
                            }}
                            className={`py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider transition-all ${
                              selectedGender === 'female' 
                                ? 'bg-theme-primary/10 border border-theme-primary/20 text-theme-primary' 
                                : 'text-theme-muted hover:text-theme-text'
                            }`}
                          >
                            Female
                          </button>
                        </div>

                        {/* Avatar Icons Grid */}
                        <div className="grid grid-cols-5 gap-2 p-2 bg-theme-bg/30 border border-theme-border/50 rounded-2xl">
                          {avatarsList
                            .filter((av) => av.gender === selectedGender)
                            .map((av) => {
                              const isSelected = selectedAvatarId === av.id;
                              return (
                                <button
                                  key={av.id}
                                  type="button"
                                  onClick={() => setSelectedAvatarId(av.id)}
                                  className={`aspect-square rounded-xl overflow-hidden p-0.5 transition-all relative group ${
                                    isSelected 
                                      ? 'border-2 border-theme-primary ring-2 ring-theme-primary/10 scale-105' 
                                      : 'border border-theme-border/50 hover:border-theme-primary/30 hover:scale-[1.02]'
                                  }`}
                                  title={av.name}
                                >
                                  <Avatar id={av.id} className="w-full h-full rounded-lg" />
                                  {isSelected && (
                                    <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-theme-primary text-white rounded-full flex items-center justify-center border border-theme-surface shadow-md">
                                      <Check size={8} strokeWidth={4} />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      {/* Set Password — shown only for Google/OAuth signups (optional) */}
                      {signupProvider === 'google' && (
                        <div className="space-y-2 mb-4">
                          <label htmlFor="onboardingPassword" className="text-[10px] md:text-[11px] font-bold text-theme-muted uppercase tracking-wider block pl-1">
                            Set Password <span className="font-normal normal-case">(Optional)</span>
                          </label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted/70">
                              <Lock size={16} />
                            </div>
                            <input
                              id="onboardingPassword"
                              name="password"
                              autoComplete="new-password"
                              type="password"
                              value={onboardingPassword}
                              onChange={(e) => setOnboardingPassword(e.target.value)}
                              placeholder="Set a password for email login"
                              style={{ color: 'var(--color-text)' }}
                              className="w-full bg-theme-bg border border-theme-border rounded-xl pl-11 pr-5 py-4 text-xs md:text-sm font-semibold focus:outline-none focus:border-theme-primary placeholder:text-theme-muted/50 transition-all"
                            />
                          </div>
                          <p className="text-[9px] md:text-[10px] text-theme-muted/60 pl-1 mt-0.5">
                            Optional — allows you to sign in with email & password later
                          </p>
                        </div>
                      )}

                      {/* Referred By */}
                      <div className="space-y-2 mb-5">
                        <label htmlFor="referredBy" className="text-[10px] md:text-[11px] font-bold text-theme-muted uppercase tracking-wider block pl-1">Referred By (Optional)</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted/70">
                            <Gift size={16} />
                          </div>
                          <input
                            id="referredBy"
                            name="referredBy"
                            type="text"
                            autoComplete="off"
                            value={referredBy}
                            onChange={(e) => setReferredBy(e.target.value.trim())}
                            placeholder="Referrer's username"
                            style={{ color: 'var(--color-text)' }}
                            className="w-full bg-theme-bg border border-theme-border rounded-xl pl-11 pr-10 py-4 text-xs md:text-sm font-semibold focus:outline-none focus:border-theme-primary placeholder:text-theme-muted/50 transition-all"
                          />
                        </div>
                        <p className="text-[9px] md:text-[10px] text-theme-muted/60 pl-1 mt-0.5">Enter friend's username to Earn Rewards & Discounts</p>
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthSubmitting || usernameStatus !== 'valid'}
                        className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-theme-primary to-theme-accent text-white font-black text-xs md:text-sm uppercase tracking-widest shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                      >
                        {isAuthSubmitting ? (
                          <div className="btn-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Complete Onboarding'
                        )}
                      </button>
                      {/* FIX-05 (BUG-05): Contextual hint so users understand why button is disabled */}
                      {!isAuthSubmitting && usernameStatus !== 'valid' && username.trim().length > 0 && (
                        <p className="text-center text-[10px] text-theme-muted/60 mt-2">
                          {usernameStatus === 'checking'
                            ? '⏳ Checking username availability...'
                            : 'Choose a valid username to continue'}
                        </p>
                      )}
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
