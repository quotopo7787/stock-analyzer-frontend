import type { FinancialStatementValues, ManualFinancialStatementResult } from "./dataGaps";

export interface VietstockImportCandidate {
  stockCode: string;
  companyName: string;
  missingYears: number[];
  missingFields: string[];
  reason: "MISSING_FINANCIAL_YEAR" | "MISSING_FINANCIAL_STATEMENTS" | string;
}

export interface VietstockImportCandidateResponse {
  items: VietstockImportCandidate[];
}

export interface VietstockImportSessionResponse {
  status: "SESSION_OK" | "LOGIN_REQUIRED" | string;
  profilePath?: string;
  loginUrl?: string;
  message?: string;
  warnings: string[];
}

export interface VietstockFinancialStatementPreviewRequest {
  stockCode: string;
  years: number[];
}

export interface VietstockFinancialStatementPastePreviewRequest {
  stockCode: string;
  year: number;
  unitMultiplier: number;
  rawText: string;
}

export interface VietstockFinancialStatementPreviewRow {
  year: number;
  extracted?: FinancialStatementValues | null;
  existing?: FinancialStatementValues | null;
  missingFieldsFilled: string[];
  warnings: string[];
}

export interface VietstockFinancialStatementPreviewResponse {
  stockCode: string;
  source: "Vietstock" | string;
  sourceNote: string;
  rows: VietstockFinancialStatementPreviewRow[];
  warnings: string[];
}

export interface VietstockFinancialStatementConfirmRequest {
  stockCode: string;
  rows: Array<FinancialStatementValues & { year: number }>;
  sourceNote: string;
  confirm: boolean;
  allowOverwriteExisting: boolean;
}

export interface VietstockFinancialStatementConfirmRow {
  year: number;
  action: "INSERTED" | "UPDATED" | "NO_CHANGE" | string;
  result?: ManualFinancialStatementResult | null;
  skippedFields: string[];
  warnings: string[];
}

export interface VietstockFinancialStatementConfirmResponse {
  stockCode: string;
  source: "Vietstock" | string;
  sourceNote: string;
  rows: VietstockFinancialStatementConfirmRow[];
  warnings: string[];
}
