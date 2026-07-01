export type NewsAiSymbolCorrect = "TRUE" | "FALSE" | "PARTIAL" | "UNKNOWN";
export type NewsAiHumanContextLabel =
  | "STOCK_DIRECT"
  | "MARKET_CONTEXT"
  | "INDUSTRY_CONTEXT"
  | "LEGITIMATE_OTHER_SYMBOL"
  | "RELATED_COMPANY_AMBIGUITY"
  | "INSUFFICIENT_EVIDENCE"
  | "WRONG_SYMBOL";
export type NewsAiHumanEventType =
  | "MARKET_FLOW"
  | "ENTERPRISE_CONTEXT"
  | "FINANCE_CONTEXT"
  | "BANKING_CONTEXT"
  | "INSURANCE_CONTEXT"
  | "REAL_ESTATE_CONTEXT"
  | "CORPORATE_ACTION"
  | "LEGAL_RISK"
  | "OTHER"
  | "UNKNOWN";
export type NewsAiHumanSentiment = "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED" | "UNKNOWN";
export type NewsAiHumanImpactLevel = "HIGH" | "MEDIUM" | "LOW" | "NONE" | "UNKNOWN";
export type NewsAiReviewStatus = "PENDING" | "REVIEWED" | "SKIPPED" | "NEED_MORE_EVIDENCE";

export interface NewsAiManualReview {
  id: number;
  impactId: number;
  articleId: number | null;
  stockId: number | null;
  stockCode: string | null;
  gateVersion: string | null;
  evidenceGateLabel: string | null;
  evidenceGateReason: string | null;
  symbolCorrect: NewsAiSymbolCorrect | null;
  humanContextLabel: NewsAiHumanContextLabel | null;
  humanEventType: NewsAiHumanEventType | null;
  humanSentiment: NewsAiHumanSentiment | null;
  humanImpactLevel: NewsAiHumanImpactLevel | null;
  reviewStatus: NewsAiReviewStatus;
  reviewerNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface NewsAiReviewQueueItem {
  impactId: number;
  articleId: number | null;
  stockId: number | null;
  stockCode: string | null;
  title: string | null;
  summary: string | null;
  source: string | null;
  sourceType: string | null;
  url: string | null;
  publishedAt: string | null;
  eventType: string | null;
  eventCategory: string | null;
  sentiment: string | null;
  impactScore: number | null;
  industryAdjustedImpactScore: number | null;
  confidenceScore: number | null;
  confidenceLabel: string | null;
  priorityScore: number | null;
  horizon: string | null;
  evidence: string[] | null;
  reviewReasons: string[] | null;
  evidenceGateLabel: string | null;
  evidenceGateAction: string | null;
  evidenceGateConfidence: string | null;
  evidenceGateReason: string | null;
  directEvidenceMatchedText: string | null;
  gateVersion: string | null;
  gateEvaluatedAt: string | null;
  processedAt: string | null;
  reviewStatus: NewsAiReviewStatus;
  review: NewsAiManualReview | null;
}

export interface NewsAiReviewSummary {
  totalQueue: number;
  pending: number;
  reviewed: number;
  skipped: number;
  needMoreEvidence: number;
  byGateVersion: Record<string, number>;
  byHumanContextLabel: Record<string, number>;
}

export interface NewsAiReviewRequest {
  symbolCorrect?: NewsAiSymbolCorrect;
  humanContextLabel?: NewsAiHumanContextLabel;
  humanEventType?: NewsAiHumanEventType;
  humanSentiment?: NewsAiHumanSentiment;
  humanImpactLevel?: NewsAiHumanImpactLevel;
  reviewStatus: NewsAiReviewStatus;
  reviewerNote?: string;
  reviewedBy?: string;
}

export interface NewsAiReviewQueueParams {
  reviewStatus?: NewsAiReviewStatus;
  stockCode?: string;
  source?: string;
  gateVersion?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
