-- SQL Migration: Add buy_kash_coins_with_wallet_rpc function to Supabase
-- Run this script in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.buy_kash_coins_with_wallet_rpc()
RETURNS json AS $$
DECLARE
  prof RECORD;
BEGIN
  -- Lock row for update to prevent race conditions
  SELECT * INTO prof FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Profile not found.');
  END IF;

  IF COALESCE(prof.premium_discount_earned, 0) < 50 THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient wallet balance. Minimum ₹50 required.');
  END IF;

  -- Deduct ₹50 from wallet money and add +1000 to liquid_coins
  UPDATE public.profiles
  SET premium_discount_earned = GREATEST(0, COALESCE(premium_discount_earned, 0) - 50),
      liquid_coins = COALESCE(liquid_coins, 0) + 1000
  WHERE id = auth.uid();

  RETURN json_build_object(
    'success', true,
    'message', '₹50 deducted from Wallet Balance! +1,000 KashCoins credited.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
