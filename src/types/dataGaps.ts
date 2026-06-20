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
