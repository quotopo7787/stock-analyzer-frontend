export type ValuationScenarioMethod = "PE" | "PB" | "MANUAL";
export type ValuationScenarioStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface ValuationScenarioListItem {
  id: number;
  stockCode: string;
  companyName?: string;
  valuationYear: number;
  method: ValuationScenarioMethod;
  scenarioName: string;
  fairValue?: number;
  targetBuyPrice?: number;
  targetSellPrice?: number;
  currentPrice?: number;
  upsidePercent?: number;
  marginOfSafetyPercent?: number;
  status: ValuationScenarioStatus;
  linkedDecisionPlanId?: number;
  updatedAt: string;
}

export interface ValuationScenarioDetail extends ValuationScenarioListItem {
  eps?: number;
  bookValuePerShare?: number;
  peMultiple?: number;
  pbMultiple?: number;
  assumptions?: string[];
  sourceNote?: string;
  notes?: string;
  priceDataWarning?: "MISSING_LATEST_PRICE" | string;
  createdAt: string;
  archivedAt?: string;
}

export interface ValuationScenarioCreateRequest {
  stockCode: string;
  linkedDecisionPlanId?: number;
  valuationYear: number;
  method: ValuationScenarioMethod;
  scenarioName: string;
  eps?: number;
  bookValuePerShare?: number;
  peMultiple?: number;
  pbMultiple?: number;
  fairValue?: number;
  targetBuyPrice?: number;
  targetSellPrice?: number;
  marginOfSafetyPercent?: number;
  assumptions?: string[];
  sourceNote?: string;
  notes?: string;
  status?: ValuationScenarioStatus;
}

export type ValuationScenarioUpdateRequest = Omit<ValuationScenarioCreateRequest, "stockCode">;

export interface ValuationScenarioApplyRequest {
  decisionPlanId?: number;
  applyFairValue: boolean;
  applyTargetBuyPrice: boolean;
  applyTargetSellPrice: boolean;
  confirm: boolean;
}

export interface ValuationScenarioPriceFields {
  fairValue?: number;
  targetBuyPrice?: number;
  targetSellPrice?: number;
}

export interface ValuationScenarioApplyResponse {
  valuationScenarioId: number;
  decisionPlanId: number;
  stockCode: string;
  appliedFields: string[];
  before: ValuationScenarioPriceFields;
  after: ValuationScenarioPriceFields;
  warnings: string[];
}

export interface ValuationScenarioPage {
  content: ValuationScenarioListItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
