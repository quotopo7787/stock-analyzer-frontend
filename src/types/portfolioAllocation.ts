export type PortfolioAllocationRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type PortfolioAllocationStatus = "OK" | "OVERWEIGHT_STOCK" | "OVERWEIGHT_INDUSTRY" | "DATA_MISSING";
export type PortfolioAllocationPriority = "HIGH" | "MEDIUM" | "LOW";
export type PortfolioAllocationCashSource = "MANUAL_OVERRIDE" | "CASH_LEDGER" | "CASH_LEDGER_EMPTY";

export interface PortfolioAllocationReviewRequest {
  totalCapital?: number;
  cashAmount?: number;
  maxStockWeightPercent?: number;
  maxIndustryWeightPercent?: number;
  minCashPercent?: number;
  targetCashPercent?: number;
}

export interface PortfolioAllocationSummary {
  totalCapital: number;
  cashAmount: number;
  cashSource?: PortfolioAllocationCashSource;
  cashLedgerBalance?: number | null;
  manualCashOverride?: boolean;
  cashSourceNote?: string | null;
  investedAmount: number;
  cashPercent?: number;
  positionCount: number;
  topStockWeight?: number;
  topIndustryWeight?: number;
  riskLevel: PortfolioAllocationRiskLevel;
  warnings: string[];
}

export interface PortfolioAllocationPosition {
  stockCode: string;
  companyName: string;
  industry: string;
  quantity: number;
  averageCost: number;
  currentPrice?: number;
  marketValue?: number;
  costValue: number;
  unrealizedPnl?: number;
  unrealizedPnlPercent?: number;
  weightPercent?: number;
  industryWeightPercent?: number;
  valuationFairValue?: number;
  targetBuyPrice?: number;
  targetSellPrice?: number;
  decisionPlanAction?: string;
  decisionPlanStatus?: string;
  allocationStatus: PortfolioAllocationStatus;
  warning?: string;
}

export interface PortfolioAllocationIndustry {
  industry: string;
  marketValue: number;
  weightPercent?: number;
  warning?: string;
}

export interface PortfolioAllocationSuggestion {
  type: string;
  priority: PortfolioAllocationPriority;
  stockCode?: string;
  message: string;
  blockedReason?: string;
  relatedRisk?: string;
  isActionable?: boolean;
  stockWeightPercent?: number;
  industryWeightPercent?: number;
}

export interface PortfolioAllocationReviewResponse {
  summary: PortfolioAllocationSummary;
  positions: PortfolioAllocationPosition[];
  industries: PortfolioAllocationIndustry[];
  suggestions: PortfolioAllocationSuggestion[];
  warnings: string[];
}
