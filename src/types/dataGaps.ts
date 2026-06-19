export type DataGapReason = "OLD_STOCK_PRICE" | "MISSING_SHARE_INFO" | "MISSING_FINANCIAL_YEAR" | "MISSING_FINANCIAL_STATEMENTS";

export interface OpportunityDataGap {
  stockCode: string; companyName: string; exchange: string; industry?: string | null;
  primaryReason: DataGapReason; missingYears: number[]; latestPriceDate?: string | null;
  latestPrice?: number | null; hasFinancialStatements: boolean; hasShareInfo: boolean; note: string;
}

export interface OpportunityDataGapPage {
  fromYear: number; toYear: number; page: number; size: number; totalElements: number;
  totalPages: number; content: OpportunityDataGap[]; reasonCounts: Record<DataGapReason, number>;
}

export interface ManualShareInfoResult {
  stockCode: string; year: number; oldSharesOutstanding?: number | null; newSharesOutstanding: number;
  action: "INSERTED" | "UPDATED" | "NO_CHANGE"; eligibleStockCountBefore: number;
  eligibleStockCountAfter: number; becameEligible: boolean; duplicateCount: number; dataFreshnessStatus: string;
}
