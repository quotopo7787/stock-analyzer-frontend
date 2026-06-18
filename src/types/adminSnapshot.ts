export type BatchJobStatus = "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";

export type BatchJobTriggerType = "MANUAL" | "SCHEDULED";

export interface BatchJobRun {
  id: number;
  jobName: string;
  status: BatchJobStatus | string;
  triggerType: BatchJobTriggerType | string;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | null;
  recordsProcessed?: number | null;
  reason?: string | null;
  errorMessage?: string | null;
  fromYear?: number | null;
  toYear?: number | null;
  recentPriceDays?: number | null;
  createdAt?: string | null;
}

export interface OpportunitySnapshotStatus {
  fromYear: number;
  toYear: number;
  recentPriceDays: number;
  snapshotCount: number;
  stockCount: number;
  duplicateCount: number;
  latestGeneratedAt?: string | null;
  oldestGeneratedAt?: string | null;
  latestSourceUpdatedAt?: string | null;
  isSourceNewerThanSnapshot?: boolean | null;
  dataFreshnessStatus?: "FRESH" | "SOURCE_NEWER_THAN_SNAPSHOT" | "UNKNOWN_SOURCE_FRESHNESS" | string | null;
  sourceFreshnessBreakdown?: Record<string, string | null> | null;
  latestJobStatus?: BatchJobStatus | string | null;
  latestJobStartedAt?: string | null;
  latestJobFinishedAt?: string | null;
}

export interface RecalculateResponse {
  job: string;
  status: string;
  fromYear?: number | null;
  toYear?: number | null;
  recentPriceDays?: number | null;
  processedCount: number;
  errorCount: number;
  durationMs: number;
  message?: string | null;
  errors: string[];
  generatedAt: string;
}
