import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Sparkles, Snowflake, Flame, Loader, CheckCircle2, User, Clock, Shield, Share2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { saveReferralCardToDB, getReferralCardsFromDB } from '../lib/db';
import confetti from 'canvas-confetti';

export default function ScratchCardSection({ economy, refreshEconomy, showToast, playVictory }) {
  const [cards, setCards] = useState([]);
  const [claimingId, setClaimingId] = useState(null);
  const [claimedRewardsMap, setClaimedRewardsMap] = useState({});
  const [cardHistory, setCardHistory] = useState([]);

  const username = economy?.username || 'default';
  const ecoId = economy?.id;
  const refCount = Number(economy?.referral_count || 0);
  const scratchedCount = Number(economy?.scratched_cards_count || 0);
  const referredBy = economy?.referred_by;

  // Load history and pending cards purely from local storage / state (0 Supabase DB load)
  const loadCardsAndHistory = useCallback(async () => {
    if (!ecoId || ecoId === 'default_user' || username === 'default') return;

    const savedHistory = await getReferralCardsFromDB(username);
    const welcomeCoins = localStorage.getItem('mcqkash_welcome_coins_pending');
    const pendingList = [];

    if (welcomeCoins) {
      pendingList.push({
        id: 'welcome',
        isWelcome: true,
        coins: Number(welcomeCoins)
      });
    }

    const pendingReferrals = Math.max(0, refCount - scratchedCount);
    for (let i = 0; i < pendingReferrals; i++) {
      pendingList.push({
        id: `ref_${scratchedCount + i + 1}`,
        isWelcome: false
      });
    }

    setCards(pendingList);
    setCardHistory(savedHistory);
  }, [ecoId, username, refCount, scratchedCount]);

  useEffect(() => {
    loadCardsAndHistory();
  }, [loadCardsAndHistory]);

  // ⚡ 1-TAP REVEAL & INSTANT SAVE TO INDEXED DB (0 Database overhead)
  const handleOneTapReveal = async (card) => {
    if (claimingId || claimedRewardsMap[card.id]) return;

    setClaimingId(card.id);
    let resultRewards = null;

    try {
      if (card.isWelcome) {
        resultRewards = {
          coins_rewarded: card.coins || 150,
          wallet_credited: 25,
          freezes_added: 1,
          surge_days_added: 7
        };

        // Credit Welcome Card ₹25 wallet money to DB
        if (ecoId && ecoId !== 'default_user') {
          await supabase.from('profiles').update({
            premium_discount_earned: Number(economy.premium_discount_earned || 0) + 25
          }).eq('id', ecoId);
        }
        localStorage.removeItem('mcqkash_welcome_coins_pending');
      } else {
        const { data, error } = await supabase.rpc('scratch_referral_card_rpc');
        if (error) throw error;
        if (data && data.success) {
          resultRewards = {
            coins_rewarded: data.coins_rewarded || 150,
            wallet_credited: 25,
            freezes_added: 1,
            surge_days_added: 3
          };
        } else {
          if (showToast) showToast(data?.message || 'Reward already claimed.', 'info');
          setCards(prev => prev.filter(c => c.id !== card.id));
          if (refreshEconomy) await refreshEconomy(true);
          setClaimingId(null);
          return;
        }
      }

      // Reset 15-day wallet countdown timer on claim
      localStorage.setItem('mcqkash_last_referral_time', Date.now().toString());

      // Save card entry to IndexedDB / localStorage permanently
      const newCardEntry = {
        id: card.id,
        owner: username,
        type: card.isWelcome ? 'Welcome Card' : 'Referral Card',
        coins: resultRewards.coins_rewarded,
        wallet: resultRewards.wallet_credited,
        freezes: resultRewards.freezes_added,
        surge_days: resultRewards.surge_days_added,
        date: new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        timestamp: Date.now()
      };

      await saveReferralCardToDB(newCardEntry);
      setCardHistory(prev => [newCardEntry, ...prev.filter(c => c.id !== card.id)]);

      // Mark card as revealed in UI state
      setClaimedRewardsMap(prev => ({ ...prev, [card.id]: resultRewards }));

      // Sound & Celebration
      if (playVictory) playVictory();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'] });

      // Refresh economy stats cleanly
      if (refreshEconomy) await refreshEconomy(true);
      window.dispatchEvent(new Event('sync-profile-stats'));

      if (showToast) {
        showToast(`Unlocked +${resultRewards.coins_rewarded} KC & +₹${resultRewards.wallet_credited} Wallet Money! 🚀`, 'success');
      }
    } catch (e) {
      console.error('Failed to reveal card:', e);
      if (showToast) showToast(e.message || 'Could not reveal card. Please try again.', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  const handleDismissCard = (cardId) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    setClaimedRewardsMap(prev => {
      const copy = { ...prev };
      delete copy[cardId];
      return copy;
    });
  };

  return (
    <div className="bg-theme-surface/40 backdrop-blur-md border border-amber-500/20 rounded-3xl p-5 space-y-4 text-left shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">
          Referral Card
        </span>
        {cards.length > 0 && (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9.5px] font-black uppercase tracking-widest animate-pulse">
            {cards.length} Pending
          </span>
        )}
      </div>

      {/* PENDING CARDS OR BEAUTIFUL EMPTY STATE CARD */}
      <div className="space-y-3">
        {cards.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {cards.map((card) => {
              const isClaimingThis = claimingId === card.id;
              const rewards = claimedRewardsMap[card.id];

              if (rewards) {
                /* REVEALED / OPENED CARD STATE - COMPACT & BEAUTIFUL */
                return (
                  <motion.div
                    key={card.id}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="w-full relative rounded-2xl p-3.5 sm:p-4 overflow-hidden border border-emerald-500/40 bg-emerald-500/10 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left shadow-sm"
                  >
                    {/* Left: Checkmark Icon & Details */}
                    <div className="flex items-center gap-3 relative z-10 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center font-black text-xl shrink-0 border border-emerald-500/30">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-theme-text tracking-tight">
                          {card.isWelcome ? 'Welcome Rewards Claimed!' : 'Referral Rewards Claimed!'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold mt-1">
                          <span className="text-amber-500 dark:text-amber-400">+{rewards.coins_rewarded} KC</span>
                          <span className="text-theme-muted/40">•</span>
                          <span className="text-emerald-600 dark:text-emerald-400">+₹{rewards.wallet_credited} Cash</span>
                          <span className="text-theme-muted/40">•</span>
                          <span className="text-cyan-600 dark:text-cyan-300">+{rewards.freezes_added} Shield</span>
                          <span className="text-theme-muted/40">•</span>
                          <span className="text-rose-500 dark:text-rose-400">+{rewards.surge_days_added}d Surge</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Done Button */}
                    <button
                      onClick={() => handleDismissCard(card.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-theme-surface hover:bg-theme-surface-hover text-xs font-black text-theme-text uppercase tracking-wider transition-all border border-theme-border/60 cursor-pointer shrink-0 self-end sm:self-auto shadow-sm"
                    >
                      Done
                    </button>
                  </motion.div>
                );
              }

              /* UNREVEALED MYSTERY SCRATCH CARD - CLEAN FULLY CLICKABLE CARD */
              return (
                <motion.button
                  key={card.id}
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleOneTapReveal(card)}
                  disabled={claimingId !== null}
                  className="w-full relative group cursor-pointer text-left rounded-2xl p-3.5 sm:p-4 overflow-hidden transition-all duration-300 border border-amber-500/35 hover:border-amber-500/70 shadow-sm bg-gradient-to-r from-amber-500/15 via-theme-surface/90 to-amber-500/15 backdrop-blur-xl flex items-center justify-between gap-3"
                >
                  {/* Subtle shimmer aura */}
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/20 rounded-full blur-xl group-hover:bg-amber-400/30 transition-all duration-500 pointer-events-none" />

                  {/* Left: Gift Icon + Single Clean Text */}
                  <div className="flex items-center gap-3 relative z-10 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0 border border-amber-200/40">
                      🎁
                    </div>
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <h4 className="text-sm font-extrabold text-theme-text tracking-tight">
                        {card.isWelcome ? 'Reveal Welcome Card' : 'Reveal Scratch Card'}
                      </h4>
                      <Sparkles size={14} className="text-amber-500 dark:text-amber-400 animate-pulse shrink-0" />
                    </div>
                  </div>

                  {/* Right: Clean Arrow or Loading indicator */}
                  <div className="relative z-10 shrink-0 text-amber-500 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                    {isClaimingThis ? (
                      <Loader size={18} className="animate-spin text-amber-500" />
                    ) : (
                      <ChevronRight size={20} className="text-amber-500 dark:text-amber-400" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          /* BEAUTIFUL EMPTY STATE CARD */
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-theme-surface/90 border border-amber-500/30 rounded-3xl p-5 flex items-center justify-between gap-4 text-left shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center font-black text-2xl shrink-0 border border-amber-500/30">
                🎁
              </div>
              <div>
                <h4 className="text-xs font-black text-theme-text tracking-tight uppercase">
                  Invite Friends & Win Cash
                </h4>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                  Earn ₹25 Wallet Money + 150 KashCoins per friend invited!
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* REWARD CARD HISTORY (INDEXED DB OFFLINE HISTORY) */}
      {cardHistory.length > 0 && (
        <div className="pt-3 border-t border-amber-500/15 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
              <Clock size={11} className="text-amber-500 dark:text-amber-400" />
              Earned Card History
            </span>
            <span className="text-[9px] text-theme-muted font-bold">
              {cardHistory.length} Saved
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {cardHistory.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-theme-surface/80 backdrop-blur-md border border-theme-border/40 hover:border-amber-500/40 rounded-2xl p-3 flex items-center justify-between text-left transition-all shadow-sm group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center font-black text-sm shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    🎁
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="text-xs font-black text-theme-text tracking-tight">
                      {item.type === 'Welcome Card' ? 'Welcome' : (item.date || 'Saved')}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-extrabold mt-0.5">
                      <span className="text-amber-600 dark:text-amber-400">+{item.coins || 150} KC</span>
                      <span className="text-theme-muted/40">•</span>
                      <span className="text-emerald-600 dark:text-emerald-400">+₹{item.wallet || 25} Wallet</span>
                      {(item.freezes > 0 || !item.type) && (
                        <>
                          <span className="text-theme-muted/40">•</span>
                          <span className="text-cyan-600 dark:text-cyan-300">+{item.freezes || 1} Shield</span>
                        </>
                      )}
                      {item.surge_days > 0 && (
                        <>
                          <span className="text-theme-muted/40">•</span>
                          <span className="text-rose-500 dark:text-rose-400">+{item.surge_days}d Surge</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {item.type === 'Welcome Card' && item.date && (
                  <span className="text-[10px] font-bold text-theme-muted shrink-0 ml-2">
                    {item.date}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
