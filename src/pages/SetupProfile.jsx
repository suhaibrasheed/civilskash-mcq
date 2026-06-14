import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Sparkles, Check, AlertTriangle, ArrowRight, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useEconomy } from '../context/EconomyContext';
import { useToast } from '../context/ToastContext';

export default function SetupProfile() {
  const { user, loading: authLoading } = useAuth();
  const { economy, refreshEconomy } = useEconomy();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [referredBy, setReferredBy] = useState('');
  
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking' | 'valid' | 'invalid' | null
  const [usernameError, setUsernameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingTimeout, setCheckingTimeout] = useState(null);

  // Prefill Full Name from Google metadata or email prefix
  useEffect(() => {
    if (user) {
      const isGoogle = user.app_metadata?.provider === 'google' || 
                       user.app_metadata?.providers?.includes('google') ||
                       user.identities?.some(id => id.provider === 'google');
      setIsGoogleUser(!!isGoogle);

      const googleName = user.user_metadata?.full_name || '';
      if (googleName) {
        setFullName(googleName);
      } else {
        const prefix = user.email.split('@')[0];
        setFullName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
      }

      // Proactively suggest a clean lowercase username
      const suggestedUsername = (user.user_metadata?.username || user.email.split('@')[0])
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toLowerCase();
      setUsername(suggestedUsername);
      validateUsernameLocal(suggestedUsername);
    }
  }, [user]);

  // Debounced DB check for username uniqueness
  useEffect(() => {
    if (!username.trim()) {
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
        console.error('Username uniqueness check failed:', err);
        setUsernameStatus(null);
      }
    }, 450);

    setCheckingTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [username]);

  if (authLoading || (user && !economy)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg text-theme-text">
        <div className="btn-spin w-8 h-8 border-4 border-theme-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect logic: Not logged in -> go to auth. Already onboarded -> go to dashboard.
  if (!user) {
    return <Navigate to="/profile" replace />;
  }

  if (economy?.onboarded) {
    return <Navigate to="/" replace />;
  }

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
      setUsernameError('Only alphanumeric letters & underscores allowed.');
      return false;
    }
    return true;
  };

  const handleUsernameChange = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    setUsername(cleaned);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (usernameStatus !== 'valid') {
      showToast('Please choose a valid unique username.', 'warning');
      return;
    }

    if (isGoogleUser) {
      if (!password.trim() || password.length < 6) {
        showToast('Password must be at least 6 characters.', 'warning');
        return;
      }
    }
    
    setIsSubmitting(true);

    try {
      // 0. If Google user, update password in auth
      if (isGoogleUser && password.trim()) {
        const { error: pwdError } = await supabase.auth.updateUser({ password: password.trim() });
        if (pwdError) {
          throw new Error(`Failed to set password: ${pwdError.message}`);
        }
      }
      // 1. If referredBy is provided, check & apply referral code first
      if (referredBy.trim()) {
        const { data: refResult, error: refError } = await supabase.rpc('apply_referral_code', {
          referrer_username: referredBy.trim()
        });

        if (refError) {
          throw new Error(`Referral error: ${refError.message}`);
        }

        if (refResult && !refResult.success) {
          showToast(refResult.message || 'Referral code is invalid.', 'error');
          setIsSubmitting(false);
          return;
        }

        if (refResult && refResult.success) {
          localStorage.setItem('mcqkash_welcome_coins_pending', refResult.coins_rewarded.toString());
          showToast('Referral code accepted! 🎉', 'success');
        }
      }

      // 2. Update username, full_name, and mark onboarded
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          full_name: fullName.trim() || username.trim(),
          onboarded: true
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local storage representation of onboarding completion
      localStorage.setItem(`mcqkash_onboarded_${user.id}`, 'true');
      
      showToast('Profile configured successfully! Welcome aboard 🚀', 'success');
      await refreshEconomy();
      navigate('/', { replace: true });

    } catch (err) {
      console.error('Setup profile failed:', err);
      showToast(err.message || 'Profile setup failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-theme-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-theme-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-theme-surface border border-theme-border rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-theme-primary via-theme-accent to-theme-primary opacity-80" />

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-theme-primary/15 border border-theme-primary/25 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-theme-primary animate-pulse" size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-theme-text italic uppercase">Configure Profile</h1>
          <p className="text-xs text-theme-muted mt-1.5 font-bold uppercase tracking-wider">Set up your identity on MCQKash</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Input Field */}
          <div className="space-y-2">
            <label className="text-xs font-black text-theme-muted uppercase tracking-wider block">Choose Unique Username *</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={handleUsernameChange}
                placeholder="e.g. topper_ias"
                style={{ color: 'var(--color-text)' }}
                className="w-full bg-theme-bg border border-theme-border rounded-xl pl-4 pr-10 py-3.5 text-sm font-semibold focus:outline-none focus:border-theme-primary placeholder:text-theme-muted/40 transition-colors"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                {usernameStatus === 'checking' && (
                  <div className="w-4 h-4 border-2 border-theme-primary border-t-transparent rounded-full animate-spin" />
                )}
                {usernameStatus === 'valid' && (
                  <Check className="text-emerald-500" size={18} />
                )}
                {usernameStatus === 'invalid' && (
                  <AlertTriangle className="text-rose-500" size={18} />
                )}
              </div>
            </div>
            {usernameError && (
              <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                <AlertTriangle size={12} /> {usernameError}
              </p>
            )}
            <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest opacity-60">
              Username is permanent & cant be changed later
            </p>
          </div>

          {/* Full Name Input Field */}
          <div className="space-y-2">
            <label className="text-xs font-black text-theme-muted uppercase tracking-wider block">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              style={{ color: 'var(--color-text)' }}
              className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-theme-primary placeholder:text-theme-muted/40 transition-colors"
            />
            <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest opacity-60">
              Optional display name for leaderboards.
            </p>
          </div>

          {/* Password Input Field (Only for Google OAuth users) */}
          {isGoogleUser && (
            <div className="space-y-2">
              <label className="text-xs font-black text-theme-muted uppercase tracking-wider block">Set Account Password *</label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value.length < 6) {
                    setPasswordError('Password must be at least 6 characters.');
                  } else {
                    setPasswordError('');
                  }
                }}
                placeholder="Enter a password (e.g. topper123)"
                style={{ color: 'var(--color-text)' }}
                className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-theme-primary placeholder:text-theme-muted/40 transition-colors"
              />
              {passwordError && (
                <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                  <AlertTriangle size={12} /> {passwordError}
                </p>
              )}
              <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest opacity-60">
                Create password you can remember
              </p>
            </div>
          )}

          {/* Referred By Input Field */}
          <div className="space-y-2">
            <label className="text-xs font-black text-theme-muted uppercase tracking-wider block flex items-center gap-1.5">
              <Gift size={14} className="text-theme-accent" />
              Referred By (Optional)
            </label>
            <input
              type="text"
              value={referredBy}
              onChange={(e) => setReferredBy(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
              placeholder="Referrer's username"
              style={{ color: 'var(--color-text)' }}
              className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-theme-primary placeholder:text-theme-muted/40 transition-colors"
            />
            <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest opacity-60">
              Enter friend's username to earn rewards.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || usernameStatus !== 'valid'}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-theme-primary to-theme-accent text-white font-black text-xs md:text-sm uppercase tracking-widest shadow-lg hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <div className="btn-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Complete Onboarding
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
