export type PortfolioTransactionType = "BUY" | "SELL" | "DIVIDEND" | "CASH_IN" | "CASH_OUT" | "FEE" | "TAX";

export interface PortfolioTransaction {
  id: number;
  stockId?: number | null;
  stockCode?: string | null;
  companyName?: string | null;
  transactionType: PortfolioTransactionType;
  transactionDate: string;
  quantity?: number | null;
  price?: number | null;
  amount: number;
  fee?: number | null;
  tax?: number | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortfolioTransactionPage {
  content: PortfolioTransaction[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PortfolioTransactionRequest {
  stockCode?: string;
  transactionType: PortfolioTransactionType;
  transactionDate: string;
  quantity?: number;
  price?: number;
  amount?: number;
  fee?: number;
  tax?: number;
  notes?: string;
}

export interface PortfolioTransactionTypeSummary {
  transactionType: PortfolioTransactionType;
  count: number;
  amount: number;
  fee: number;
  tax: number;
}

export interface PortfolioTransactionSummary {
  totalBuyAmount: number;
  totalSellAmount: number;
  totalDividend: number;
  totalFee: number;
  totalTax: number;
  netCashFlow: number;
  transactionCount: number;
  byType: PortfolioTransactionTypeSummary[];
}

export interface PortfolioTransactionListParams {
  stockCode?: string;
  type?: PortfolioTransactionType | "";
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}
