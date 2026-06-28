export type MacroTrend = "RISING" | "FALLING" | "STABLE" | "UNKNOWN";
export type MacroPressureLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

export interface MacroIndicator {
  id: number;
  indicatorCode: string;
  indicatorName: string;
  source: string;
  frequency?: string | null;
  periodDate: string;
  value: number;
  unit?: string | null;
  yoyChange?: number | null;
  momChange?: number | null;
  sourceUpdatedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface MacroIndicatorSyncResponse {
  source: string;
  countryCode: string;
  indicatorCount: number;
  fetchedCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  durationMs: number;
  warnings: string[];
  errors: string[];
  syncedAt: string;
}

export interface MacroRegime {
  id?: number | null;
  contextDate: string;
  interestRateTrend: MacroTrend;
  inflationTrend: MacroTrend;
  creditCondition: MacroTrend;
  fxPressure: MacroPressureLevel;
  marketLiquidity: MacroTrend;
  commodityCycle?: string | null;
  realEstateCycle?: string | null;
  confidenceLevel: string;
  generatedBy: string;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface MacroRegimeRequest {
  contextDate: string;
  interestRateTrend: MacroTrend;
  inflationTrend: MacroTrend;
  creditCondition: MacroTrend;
  fxPressure: MacroPressureLevel;
  marketLiquidity: MacroTrend;
  commodityCycle?: string;
  realEstateCycle?: string;
  confidenceLevel?: string;
  notes?: string;
}
