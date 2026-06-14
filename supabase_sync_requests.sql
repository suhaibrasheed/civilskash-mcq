-- Create Sync Requests table to securely trigger GitHub builds via Supabase Webhooks
CREATE TABLE IF NOT EXISTS public.sync_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.sync_requests ENABLE ROW LEVEL SECURITY;

-- Allow only authenticated users (admins) to insert sync requests
-- In a real app, you can restrict this to admin users only.
CREATE POLICY "Authenticated users can insert sync requests" ON public.sync_requests
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to view sync requests
CREATE POLICY "Authenticated users can view sync requests" ON public.sync_requests
  FOR SELECT TO authenticated USING (true);

-- Explicitly grant permissions on sync_requests table to API roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_requests TO authenticated;
GRANT SELECT ON public.sync_requests TO anon;

