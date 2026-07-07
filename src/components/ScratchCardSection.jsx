import React, { useState, useEffect, useRef } from 'react';
import { Gift, Sparkles, Snowflake, Flame, Loader, ChevronRight } from 'lucide-react';
import { motion as m, AnimatePresence as Ap } from 'framer-motion';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';

export default function ScratchCardSection({ economy, refreshEconomy, showToast, playVictory }) {
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [isScratched, setIsScratched] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const [scratchHistory, setScratchHistory] = useState([]);

  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const username = economy?.username || 'default';
  const historyKey = `mcqkash_scratch_history_${username}`;
  const scratchedKey = `mcqkash_scratched_count_${username}`;

  // Load pending cards and history
  useEffect(() => {
    if (!economy || username === 'default' || economy.id === 'default_user') return;

    // 1. Check Welcome Card
    const welcomeCoins = localStorage.getItem('mcqkash_welcome_coins_pending');
    const pendingList = [];

    if (welcomeCoins) {
      pendingList.push({
        id: 'welcome',
        isWelcome: true,
        coins: Number(welcomeCoins)
      });
    }

    // 2. Check Referral Cards
    const dbCount = Number(economy.referral_count || 0);
    const isGuest = !economy || economy.id === 'default_user';
    const scratchedCount = isGuest
      ? Number(localStorage.getItem(scratchedKey) || 0)
      : Number(economy.scratched_cards_count || 0);
    const pendingReferrals = Math.max(0, dbCount - scratchedCount);

    for (let i = 0; i < pendingReferrals; i++) {
      pendingList.push({
        id: `ref_${scratchedCount + i + 1}`,
        isWelcome: false
      });
    }

    setCards(pendingList);

    // Load history
    try {
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
      setScratchHistory(history);
    } catch (e) {
      setScratchHistory([]);
    }
  }, [economy, username]);

  // Canvas setup
  useEffect(() => {
    if (!activeCard || !canvasRef.current || rewardData) return;

    try {
      const canvas = canvasRef.current;
      canvas.width = 320;
      canvas.height = 180;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        autoRevealFallback();
        return;
      }
      contextRef.current = ctx;

      // Draw the gold gradient cover
      const grad = ctx.createLinearGradient(0, 0, 320, 180);
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(0.3, '#fbbf24');
      grad.addColorStop(0.5, '#fef08a');
      grad.addColorStop(0.7, '#f59e0b');
      grad.addColorStop(1, '#b45309');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 320, 180);

      // Add overlay sparkles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * 320;
        const y = Math.random() * 180;
        const r = Math.random() * 2.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎁 SCRATCH TO REVEAL', 160, 80);
      ctx.font = '500 9px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#92400e';
      ctx.fillText('Swipe or drag here to scratch card', 160, 105);
    } catch (err) {
      console.warn('Canvas setup error, auto-revealing...', err);
      autoRevealFallback();
    }
  }, [activeCard, rewardData]);

  const autoRevealFallback = () => {
    setIsScratched(true);
    triggerRewardClaim();
  };

  const getMousePos = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startScratching = (e) => {
    setIsScratching(true);
    scratch(e);
  };

  const stopScratching = () => {
    setIsScratching(false);
    checkScratchPercentage();
  };

  const scratch = (e) => {
    if (!isScratching || isScratched || isClaiming || !contextRef.current) return;
    try {
      e.preventDefault();
      const pos = getMousePos(e);
      const ctx = contextRef.current;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      ctx.fill();
    } catch (err) {
      autoRevealFallback();
    }
  };

  const checkScratchPercentage = () => {
    if (isScratched || isClaiming || !canvasRef.current) return;
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const imgData = ctx.getImageData(0, 0, 320, 180);
      const pixels = imgData.data;
      let transparentCount = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) transparentCount++;
      }
      const ratio = transparentCount / (320 * 180);
      if (ratio > 0.45) {
        triggerRewardClaim();
      }
    } catch (e) {
      autoRevealFallback();
    }
  };

  const triggerRewardClaim = async () => {
    setIsScratched(true);
    if (activeCard.isWelcome) {
      setRewardData({ success: true, coins_rewarded: activeCard.coins });
      if (playVictory) playVictory();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
      return;
    }

    setIsClaiming(true);
    try {
      const { data, error } = await supabase.rpc('scratch_referral_card_rpc');
      if (error) throw error;
      if (data && data.success) {
        setRewardData(data);
        if (playVictory) playVictory();
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
      }
    } catch (e) {
      console.error('Scratch claim failed:', e);
      if (showToast) showToast('Failed to claim referral reward. Please try again.', 'error');
      setIsScratched(false);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleSaveClaim = async () => {
    if (!activeCard || !rewardData) return;

    const coinsWon = activeCard.isWelcome ? activeCard.coins : (rewardData.coins_rewarded || 0);
    setIsClaiming(true);

    // The database has already created and fully funded the rewards (Coins, freezes, surges) when 'apply_referral_code' was called during signup.
    // Therefore, we just need to locally clear the welcome pending card flag, save the entry to local history, and refresh the economy context to reflect the balance changes.

    // Save to history
    try {
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      const newEntry = {
        id: activeCard.id,
        type: activeCard.isWelcome ? 'Welcome Card' : 'Referral Card',
        coins: coinsWon,
        wallet: activeCard.isWelcome ? 0 : 25,
        date: new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
      };
      const updatedHistory = [newEntry, ...history];
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
      setScratchHistory(updatedHistory);
    } catch (e) {
      console.error('Failed to save scratch history:', e);
    }

    // Update scratched counters
    if (activeCard.isWelcome) {
      localStorage.removeItem('mcqkash_welcome_coins_pending');
    } else {
      const isGuest = !economy || economy.id === 'default_user';
      if (isGuest) {
        const scratchedCount = Number(localStorage.getItem(scratchedKey) || 0);
        localStorage.setItem(scratchedKey, (scratchedCount + 1).toString());
      }
    }

    // Refresh layout state
    setActiveCard(null);
    setIsScratched(false);
    setRewardData(null);
    setIsClaiming(false);
    if (refreshEconomy) await refreshEconomy();
    if (showToast) showToast(`Claimed +${coinsWon} KashCoins & Rewards! 🚀`, 'success');
  };

  return (
    <div className="bg-amber-500/[0.01] dark:bg-amber-500/[0.02] backdrop-blur-md border border-amber-500/15 rounded-3xl p-5 space-y-4 text-left shadow-[0_8px_32px_0_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">Referral Scratch Cards</span>
        {cards.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest animate-pulse">
            {cards.length} Pending
          </span>
        )}
      </div>

      {activeCard ? (
        <div className="flex flex-col items-center justify-center py-2">
          {/* Scratch Card Canvas Container */}
          <div className="relative w-80 h-44 rounded-2xl overflow-hidden border shadow-lg bg-theme-surface flex items-center justify-center select-none" style={{ borderColor: 'rgba(var(--color-text-rgb), 0.08)' }}>
            
            {/* Revealed rewards display */}
            <div className="absolute inset-0 p-4 flex flex-col justify-center items-center">
              {isClaiming ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <Loader className="w-6 h-6 text-amber-500 animate-spin" />
                  <span className="text-[10px] font-mono text-theme-muted animate-pulse">Claiming rewards...</span>
                </div>
              ) : rewardData ? (
                <m.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-3 w-full"
                >
                  <div className="flex items-center justify-center gap-1">
                    <Sparkles className="text-amber-500 animate-bounce" size={13} />
                    <span className="text-[9px] font-black text-theme-primary uppercase tracking-widest">Scratch Success!</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="bg-theme-bg/60 p-2 rounded-xl border flex items-center gap-2" style={{ borderColor: 'rgba(var(--color-text-rgb), 0.06)' }}>
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Gift size={12} />
                      </div>
                      <div>
                        <div className="text-[7px] font-black uppercase text-theme-muted tracking-widest leading-none">KashCoins</div>
                        <div className="text-xs font-black text-amber-500">
                          +{rewardData.coins_rewarded || activeCard.coins} KC
                        </div>
                      </div>
                    </div>

                    <div className="bg-theme-bg/60 p-2 rounded-xl border flex items-center gap-2" style={{ borderColor: 'rgba(var(--color-text-rgb), 0.06)' }}>
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Gift size={12} />
                      </div>
                      <div>
                        <div className="text-[7px] font-black uppercase text-theme-muted tracking-widest leading-none">Wallet Money</div>
                        <div className="text-xs font-black text-emerald-500">
                          {activeCard.isWelcome ? '₹0' : '₹25'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-theme-bg/60 p-2 rounded-xl border flex items-center gap-2" style={{ borderColor: 'rgba(var(--color-text-rgb), 0.06)' }}>
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                        <Snowflake size={12} />
                      </div>
                      <div>
                        <div className="text-[7px] font-black uppercase text-theme-muted tracking-widest leading-none">Streak Shield</div>
                        <div className="text-[10px] font-black text-theme-text">+1 Shield</div>
                      </div>
                    </div>

                    <div className="bg-theme-bg/60 p-2 rounded-xl border flex items-center gap-2" style={{ borderColor: 'rgba(var(--color-text-rgb), 0.06)' }}>
                      <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                        <Flame size={12} fill="currentColor" />
                      </div>
                      <div>
                        <div className="text-[7px] font-black uppercase text-theme-muted tracking-widest leading-none">Power Surge</div>
                        <div className="text-[10px] font-black text-theme-text">
                          +{activeCard.isWelcome ? '7' : '3'} Days
                        </div>
                      </div>
                    </div>
                  </div>
                </m.div>
              ) : (
                <span className="text-[10px] text-theme-muted italic">Scratching canvas failed.</span>
              )}
            </div>

            {/* Canvas Scratch layer */}
            {!rewardData && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 cursor-crosshair touch-none select-none z-10"
                onMouseDown={startScratching}
                onMouseUp={stopScratching}
                onMouseLeave={stopScratching}
                onMouseMove={scratch}
                onTouchStart={startScratching}
                onTouchEnd={stopScratching}
                onTouchMove={scratch}
              />
            )}
          </div>

          <div className="w-full mt-3 flex gap-2">
            {rewardData ? (
              <button
                onClick={handleSaveClaim}
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
              >
                Claim rewards & Continue
              </button>
            ) : (
              <>
                <button
                  onClick={autoRevealFallback}
                  className="flex-1 py-2 bg-theme-surface hover:bg-theme-surface-hover text-theme-muted hover:text-theme-text border border-theme-border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Auto-Reveal
                </button>
                <button
                  onClick={() => setActiveCard(null)}
                  className="py-2 px-3 bg-theme-surface hover:bg-theme-surface-hover text-theme-muted hover:text-theme-text border border-theme-border rounded-xl text-[10px] font-bold transition-all"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Card selection list */}
          {cards.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {cards.map((card, idx) => (
                <button
                  key={card.id}
                  onClick={() => setActiveCard(card)}
                  className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-500/5 to-amber-500/[0.01] hover:from-amber-500/10 hover:to-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl transition-all duration-300 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <Gift size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-theme-text">
                        {card.isWelcome ? 'Welcome Gift Scratch Card' : `Referral Reward Card #${idx + 1}`}
                      </h4>
                      <p className="text-[9px] text-theme-muted uppercase tracking-widest font-black mt-0.5">
                        {card.isWelcome ? 'Unlock welcome benefits!' : 'Claim variable kashcoins & surges'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-amber-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center bg-amber-500/[0.02] rounded-2xl border border-amber-500/10 text-theme-muted text-[10px] font-bold uppercase tracking-wider">
              🎉 All caught up! Invite friends to get scratch cards.
            </div>
          )}

          {/* History/Archive area */}
          {scratchHistory.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="max-h-[160px] overflow-y-auto custom-scrollbar space-y-2 pr-1.5">
                {scratchHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-theme-surface/40 dark:bg-theme-surface/20 border hover:border-theme-primary/20 rounded-2xl text-left backdrop-blur-md shadow-sm hover:scale-[1.01] hover:bg-theme-surface/50 transition-all duration-300"
                    style={{ borderColor: 'rgba(var(--color-text-rgb), 0.08)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center border border-theme-primary/15 shrink-0">
                        <Gift size={14} className="opacity-80" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-theme-text block leading-none">{item.type}</span>
                        <span className="text-[8px] font-bold text-theme-muted uppercase tracking-widest mt-1 block">{item.date}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black tracking-wide shrink-0">
                          +{item.coins} KC
                        </span>
                        {item.wallet > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8.5px] font-black tracking-wide shrink-0">
                            +₹{item.wallet} Wallet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
