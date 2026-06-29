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
