-- Create public.feedbacks table
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  device_info JSONB NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid migration collision
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.feedbacks;

-- Create policy to allow authenticated users to submit feedback
CREATE POLICY "Enable insert for authenticated users only"
ON public.feedbacks FOR INSERT
TO authenticated
WITH CHECK (true);
