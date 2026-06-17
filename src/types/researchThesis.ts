export type ResearchThesisStatus =
  | "DRAFT"
  | "RESEARCHING"
  | "WATCHLIST"
  | "WAITING_DATA"
  | "REJECTED";

export interface ResearchThesisDraft {
  id: string;
  backendId?: number;
  stockCode: string;
  year?: number;
  thesisStatus: ResearchThesisStatus;
  bullCase: string[];
  bearCase: string[];
  keyRisks: string[];
  missingData: string[];
  buyConditions: string[];
  rejectConditions: string[];
  personalNote: string;
  nextReviewDate: string;
  source?: "OPPORTUNITIES" | "MANUAL";
  sourceMeta?: {
    decision?: string | null;
    researchReadiness?: string | null;
    conclusionConfidenceLevel?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}
