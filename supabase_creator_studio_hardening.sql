-- Creator Studio hardening for MCQKash.
-- Run in Supabase Studio SQL Editor after the base profile schema.

-- 1. Shared admin check used by RLS policies and RPCs.
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Questions table safety net for Creator Studio pushes.
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id text NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_id text NOT NULL DEFAULT 'a',
  explanation text DEFAULT '',
  tags text[] DEFAULT '{}',
  difficulty text DEFAULT NULL,
  source text DEFAULT 'admin-studio',
  status text DEFAULT 'published',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT questions_difficulty_check
    CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard')),
  CONSTRAINT questions_status_check
    CHECK (status IN ('draft', 'published', 'hidden', 'unpublished'))
);

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS difficulty text DEFAULT NULL;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS pyq text DEFAULT NULL;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published questions are readable" ON public.questions;
CREATE POLICY "Published questions are readable" ON public.questions
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
CREATE POLICY "Admins can manage questions" ON public.questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 3. Exams table safety net. Hidden/unpublished exams stay in DB but vanish from the app.
CREATE TABLE IF NOT EXISTS public.exams (
  id text PRIMARY KEY,
  name text NOT NULL,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  difficulties jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT exams_status_check
    CHECK (status IN ('published', 'hidden', 'unpublished'))
);

ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published exams are readable" ON public.exams;
CREATE POLICY "Published exams are readable" ON public.exams
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
CREATE POLICY "Admins can manage exams" ON public.exams
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 4. Optional: make the passcode RPC require a real admin account too.
-- Replace 'CHANGE_THIS_ADMIN_PASSCODE_HASH' with crypt('your-passcode', gen_salt('bf'))
-- if you want DB-side passcode verification instead of your existing RPC.
-- The app already requires both profiles.is_admin=true and verify_admin_passcode=true.

-- 5. Explicitly grant permissions on questions and exams tables to API roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT SELECT ON public.questions TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT SELECT ON public.exams TO anon;
