export type Decision = "RESEARCH_NOW" | "WATCHLIST" | "REVIEW" | "AVOID";

export type DecisionReasonCode =
  | "LOW_LIQUIDITY"
  | "NEGATIVE_MOMENTUM"
  | "BANK_DATA_MISSING"
  | "FINANCIAL_SERVICES_DATA_MISSING"
  | "INSURANCE_DATA_MISSING"
  | "CYCLICAL_RISK"
  | "DATA_NOT_ENOUGH"
  | "OLD_PRICE_DATA"
  | "INSUFFICIENT_52W_DATA"
  | "REVENUE_DECLINE"
  | "LOW_ROE"
  | "VALUE_TRAP_RISK"
  | "VALUATION_HIGH"
  | "FINANCIAL_RISK"
  | "QUALITY_STRONG"
  | "VALUE_ATTRACTIVE"
  | "NORMAL";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type DataConfidenceLevel = "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW";

export type DataConfidenceWarning =
  | "PROFIT_CAGR_OUTLIER"
  | "PROFIT_CAGR_VOLATILE"
  | "BASE_YEAR_PROFIT_LOW"
  | "CFO_LNST_UNRELIABLE"
  | "INDUSTRY_RULE_MISSING"
  | "DATA_CONFIDENCE_LOW"
  | "INSUFFICIENT_FINANCIAL_COVERAGE"
  | "STALE_PRICE"
  | "MISSING_SHARE_INFO"
  | "PE_OUT_OF_RANGE"
  | "PB_OUT_OF_RANGE"
  | "EPS_NOT_MEANINGFUL"
  | "PRICE_STALE"
  | "PRICE_FUTURE_DATE"
  | "TURNAROUND_BASE_EFFECT"
  | string;

export type ResearchReadiness =
  | "READY_FOR_RESEARCH"
  | "PRELIMINARY_ONLY"
  | "LOW_CONFIDENCE_DATA"
  | "WATCH_ONLY"
  | "AVOID_FOR_NOW";

export type ExecutionReadiness =
  | "READY_TO_TRADE"
  | "TRADE_WITH_SIZE_LIMIT"
  | "LOW_LIQUIDITY_CAUTION"
  | "NOT_RECOMMENDED_TO_TRADE";

export type LiquidityLevel = "VERY_LIQUID" | "LIQUID" | "ACCEPTABLE" | "LOW_LIQUIDITY" | "UNKNOWN";

export type PriceTrendLevel =
  | "POSITIVE_MOMENTUM"
  | "STABLE"
  | "WEAK"
  | "NEGATIVE_MOMENTUM"
  | "FALLING_KNIFE"
  | "UNKNOWN";

export interface OpportunityQueryParams {
  fromYear: number;
  toYear: number;
  page: number;
  size: number;
  exchange?: string;
  excludeLowLiquidity?: boolean;
  decision?: string;
  decisionReasonCode?: string;
  industryGroup?: string;
  opportunityType?: string;
  dataConfidenceLevel?: string;
  conclusionConfidenceLevel?: string;
  researchReadiness?: string;
  executionReadiness?: string;
  minFinalScore?: number;
  minQualityScore?: number;
  minAverageRoe?: number;
  minLiquidityScore?: number;
  minDataCompletenessScore?: number;
  maxPe?: number;
  maxPb?: number;
  sort?: string;
}

export interface OpportunityMeta {
  exchange?: string | null;
  fromYear: number;
  toYear: number;
  limit?: number | null;
  page: number;
  size: number;
  totalReturned: number;
  totalBeforeFilters: number;
  totalAfterFilters: number;
  excludedByLowLiquidity: number;
  excludeLowLiquidity: boolean;
  viewMode: string;
  responseMode: string;
  sort: string;
  activeFilters: Record<string, unknown>;
  generatedAt: string;
  source?: "SNAPSHOT" | "REALTIME_FALLBACK" | string | null;
  snapshotGeneratedAt?: string | null;
  snapshotCount?: number | null;
  latestSourceUpdatedAt?: string | null;
  isSourceNewerThanSnapshot?: boolean | null;
  dataFreshnessStatus?: "FRESH" | "SOURCE_NEWER_THAN_SNAPSHOT" | "UNKNOWN_SOURCE_FRESHNESS" | string | null;
  latestJobStatus?: string | null;
  warning?: string | null;
}

export interface OpportunityPagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export interface OpportunitySummary {
  scope: string;
  reasonCodeCountMode: string;
  noReasonCount: number;
  countModes: Record<string, string>;
  decisionCounts: Record<string, number>;
  reasonCodeCounts: Record<string, number>;
  liquidityCounts: Record<string, number>;
  industryCounts: Record<string, number>;
  priceTrendCounts: Record<string, number>;
  dataConfidenceCounts: Record<string, number>;
  conclusionConfidenceCounts: Record<string, number>;
  researchReadinessCounts: Record<string, number>;
  executionReadinessCounts: Record<string, number>;
}

