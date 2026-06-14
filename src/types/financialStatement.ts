export interface FinancialStatementRequest {
  stockCode: string;
  year: number;
  revenue: number;
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  operatingCashFlow: number;
}

export interface FinancialStatementResponse {
  id: number;
  stockCode: string;
  year: number;
  revenue: number;
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  operatingCashFlow: number;
}