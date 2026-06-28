export type MacroLevel = "FAVORABLE" | "SLIGHTLY_FAVORABLE" | "NEUTRAL" | "UNFAVORABLE" | "HIGH_RISK" | string;

export interface MacroContext {
  symbol: string;
  industry?: string | null;
  industryGroup?: string | null;
  finalScore?: number | null;
  macroScore?: number | null;
  macroAdjustment?: number | null;
  adjustedScore?: number | null;
  macroLevel?: MacroLevel | null;
  macroSignals: string[];
  macroWarnings: string[];
  assumptions: string[];
  contextDate?: string | null;
  note?: string | null;
}
