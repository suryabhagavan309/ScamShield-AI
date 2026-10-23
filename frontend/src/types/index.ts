export type RiskLevel = 'HIGH' | 'MODERATE' | 'LOW';

export type RedFlagCategory = 
  | 'impersonation'
  | 'urgency'
  | 'secrecy'
  | 'unconventional_payment'
  | 'remote_access'
  | 'threat_or_coercion';

export interface RedFlag {
  category: RedFlagCategory;
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  detected_indicators: string[];
}

export interface VerificationGuidance {
  immediate_action: string;
  pause_recommendation: string;
  independent_verification_steps: string[];
  safe_helplines: string[];
  cooling_off_advice: string;
}

export interface AssessmentResponse {
  assessment_id: string;
  timestamp: string;
  risk_level: RiskLevel;
  risk_score: number;
  summary_headline: string;
  detailed_explanation: string;
  detected_warning_signs: RedFlag[];
  verification_guidance: VerificationGuidance;
  cooling_off_recommended: boolean;
  cooling_off_minutes: number;
  mock_engine_notice: string;
  is_mock: boolean;
}

export interface AssessmentRequest {
  description: string;
  claimed_caller?: string;
  demanded_amount?: string;
  payment_method?: string;
  channel?: string;
}

export type IncidentStatus = 
  | 'NEW'
  | 'PAUSED_COOLING_OFF'
  | 'CONTACT_ALERTED'
  | 'REPORT_DRAFTED'
  | 'RESOLVED';

export interface Incident {
  id: string;
  created_at: string;
  description_snippet: string;
  claimed_caller: string;
  risk_level: RiskLevel;
  risk_score: number;
  status: IncidentStatus;
  cooling_off_active: boolean;
  cooling_off_end_time?: string | null;
  cooling_off_duration_minutes: number;
  assessment: AssessmentResponse;
  trusted_contact_alerted: boolean;
  report_drafted: boolean;
}

export interface SyntheticScenario {
  id: string;
  title: string;
  claimed_caller: string;
  category: string;
  prompt_text: string;
  demanded_amount: string;
  payment_method: string;
  channel: string;
}

export interface AlertRequest {
  incident_id: string;
  contact_name: string;
  contact_relationship: string;
  contact_phone_or_email: string;
  explicit_consent: boolean;
  custom_message_note?: string;
}

export interface AlertResponse {
  alert_id: string;
  incident_id: string;
  timestamp: string;
  simulated_delivery_status: string;
  explicit_consent_verified: boolean;
  recipient_summary: string;
  generated_message_preview: string;
  mock_disclaimer: string;
}

export type TargetAgency = 
  | 'FTC_REPORT_FRAUD'
  | 'LOCAL_POLICE'
  | 'BANK_FRAUD_DEPARTMENT'
  | 'NATIONAL_ELDER_FRAUD_HOTLINE';

export interface ReportDraftRequest {
  incident_id: string;
  target_agency: TargetAgency;
}

export interface ReportDraftResponse {
  report_id: string;
  incident_id: string;
  created_at: string;
  target_agency: TargetAgency;
  target_agency_title: string;
  official_reporting_portal_or_phone: string;
  formatted_report_text: string;
  sanitized_privacy_statement: string;
}
