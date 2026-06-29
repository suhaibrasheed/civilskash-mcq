-- ==========================================
-- SUPABASE REALTIME LEADERBOARD & PROFILE SCHEMA
-- Run this script in the Supabase Studio SQL Editor.
-- ==========================================

-- 1. Create Profiles Table (Flat, single-row layout)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_id smallint DEFAULT 1,
  liquid_coins integer DEFAULT 0,
  staked_coins integer DEFAULT 0,
  total_coins integer GENERATED ALWAYS AS (liquid_coins + staked_coins) STORED,
  streak_days integer DEFAULT 0,
  pro_expires_at timestamp with time zone DEFAULT NULL,
  status_message varchar(50) DEFAULT NULL,
  last_status_update_at timestamp with time zone DEFAULT NULL,
  is_admin boolean DEFAULT false,
  last_streak_increment_at timestamp with time zone DEFAULT NULL,
  target_exam text DEFAULT NULL,
  users_accuracy numeric DEFAULT 0,
  joinee_date timestamp with time zone DEFAULT now()
);

-- 2. Create Descending Indexes for Volume Optimization
CREATE INDEX IF NOT EXISTS idx_profiles_total_coins ON public.profiles(total_coins DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_streak_days ON public.profiles(streak_days DESC);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Expose Public View (Excluding raw emails to prevent privacy leaks)
-- Note: SELECT access on this view is NOT granted to public roles (anon/authenticated)
-- to prevent scraping of the entire directory. Ranks must be retrieved via get_top_leaderboard.
CREATE OR REPLACE VIEW public.profiles_public WITH (security_barrier) AS
SELECT 
  id, 
  full_name, 
  avatar_id, 
  liquid_coins, 
  staked_coins, 
  total_coins, 
  streak_days, 
  CASE WHEN is_admin THEN NOW() + INTERVAL '100 years' ELSE pro_expires_at END as pro_expires_at, 
  status_message, 
  last_status_update_at,
  joinee_date
FROM public.profiles;

-- Ensure no global select permissions exist on profiles_public
REVOKE SELECT ON public.profiles_public FROM anon, authenticated, public;

-- 4. Row Level Security Policies
-- Users can read their own private profile (with email)
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own public details (display name, avatar_id, status_message)
CREATE POLICY "Users can update own details" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Restore UPDATE privileges on the profiles table for authenticated users.
-- Column level restrictions are enforced via the validate_profile_update trigger.
ALTER TABLE public.profiles OWNER TO postgres;
GRANT UPDATE ON public.profiles TO authenticated;

-- 5. Trigger for Phase 1 Onboarding (Auto-Creation on Auth insert)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_id, liquid_coins, staked_coins, streak_days, is_admin)
  VALUES (
    new.id,
    new.email,
    split_part(new.email, '@', 1), -- default display name to email prefix
    1, -- default avatar ID
    100, -- 100 Welcome Coins
    0,
    0,
    false -- default is_admin to false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Trigger for Pro Status Message & Expiry Validation (Anti-Spam Lock)
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS trigger AS $$
BEGIN
  -- Enforce zero-trust: prevent direct client updates to balance, streak, or subscription columns.
  -- The SECURITY DEFINER RPC functions execute as the postgres owner, bypassing this check.
  IF current_user IN ('authenticated', 'anon') THEN
    IF NEW.liquid_coins IS DISTINCT FROM OLD.liquid_coins OR
       NEW.staked_coins IS DISTINCT FROM OLD.staked_coins OR
       NEW.streak_days IS DISTINCT FROM OLD.streak_days OR
       NEW.pro_expires_at IS DISTINCT FROM OLD.pro_expires_at OR
       NEW.is_admin IS DISTINCT FROM OLD.is_admin OR
       NEW.last_streak_increment_at IS DISTINCT FROM OLD.last_streak_increment_at THEN
      RAISE EXCEPTION 'Permission denied: Direct updates to financial, streak, or tier columns are not allowed.';
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

CREATE OR REPLACE TRIGGER before_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_update();

-- ==========================================
-- REMOTE PROCEDURE CALL (RPC) FUNCTIONS
-- These run as SECURITY DEFINER to bypass RLS,
-- enabling secure state modification that normal users cannot tamper with.
-- ==========================================

-- A. Transact Coins (Add / Deduct)
CREATE OR REPLACE FUNCTION public.transact_coins_rpc(amount integer)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET liquid_coins = GREATEST(0, liquid_coins + amount)
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Stake Coins
CREATE OR REPLACE FUNCTION public.stake_coins_rpc(amount integer)
RETURNS void AS $$
BEGIN
  IF (SELECT liquid_coins FROM public.profiles WHERE id = auth.uid()) < amount THEN
    RAISE EXCEPTION 'Insufficient coins to stake!';
  END IF;

  UPDATE public.profiles
  SET liquid_coins = liquid_coins - amount,
      staked_coins = staked_coins + amount
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Claim Staked Yield (Math calculated internally)
CREATE OR REPLACE FUNCTION public.claim_staked_coins_rpc(staked_amount integer, reward_multiplier numeric)
RETURNS void AS $$
DECLARE
  reward_amount integer;
BEGIN
  IF (SELECT staked_coins FROM public.profiles WHERE id = auth.uid()) < staked_amount THEN
    RAISE EXCEPTION 'Insufficient staked coins!';
  END IF;

  reward_amount := floor(staked_amount * reward_multiplier);

  UPDATE public.profiles
  SET staked_coins = staked_coins - staked_amount,
      liquid_coins = liquid_coins + staked_amount + reward_amount
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D. Break Vault Early (60% Principal Refunded, math calculated internally)
CREATE OR REPLACE FUNCTION public.break_staked_coins_rpc(staked_amount integer)
RETURNS void AS $$
DECLARE
  refund_amount integer;
BEGIN
  IF (SELECT staked_coins FROM public.profiles WHERE id = auth.uid()) < staked_amount THEN
    RAISE EXCEPTION 'Insufficient staked coins!';
  END IF;

  refund_amount := floor(staked_amount * 0.60);

  UPDATE public.profiles
  SET staked_coins = staked_coins - staked_amount,
      liquid_coins = liquid_coins + refund_amount
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. Complete Daily Streak (Enforced with a 20-hour time lock to prevent spamming)
CREATE OR REPLACE FUNCTION public.increment_user_streak()
RETURNS void AS $$
DECLARE
  last_increment timestamp with time zone;
BEGIN
  SELECT last_streak_increment_at INTO last_increment FROM public.profiles WHERE id = auth.uid();
  IF last_increment IS NOT NULL AND NOW() - last_increment < INTERVAL '20 hours' THEN
    RAISE EXCEPTION 'Streak already incremented within the last 20 hours!';
  END IF;

  UPDATE public.profiles
  SET streak_days = streak_days + 1,
      last_streak_increment_at = NOW()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- F. Buy Streak Freeze
CREATE OR REPLACE FUNCTION public.buy_streak_freeze_rpc(cost integer)
RETURNS void AS $$
BEGIN
  IF (SELECT liquid_coins FROM public.profiles WHERE id = auth.uid()) < cost THEN
    RAISE EXCEPTION 'Insufficient coins to buy streak freeze!';
  END IF;

  UPDATE public.profiles
  SET liquid_coins = liquid_coins - cost
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- G. Get Logged-In User Coin Rank
CREATE OR REPLACE FUNCTION public.get_logged_in_user_coins_rank()
RETURNS integer AS $$
  SELECT COUNT(*)::integer + 1 
  FROM public.profiles 
  WHERE total_coins > (SELECT total_coins FROM public.profiles WHERE id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER;

-- H. Get Logged-In User Streak Rank
CREATE OR REPLACE FUNCTION public.get_logged_in_user_streak_rank()
RETURNS integer AS $$
  SELECT COUNT(*)::integer + 1 
  FROM public.profiles 
  WHERE streak_days > (SELECT streak_days FROM public.profiles WHERE id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER;

-- H2. Get Total Registered Aspirants Count (Used to render realistic leaderboard size)
CREATE OR REPLACE FUNCTION public.get_total_aspirants_count()
RETURNS integer AS $$
  SELECT COUNT(*)::integer FROM public.profiles;
$$ LANGUAGE sql SECURITY DEFINER;

-- I. Toggle Pro Status (Restricted to verified administrators)
CREATE OR REPLACE FUNCTION public.toggle_pro_status_rpc(is_pro boolean)
RETURNS void AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  SELECT is_admin INTO caller_is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(caller_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can toggle Pro status.';
  END IF;

  IF is_pro THEN
    UPDATE public.profiles
    SET pro_expires_at = NOW() + INTERVAL '90 days'
    WHERE id = auth.uid();
  ELSE
    UPDATE public.profiles
    SET pro_expires_at = NULL
    WHERE id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- J. Get Top Leaderboard (Securely returns only top 50 users to prevent directory scraping)
CREATE OR REPLACE FUNCTION public.get_top_leaderboard(leaderboard_type text)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_id smallint,
  liquid_coins integer,
  staked_coins integer,
  total_coins integer,
  streak_days integer,
  pro_expires_at timestamp with time zone,
  status_message varchar(50),
  last_status_update_at timestamp with time zone
) AS $$
BEGIN
  IF leaderboard_type = 'coins' THEN
    RETURN QUERY
    SELECT 
      p.id, 
      p.full_name, 
      p.avatar_id, 
      p.liquid_coins, 
      p.staked_coins, 
      p.total_coins, 
      p.streak_days, 
      CASE WHEN p.is_admin THEN NOW() + INTERVAL '100 years' ELSE p.pro_expires_at END as pro_expires_at, 
      p.status_message, 
      p.last_status_update_at
    FROM public.profiles p
    ORDER BY p.total_coins DESC
    LIMIT 50;
  ELSIF leaderboard_type = 'streaks' THEN
    RETURN QUERY
    SELECT 
      p.id, 
      p.full_name, 
      p.avatar_id, 
      p.liquid_coins, 
      p.staked_coins, 
      p.total_coins, 
      p.streak_days, 
      CASE WHEN p.is_admin THEN NOW() + INTERVAL '100 years' ELSE p.pro_expires_at END as pro_expires_at, 
      p.status_message, 
      p.last_status_update_at
    FROM public.profiles p
    ORDER BY p.streak_days DESC
    LIMIT 50;
  ELSE
    RAISE EXCEPTION 'Invalid leaderboard type';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- K. Migrate Guest Data (Syncs local guest coins & streaks to Supabase upon sign up)
CREATE OR REPLACE FUNCTION public.migrate_guest_data_rpc(guest_coins integer, guest_streak integer)
RETURNS void AS $$
BEGIN
  -- Only allow migration if the user's profile is brand new (e.g. liquid_coins is the default 105 or 100 welcome coins, and streak_days is 0)
  -- This prevents users from trying to call it multiple times to inflate their coins.
  IF (SELECT liquid_coins FROM public.profiles WHERE id = auth.uid()) <= 100 
     AND (SELECT streak_days FROM public.profiles WHERE id = auth.uid()) = 0 THEN
      
    UPDATE public.profiles
    SET liquid_coins = GREATEST(100, guest_coins), -- respect guest coins, keeping at least the 100 welcome coins
        streak_days = GREATEST(0, guest_streak)
    WHERE id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- L. Get Leaderboard with Rivalry Radar
CREATE OR REPLACE FUNCTION public.get_leaderboard_with_radar(
  leaderboard_type text,
  viewer_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_id smallint,
  liquid_coins integer,
  staked_coins integer,
  total_coins integer,
  streak_days integer,
  pro_expires_at timestamp with time zone,
  status_message varchar(50),
  last_status_update_at timestamp with time zone,
  rank integer
) AS $$
DECLARE
  viewer_rank integer := NULL;
BEGIN
  -- Find the viewer's absolute rank first if they are logged in
  IF viewer_id IS NOT NULL THEN
    IF leaderboard_type = 'coins' THEN
      SELECT r.rank INTO viewer_rank
      FROM (
        SELECT p.id, row_number() OVER (ORDER BY p.total_coins DESC, p.id ASC) as rank
        FROM public.profiles p
      ) r
      WHERE r.id = viewer_id;
    ELSIF leaderboard_type = 'streaks' THEN
      SELECT r.rank INTO viewer_rank
      FROM (
        SELECT p.id, row_number() OVER (ORDER BY p.streak_days DESC, p.id ASC) as rank
        FROM public.profiles p
      ) r
      WHERE r.id = viewer_id;
    END IF;
  END IF;
 
  -- Query and filter leaderboard rows
  IF leaderboard_type = 'coins' THEN
    RETURN QUERY
    WITH ranked_profiles AS (
      SELECT 
        p.id, 
        p.full_name, 
        p.avatar_id, 
        p.liquid_coins, 
        p.staked_coins, 
        p.total_coins, 
        p.streak_days, 
        CASE WHEN p.is_admin THEN NOW() + INTERVAL '100 years' ELSE p.pro_expires_at END as pro_expires_at, 
        p.status_message, 
        p.last_status_update_at,
        row_number() OVER (ORDER BY p.total_coins DESC, p.id ASC)::integer as rnk
      FROM public.profiles p
    )
    SELECT * 
    FROM ranked_profiles rp
    WHERE rp.rnk <= 10
       OR (viewer_rank IS NOT NULL AND rp.rnk BETWEEN (viewer_rank - 5) AND (viewer_rank + 5))
       OR (viewer_id IS NULL AND rp.rnk <= 20)
    ORDER BY rp.rnk ASC;
 
  ELSIF leaderboard_type = 'streaks' THEN
    RETURN QUERY
    WITH ranked_profiles AS (
      SELECT 
        p.id, 
        p.full_name, 
        p.avatar_id, 
        p.liquid_coins, 
        p.staked_coins, 
        p.total_coins, 
        p.streak_days, 
        CASE WHEN p.is_admin THEN NOW() + INTERVAL '100 years' ELSE p.pro_expires_at END as pro_expires_at, 
        p.status_message, 
        p.last_status_update_at,
        row_number() OVER (ORDER BY p.streak_days DESC, p.id ASC)::integer as rnk
      FROM public.profiles p
    )
    SELECT * 
    FROM ranked_profiles rp
    WHERE rp.rnk <= 10
       OR (viewer_rank IS NOT NULL AND rp.rnk BETWEEN (viewer_rank - 5) AND (viewer_rank + 5))
       OR (viewer_id IS NULL AND rp.rnk <= 20)
    ORDER BY rp.rnk ASC;
  ELSE
    RAISE EXCEPTION 'Invalid leaderboard type';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
 
 
-- M. Get Shoutout Feed
CREATE OR REPLACE FUNCTION public.get_shoutout_feed()
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_id smallint,
  pro_expires_at timestamp with time zone,
  status_message varchar(50),
  last_status_update_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.full_name, 
    p.avatar_id, 
    CASE WHEN p.is_admin THEN NOW() + INTERVAL '100 years' ELSE p.pro_expires_at END as pro_expires_at, 
    p.status_message, 
    p.last_status_update_at
  FROM public.profiles p
  WHERE p.status_message IS NOT NULL 
    AND (COALESCE(p.is_admin, false) OR (p.pro_expires_at IS NOT NULL AND p.pro_expires_at > NOW()))
  ORDER BY p.last_status_update_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- POPULATE DUMMY LEADERBOARD PROFILES
-- Run this block to insert 30 diverse Indian mock users (Hindu/Muslim mix, 10 Pro, 20 Free, coins 140-2345, streak 1-70).
-- ==========================================

-- 1. Clean up previous mock users
DELETE FROM auth.users WHERE email LIKE '%@mock.com';

-- 2. Insert 30 dummy users into auth.users (This automatically fires public.handle_new_user() to create profiles)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES
('00000000-0000-0000-0000-000000000001', 'amit.sharma@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000002', 'zara.khan@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000003', 'fatima.shaikh@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000004', 'vikram.malhotra@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000005', 'rohan.gupta@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000006', 'aisha.ahmed@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000007', 'priya.patel@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000008', 'kabir.sheikh@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000009', 'sneha.reddy@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000010', 'tariq.anwar@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000011', 'anjali.mishra@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000012', 'mustafa.ali@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000013', 'rajat.verma@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000014', 'yasmin.qureshi@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000015', 'divya.nair@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000016', 'imran.hashmi@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000017', 'sandeep.kumar@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000018', 'sana.malik@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000019', 'neha.joshi@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000020', 'arshad.warsi@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000021', 'aditya.rao@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000022', 'zainab.begum@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000023', 'kavita.deshmukh@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000024', 'farhan.akhtar@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000025', 'rahul.singh@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000026', 'niloufer.khan@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000027', 'shalini.sen@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000028', 'sajid.nadiadwala@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000029', 'deepak.chawla@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
('00000000-0000-0000-0000-000000000030', 'rukhsar.rehman@mock.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');

-- 3. Update the profiles with detailed names, coins, streaks, pro status, and status messages
UPDATE public.profiles SET full_name = 'Amit Sharma', avatar_id = 1, liquid_coins = 2345, streak_days = 68, pro_expires_at = NOW() + INTERVAL '100 days', status_message = 'Cracking CSE is my target! 🎯', last_status_update_at = NOW() WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET full_name = 'Zara Khan', avatar_id = 2, liquid_coins = 2260, streak_days = 55, pro_expires_at = NOW() + INTERVAL '100 days', status_message = 'Keep going, success is near. ✨', last_status_update_at = NOW() WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET full_name = 'Fatima Shaikh', avatar_id = 3, liquid_coins = 2180, streak_days = 62, pro_expires_at = NOW() + INTERVAL '100 days', status_message = 'Consistency beats talent any day.', last_status_update_at = NOW() WHERE id = '00000000-0000-0000-0000-000000000003';
UPDATE public.profiles SET full_name = 'Vikram Malhotra', avatar_id = 4, liquid_coins = 2090, streak_days = 48, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000004';
UPDATE public.profiles SET full_name = 'Rohan Gupta', avatar_id = 5, liquid_coins = 2010, streak_days = 41, pro_expires_at = NOW() + INTERVAL '100 days', status_message = 'Daily revision is the secret. 📚', last_status_update_at = NOW() WHERE id = '00000000-0000-0000-0000-000000000005';
UPDATE public.profiles SET full_name = 'Aisha Ahmed', avatar_id = 6, liquid_coins = 1930, streak_days = 35, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000006';
UPDATE public.profiles SET full_name = 'Priya Patel', avatar_id = 7, liquid_coins = 1840, streak_days = 39, pro_expires_at = NOW() + INTERVAL '100 days', status_message = 'Focus on your goals!', last_status_update_at = NOW() WHERE id = '00000000-0000-0000-0000-000000000007';
UPDATE public.profiles SET full_name = 'Kabir Sheikh', avatar_id = 8, liquid_coins = 1760, streak_days = 30, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000008';
UPDATE public.profiles SET full_name = 'Sneha Reddy', avatar_id = 9, liquid_coins = 1680, streak_days = 52, pro_expires_at = NOW() + INTERVAL '100 days', status_message = 'History is my favorite subject.', last_status_update_at = NOW() WHERE id = '00000000-0000-0000-0000-000000000009';
UPDATE public.profiles SET full_name = 'Tariq Anwar', avatar_id = 1, liquid_coins = 1590, streak_days = 28, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000010';
UPDATE public.profiles SET full_name = 'Anjali Mishra', avatar_id = 2, liquid_coins = 1510, streak_days = 45, pro_expires_at = NOW() + INTERVAL '100 days', status_message = 'UPSC 2027 Aspirant!', last_status_update_at = NOW() WHERE id = '00000000-0000-0000-0000-000000000011';
UPDATE public.profiles SET full_name = 'Mustafa Ali', avatar_id = 3, liquid_coins = 1430, streak_days = 22, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000012';
UPDATE public.profiles SET full_name = 'Rajat Verma', avatar_id = 4, liquid_coins = 1340, streak_days = 18, pro_expires_at = NOW() + INTERVAL '100 days', status_message = 'Practice makes perfect.', last_status_update_at = NOW() WHERE id = '00000000-0000-0000-0000-000000000013';
UPDATE public.profiles SET full_name = 'Yasmin Qureshi', avatar_id = 5, liquid_coins = 1260, streak_days = 15, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000014';
UPDATE public.profiles SET full_name = 'Divya Nair', avatar_id = 6, liquid_coins = 1180, streak_days = 25, pro_expires_at = NOW() + INTERVAL '100 days', status_message = 'Never give up!', last_status_update_at = NOW() WHERE id = '00000000-0000-0000-0000-000000000015';
UPDATE public.profiles SET full_name = 'Imran Hashmi', avatar_id = 7, liquid_coins = 1090, streak_days = 14, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000016';
UPDATE public.profiles SET full_name = 'Sandeep Kumar', avatar_id = 8, liquid_coins = 1010, streak_days = 12, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000017';
UPDATE public.profiles SET full_name = 'Sana Malik', avatar_id = 9, liquid_coins = 920, streak_days = 20, pro_expires_at = NOW() + INTERVAL '100 days', status_message = 'Believer in hard work.', last_status_update_at = NOW() WHERE id = '00000000-0000-0000-0000-000000000018';
UPDATE public.profiles SET full_name = 'Neha Joshi', avatar_id = 1, liquid_coins = 840, streak_days = 8, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000019';
UPDATE public.profiles SET full_name = 'Arshad Warsi', avatar_id = 2, liquid_coins = 760, streak_days = 10, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000020';
UPDATE public.profiles SET full_name = 'Aditya Rao', avatar_id = 3, liquid_coins = 680, streak_days = 6, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000021';
UPDATE public.profiles SET full_name = 'Zainab Begum', avatar_id = 4, liquid_coins = 590, streak_days = 5, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000022';
UPDATE public.profiles SET full_name = 'Kavita Deshmukh', avatar_id = 5, liquid_coins = 510, streak_days = 9, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000023';
UPDATE public.profiles SET full_name = 'Farhan Akhtar', avatar_id = 6, liquid_coins = 430, streak_days = 7, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000024';
UPDATE public.profiles SET full_name = 'Rahul Singh', avatar_id = 7, liquid_coins = 350, streak_days = 4, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000025';
UPDATE public.profiles SET full_name = 'Niloufer Khan', avatar_id = 8, liquid_coins = 280, streak_days = 3, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000026';
UPDATE public.profiles SET full_name = 'Shalini Sen', avatar_id = 9, liquid_coins = 220, streak_days = 2, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000027';
UPDATE public.profiles SET full_name = 'Sajid Nadiadwala', avatar_id = 1, liquid_coins = 180, streak_days = 1, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000028';
UPDATE public.profiles SET full_name = 'Deepak Chawla', avatar_id = 2, liquid_coins = 160, streak_days = 2, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000029';
UPDATE public.profiles SET full_name = 'Rukhsar Rehman', avatar_id = 3, liquid_coins = 140, streak_days = 1, pro_expires_at = NULL, status_message = NULL, last_status_update_at = NULL WHERE id = '00000000-0000-0000-0000-000000000030';


-- RPC function to securely get public profile details by username (avatar, leaderboard rank, pro status)
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


-- RPC function to select 5 random opponents for matchmaking to minimize network egress
CREATE OR REPLACE FUNCTION public.get_random_opponents(
  viewer_id uuid DEFAULT NULL,
  max_limit integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_id smallint,
  username text,
  referred_by text,
  pro_expires_at timestamp with time zone,
  status_message varchar(50),
  users_accuracy integer,
  streak_days integer,
  rank integer
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_profiles AS (
    SELECT 
      p.id,
      p.full_name,
      p.avatar_id,
      p.username,
      p.referred_by,
      CASE WHEN p.is_admin THEN NOW() + INTERVAL '100 years' ELSE p.pro_expires_at END as pro_expires_at,
      p.status_message,
      p.users_accuracy,
      p.streak_days,
      row_number() OVER (ORDER BY p.total_coins DESC, p.id ASC)::integer as rank
    FROM public.profiles p
    WHERE p.id <> viewer_id OR viewer_id IS NULL
  )
  SELECT 
    rp.id,
    rp.full_name,
    rp.avatar_id,
    rp.username,
    rp.referred_by,
    rp.pro_expires_at,
    rp.status_message,
    rp.users_accuracy,
    rp.streak_days,
    rp.rank
  FROM ranked_profiles rp
  ORDER BY random()
  LIMIT max_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC function to select a single, diverse opponent for matchmaking to minimize network egress
CREATE OR REPLACE FUNCTION public.get_diverse_opponent(
  viewer_id uuid DEFAULT NULL,
  exclude_usernames text[] DEFAULT '{}',
  viewer_username text DEFAULT NULL,
  viewer_referred_by text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_id smallint,
  username text,
  referred_by text,
  pro_expires_at timestamp with time zone,
  status_message varchar(50),
  users_accuracy integer,
  streak_days integer,
  rank integer,
  target_exam text
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_profiles AS (
    SELECT 
      p.id,
      p.full_name,
      p.avatar_id,
      p.username,
      p.referred_by,
      CASE WHEN p.is_admin THEN NOW() + INTERVAL '100 years' ELSE p.pro_expires_at END as pro_expires_at,
      p.status_message,
      round(coalesce(p.users_accuracy, 0))::integer as users_accuracy,
      p.streak_days,
      row_number() OVER (ORDER BY p.total_coins DESC, p.id ASC)::integer as rank,
      p.target_exam
    FROM public.profiles p
    WHERE p.username IS NOT NULL 
      AND p.username <> '' 
      AND p.full_name IS NOT NULL 
      AND p.full_name <> ''
  )
  SELECT 
    rp.id,
    rp.full_name,
    rp.avatar_id,
    rp.username,
    rp.referred_by,
    rp.pro_expires_at,
    rp.status_message,
    rp.users_accuracy,
    rp.streak_days,
    rp.rank,
    rp.target_exam
  FROM ranked_profiles rp
  WHERE (rp.id <> viewer_id OR viewer_id IS NULL)
    AND (exclude_usernames IS NULL OR cardinality(exclude_usernames) = 0 OR NOT (rp.username = ANY(exclude_usernames)))
    AND (viewer_referred_by IS NULL OR rp.username IS NULL OR lower(rp.username) <> lower(viewer_referred_by))
    AND (viewer_username IS NULL OR rp.referred_by IS NULL OR lower(rp.referred_by) <> lower(viewer_username))
  ORDER BY random()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Asynchronous Challenge Notifications ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  read boolean DEFAULT false NOT NULL,
  type text
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow select on notifications for authenticated users
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Allow update of own notifications (e.g. mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Allow inserting notifications by anyone authenticated (so opponents can notify challengers)
CREATE POLICY "Anyone can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

