export interface BacktestRunRequest {
  fromDate: string;
  toDate: string;
  symbols?: string[];
  horizons?: number[];
  decisions?: string[];
  maxSymbols?: number;
  dataMode?: string;
  dryRun: boolean;
  confirmRun: boolean;
}

export interface BacktestRunResponse {
  id: number;
  fromDate: string;
  toDate: string;
  horizons: string;
  symbolsFilter: string;
  symbolsCount: number;
  evaluationDaysCount: number;
  totalSignals: number;
  dryRun: boolean;
  status: string;
  notes: string | null;
  dataMode?: string | null;
  lookAheadBiasLevel?: string | null;
  limitations?: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: string;
  averageReturn7D?: number | null;
  winRate7D?: number | null;
  averageAlphaReturn7D?: number | null;
  averageNetReturn7D?: number | null;
}

export interface HorizonSummary {
  horizonDays: number;
  count: number;
  sampleSize?: number;
  evaluatedSampleSize?: number;
  reliabilityLevel?: string | null;
  warnings?: string[];
  avgReturnPct: number;
  avgStockReturnPct?: number | null;
  avgBenchmarkReturnPct?: number | null;
  avgBenchmarkReturnPctVn30?: number | null;
  avgAlphaReturnPct?: number | null;
  avgNetReturnPct?: number | null;
  alphaWinRate?: number | null;
  medianReturnPct: number;
  bestReturnPct?: number | null;
  worstReturnPct?: number | null;
  positiveCount?: number;
  negativeCount?: number;
  top1WinnerContributionPct?: number | null;
  top3WinnerContributionPct?: number | null;
  winRate: number;
  winCount: number;
  lossCount: number;
  flatCount: number;
  noExitCount: number;
}

export interface DecisionSummary {
  decision: string;
  count: number;
  sampleSize?: number;
  evaluatedSampleSize?: number;
  reliabilityLevel?: string | null;
  warnings?: string[];
  avgReturnByHorizon: Record<string, number>;
  winRateByHorizon: Record<string, number>;
  avgStockReturnByHorizon?: Record<string, number | null>;
  avgBenchmarkReturnByHorizon?: Record<string, number | null>;
  avgAlphaReturnByHorizon?: Record<string, number | null>;
  avgNetReturnByHorizon?: Record<string, number | null>;
  alphaWinRateByHorizon?: Record<string, number | null>;
}

export interface GroupSummary {
  group: string;
  count: number;
  sampleSize?: number;
  evaluatedSampleSize?: number;
  reliabilityLevel?: string | null;
  warnings?: string[];
  avgStockReturnByHorizon: Record<string, number | null>;
  avgBenchmarkReturnByHorizon: Record<string, number | null>;
  avgAlphaReturnByHorizon: Record<string, number | null>;
  avgNetReturnByHorizon: Record<string, number | null>;
  alphaWinRateByHorizon: Record<string, number | null>;
}

export interface ShadowLabelSummary {
  label: string;
  count: number;
  sampleSize: number;
  evaluatedSampleSize: number;
  reliabilityLevel?: string | null;
  avgAlphaReturnByHorizon: Record<string, number | null>;
  avgNetReturnByHorizon: Record<string, number | null>;
  alphaWinRateByHorizon: Record<string, number | null>;
  topSymbol?: string | null;
  topSymbolSharePct?: number | null;
  topIndustry?: string | null;
  topIndustrySharePct?: number | null;
}

export interface AlphaFactorSummary {
  tag: string;
  description?: string | null;
  count: number;
  sampleSize: number;
  evaluatedSampleSize: number;
  status: "TRACKING" | "PROMISING" | "FAILED" | "INSUFFICIENT" | string;
  avgAlphaReturnByHorizon: Record<string, number | null>;
  medianAlphaReturnByHorizon: Record<string, number | null>;
  avgNetReturnByHorizon: Record<string, number | null>;
  alphaWinRateByHorizon: Record<string, number | null>;
  topSymbol?: string | null;
  topSymbolSharePct?: number | null;
  topIndustry?: string | null;
  topIndustrySharePct?: number | null;
}

