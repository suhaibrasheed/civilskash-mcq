# Battle Arena Matchmaking Summary & Developer Handover

This document summarizes the bugs, architectural issues, and solutions implemented in the MCQ Kash Battle Arena to optimize matchmaking diversity and code safety.

## 1. Handover Checklist & Summary

| Feature / Issue | Symptom | Technical Solution |
| :--- | :--- | :--- |
| **Matchmaking Duplicates** | matched same opponent repeatedly | Created `get_diverse_opponent` RPC. Client caches the last 6 usernames in `localStorage` and excludes them on the database level. |
| **Numeric/Integer Cast (400 Error)** | Network POST to `rpc/get_diverse_opponent` returned 400 | `profiles.users_accuracy` is a numeric decimal type. Cast it to integer inside the database function query: `round(coalesce(p.users_accuracy, 0))::integer`. |
| **"Aspirant" / "@aspirant" Match Loop** | Matched placeholder profiles with blank usernames repeatedly | 1. In SQL, `NULL = ANY(...)` is always null, bypassing exclusions. Filtered them out in the database query via `WHERE p.username IS NOT NULL AND p.username <> ''`. <br>2. Resolved fallbacks on the frontend (resolvedUsername cached in local storage). |
| **Exam & Accuracy Fallbacks** | Players with no exam showed as "State PSC"; 0% accuracy looked broken | 1. Defaulted null opponent exams to match the active user's target exam. <br>2. Adjusted 0% or null accuracy values to a realistic baseline (30% to 70%). |
| **Ghost Match Opponents** | matched against offline mock names in Ghost Mode | Refactored `handleStartGhostAnyway` to query real database opponents using the exact same matchmaking database RPC. |
| **Explanations Autoplay Bug** | Multiple explanation videos played simultaneously on result card | Added string sanitizer to `McqCard.jsx` to replace `autoplay=1` with `autoplay=0` and strip autoplay permissions. |
| **Clean Logo in Mock Tests** | Brand name and tier badges cluttered the test engine header | Refactored `MCQKashLogo` to support `onlyIcon` prop. `ExamEngine.jsx` now only displays the clean "M" hexagon logo. |

---

## 2. Technical Details

### Stored Procedure (`get_diverse_opponent`)
The database function matches candidates randomly using `ORDER BY random() LIMIT 1` while applying exclusion rules:

```sql
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
    -- Exclude incomplete placeholder test profiles
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
    -- Anti-collusion checks (referred/referrer accounts)
    AND (viewer_referred_by IS NULL OR rp.username IS NULL OR lower(rp.username) <> lower(viewer_referred_by))
    AND (viewer_username IS NULL OR rp.referred_by IS NULL OR lower(rp.referred_by) <> lower(viewer_username))
  ORDER BY random()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Client-Side Matching Integration
The frontend matches contestants in `BattleArena.jsx` using:
- `const lastUsernamesKey = 'mcqkash_last_usernames_' + userId`
- `const cleanUsernames = lastUsernames.filter(...)`
- Invokes `supabase.rpc('get_diverse_opponent', { exclude_usernames: cleanUsernames })`.
- Handles target exam and accuracy fallback values dynamically.
