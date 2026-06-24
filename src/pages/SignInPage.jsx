import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { AlertTriangle, User, Mail, Lock, Sparkles, CheckCircle, Check, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useEconomy } from '../context/EconomyContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignInPage() {
  const { user, signIn, signUp, signInWithGoogle, loading } = useAuth();
  const { refreshEconomy } = useEconomy();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  // Basic Credentials
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  // Step state: 
  // 'credentials': Enter Email & Password
  // 'onboarding': Complete profile settings (username, full name, referral) after initial registration
  const [activeStep, setActiveStep] = useState('credentials'); 
  const [tempUser, setTempUser] = useState(null); // stores user instance temporarily during onboarding transition

  // Profile Onboarding State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [onboardingPassword, setOnboardingPassword] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking' | 'valid' | 'invalid' | null
  const [usernameError, setUsernameError] = useState('');
  const [checkingTimeout, setCheckingTimeout] = useState(null);

  const fromPath = location.state?.from || '/';
  const customMessage = location.state?.message || '';

  // Listen to Auth state change: if user is signed in through Google OAuth, check if onboarded
  useEffect(() => {
    if (user && !loading) {
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
            // Google user needs to configure profile onboarding
            setTempUser(user);
            // Pre-suggest username
            const suggested = (user.user_metadata?.username || user.email.split('@')[0])
              .replace(/[^a-zA-Z0-9_]/g, '')
              .toLowerCase();
            setUsername(suggested);
            setFullName(user.user_metadata?.full_name || '');
            setOnboardingPassword(''); // empty for google users so they can set it
            setIsLogin(false);
            setActiveStep('onboarding');
          }
        } else {
          // Default fallback
          navigate(fromPath, { replace: true });
        }
      };
      checkOnboardingStatus();
    }
  }, [user, loading, navigate, fromPath]);

  // Display custom message
  useEffect(() => {
    if (customMessage) {
      showToast(customMessage, 'info', 5000);
    }
  }, [customMessage, showToast]);

  // Debounced uniqueness check in database
  useEffect(() => {
    if (isLogin || activeStep !== 'onboarding' || !username.trim()) {
      setUsernameStatus(null);
      return;
    }

    if (checkingTimeout) clearTimeout(checkingTimeout);

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

    setCheckingTimeout(timeout);
    return () => clearTimeout(timeout);
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

    if (!tempUser && (!onboardingPassword || onboardingPassword.trim().length < 6)) {
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
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          full_name: fullName.trim() || username.trim(),
          onboarded: true
        })
        .eq('id', targetUser.id);

      if (profileError) throw profileError;

      showToast('Profile configured successfully! Welcome aboard 🚀', 'success');
      await refreshEconomy().catch(() => {});
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
      {activeStep === 'onboarding' ? (
        <header className="w-full py-5 px-6 border-b border-theme-border/30 bg-theme-surface/10 backdrop-blur-md flex items-center justify-center relative z-20">
          <span className="text-sm md:text-base font-black tracking-wider text-theme-primary uppercase">
            Setup your Amazing Profile
          </span>
        </header>
      ) : (
        <Header />
      )}
      
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-theme-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-theme-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-[540px] w-full flex flex-col items-center relative z-10 mx-auto px-2">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-theme-surface/50 backdrop-blur-xl rounded-[2.2rem] border border-theme-border p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col justify-between"
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

                    <form onSubmit={handleAuthSubmit} className="space-y-5 relative z-10">
                      <div className="space-y-1">
                        <input
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
                        <input
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
                      {/* Full Name */}
                      <div className="space-y-2 mb-4">
                        <label className="text-[10px] md:text-[11px] font-bold text-theme-muted uppercase tracking-wider block pl-1">Full Name</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted/70">
                            <User size={16} />
                          </div>
                          <input
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
                        <label className="text-[10px] md:text-[11px] font-bold text-theme-muted uppercase tracking-wider block pl-1">Choose Unique Username *</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted font-bold text-xs md:text-sm select-none">
                            @
                          </div>
                          <input
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

                      {/* Set Password (Google signups only) */}
                      {!tempUser && (
                        <div className="space-y-2 mb-4">
                          <label className="text-[10px] md:text-[11px] font-bold text-theme-muted uppercase tracking-wider block pl-1">
                            Set Password *
                          </label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted/70">
                              <Lock size={16} />
                            </div>
                            <input
                              type="password"
                              required
                              value={onboardingPassword}
                              onChange={(e) => setOnboardingPassword(e.target.value)}
                              placeholder="Enter secure password"
                              style={{ color: 'var(--color-text)' }}
                              className="w-full bg-theme-bg border border-theme-border rounded-xl pl-11 pr-5 py-4 text-xs md:text-sm font-semibold focus:outline-none focus:border-theme-primary placeholder:text-theme-muted/50 transition-all"
                            />
                          </div>
                          <p className="text-[9px] md:text-[10px] text-theme-muted/60 pl-1 mt-0.5">
                            Set a password for manual email login later
                          </p>
                        </div>
                      )}

                      {/* Referred By */}
                      <div className="space-y-2 mb-5">
                        <label className="text-[10px] md:text-[11px] font-bold text-theme-muted uppercase tracking-wider block pl-1">Referred By (Optional)</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted/70">
                            <Gift size={16} />
                          </div>
                          <input
                            type="text"
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
