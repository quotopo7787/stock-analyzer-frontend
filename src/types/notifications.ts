export interface Notification {
  type: string;
  title: string;
  message: string;
  stockCode: string | null;
  score: number | null;
  timestamp: string;
}

export interface AlertRule {
  id: string;
  name: string;
  stockCodes: string[] | null;
  minScore: number | null;
  maxScore: number | null;
  decisions: string[] | null;
  industryGroups: string[] | null;
  requireSectorInflow: boolean;
  active: boolean;
  createdAt: string;
}

export interface AlertResult {
  ruleId: string;
  ruleName: string;
  stockCode: string;
  score: number;
  decision: string;
  message: string;
  triggeredAt: string;
}

export interface ScoreDataPoint {
  date: string;
  finalScore: number;
  qualityScore: number | null;
  growthScore: number | null;
  valuationScore: number | null;
  decision: string;
}

export interface ScoreTimeline {
  stockCode: string;
  dataPoints: ScoreDataPoint[];
  latestScore: number | null;
  scoreChange: number | null;
  trend: string;
  dataPointCount: number | null;
  message: string | null;
}

export interface ScoreMovement {
  stockCode: string;
  currentScore: number;
  previousScore: number;
  scoreChange: number;
  currentDecision: string;
  previousDecision: string;
  direction: string;
}

export interface OptimizationReport {
  status: string;
  sampleCount: number;
  forwardMonths: number | null;
  currentWeights: Record<string, number>;
  currentCorrelation: number | null;
  suggestedWeights: Record<string, number> | null;
  suggestedCorrelation: number | null;
  correlationImprovement: number | null;
  shouldApply: boolean | null;
  insights: string[] | null;
  message: string;
}
