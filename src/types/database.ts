export interface CoachingInstitute {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  location: string | null;
  deception_score: number;
  total_claims: number;
  conflicted_claims: number;
  verified_claims: number;
  created_at: string;
  updated_at: string;
}

export interface TopperClaim {
  id: string;
  institute_id: string | null;
  topper_name: string;
  rank_claimed: string;
  exam_name: string | null;
  exam_year: number | null;
  fine_print: string | null;
  newspaper_name: string | null;
  ad_date: string | null;
  newspaper_image_url: string;
  extracted_text: string | null;
  is_verified: boolean;
  has_conflict: boolean;
  created_at: string;
}

export interface Conflict {
  id: string;
  topper_name: string;
  rank_claimed: string;
  exam_name: string | null;
  exam_year: number | null;
  claim_ids: string[];
  institute_ids: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'unresolved' | 'investigating' | 'confirmed' | 'dismissed';
  created_at: string;
  updated_at: string;
}

export interface CCPAReport {
  id: string;
  institute_id: string | null;
  conflict_id: string | null;
  report_data: ReportData;
  pdf_url: string | null;
  generated_at: string;
}

export interface ReportData {
  institute_name: string;
  institute_logo: string | null;
  conflict_details: ConflictDetail[];
  generated_at: string;
  summary: string;
}

export interface ConflictDetail {
  topper_name: string;
  rank_claimed: string;
  exam_name: string;
  exam_year: number;
  conflicting_institutes: string[];
  newspaper_images: string[];
}

export interface ExtractedStudent {
  topper_name: string;
  rank_claimed: string;
  exam_name: string | null;
  exam_year: number | null;
  fine_print: string | null;
}

export interface ExtractedAdData {
  institute_name: string;
  students: ExtractedStudent[];
  confidence: number;
}
