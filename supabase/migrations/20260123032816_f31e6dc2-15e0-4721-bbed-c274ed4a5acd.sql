-- Add course_category to coaching_institutes
ALTER TABLE public.coaching_institutes 
ADD COLUMN IF NOT EXISTS course_category text DEFAULT 'JEE' CHECK (course_category IN ('JEE', 'NEET', 'BOTH'));

-- Add course_category to topper_claims
ALTER TABLE public.topper_claims 
ADD COLUMN IF NOT EXISTS course_category text DEFAULT 'JEE' CHECK (course_category IN ('JEE', 'NEET'));

-- Create analytics table for admin dashboard
CREATE TABLE IF NOT EXISTS public.analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  page_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on analytics
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics events
CREATE POLICY "Anyone can insert analytics" ON public.analytics
FOR INSERT WITH CHECK (true);

-- Anyone can view analytics (admin will filter client-side with password)
CREATE POLICY "Anyone can view analytics" ON public.analytics
FOR SELECT USING (true);