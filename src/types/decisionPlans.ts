export type DecisionPlanAction = "BUY" | "WATCH" | "HOLD" | "TRIM" | "SELL" | "AVOID";
export type DecisionPlanStatus = "DRAFT" | "ACTIVE" | "CLOSED";

export interface DecisionPlanListItem {
  id: number;
  stockCode: string;
  companyName: string;
  action: DecisionPlanAction;
  status: DecisionPlanStatus;
  title?: string;
  notes?: string;
  sourceNote?: string;
  personalNotes?: string;
  targetBuyPrice?: number;
  fairValue?: number;
  targetSellPrice?: number;
  maxPositionPercent?: number;
  currentPositionPercent?: number;
  reviewDate?: string;
  isDueReview: boolean;
  linkedThesisId?: number;
  linkedWatchlistId?: number;
  updatedAt: string;
}

export interface DecisionPlanDetail extends DecisionPlanListItem {
  buyConditions?: string[];
  sellConditions?: string[];
  riskNotes?: string[];
  personalNotes?: string;
  createdAt: string;
  closedAt?: string;
}

export interface DecisionPlanPage {
  content: DecisionPlanListItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface DecisionPlanPayload {
  stockCode?: string;
  linkedThesisId?: number;
  linkedWatchlistId?: number;
  action: DecisionPlanAction;
  status: DecisionPlanStatus;
  targetBuyPrice?: number;
  fairValue?: number;
  targetSellPrice?: number;
  maxPositionPercent?: number;
  currentPositionPercent?: number;
  reviewDate?: string;
  buyConditions: string[];
  sellConditions: string[];
  riskNotes: string[];
  personalNotes?: string;
}

export interface DecisionPlanPrefill {
  stockCode: string;
  linkedThesisId?: number;
  linkedWatchlistId?: number;
  action?: DecisionPlanAction;
  status?: DecisionPlanStatus;
  reviewDate?: string;
  maxPositionPercent?: number;
  buyConditions?: string[];
  sellConditions?: string[];
  riskNotes?: string[];
  personalNotes?: string;
}
