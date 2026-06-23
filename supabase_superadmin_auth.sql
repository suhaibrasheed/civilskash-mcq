-- Run this in your Supabase SQL Editor to support the new Super Admin tier passcode.

-- 1. Create verify_superadmin_passcode RPC
CREATE OR REPLACE FUNCTION public.verify_superadmin_passcode(entered_passcode text)
RETURNS boolean AS $$
DECLARE
  stored_passcode text;
BEGIN
  -- Check if the current authenticated user is an admin first
  IF NOT public.is_current_user_admin() THEN
    RETURN false;
  END IF;

  SELECT value INTO stored_passcode
  FROM public.admin_config
  WHERE key = 'superadmin_passcode';

  RETURN entered_passcode = stored_passcode;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Redefine verify_admin_passcode RPC to allow EITHER admin_passcode OR superadmin_passcode
CREATE OR REPLACE FUNCTION public.verify_admin_passcode(entered_passcode text)
RETURNS boolean AS $$
DECLARE
  stored_admin_passcode text;
  stored_superadmin_passcode text;
BEGIN
  -- Check if the current authenticated user is an admin first
  IF NOT public.is_current_user_admin() THEN
    RETURN false;
  END IF;

  SELECT value INTO stored_admin_passcode FROM public.admin_config WHERE key = 'admin_passcode';
  SELECT value INTO stored_superadmin_passcode FROM public.admin_config WHERE key = 'superadmin_passcode';

  RETURN entered_passcode = stored_admin_passcode OR entered_passcode = stored_superadmin_passcode;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Explicitly grant execute permissions to API roles
GRANT EXECUTE ON FUNCTION public.verify_admin_passcode(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_superadmin_passcode(text) TO authenticated;
