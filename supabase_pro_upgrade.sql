-- ==========================================================
-- PRO UPGRADE PAYMENT SYSTEM SCHEMA EXTENSION
-- ==========================================================

-- 1. Extend the public.profiles table with premium status tracking columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_pro boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pro_tier text DEFAULT NULL CHECK (pro_tier IN ('THREE_MONTHS', 'SIX_MONTHS', 'ONE_YEAR', 'LIFETIME')),
ADD COLUMN IF NOT EXISTS pro_expiration timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_history jsonb DEFAULT '[]'::jsonb;

-- 2. Update the Row Level Security (RLS) trigger function to protect new columns
-- Normal client users ('authenticated' / 'anon') must be blocked from directly updating
-- financial, streak, admin, or any Pro status fields.
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS trigger AS $$
BEGIN
  -- Enforce zero-trust: prevent direct client updates to sensitive columns.
  -- The backend uses the SUPABASE_SERVICE_ROLE_KEY which runs as a superuser/service_role
  -- bypassing this check.
  IF current_user IN ('authenticated', 'anon') THEN
    IF NEW.liquid_coins IS DISTINCT FROM OLD.liquid_coins OR
       NEW.staked_coins IS DISTINCT FROM OLD.staked_coins OR
       NEW.streak_days IS DISTINCT FROM OLD.streak_days OR
       NEW.pro_expires_at IS DISTINCT FROM OLD.pro_expires_at OR
       NEW.is_admin IS DISTINCT FROM OLD.is_admin OR
       NEW.last_streak_increment_at IS DISTINCT FROM OLD.last_streak_increment_at OR
       NEW.is_pro IS DISTINCT FROM OLD.is_pro OR
       NEW.pro_tier IS DISTINCT FROM OLD.pro_tier OR
       NEW.pro_expiration IS DISTINCT FROM OLD.pro_expiration OR
       NEW.payment_history IS DISTINCT FROM OLD.payment_history THEN
      RAISE EXCEPTION 'Permission denied: Direct updates to financial, streak, or tier columns are not allowed.';
    END IF;
  END IF;

  -- Validate status message updates (Pro-only feature)
  IF NEW.status_message IS DISTINCT FROM OLD.status_message THEN
    -- Check if user is Pro or Admin (supporting both old and new columns)
    IF (NEW.pro_expires_at IS NULL OR NEW.pro_expires_at <= NOW()) 
       AND (NEW.pro_expiration IS NULL OR NEW.pro_expiration <= NOW())
       AND NOT COALESCE(NEW.is_pro, false)
       AND NOT COALESCE(NEW.is_admin, false) THEN
      RAISE EXCEPTION 'Status message is a Pro-only feature. Go Pro to speak to the global audience!';
    END IF;

    -- Anti-spam: enforce 24-hour update rule
    IF OLD.last_status_update_at IS NOT NULL AND OLD.last_status_update_at > NOW() - INTERVAL '24 hours' THEN
      RAISE EXCEPTION 'You can only update your status message once every 24 hours!';
    END IF;

    -- Update last status update timestamp
    NEW.last_status_update_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update the check constraint to allow the new ONE_WEEK and ONE_MONTH pro_tier values
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pro_tier_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pro_tier_check CHECK (pro_tier IN ('ONE_WEEK', 'ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'ONE_YEAR', 'LIFETIME'));
