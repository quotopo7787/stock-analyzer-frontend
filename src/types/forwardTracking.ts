export interface ForwardTrackingJobSummary {
  id: number;
  jobName: string;
  runDate: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  dryRun: boolean;
  insertedCount: number;
  duplicateCount: number;
  evaluatedCount: number;
  durationMs: number | null;
  errorMessage: string | null;
}

export interface ForwardTrackingStatus {
  enabled: boolean;
  dryRun: boolean;
  confirmCapture: boolean;
  canMutate: boolean;
  timezone: string;
  snapshotCron: string;
  signalCron: string;
  evaluationCron: string;
  lastSnapshotJob: ForwardTrackingJobSummary | null;
  lastSignalJob: ForwardTrackingJobSummary | null;
  lastEvaluationJob: ForwardTrackingJobSummary | null;
  todaySnapshotCaptured: boolean;
  todaySignalCaptured: boolean;
  pending7DCount: number;
  pending14DCount: number;
  pending30DCount: number;
  warnings: string[];
}
