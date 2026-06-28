export type PortfolioCashDirection = "INFLOW" | "OUTFLOW";
export type PortfolioCashEntryType = "CASH_IN" | "CASH_OUT" | "BUY" | "SELL" | "DIVIDEND" | "FEE" | "TAX" | "ADJUSTMENT";

export interface PortfolioCashLedgerEntry {
  id: number;
  sourceTransactionId?: number | null;
  cashEntryType: PortfolioCashEntryType;
  entryDate: string;
  amount: number;
  direction: PortfolioCashDirection;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortfolioCashLedgerPage {
  content: PortfolioCashLedgerEntry[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PortfolioCashLedgerTypeSummary {
  cashEntryType: PortfolioCashEntryType;
  count: number;
  inflow: number;
  outflow: number;
  net: number;
}

export interface PortfolioCashLedgerSummary {
  totalInflow: number;
  totalOutflow: number;
  netCashBalance: number;
  entryCount: number;
  byType: PortfolioCashLedgerTypeSummary[];
  latestEntryDate?: string | null;
}

export interface PortfolioCashRebuildResponse {
  sourceTransactionCount: number;
  deletedGeneratedEntryCount: number;
  createdEntryCount: number;
  preservedAdjustmentCount: number;
}

export interface PortfolioCashLedgerAdjustmentRequest {
  entryDate: string;
  amount: number;
  direction: PortfolioCashDirection;
  notes?: string;
}

export interface PortfolioCashLedgerListParams {
  fromDate?: string;
  toDate?: string;
  type?: PortfolioCashEntryType | "";
  page?: number;
  size?: number;
}
