export type UserRole = 
  | "Super Admin" 
  | "Commissioner" 
  | "Station Admin" 
  | "Police Officer" 
  | "Investigator" 
  | "Data Entry Operator";

export interface Permission {
  public_id: string;
  code: string;
  name: string;
  module: string;
}

export interface Role {
  public_id: string;
  name: UserRole;
  description?: string;
  permissions: Permission[];
}

export interface User {
  id?: number;
  public_id: string;
  email: string;
  full_name: string;
  badge_number?: string;
  rank?: string;
  station_name?: string;
  phone_number?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  role?: Role;
}

export interface CrimeTimeline {
  public_id: string;
  title: string;
  description: string;
  event_timestamp: string;
  performed_by?: User;
}

export interface Crime {
  id?: number;
  public_id: string;
  crime_number: string;
  title: string;
  crime_type: string;
  custom_crime_type?: string;
  description: string;
  crime_date: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
  priority: "Low" | "Medium" | "High" | "Critical";
  severity: "Minor" | "Moderate" | "Severe" | "Critical";
  status: "Open" | "Under Investigation" | "Pending Approval" | "Closed";
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  assigned_officer?: User;
  timeline_entries?: CrimeTimeline[];
  evidences?: any[];
}

export interface FIR {
  id?: number;
  public_id: string;
  fir_number: string;
  crime_id?: number;
  complainant_name: string;
  complainant_contact: string;
  complainant_address?: string;
  incident_details: string;
  sections_of_law: string;
  status: "Registered" | "Under Review" | "Verified" | "Closed";
  registered_at: string;
}

export interface Criminal {
  id?: number;
  public_id: string;
  full_name: string;
  alias?: string;
  photo_url?: string;
  dob?: string;
  gender?: string;
  address?: string;
  identification_marks?: string;
  wanted_status: "Wanted" | "Arrested" | "Released" | "Absconding" | "Not Wanted";
  created_at: string;
  updated_at: string;
}

export interface Victim {
  id?: number;
  public_id: string;
  crime_id: number;
  full_name: string;
  contact?: string;
  address?: string;
  statement?: string;
  medical_report_url?: string;
  created_at: string;
}

export interface Witness {
  id?: number;
  public_id: string;
  crime_id: number;
  full_name: string;
  contact?: string;
  address?: string;
  statement?: string;
  is_protected: boolean;
  created_at: string;
}

export interface EvidenceChainOfCustody {
  id?: number;
  public_id: string;
  action: string;
  moved_from?: string;
  moved_to?: string;
  notes?: string;
  created_at: string;
  handled_by?: User;
}

export interface Evidence {
  id?: number;
  public_id: string;
  evidence_number: string;
  crime_id: number;
  file_name: string;
  file_type: "image" | "video" | "audio" | "pdf" | "document";
  file_url: string;
  description?: string;
  barcode?: string;
  storage_location: string;
  status: "In Locker" | "In Lab" | "Court Presentation" | "Disposed";
  created_at: string;
  uploaded_by?: User;
  assigned_officer?: User;
  chain_of_custody?: EvidenceChainOfCustody[];
}

export interface CaseDiary {
  id?: number;
  public_id: string;
  notes: string;
  entry_date: string;
  author?: User;
}

export interface Investigation {
  id?: number;
  public_id: string;
  crime_id: number;
  status: "In Progress" | "Pending Chargesheet" | "Closed" | "Cold Case";
  summary?: string;
  started_at: string;
  closed_at?: string;
  lead_investigator?: User;
  case_diaries?: CaseDiary[];
}

export interface OfficerWorkload {
  officer: User;
  active_cases_count: number;
  closed_cases_count: number;
  performance_score: number;
  availability_status: "Available" | "High Workload" | "Overloaded";
}

export interface AuditLog {
  id?: number;
  public_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
  user_email?: string;
  user?: User;
}

export interface AnalyticsOverview {
  total_crimes: number;
  open_crimes: number;
  under_investigation: number;
  closed_crimes: number;
  total_firs: number;
  total_criminals: number;
  total_evidences: number;
  resolution_rate: number;
  crime_type_distribution: { category: string; count: number; percentage: number }[];
  monthly_trends: { month: string; total_crimes: number; resolved: number; pending: number }[];
  severity_distribution: { severity: string; count: number }[];
  station_performance: { station_name: string; total_cases: number; closed_cases: number; resolution_rate: number }[];
}

export interface StandardApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PaginatedApiResponse<T> extends StandardApiResponse<PaginatedData<T>> {}
