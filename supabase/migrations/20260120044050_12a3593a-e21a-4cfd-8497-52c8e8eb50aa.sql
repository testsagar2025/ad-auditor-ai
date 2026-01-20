-- Create coaching_institutes table (The Store)
CREATE TABLE public.coaching_institutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  location TEXT,
  deception_score INTEGER NOT NULL DEFAULT 0,
  total_claims INTEGER NOT NULL DEFAULT 0,
  conflicted_claims INTEGER NOT NULL DEFAULT 0,
  verified_claims INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create topper_claims table (extracted from newspaper ads)
CREATE TABLE public.topper_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.coaching_institutes(id) ON DELETE CASCADE,
  topper_name TEXT NOT NULL,
  rank_claimed TEXT NOT NULL,
  exam_name TEXT,
  exam_year INTEGER,
  fine_print TEXT,
  newspaper_name TEXT,
  ad_date DATE,
  newspaper_image_url TEXT NOT NULL,
  extracted_text TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  has_conflict BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conflicts table (detected conflicts)
CREATE TABLE public.conflicts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topper_name TEXT NOT NULL,
  rank_claimed TEXT NOT NULL,
  exam_name TEXT,
  exam_year INTEGER,
  claim_ids UUID[] NOT NULL,
  institute_ids UUID[] NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'unresolved',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ccpa_reports table (generated reports)
CREATE TABLE public.ccpa_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.coaching_institutes(id) ON DELETE SET NULL,
  conflict_id UUID REFERENCES public.conflicts(id) ON DELETE SET NULL,
  report_data JSONB NOT NULL,
  pdf_url TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public read, anonymous app)
ALTER TABLE public.coaching_institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topper_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ccpa_reports ENABLE ROW LEVEL SECURITY;

-- Public read policies (anonymous access for transparency)
CREATE POLICY "Anyone can view institutes" ON public.coaching_institutes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view topper claims" ON public.topper_claims
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view conflicts" ON public.conflicts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view reports" ON public.ccpa_reports
  FOR SELECT USING (true);

-- Anonymous insert policies (no user tracking as per requirements)
CREATE POLICY "Anyone can submit claims" ON public.topper_claims
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can create institutes" ON public.coaching_institutes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can generate reports" ON public.ccpa_reports
  FOR INSERT WITH CHECK (true);

-- System update policies (for backend conflict detection)
CREATE POLICY "System can update claims" ON public.topper_claims
  FOR UPDATE USING (true);

CREATE POLICY "System can update institutes" ON public.coaching_institutes
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can create conflicts" ON public.conflicts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update conflicts" ON public.conflicts
  FOR UPDATE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_coaching_institutes_updated_at
  BEFORE UPDATE ON public.coaching_institutes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conflicts_updated_at
  BEFORE UPDATE ON public.conflicts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for newspaper images
INSERT INTO storage.buckets (id, name, public) VALUES ('newspaper-ads', 'newspaper-ads', true);

-- Storage policies for anonymous uploads
CREATE POLICY "Anyone can upload newspaper ads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'newspaper-ads');

CREATE POLICY "Anyone can view newspaper ads" ON storage.objects
  FOR SELECT USING (bucket_id = 'newspaper-ads');

-- Create index for conflict detection
CREATE INDEX idx_topper_claims_conflict_detection 
  ON public.topper_claims(topper_name, rank_claimed, exam_year);