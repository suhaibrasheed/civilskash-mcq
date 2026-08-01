-- Fix for Supabase Database: Synchronize premium_discount_earned and update RPC
-- Run this SQL in Supabase SQL Editor to sync existing user discount balances

-- 1. Sync existing profiles where premium_discount_earned was missing or out of sync with scratched cards
UPDATE public.profiles
SET premium_discount_earned = GREATEST(
  COALESCE(premium_discount_earned, 0),
  COALESCE(scratched_cards_count, 0) * 25
);

-- 2. Update scratch_referral_card_rpc to increment premium_discount_earned by ₹25 on every scratch claim
CREATE OR REPLACE FUNCTION public.scratch_referral_card_rpc()
RETURNS json AS $$
DECLARE
  coins_roll integer;
  user_row RECORD;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT * INTO user_row FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'User profile not found.');
  END IF;

  -- Verify user has pending scratch cards
  IF user_row.referral_count <= user_row.scratched_cards_count THEN
    RETURN json_build_object('success', false, 'message', 'No pending scratch cards available.');
  END IF;

  -- Roll coins (choices: 100 to 250 with 250 having 5% probability)
  coins_roll := (ARRAY[100,100,100,100, 125,125,125,125, 150,150,150, 175,175,175, 200,200,200, 225,225, 250])[floor(random() * 20) + 1];

  -- Apply rewards (KashCoins, +1 streak freeze, +3 days power surge, +₹25 discount) and increment scratched cards count
  UPDATE public.profiles
  SET liquid_coins = liquid_coins + coins_roll,
      available_streak_freezes = available_streak_freezes + 1,
      power_surge_expires_at = COALESCE(power_surge_expires_at, NOW()) + INTERVAL '3 days',
      scratched_cards_count = scratched_cards_count + 1,
      premium_discount_earned = COALESCE(premium_discount_earned, 0) + 25
  WHERE id = auth.uid();

  RETURN json_build_object(
    'success', true,
    'coins_rewarded', coins_roll
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
