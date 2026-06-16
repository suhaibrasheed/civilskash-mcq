import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles, Check, X, Mail, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { avatarsList } from './Avatars';
import { useEconomy } from '../context/EconomyContext';

export default function ProfileCustomizerModal({ 
  user, 
  isOpen, 
  onComplete, 
  initialName = '', 
  initialAvatarId = 1, 
  onClose 
}) {
  const [fullName, setFullName] = useState(initialName);
  const [gender, setGender] = useState('male'); // 'male' or 'female'
  const [selectedAvatarId, setSelectedAvatarId] = useState(initialAvatarId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { economy } = useEconomy();
  const isOnboarded = economy?.onboarded || (user ? localStorage.getItem(`mcqkash_onboarded_${user.id}`) === 'true' : false);

  // Set initial state when modal opens or initial values load
  useEffect(() => {
    if (isOpen) {
      if (initialName) {
        setFullName(initialName);
      } else if (user?.email) {
        const prefix = user.email.split('@')[0];
        // Capitalize first letter of prefix
        setFullName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
      } else {
        setFullName('');
      }

      if (initialAvatarId) {
        setSelectedAvatarId(initialAvatarId);
        const av = avatarsList.find(a => a.id === initialAvatarId);
        if (av) {
          setGender(av.gender);
        }
      } else {
        setSelectedAvatarId(1);
        setGender('male');
      }
    }
  }, [isOpen, initialName, initialAvatarId, user]);

  // Adjust default avatar selection when gender toggles, but avoid resetting if it already matches
  useEffect(() => {
    const currentAvatar = avatarsList.find(av => av.id === selectedAvatarId);
    if (currentAvatar && currentAvatar.gender !== gender) {
      if (gender === 'male') {
        setSelectedAvatarId(1);
      } else {
        setSelectedAvatarId(6);
      }
    }
  }, [gender]);

  if (!isOpen || !user) return null;

  // Filter avatars based on gender
  const filteredAvatars = avatarsList.filter(av => av.gender === gender);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter a display name.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          avatar_id: selectedAvatarId,
          onboarded: true,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Mark onboarding as complete in localStorage
      localStorage.setItem(`mcqkash_onboarded_${user.id}`, 'true');
      onComplete({ fullName: fullName.trim(), avatarId: selectedAvatarId });
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      setErrorMsg(err.message || 'Onboarding failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-lg bg-theme-surface border border-theme-border rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-y-auto max-h-full"
          style={{ background: 'var(--color-surface)' }}
        >
          {/* Close button (Only show if onboarded or onClose is provided) */}
          {isOnboarded && onClose && (
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl bg-theme-bg/60 border border-theme-border/80 hover:border-rose-500/30 hover:bg-rose-500/10 text-theme-muted hover:text-rose-500 transition-all z-20"
              title="Close"
            >
              <X size={16} />
            </button>
          )}

          {/* Decorative Background Mesh */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-theme-primary/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-theme-accent/5 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-theme-primary/10 border border-theme-primary/20 rounded-full">
                <Sparkles size={14} className="text-theme-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-primary">
                  {isOnboarded ? 'Profile Settings' : 'Onboarding Phase 2'}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-theme-text tracking-tight">
                {isOnboarded ? 'Update Your Profile' : 'Create Your Profile'}
              </h2>
              <p className="text-xs text-theme-muted font-medium max-w-sm mx-auto">
                {isOnboarded
                  ? 'Change your display name or pick a new avatar character below.'
                  : 'Customize your identity to claim your spot on the global leaderboards and start earning KashCoins.'}
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account info section (Read-only for visual clarity) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-theme-bg/60 border border-theme-border rounded-2xl p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-theme-muted shrink-0">
                    <Mail size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-wider text-theme-muted block leading-none mb-1">
                      Email Address
                    </span>
                    <p className="text-xs font-bold text-theme-text/80 truncate leading-tight" title={user?.email}>
                      {user?.email || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-theme-muted shrink-0">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-theme-muted block leading-none mb-1">
                      Joined Date
                    </span>
                    <p className="text-xs font-bold text-theme-text/80 leading-tight">
                      {economy?.joinee_date ? new Date(economy.joinee_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : 'Not Available'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Input 1: Display Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-theme-muted block">
                  Display Name
                </label>
                <div className="relative flex items-center">
                  <User size={18} className="absolute left-4 text-theme-muted" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    style={{ color: 'var(--color-text)' }}
                    className="w-full bg-theme-bg border-2 border-theme-border rounded-2xl pl-12 pr-4 py-3.5 text-base font-semibold focus:outline-none focus:border-theme-primary focus:ring-4 focus:ring-theme-primary/10 transition-all placeholder:text-theme-muted/50"
                  />
                </div>
              </div>

              {/* Input 2: Gender Selector Toggle */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-theme-muted block">
                  Select Gender (For Avatar Matching)
                </label>
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-theme-bg border border-theme-border rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                      gender === 'male'
                        ? 'bg-theme-primary text-white shadow-md'
                        : 'text-theme-muted hover:text-theme-text'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                      gender === 'female'
                        ? 'bg-theme-primary text-white shadow-md'
                        : 'text-theme-muted hover:text-theme-text'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              {/* Avatar Grid */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-theme-muted block">
                  Choose Your Character
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {filteredAvatars.map((avatar) => {
                    const isSelected = selectedAvatarId === avatar.id;
                    const AvatarSVG = avatar.component;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatarId(avatar.id)}
                        className={`relative aspect-square rounded-2xl overflow-hidden p-1 transition-all border-2 active:scale-95 group ${
                          isSelected
                            ? 'border-theme-primary bg-theme-primary/10 scale-105 shadow-lg shadow-theme-primary/15'
                            : 'border-theme-border bg-theme-bg hover:border-theme-primary/30'
                        }`}
                      >
                        <AvatarSVG className="w-full h-full transition-transform duration-300 group-hover:scale-105" />
                        {isSelected && (
                          <div className="absolute bottom-1 right-1 w-4 h-4 bg-theme-primary text-white rounded-full flex items-center justify-center border border-theme-surface">
                            <Check size={8} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-theme-primary to-theme-accent text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-theme-primary/15 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  isOnboarded ? 'Save Changes' : 'Complete Registration'
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
