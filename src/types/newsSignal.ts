export type NewsEvidenceGateLabel =
  | "STOCK_DIRECT"
  | "MARKET_CONTEXT"
  | "INDUSTRY_CONTEXT"
  | "NEEDS_REVIEW"
  | "INSUFFICIENT_EVIDENCE";

export type NewsEvidenceGateAction =
  | "KEEP_STOCK_CONTEXT"
  | "DOWNGRADE_TO_MARKET_CONTEXT"
  | "DOWNGRADE_TO_INDUSTRY_CONTEXT"
  | "HUMAN_REVIEW_REQUIRED"
  | "DO_NOT_USE_FOR_STOCK_IMPACT";

export type NewsEvidenceGateConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface NewsStockImpact {
  signalId: number | null;
  articleId: number | null;
  stockCode: string | null;
  title: string | null;
  source: string | null;
  sourceType: string | null;
  url: string | null;
  publishedAt: string | null;
  eventType: string;
  eventCategory: string | null;
  sentiment: string;
  impactScore: number | null;
  industryAdjustedImpactScore: number | null;
  confidenceScore: number | null;
  confidenceLabel: string | null;
  needsReview: boolean | null;
  priorityScore: number | null;
  horizon: string | null;
  evidence: string[];
  reviewReasons: string[];
  processedAt: string | null;
  ensembleSource: string | null;
  phobertEventType: string | null;
  bgeEventType: string | null;
  evidenceGateLabel?: NewsEvidenceGateLabel | null;
  evidenceGateAction?: NewsEvidenceGateAction | null;
  evidenceGateConfidence?: NewsEvidenceGateConfidence | null;
  evidenceGateReason?: string | null;
  directEvidenceMatchedText?: string | null;
  gateVersion?: string | null;
  gateEvaluatedAt?: string | null;
}

export interface NewsStockContext {
  stockCode: string;
  days: number;
  totalImpacts: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  weightedSentiment: number;
  sentimentRatio: number;
  contextLabel: string;
  warnings: string[];
  recentImpacts: NewsStockImpact[];
}

export interface NewsMarketContext {
  days: number;
  totalImpacts: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  weightedSentiment: number;
  contextLabel: string;
  topImpacts: NewsStockImpact[];
}

export interface NewsSentimentSummary {
  stockCode?: string;
  industry?: string;
  available: boolean;
  totalSignals: number;
  positiveCount: number;
  negativeCount: number;
  weightedSentiment: number;
  sentimentRatio: number;
}
