export type DataGapReason =
  | "FUTURE_PRICE_DATE"
  | "OLD_STOCK_PRICE"
  | "MISSING_RECENT_PRICE"
  | "MISSING_SHARE_INFO"
  | "MISSING_FINANCIAL_YEAR"
  | "MISSING_FINANCIAL_STATEMENTS";

export interface OpportunityDataGap {
  stockCode: string;
  companyName: string;
  exchange: string;
  industry?: string | null;
  primaryReason: DataGapReason;
  missingYears: number[];
  latestPriceDate?: string | null;
  latestPrice?: number | null;
  hasFinancialStatements: boolean;
  hasShareInfo: boolean;
  note: string;
  severity?: "HIGH" | "MEDIUM" | "LOW" | null;
  actionType?: string | null;
  actionLabel?: string | null;
}

export interface OpportunityDataGapPage {
  fromYear: number;
  toYear: number;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  content: OpportunityDataGap[];
  reasonCounts: Record<string, number>;
}

export type DataCoveragePriorityLevel = "P0" | "P1" | "P2" | "P3";

export interface DataCoveragePriorityItem {
  stockCode: string;
  stockName: string;
  exchange?: string | null;
  industry?: string | null;
  industryGroup?: string | null;
  priorityLevel: DataCoveragePriorityLevel;
  priorityScore: number;
  primaryReason: string;
  missingFields: string[];
  dataIssues: string[];
  affectedModules: string[];
  suggestedAction: string;
  yearsMissingFinancials: number[];
  yearsMissingShareInfo: number[];
  latestFinancialYear?: number | null;
  latestPriceDate?: string | null;
  hasLatestPrice: boolean;
  hasCompanyProfile: boolean;
  dataConfidenceLevel?: string | null;
  currentDecision?: string | null;
  currentOpportunityType?: string | null;
  finalScore?: number | null;
  isInPortfolio: boolean;
  isInWatchlist: boolean;
  hasActiveDecisionPlan: boolean;
  opportunityRank?: number | null;
  rankingRank?: number | null;
  notes?: string | null;
}

export interface DataCoveragePriorityQueue {
  generatedAt: string;
  totalItems: number;
  p0Count: number;
  p1Count: number;
  p2Count: number;
  p3Count: number;
  sourceStats: Record<string, number>;
  topMissingFields: Record<string, number>;
  topAffectedModules: Record<string, number>;
  items: DataCoveragePriorityItem[];
}

export interface ManualShareInfoResult {
  stockCode: string;
  year: number;
  oldSharesOutstanding?: number | null;
  newSharesOutstanding: number;
  action: "INSERTED" | "UPDATED" | "NO_CHANGE";
  eligibleStockCountBefore: number;
  eligibleStockCountAfter: number;
  becameEligible: boolean;
  duplicateCount: number;
  dataFreshnessStatus: string;
}

export interface ManualStockPriceResult {
  stockCode: string;
  priceDate: string;
  oldClosePrice?: number | null;
  newClosePrice: number;
  action: "INSERTED" | "UPDATED" | "NO_CHANGE";
  unitInfo: string;
  eligibleStockCountBefore: number;
  eligibleStockCountAfter: number;
  becameEligible: boolean;
  dataFreshnessStatus: string;
}

export interface FinancialStatementValues {
  revenue?: number | null;
  netProfit?: number | null;
  totalAssets?: number | null;
  totalLiabilities?: number | null;
  equity?: number | null;
  operatingCashFlow?: number | null;
}

export interface ManualFinancialStatementCurrent {
  stockCode: string;
  year: number;
  current?: FinancialStatementValues | null;
  missingFields: string[];
}

export interface ManualFinancialStatementRequest extends FinancialStatementValues {
  stockCode: string;
  year: number;
  sourceNote: string;
}

export interface ManualFinancialStatementResult {
  stockCode: string;
  year: number;
  action: "INSERTED" | "UPDATED" | "NO_CHANGE";
  oldValue?: FinancialStatementValues | null;
  newValue: FinancialStatementValues;
  warnings: string[];
  affectedOpportunities: boolean;
  eligibleStockCountBefore: number;
  eligibleStockCountAfter: number;
  becameEligible: boolean;
  duplicateCount: number;
  dataFreshnessStatus: string;
}
