export type PortfolioPositionStatus = "ACTIVE" | "CLOSED";

export interface PortfolioPosition {
  id: number;
  stockCode: string;
  companyName: string;
  exchange?: string;
  industry?: string;
  quantity: number;
  averageCost: number;
  costValue: number;
  latestPrice?: number;
  latestPriceDate?: string;
  marketValue?: number;
  unrealizedPnL?: number;
  unrealizedPnLPercent?: number;
  portfolioWeightPercent?: number;
  linkedDecisionPlanId?: number;
  activeDecisionPlanId?: number;
  decisionAction?: string;
  maxPositionPercent?: number;
  isOverMaxPosition: boolean;
  positionWarning?: "OVER_MAX_POSITION";
  priceDataWarning?: "MISSING_LATEST_PRICE";
  status: PortfolioPositionStatus;
  notes?: string;
  createdAt?: string;
  updatedAt: string;
  closedAt?: string;
}

export interface PortfolioPage {
  content: PortfolioPosition[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PortfolioSummary {
  activePositionCount: number;
  totalCostValue?: number;
  totalMarketValue?: number;
  totalUnrealizedPnL?: number;
  totalUnrealizedPnLPercent?: number;
  overMaxPositionCount: number;
  missingPriceCount: number;
  topPositions: PortfolioPosition[];
  worstPnLPositions: PortfolioPosition[];
  bestPnLPositions: PortfolioPosition[];
}

export interface PortfolioPositionPayload {
  stockCode?: string;
  linkedDecisionPlanId?: number;
  quantity: number;
  averageCost: number;
  notes?: string;
}