export interface SignalDetail {
  signalId: number;
  stockCode: string;
  industryGroup: string | null;
  signalDate: string;
  decision: string;
  score: number;
  entryPrice: number;
  horizonDays: number;
  exitPrice: number;
  returnPct: number;
  benchmarkReturnPct?: number | null;
  alphaReturnPct?: number | null;
  netReturnPct?: number | null;
  outcome: string;
}

export interface RankedGroup {
  group: string;
  count: number;
  avgAlphaReturnPct: number | null;
  alphaWinRate: number | null;
  reliabilityLevel: string | null;
}

export interface RepeatedLoser {
  stockCode: string;
  lossCount: number;
  avgReturnPct: number | null;
  avgAlphaReturnPct: number | null;
}

export interface DiagnosticSection {
  worstDecisionByAlpha: string | null;
  worstDecisionAlphaValue: number | null;
  bestDecisionByAlpha: string | null;
  bestDecisionAlphaValue: number | null;
  worstIndustryByAlpha: string | null;
  worstIndustryAlphaValue: number | null;
  bestIndustryByAlpha: string | null;
  bestIndustryAlphaValue: number | null;
  confidenceAlphaRanking: RankedGroup[];
  repeatedLoserSymbols: RepeatedLoser[];
  benchmarkDragCount: number;
  benchmarkDragPct: number | null;
  insights: string[];
}

export interface SimulationSignal {
  signalId: number;
  stockCode: string;
  industryGroup: string | null;
  signalDate: string;
  currentDecision: string;
  simulatedDecisionV2: string;
  qualityZone: string;
  valuationZone: string;
  qualityScore: number | null;
  valuationScore: number | null;
  matrixRuleApplied: string;
  alpha7d: number | null;
  alpha14d: number | null;
  alpha30d: number | null;
}

export interface SimulationDecisionSummary {
  decision: string;
  count: number;
  avgAlpha7d: number | null;
  avgAlpha14d: number | null;
  avgAlpha30d: number | null;
  alphaWinRate7d: number | null;
}

export interface SimulationComparison {
  totalSignals: number;
  upgradedCount: number;
  downgradedCount: number;
  unchangedCount: number;
  overallAvgAlpha7d: number | null;
  candidateAvgAlpha7d: number | null;
  waitForPriceAvgAlpha7d: number | null;
  currentFalsePositives: number;
  simFalsePositives: number;
  falsePositiveReduction: number;
}

export interface DecisionMatrixSimulationResponse {
  runId: number;
  simulationVersion: string;
  disclaimer: string;
  comparison: SimulationComparison;
  bySimulatedDecision: SimulationDecisionSummary[];
  byCurrentDecision: SimulationDecisionSummary[];
  signals: SimulationSignal[];
  signalsTruncated: boolean;
  totalSignalCount: number;
}

export interface BacktestSummaryResponse {
  runId: number;
  fromDate: string;
  toDate: string;
  status: string;
  totalSignals: number;
  evaluatedSignals: number;
  noExitPriceCount: number;
  durationMs: number | null;
  createdAt: string;
  benchmarkCode: string;
  transactionCostPct: number;
  dataMode?: string | null;
  lookAheadBiasLevel?: string | null;
  limitations?: string | null;
  sampleReliabilityLevel?: string | null;
  minSampleThreshold?: number;
  lowSampleWarnings?: string[];
  strongWatchlistCount?: number;
  strongWatchlistAlpha30D?: number | null;
  strongWatchlistBeatBaseline?: boolean;
  byHorizon: Record<string, HorizonSummary>;
  byDecision: Record<string, DecisionSummary>;
  byShadowLabel?: Record<string, ShadowLabelSummary>;
  byAlphaFactorTag?: Record<string, AlphaFactorSummary>;
  byConfidence: Record<string, GroupSummary>;
  byIndustry: Record<string, GroupSummary>;
  topWinners: SignalDetail[];
  topLosers: SignalDetail[];
  topPositiveAlpha: SignalDetail[];
  topNegativeAlpha: SignalDetail[];
  diagnostic: DiagnosticSection | null;
  warnings: string[];
}
