export interface DataQualitySummary {
  exchange?: string | null;
  fromYear: number;
  toYear: number;
  expectedYearCount: number;
  recentPriceDays: number;
  compareFromDate: string;
  compareToDate: string;
  totalStocks: number;
  stocksReadyForRanking: number;
  stocksReadyForOpportunity: number;
  missingRecentPriceCount: number;
  missingFullFinancialStatementCount: number;
  missingShareInfoCount: number;
  missingIndustryCount: number;
  missingLiquidityCount: number;
  companyReferenceTablesAvailable: boolean;
  stocksWithCompanyOverview: number;
  stocksWithShareholders: number;
  stocksWithOfficers: number;
  stocksWithEvents: number;
  missingCompanyOverviewCount: number;
  missingShareholdersCount: number;
  missingOfficersCount: number;
  missingEventsCount: number;
  vndirectPriceTableAvailable: boolean;
  vndirectComparedRows: number;
  vndirectMatchedRows: number;
  vndirectMismatchRows: number;
  vndirectMissingStockPriceRows: number;
  vndirectClosePriceMismatchRows: number;
  vndirectVolumeMismatchRows: number;
  vndirectTradingValueMismatchRows: number;
  note?: string;
}

export interface PriceSourceMismatch {
  stockCode: string;
  exchange: string;
  priceDate: string;
  stockClosePrice?: number | null;
  vndirectClosePrice?: number | null;
  closePriceDiff?: number | null;
  stockVolume?: number | null;
  vndirectVolume?: number | null;
  stockTradingValue?: number | null;
  vndirectTradingValue?: number | null;
  tradingValueDiffPercent?: number | null;
  issues: string[];
}

export interface ReferenceCoverage {
  stockCode: string;
  companyName: string;
  exchange: string;
  industry?: string | null;
  hasCompanyOverview: boolean;
  hasShareholders: boolean;
  hasOfficers: boolean;
  hasEvents: boolean;
  missingReferenceReason: string;
}