export interface OpportunitySummaryItem {
  rank: number;
  code: string;
  name: string;
  exchange?: string | null;
  industry?: string | null;
  subIndustry?: string | null;
  industryGroup?: string | null;
  fromYear: number;
  toYear: number;
  latestPriceDate?: string | null;
  latestPrice?: number | null;
  finalScore?: number | null;
  qualityScore?: number | null;
  growthScore?: number | null;
  cashFlowScore?: number | null;
  balanceSheetScore?: number | null;
  valuationScore?: number | null;
  riskPenalty?: number | null;
  decision: Decision | string;
  decisionLabel?: string | null;
  decisionReasonCode?: DecisionReasonCode | string | null;
  decisionReasonCodes: string[];
  decisionReasonLabels: string[];
  opportunityType?: string | null;
  revenueCagr?: number | null;
  profitCagr?: number | null;
  averageRoe?: number | null;
  latestNetProfitMargin?: number | null;
  averageDebtToEquity?: number | null;
  averageCfoToNetProfit?: number | null;
  eps?: number | null;
  pe?: number | null;
  pb?: number | null;
  liquidityLevel?: LiquidityLevel | string | null;
  liquidityWarning?: boolean | null;
  averageVolume20d?: number | null;
  averageTradingValue20d?: number | null;
  priceChange1M?: number | null;
  priceChange3M?: number | null;
  priceChange6M?: number | null;
  priceChange1Y?: number | null;
  drawdownFrom52wHigh?: number | null;
  priceTrendLevel?: PriceTrendLevel | string | null;
  sectorSpecific?: boolean | null;
  notApplicableMetrics?: string[];
  missingRequiredMetrics?: string[];
  mainReasons?: string[];
  mainRisks?: string[];
  dataQualityWarnings?: string[];
  dataCompletenessScore?: number | null;
  dataConfidenceScore?: number | null;
  dataConfidenceLevel?: DataConfidenceLevel | string | null;
  dataConfidenceLabel?: string | null;
  dataConfidenceWarnings?: DataConfidenceWarning[];
  // Score breakdown for clarity
  businessQualityScore?: number | null;
  businessQualityLabel?: string | null;
  valuationAttractivenessScore?: number | null;
  valuationLabel?: string | null;
  riskPenaltyScore?: number | null;
  finalInterpretation?: string | null;
  businessQualitySummary?: string | null;
  valuationSummary?: string | null;
  finalDecisionSummary?: string | null;
  // Explanation fields for Task 5 QA
  oneLineVerdict?: string | null;
  explanationBullets?: string[];
  watchConditions?: string[];
  cautionMessage?: string | null;
  conclusionConfidenceLevel?: ConfidenceLevel | string | null;
  conclusionConfidenceLabel?: string | null;
  researchReadiness?: ResearchReadiness | string | null;
  researchReadinessLabel?: string | null;
  executionReadiness?: ExecutionReadiness | string | null;
  executionReadinessLabel?: string | null;
}

export interface OpportunityDetailItem extends OpportunitySummaryItem {
  industryRuleScore?: number | null;
  industryValuationScore?: number | null;
  industryRiskPenalty?: number | null;
  industryTotalScoreImpact?: number | null;
  industryMaxDecision?: string | null;
  signalScore?: number | null;
  investmentOpportunityScore?: number | null;
  valueScore?: number | null;
  marginOfSafetyScore?: number | null;
  qualityFloorScore?: number | null;
  longTermScore?: number | null;
  liquiditySessions20d?: number | null;
  liquidityOldestDate?: string | null;
  liquidityLatestDate?: string | null;
  priceChange3M?: number | null;
  priceChange6M?: number | null;
  priceChange1Y?: number | null;
  high52w?: number | null;
  low52w?: number | null;
  distanceFrom52wLow?: number | null;
  priceWarnings?: string[];
  reasons?: string[];
  risks?: string[];
  // Valuation V2.1 — Historical
  historicalMedianPe3y?: number | null;
  historicalMedianPb3y?: number | null;
  peVsHistoryPercent?: number | null;
  pbVsHistoryPercent?: number | null;
  peHistoryLabel?: string | null;
  pbHistoryLabel?: string | null;
  historicalValuationLabel?: string | null;
  historicalValuationScore?: number | null;
  historicalValuationExplanation?: string | null;
  historicalValuationWarnings?: string[];
  // Valuation V2.2 — Industry Median
  industryMedianPe?: number | null;
  industryMedianPb?: number | null;
  peVsIndustryPercent?: number | null;
  pbVsIndustryPercent?: number | null;
  peIndustryLabel?: string | null;
  pbIndustryLabel?: string | null;
  industryMedianLabel?: string | null;
  industryMedianScore?: number | null;
  industrySampleSize?: number | null;
  industryMedianExplanation?: string | null;
  industryMedianWarnings?: string[];
  // Valuation V2.3 — Quality-adjusted
  qualityAdjustedValuationLabel?: string | null;
  qualityPremiumStatus?: string | null;
  valueTrapRiskLevel?: string | null;
  premiumJustificationScore?: number | null;
  discountQualityRiskScore?: number | null;
  qualityAdjustedValuationScore?: number | null;
  qualityAdjustedValuationExplanation?: string | null;
  qualityAdjustedValuationWarnings?: string[];
  valuationActionability?: string | null;
  // Valuation V2.4 — PEG / Growth Alignment
  pegRatio?: number | null;
  expectedPeMin?: number | null;
  expectedPeMax?: number | null;
  growthAlignmentLabel?: string | null;
  growthAlignmentScore?: number | null;
  growthAdjustedExplanation?: string | null;
  growthAdjustedWarnings?: string[];
}

export interface OpportunityWrappedResponse {
  meta: OpportunityMeta;
  pagination: OpportunityPagination;
  summary: OpportunitySummary;
  items: OpportunitySummaryItem[];
}
