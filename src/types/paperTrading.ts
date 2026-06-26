export interface DailyMonitoringResponse {
  date: string;
  readiness: string;
  overallHealth: "HEALTHY" | "WARNING" | "FAILED" | "NOT_EXPECTED_TODAY";
  capture: {
    expectedToday: boolean;
    ranToday: boolean;
    lastRunAt: string | null;
    status: "SUCCESS" | "FAILED" | "NOT_RUN";
    insertedCount: number;
    duplicateCount: number;
    durationMs: number | null;
  };
  evaluation: {
    expectedToday: boolean;
    ranToday: boolean;
    lastRunAt: string | null;
    status: "SUCCESS" | "FAILED" | "NOT_RUN";
    dueCount7d: number;
    dueCount30d: number;
    dueCount90d: number;
    evaluatedCount7d: number;
    evaluatedCount30d: number;
    evaluatedCount90d: number;
    durationMs: number | null;
  };
  alpha: {
    benchmarkedCount: number;
    missingBenchmarkCount: number;
    averageAlpha7d: number | null;
    positiveAlphaRate7d: number | null;
  };
  trackRecordProgress: {
    totalSignals: number;
    targetSignals: number;
    progressPercent: number;
    qualityGrade: string;
  };
  issues: MonitoringIssue[];
}

export interface MonitoringIssue {
  severity: "INFO" | "WARNING" | "CRITICAL";
  code: string;
  message: string;
}

export interface DailyCheckResponse {
  overallStatus: string;
  date: string;
  issueCount: number;
  issues: MonitoringIssue[];
  recommendations: string[];
  readOnly: boolean;
}

export interface AlphaOverviewResponse {
  group: string;
  count: number;
  evaluationCount: number;
  benchmarkedCount: number;
  missingBenchmarkCount: number;
  averageSignalReturn: number | null;
  averageBenchmarkReturn: number | null;
  averageAlpha: number | null;
  medianAlpha: number | null;
  positiveAlphaRate: number | null;
  bestAlpha: number | null;
  worstAlpha: number | null;
  alphaStandardDeviation: number | null;
  alphaConfidenceLabel: string;
  interpretation: string[];
}

export interface AlphaByDecisionItem {
  group: string;
  count: number;
  evaluationCount: number;
  benchmarkedCount: number;
  averageAlpha: number | null;
  positiveAlphaRate: number | null;
  averageSignalReturn: number | null;
  averageBenchmarkReturn: number | null;
  medianAlpha: number | null;
  bestAlpha: number | null;
  worstAlpha: number | null;
}

export interface AlphaTopItem {
  symbol: string;
  decision: string;
  score: number | null;
  signalReturn: number | null;
  benchmarkReturn: number | null;
  alpha: number | null;
  sourceType: string;
  signalDate: string;
  evaluationDate: string;
}

export interface SchedulerStatusResponse {
  captureEnabled: boolean;
  captureDryRun: boolean;
  captureRequireConfirm: boolean;
  evaluateEnabled: boolean;
  evaluateDryRun: boolean;
  evaluateRequireConfirm: boolean;
  lastCaptureRunAt: string | null;
  lastCaptureResult: string | null;
  lastCaptureDurationMs: number | null;
  lastEvaluateRunAt: string | null;
  lastEvaluateResult: string | null;
  lastEvaluateDurationMs: number | null;
  totalCaptureRuns: number;
  totalEvaluateRuns: number;
  [key: string]: unknown;
}

export interface JobRunItem {
  id: number;
  jobName: string;
  runType: string;
  runDate: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  dryRun: boolean;
  insertedCount: number;
  duplicateCount: number;
  skippedCount: number;
  failedCount: number;
  dueCount: number;
  evaluatedCount: number;
  durationMs: number | null;
  errorMessage: string | null;
}

export interface JobDailySummaryResponse {
  date: string;
  totalJobs: number;
  failedJobs: number;
  captureLatest: JobRunItem | null;
  evaluateLatest: JobRunItem | null;
  warnings: string[];
}
