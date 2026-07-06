-- =========================================================================
-- MCQ KASH REFERRAL & GAMIFICATION SCHEMAS
-- Run this script in the Supabase Studio SQL Editor to enable:
-- 1. Unique usernames and referral tracking columns.
-- 2. Secure RPC functions for referral matches, scratch cards, and streak freezes.
-- =========================================================================

-- 1. Alter profiles table to add new gamification columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_discount_earned integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS power_surge_expires_at timestamp with time zone DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS available_streak_freezes integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS scratched_cards_count integer DEFAULT 0;

-- 2. Populate default unique usernames for existing rows
UPDATE public.profiles
SET username = COALESCE(
  LOWER(split_part(email, '@', 1)),
  'aspirant_' || substring(id::text from 1 for 8)
)
WHERE username IS NULL;

-- If there are duplicates in usernames, append a unique id prefix/suffix
UPDATE public.profiles p
SET username = username || '_' || substring(id::text from 1 for 4)
WHERE (SELECT COUNT(*) FROM public.profiles WHERE username = p.username) > 1;

-- Now make the username column NOT NULL
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;


-- 3. Re-create handler for new signup creation to extract metadata username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  metadata_username text;
  final_username text;
  random_suffix text;
BEGIN
  -- Read username from raw_user_meta_data (lowercase and trimmed)
  metadata_username := LOWER(TRIM(new.raw_user_meta_data ->> 'username'));
  
  -- Fallback to email prefix if not supplied
  IF metadata_username IS NULL OR metadata_username = '' THEN
    metadata_username := LOWER(split_part(new.email, '@', 1));
  END IF;

  -- Clean username: keep only alphanumeric characters and underscores
  metadata_username := regexp_replace(metadata_username, '[^a-z0-9_]', '', 'g');

  -- Ensure it is not empty
  IF metadata_username = '' THEN
    metadata_username := 'aspirant';
  END IF;

  final_username := metadata_username;
  
  -- Loop to guarantee username uniqueness
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    random_suffix := substring(md5(random()::text) from 1 for 4);
    final_username := metadata_username || '_' || random_suffix;
  END LOOP;

  INSERT INTO public.profiles (
    id, email, full_name, avatar_id, liquid_coins, staked_coins, streak_days, is_admin,
    username, referred_by, referral_count, premium_discount_earned, power_surge_expires_at, available_streak_freezes
  )
  VALUES (
    new.id,
    new.email,
    final_username,
    1,
    100, -- 100 Welcome Coins
    0,
    0,
    false,
    final_username,
    NULL,
    0,
    0,
    NULL,
    0
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Re-create update validation trigger function to lock client-side edits
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS trigger AS $$
BEGIN
  -- Enforce permanent username rule: once set (onboarded is true), cannot be modified
  IF OLD.onboarded = true AND OLD.username IS NOT NULL AND NEW.username IS DISTINCT FROM OLD.username THEN
    RAISE EXCEPTION 'Permission denied: Username is permanent and cannot be changed.';
  END IF;

  -- Enforce zero-trust: prevent direct client updates to balance, streak, referral, or subscription columns.
  -- SECURITY DEFINER RPC functions execute as the postgres owner, bypass this check.
  IF current_user IN ('authenticated', 'anon') THEN
    IF NEW.liquid_coins IS DISTINCT FROM OLD.liquid_coins OR
       NEW.staked_coins IS DISTINCT FROM OLD.staked_coins OR
       NEW.streak_days IS DISTINCT FROM OLD.streak_days OR
       NEW.pro_expires_at IS DISTINCT FROM OLD.pro_expires_at OR
       NEW.is_admin IS DISTINCT FROM OLD.is_admin OR
       NEW.last_streak_increment_at IS DISTINCT FROM OLD.last_streak_increment_at OR
       NEW.referred_by IS DISTINCT FROM OLD.referred_by OR
       NEW.referral_count IS DISTINCT FROM OLD.referral_count OR
       NEW.premium_discount_earned IS DISTINCT FROM OLD.premium_discount_earned OR
       NEW.power_surge_expires_at IS DISTINCT FROM OLD.power_surge_expires_at OR
       NEW.available_streak_freezes IS DISTINCT FROM OLD.available_streak_freezes THEN
      RAISE EXCEPTION 'Permission denied: Direct updates to financial, streak, referral, or tier columns are not allowed.';
    END IF;
  END IF;

  -- Check if status_message is changing
  IF NEW.status_message IS DISTINCT FROM OLD.status_message THEN
    -- Check if user is Pro or Admin
    IF (NEW.pro_expires_at IS NULL OR NEW.pro_expires_at <= NOW()) AND NOT COALESCE(NEW.is_admin, false) THEN
      RAISE EXCEPTION 'Status message is a Pro-only feature. Go Pro to speak to the global audience!';
    END IF;

    -- Check if updated too recently (within 24 hours)
    IF OLD.last_status_update_at IS NOT NULL AND OLD.last_status_update_at > NOW() - INTERVAL '24 hours' THEN
      RAISE EXCEPTION 'You can only update your status message once every 24 hours!';
    END IF;

    -- Update last status update timestamp
    NEW.last_status_update_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC function to apply referral code securely on referee profile
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

  -- 2. Update referrer profile (increments referral count to grant scratch card, and awards flat ₹25 premium discount)
  UPDATE public.profiles
  SET referral_count = referral_count + 1,
      premium_discount_earned = LEAST(125, premium_discount_earned + 25)
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


-- 6. RPC function to roll probabilistic scratch rewards for the referrer
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

  -- Apply rewards (KashCoins, +1 streak freeze, +3 days power surge) and increment scratched cards count
  UPDATE public.profiles
  SET liquid_coins = liquid_coins + coins_roll,
      available_streak_freezes = available_streak_freezes + 1,
      power_surge_expires_at = COALESCE(power_surge_expires_at, NOW()) + INTERVAL '3 days',
      scratched_cards_count = scratched_cards_count + 1
  WHERE id = auth.uid();

  RETURN json_build_object(
    'success', true,
    'coins_rewarded', coins_roll
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. RPC function to consume streak freezes
CREATE OR REPLACE FUNCTION public.consume_streak_freezes_rpc(count integer)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET available_streak_freezes = GREATEST(0, available_streak_freezes - count)
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. RPC function to securely get public profile details by username (avatar, leaderboard rank, pro status)
CREATE OR REPLACE FUNCTION public.get_public_profile_by_username(target_username text)
RETURNS json AS $$
DECLARE
  prof RECORD;
  user_rank integer;
BEGIN
  -- Normalize input
  target_username := LOWER(TRIM(target_username));

  -- Get profile info
  SELECT id, username, full_name, avatar_id, total_coins, 
         (COALESCE(is_admin, false) OR (pro_expires_at IS NOT NULL AND pro_expires_at > NOW())) as is_pro
  INTO prof 
  FROM public.profiles 
  WHERE LOWER(username) = target_username;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Calculate rank based on total_coins
  SELECT COUNT(*)::integer + 1 INTO user_rank
  FROM public.profiles
  WHERE total_coins > prof.total_coins;

  RETURN json_build_object(
    'id', prof.id,
    'username', prof.username,
    'full_name', prof.full_name,
    'avatar_id', prof.avatar_id,
    'rank', user_rank,
    'is_pro', prof.is_pro
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 10. Check if a username is unique (excluding current user)
CREATE OR REPLACE FUNCTION public.check_username_unique(username_to_check text)
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE LOWER(username) = LOWER(TRIM(username_to_check))
      AND id != auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

