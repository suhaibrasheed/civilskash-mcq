-- ==========================================================
-- SUPABASE RPC FUNCTION: DOWNGRADE USER TO FREE
-- Execute this in your Supabase SQL Editor (SQL Query Runner)
-- ==========================================================

CREATE OR REPLACE FUNCTION public.downgrade_user_to_free_rpc()
RETURNS void AS $$
BEGIN
  -- Verify authenticated session
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated: Only logged in users can downgrade their subscription.';
  END IF;

  -- Revert membership status and clear tier dates for the caller
  UPDATE public.profiles
  SET 
    is_pro = false,
    pro_tier = NULL,
    pro_expiration = NULL
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.downgrade_user_to_free_rpc() TO authenticated;
