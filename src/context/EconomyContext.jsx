import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getUserEconomy, 
  updateUserEconomy, 
  transactKC as dbTransactKC, 
  toggleProTier as dbToggleProTier, 
  spendRevisionKC as dbSpendRevisionKC 
} from '../lib/db';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const EconomyContext = createContext(null);

export function EconomyProvider({ children }) {
  const [economy, setEconomy] = useState(null);
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const { user } = useAuth();
  const [prevUser, setPrevUser] = useState(user);

  const clearLeaderboardCache = () => {
    localStorage.removeItem('mcqkash_lb_cache_coins');
    localStorage.removeItem('mcqkash_lb_cache_streaks');
  };

  // Helper to load economy (merging live Supabase data if logged in)
  const loadEconomy = async () => {
    try {
      const localData = await getUserEconomy();
      let updatedData = { ...localData };

      if (user) {
        // Fetch Supabase Profile
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // If trigger has a slight delay or profile is not found, insert manually
        if (error || !profile) {
          console.warn('Profile not found in database, creating fallback profile...');
          const defaultName = user.email.split('@')[0];
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
              avatar_id: 1,
              liquid_coins: 100,
              staked_coins: 0,
              streak_days: 0
            })
            .select()
            .single();

          if (insertError) {
            console.error('Failed to create fallback profile:', insertError);
            // Construct a local fallback profile so the app doesn't lock up on the loading splash screen
            profile = {
              id: user.id,
              email: user.email,
              full_name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
              avatar_id: 1,
              liquid_coins: 100,
              staked_coins: 0,
              streak_days: 0,
              onboarded: false
            };
          } else {
            profile = newProfile;
          }
        }

        // Migration of Guest progress on first login
        const migrationKey = `mcqkash_migrated_${user.id}`;
        if (profile && localStorage.getItem(migrationKey) !== 'true') {
          const guestCoins = localData.kash_coins_balance || 100;
          const guestStreak = localData.current_streak_days || 0;
          
          // Copy guest streak date to user streak key on migration
          const guestStreakDate = localStorage.getItem('mcqkash_last_streak_guest');
          if (guestStreakDate) {
            localStorage.setItem(`mcqkash_last_streak_${user.id}`, guestStreakDate);
          }

          if (guestCoins > 100 || guestStreak > 0) {
            console.log(`Migrating guest data: ${guestCoins} coins, ${guestStreak} streak days...`);
            const { error: migrateErr } = await supabase.rpc('migrate_guest_data_rpc', {
              guest_coins: guestCoins,
              guest_streak: guestStreak
            });
            if (!migrateErr) {
              // Re-fetch profile to get updated values
              let { data: updatedProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
              if (updatedProfile) {
                profile = updatedProfile;
              }
            } else {
              console.error('Failed to migrate guest data:', migrateErr);
            }
          }
          localStorage.setItem(migrationKey, 'true');
        }

        if (profile) {
          // Sync last streak date from DB to localStorage if available
          if (profile.last_streak_increment_at) {
            const dbStreakDateStr = new Date(profile.last_streak_increment_at).toDateString();
            localStorage.setItem(`mcqkash_last_streak_${user.id}`, dbStreakDateStr);
          }

          // Verify if Pro is active: is_pro must be true AND not expired (or admin bypasses)
          const hasNotExpired = (profile.pro_expiration && new Date(profile.pro_expiration) > new Date()) || 
                                (profile.pro_expires_at && new Date(profile.pro_expires_at) > new Date());
          const isPro = (!!profile.is_pro && hasNotExpired) || !!profile.is_admin;
          const expectedTier = isPro ? 'Pro' : 'FREE';

          // Sync database state to our local context state
          updatedData = {
            ...updatedData,
            id: profile.id,
            kash_coins_balance: profile.liquid_coins,
            staked_coins_balance: profile.staked_coins, // database total
            current_streak_days: profile.streak_days,
            user_tier: expectedTier,
            pro_factor: isPro ? 1.5 : 1.0,
            pro_expires_at: profile.pro_expires_at,
            pro_expiration: profile.pro_expiration || null,
            pro_tier: profile.pro_tier || null,
            payment_history: profile.payment_history || [],
            is_pro: isPro,
            is_admin: !!profile.is_admin,
            full_name: profile.full_name,
            avatar_id: profile.avatar_id,
            status_message: profile.status_message,
            last_status_update_at: profile.last_status_update_at,
            username: profile.username,
            referred_by: profile.referred_by,
            referral_count: profile.referral_count,
            premium_discount_earned: profile.premium_discount_earned,
            power_surge_expires_at: profile.power_surge_expires_at,
            available_streak_freezes: profile.available_streak_freezes,
            onboarded: !!profile.onboarded,
            scratched_cards_count: Number(profile.scratched_cards_count || 0),
            target_exam: profile.target_exam || null,
            users_accuracy: profile.users_accuracy || 0,
            joinee_date: profile.joinee_date,
          };
        }
      } else {
        // --- Guest Daily Streak Validation & Key Billing Simulation ---
        const keys = [
          'civilsKash_geminiKey',
          'civilsKash_openaiKey',
          'civilsKash_openrouterKey',
          'civilsKash_deepseekKey',
          'civilsKash_huggingfaceKey'
        ];
        const hasKey = keys.some(k => !!localStorage.getItem(k));
        const expectedTier = hasKey ? 'Pro' : 'FREE';
        if (updatedData.user_tier !== expectedTier) {
          updatedData.user_tier = expectedTier;
          await dbToggleProTier(hasKey);
        }
      }

      // Perform Daily Streak & Power Surge Validation
      const now = new Date();
      const todayStr = now.toDateString();
      if (updatedData.power_surge_active_date && updatedData.power_surge_active_date !== todayStr) {
        updatedData.power_surge_active_date = null;
      }
      const lastStreakKey = user ? `mcqkash_last_streak_${user.id}` : 'mcqkash_last_streak_guest';
      const lastActiveStr = localStorage.getItem(lastStreakKey);

      updatedData.last_streak_date = lastActiveStr || null;

      if (lastActiveStr !== todayStr) {
        if (lastActiveStr) {
          const lastActiveDate = new Date(lastActiveStr);
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const lastActive = new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate());

          const diffTimeDays = today - lastActive;
          const missedDays = Math.floor(diffTimeDays / (1000 * 60 * 60 * 24)) - 1;

          if (missedDays > 0) {
            // Streak is in danger!
            let remainingMissed = missedDays;

            // Consume standard freezes first
            const freezesToUse = Math.min(updatedData.available_streak_freezes || 0, remainingMissed);
            updatedData.available_streak_freezes = (updatedData.available_streak_freezes || 0) - freezesToUse;
            remainingMissed -= freezesToUse;
            
            if (remainingMissed === 0) {
              const yesterday = new Date(now);
              yesterday.setDate(now.getDate() - 1);
              localStorage.setItem(lastStreakKey, yesterday.toDateString());
              
              if (user && freezesToUse > 0) {
                // UPDATE DATABASE FREEZES securely via RPC!
                await supabase.rpc('consume_streak_freezes_rpc', { count: freezesToUse });
              }
            } else {
              // Streak breaks
              updatedData.current_streak_days = 0;
              updatedData.active_pledges = (updatedData.active_pledges || []).map(p =>
                p.status === 'MATURE' || p.status === 'LIQUIDATED' ? p : { ...p, status: 'LIQUIDATED' }
              );
              
              if (user) {
                // Reset streak in database
                await supabase.from('profiles').update({ streak_days: 0 }).eq('id', user.id);
                if (freezesToUse > 0) {
                  await supabase.rpc('consume_streak_freezes_rpc', { count: freezesToUse });
                }
              }
            }
          }
        }
      }

      // Check Vault maturities
      let maturityChanged = false;
      const now2 = new Date();
      updatedData.active_pledges = (updatedData.active_pledges || []).map(pledge => {
        if (pledge.status === 'MATURE' || pledge.status === 'LIQUIDATED') return pledge;
        const start = new Date(pledge.pledge_start_date);
        const diffTime = Math.abs(now2 - start);
        const durationMs = pledge.pledge_duration_days * 24 * 60 * 60 * 1000;
        if (diffTime >= durationMs) {
          maturityChanged = true;
          return { ...pledge, status: 'MATURE' };
        }
        return pledge;
      });

      // Update local storage/IndexedDB if changes occurred
      await updateUserEconomy(updatedData);
      setEconomy(updatedData);

      // Log daily snapshot if not done
      const { logCoinSnapshot } = await import('../lib/db');
      await logCoinSnapshot(updatedData.kash_coins_balance);
    } catch (err) {
      console.error("Economy Load Error", err);
    }
  };

  // Trigger reloading of economy variables when Auth User state changes and reset on logout
  useEffect(() => {
    const handleAuthTransition = async () => {
      if (prevUser && !user) {
        console.log("User logged out, resetting local guest economy state.");
        const cleanDefaults = {
          id: 'default_user',
          kash_coins_balance: 100,
          pro_factor: 1.0,
          user_tier: 'FREE',
          current_streak_days: 0,
          last_streak_date: null,
          active_pledges: [],
          available_streak_freezes: 0,
          hint_utility_usage_count: 0,
          total_kc_spent_on_revision: 0,
          avatar_id: 1,
          full_name: 'Guest Aspirant'
        };
        await updateUserEconomy(cleanDefaults);
        localStorage.removeItem('civilsKash_ghostProfile');
      }
      setPrevUser(user);
      loadEconomy();
    };

    handleAuthTransition();
  }, [user]);

  const transactKC = async (amount) => {
    if (!economy) return false;
    if (economy.kash_coins_balance + amount < 0) return false;

    if (user) {
      // Live Supabase RPC
      const { error } = await supabase.rpc('transact_coins_rpc', { amount });
      if (error) {
        console.error('Failed to transact coins in Supabase:', error);
        return false;
      }
    } else {
      // Guest local DB
      await dbTransactKC(amount);
    }
    await loadEconomy();
    clearLeaderboardCache();
    return true;
  };

  const spendRevisionKC = async (amount) => {
    if (!economy || economy.kash_coins_balance < amount) return false;

    if (user) {
      // Live Supabase RPC
      const { error } = await supabase.rpc('transact_coins_rpc', { amount: -amount });
      if (error) {
        console.error('Failed to deduct coins in Supabase:', error);
        return false;
      }
    } else {
      // Guest local DB
      const updated = await dbSpendRevisionKC(amount);
      if (!updated) return false;
    }
    await loadEconomy();
    clearLeaderboardCache();
    return true;
  };

  const toggleProTier = async (isPro) => {
    if (user) {
      // Live Supabase RPC
      const { error } = await supabase.rpc('toggle_pro_status_rpc', { is_pro: isPro });
      if (error) {
        console.error('Failed to toggle Pro status in Supabase:', error);
        return;
      }
    } else {
      // Guest local DB
      await dbToggleProTier(isPro);
    }
    await loadEconomy();
    clearLeaderboardCache();
  };

  const completeDailyStreak = async () => {
    if (!economy) return;
    const now = new Date();
    const todayStr = now.toDateString();
    
    const lastStreakKey = user ? `mcqkash_last_streak_${user.id}` : 'mcqkash_last_streak_guest';
    const lastActiveStr = localStorage.getItem(lastStreakKey);

    if (lastActiveStr === todayStr) return; // Already done today

    localStorage.setItem(lastStreakKey, todayStr);
    
    let activePledges = [...(economy.active_pledges || [])];
    const updatedPledges = activePledges.map(pledge => {
      if (pledge.status === 'MATURE' || pledge.status === 'LIQUIDATED') return pledge;
      const start = new Date(pledge.pledge_start_date);
      const diffTime = Math.abs(now - start);
      const durationMs = pledge.pledge_duration_days * 24 * 60 * 60 * 1000;
      if (diffTime >= durationMs) {
        return { ...pledge, status: 'MATURE' };
      }
      return pledge;
    });

    if (user) {
      // Live Supabase RPC
      await supabase.rpc('increment_user_streak');
    }

    await updateUserEconomy({
      current_streak_days: economy.current_streak_days + 1,
      active_pledges: updatedPledges
    });

    await loadEconomy();
    clearLeaderboardCache();
  };

  const placeStreakBet = async (amount, durationDays, rewardMultiplier) => {
    if (!economy || economy.kash_coins_balance < amount) return false;

    if (user) {
      // Deduct from live Supabase
      const { error } = await supabase.rpc('stake_coins_rpc', { amount });
      if (error) {
        console.error('Failed to stake coins in Supabase:', error);
        return false;
      }
    } else {
      // Deduct locally
      await dbTransactKC(-amount);
    }

    const newPledge = {
      id: `pledge_${Date.now()}`,
      pledged_amount: amount,
      pledge_duration_days: durationDays,
      pledge_start_date: new Date().toISOString(),
      reward_multiplier: rewardMultiplier,
      status: 'ACTIVE'
    };

    const updatedPledges = [...(economy.active_pledges || []), newPledge];
    await updateUserEconomy({
      active_pledges: updatedPledges
    });

    await loadEconomy();
    clearLeaderboardCache();
    return true;
  };

  const calculateFreezeCost = () => {
    if (!economy) return 0;
    const activePledges = economy.active_pledges || [];
    const totalStaked = activePledges.filter(p => p.status !== 'LIQUIDATED').reduce((sum, p) => sum + p.pledged_amount, 0);
    const netWorth = economy.kash_coins_balance + totalStaked;
    return Math.max(1, Math.floor(netWorth * 0.05)); // 5% of net worth
  };

  const buyStreakFreeze = async () => {
    if (!economy) return false;
    const cost = calculateFreezeCost();
    if (economy.kash_coins_balance < cost) return false;

    if (user) {
      // Live Supabase RPC
      const { error } = await supabase.rpc('buy_streak_freeze_rpc', { cost });
      if (error) {
        console.error('Failed to buy freeze in Supabase:', error);
        return false;
      }
    } else {
      // Guest local DB
      await dbTransactKC(-cost);
    }

    await updateUserEconomy({
      available_streak_freezes: (economy.available_streak_freezes || 0) + 1
    });

    await loadEconomy();
    clearLeaderboardCache();
    return true;
  };

  const checkVaultMaturities = async () => {
    if (!economy) return;
    const now = new Date();
    let changed = false;
    const updatedPledges = (economy.active_pledges || []).map(pledge => {
      if (pledge.status === 'MATURE' || pledge.status === 'LIQUIDATED') return pledge;
      const start = new Date(pledge.pledge_start_date);
      const diffTime = Math.abs(now - start);
      const durationMs = pledge.pledge_duration_days * 24 * 60 * 60 * 1000;
      if (diffTime >= durationMs) {
        changed = true;
        return { ...pledge, status: 'MATURE' };
      }
      return pledge;
    });

    if (changed) {
      await updateUserEconomy({ active_pledges: updatedPledges });
      await loadEconomy();
    }
  };

  const claimVaultYield = async (pledgeId) => {
    if (!economy) return null;
    const pledge = economy.active_pledges?.find(p => p.id === pledgeId);
    if (!pledge) return null;

    let isMature = pledge.status === 'MATURE';
    if (pledge.status === 'ACTIVE') {
      const start = new Date(pledge.pledge_start_date);
      const diffTime = Math.abs(new Date() - start);
      const durationMs = pledge.pledge_duration_days * 24 * 60 * 60 * 1000;
      if (diffTime >= durationMs) isMature = true;
    }

    if (!isMature) return null;

    const reward = Math.floor(pledge.pledged_amount * (1 + pledge.reward_multiplier));

    if (user) {
      // Live Supabase RPC
      const { error } = await supabase.rpc('claim_staked_coins_rpc', { 
        staked_amount: pledge.pledged_amount,
        reward_multiplier: pledge.reward_multiplier
      });
      if (error) {
        console.error('Failed to claim staked yield in Supabase:', error);
        return null;
      }
    } else {
      // Guest local DB
      await dbTransactKC(reward);
    }

    const updatedPledges = economy.active_pledges.filter(p => p.id !== pledgeId);
    await updateUserEconomy({ active_pledges: updatedPledges });
    await loadEconomy();
    clearLeaderboardCache();

    return reward;
  };

  const breakVault = async (pledgeId) => {
    if (!economy) return false;
    const pledge = economy.active_pledges?.find(p => p.id === pledgeId);
    if (!pledge || pledge.status === 'LIQUIDATED' || pledge.status === 'MATURE') return false;

    // Refund 60% of principal
    const refund = Math.floor(pledge.pledged_amount * 0.6);

    if (user) {
      // Live Supabase RPC
      const { error } = await supabase.rpc('break_staked_coins_rpc', {
        staked_amount: pledge.pledged_amount
      });
      if (error) {
        console.error('Failed to break vault in Supabase:', error);
        return false;
      }
    } else {
      // Guest local DB
      await dbTransactKC(refund);
    }

    const updatedPledges = economy.active_pledges.filter(p => p.id !== pledgeId);
    await updateUserEconomy({ active_pledges: updatedPledges });
    await loadEconomy();
    clearLeaderboardCache();
    return refund;
  };

  const confirmFailure = async (pledgeId) => {
    if (!economy) return false;
    const updatedPledges = economy.active_pledges.filter(p => p.id !== pledgeId);
    await updateUserEconomy({ active_pledges: updatedPledges });
    await loadEconomy();
    return true;
  };

  return (
    <EconomyContext.Provider value={{
      economy,
      transactKC,
      spendRevisionKC,
      toggleProTier,
      completeDailyStreak,
      placeStreakBet,
      calculateFreezeCost,
      buyStreakFreeze,
      checkVaultMaturities,
      claimVaultYield,
      breakVault,
      confirmFailure,
      aiSettingsOpen,
      setAiSettingsOpen,
      refreshEconomy: loadEconomy
    }}>
      {children}
    </EconomyContext.Provider>
  );
}

export const useEconomy = () => useContext(EconomyContext);
