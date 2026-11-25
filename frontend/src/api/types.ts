export interface CandidateRequest {
  firstName: string;
  lastName: string;
  email: string;
  skills?: string[];
  experienceYears?: number;
  diplomaTitle?: string;
  diplomaInstitution?: string;
  diplomaYear?: number;
}

export interface Candidate extends CandidateRequest {
  id: number;
}

export interface OfferRequest {
  title: string;
  description?: string;
  requiredSkills?: string[];
  requiredExperienceYears?: number;
}

export interface Offer extends OfferRequest {
  id: number;
}

export const applicationStatuses = [
  "RECEIVED",
  "DIPLOMA_VERIFIED",
  "DIPLOMA_NOT_FOUND",
  "DIPLOMA_PENDING_VERIFICATION",
  "SCORING_PENDING",
  "SCORED",
  "ACCEPTED",
  "REJECTED",
  "PENDING",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export interface ApplicationRequest {
  candidateId: number;
  offerId: number;
}

export interface Application {
  id: number;
  candidateId: number;
  offerId: number;
  status: ApplicationStatus;
  submittedAt: string;
  score?: number | null;
  diplomaVerified: boolean;
}

export interface RankedApplication {
  applicationId: number;
  score: number;
  rank: number;
}

export interface HealthResponse {
  status: string;
}

export interface ErrorResponse {
  error: string;
}
