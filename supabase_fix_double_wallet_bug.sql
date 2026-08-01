-- =========================================================================
-- MCQ KASH - CRITICAL WALLET BUG FIX SCRIPT
-- Run this script in Supabase Studio SQL Editor to fix the double ₹25 wallet bug.
--
-- CAUSE OF BUG:
-- 1. `apply_referral_code` was adding +₹25 to premium_discount_earned on signup.
-- 2. `scratch_referral_card_rpc` was adding ANOTHER +₹25 on unveiling the scratch card.
-- Result: 1 referral = ₹50 total instead of ₹25!
--
-- FIX:
-- `apply_referral_code` now ONLY increments referral_count (to grant 1 scratch card).
-- `scratch_referral_card_rpc` credits the +₹25 wallet money when card is unveiled.
-- Total earned per invite = EXACTLY ₹25.
-- =========================================================================

-- 1. Update apply_referral_code RPC (removes premature +₹25 credit on signup)
CREATE OR REPLACE FUNCTION public.apply_referral_code(referrer_username text)
RETURNS json AS $$
DECLARE
  ref_row RECORD;
  user_row RECORD;
  coins_roll integer;
BEGIN
  -- Normalize input
  referrer_username := LOWER(TRIM(referrer_username));

  -- Get referee profile
  SELECT * INTO user_row FROM public.profiles WHERE id = auth.uid();
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'User profile not found.');
  END IF;

  -- Check if already referred
  IF user_row.referred_by IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'You have already applied a referral code.');
  END IF;

  -- Get referrer profile
  SELECT * INTO ref_row FROM public.profiles WHERE LOWER(username) = referrer_username;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Referrer username not found.');
  END IF;

  -- Check self-referral
  IF ref_row.id = auth.uid() THEN
    RETURN json_build_object('success', false, 'message', 'You cannot refer yourself.');
  END IF;

  -- Roll variable welcome coins between 100 and 250 for the new user according to probability
  coins_roll := (ARRAY[100,100,100,100, 125,125,125,125, 150,150,150, 175,175,175, 200,200,200, 225,225, 250])[floor(random() * 20) + 1];

  -- Apply referral updates
  -- 1. Update referee profile (Welcome Coins, Streak Freeze, 1-week Power Surge)
  UPDATE public.profiles
  SET referred_by = ref_row.username,
      liquid_coins = liquid_coins + coins_roll,
      available_streak_freezes = available_streak_freezes + 1,
      power_surge_expires_at = COALESCE(power_surge_expires_at, NOW()) + INTERVAL '7 days'
  WHERE id = auth.uid();

  -- 2. Update referrer profile (increments referral count to grant scratch card; wallet money +25 is credited when scratch card is unveiled)
  UPDATE public.profiles
  SET referral_count = referral_count + 1
  WHERE id = ref_row.id;

  -- 3. Insert notification for the referrer (notifies about scratch card)
  INSERT INTO public.notifications (user_id, message, type)
  VALUES (
    ref_row.id,
    '🎉 ' || user_row.username || ' signed up using your referral code! You received 1 Scratch Card.',
    'referral_success'
  );

  -- 4. Insert notification for the referee
  INSERT INTO public.notifications (user_id, message, type)
  VALUES (
    auth.uid(),
    '🎁 Referral applied successfully! You earned +1 Streak Freeze and 7 days Power Surge.',
    'referral_applied'
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Referral applied successfully!',
    'coins_rewarded', coins_roll
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Ensure scratch_referral_card_rpc correctly credits ₹25 wallet money on unveil
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


-- 3. Cleanup query: Fix any existing profiles where premium_discount_earned was double-credited
-- (recalculates balance based on actual scratched cards + welcome card status)
UPDATE public.profiles
SET premium_discount_earned = (
  (COALESCE(scratched_cards_count, 0) * 25) +
  (CASE WHEN referred_by IS NOT NULL THEN 25 ELSE 0 END)
)
WHERE premium_discount_earned > (
  (COALESCE(scratched_cards_count, 0) * 25) +
  (CASE WHEN referred_by IS NOT NULL THEN 25 ELSE 0 END)
);
