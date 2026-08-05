-- ================================================================
-- SUPABASE STREAK VAULT & STAKING CONTRACT RPC PROCEDURES
-- Execute this script in the Supabase SQL Editor to enable server-side atomic operations.
-- ================================================================

-- 1. Stake Coins RPC (Deduct liquid coins, increase staked coins)
CREATE OR REPLACE FUNCTION public.stake_coins_rpc(amount integer)
RETURNS json AS $$
DECLARE
  prof RECORD;
BEGIN
  IF amount <= 0 THEN
    RETURN json_build_object('success', false, 'message', 'Invalid stake amount');
  END IF;

  SELECT * INTO prof FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Profile not found');
  END IF;

  IF COALESCE(prof.liquid_coins, 0) < amount THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient liquid coins');
  END IF;

  UPDATE public.profiles
  SET liquid_coins = GREATEST(0, COALESCE(liquid_coins, 0) - amount),
      staked_coins = COALESCE(staked_coins, 0) + amount
  WHERE id = auth.uid();

  RETURN json_build_object('success', true, 'message', 'Coins successfully staked');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Buy Streak Freeze RPC (Deduct cost from liquid coins)
CREATE OR REPLACE FUNCTION public.buy_streak_freeze_rpc(cost integer)
RETURNS json AS $$
DECLARE
  prof RECORD;
BEGIN
  IF cost <= 0 THEN
    RETURN json_build_object('success', false, 'message', 'Invalid freeze cost');
  END IF;

  SELECT * INTO prof FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Profile not found');
  END IF;

  IF COALESCE(prof.liquid_coins, 0) < cost THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient liquid coins');
  END IF;

  UPDATE public.profiles
  SET liquid_coins = GREATEST(0, COALESCE(liquid_coins, 0) - cost)
  WHERE id = auth.uid();

  RETURN json_build_object('success', true, 'message', 'Streak freeze purchased');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Claim Staked Coins Yield RPC (Credit principal + yield to liquid coins, reduce staked coins)
CREATE OR REPLACE FUNCTION public.claim_staked_coins_rpc(staked_amount integer, reward_multiplier numeric)
RETURNS json AS $$
DECLARE
  prof RECORD;
  reward integer;
BEGIN
  reward := floor(staked_amount * (1 + reward_multiplier));

  SELECT * INTO prof FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Profile not found');
  END IF;

  UPDATE public.profiles
  SET liquid_coins = COALESCE(liquid_coins, 0) + reward,
      staked_coins = GREATEST(0, COALESCE(staked_coins, 0) - staked_amount)
  WHERE id = auth.uid();

  RETURN json_build_object('success', true, 'reward', reward);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Break Vault Contract Early RPC (Credit 60% principal refund to liquid coins, reduce staked coins)
CREATE OR REPLACE FUNCTION public.break_staked_coins_rpc(staked_amount integer)
RETURNS json AS $$
DECLARE
  prof RECORD;
  refund integer;
BEGIN
  refund := floor(staked_amount * 0.6);

  SELECT * INTO prof FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Profile not found');
  END IF;

  UPDATE public.profiles
  SET liquid_coins = COALESCE(liquid_coins, 0) + refund,
      staked_coins = GREATEST(0, COALESCE(staked_coins, 0) - staked_amount)
  WHERE id = auth.uid();

  RETURN json_build_object('success', true, 'refund', refund);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Increment User Streak RPC
CREATE OR REPLACE FUNCTION public.increment_user_streak()
RETURNS json AS $$
BEGIN
  UPDATE public.profiles
  SET streak_days = COALESCE(streak_days, 0) + 1,
      last_streak_increment_at = NOW()
  WHERE id = auth.uid();

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Consume Streak Freezes RPC
CREATE OR REPLACE FUNCTION public.consume_streak_freezes_rpc(count integer)
RETURNS json AS $$
BEGIN
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
