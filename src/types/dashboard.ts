export interface DashboardSummary {
  totalStocks: number;
  totalFinancialStatements: number;
  totalCompanyProfiles: number;
  totalThesis: number;
  totalQualityScores: number;

  topRankings: RankingItem[];
  topQualityCompanies: QualityCompanyItem[];
  latestThesis: ThesisItem[];

  dataCoverage: DataCoverage;

  holdingRadar: RadarItem[];
  watchlistRadar: RadarItem[];

  opportunityRadar: OpportunityRadar;

  riskRadar: RiskRadarItem[];
  actionQueue: ActionQueueItem[];

  meta?: DashboardMeta;
}

export interface DashboardMeta {
  generatedAt?: string;
  exchange?: string;
  fromYear?: number;
  toYear?: number;
  recentPriceDays?: number;
  opportunityLimit?: number;
  note?: string;
}

export interface DataCoverage {
  totalStocks: number;
  totalFinancialStatements: number;
  totalCompanyProfiles: number;
  totalThesis: number;
  totalQualityScores: number;

  opportunityUniverseCount: number;
  missingIndustryCount: number;
  researchNowCount: number;
  watchlistCount: number;
  reviewCount: number;
  avoidForNowCount: number;

  deepValueCount: number;
  qualityCompounderCount: number;
  cyclicalRecoveryCount: number;
  balancedOpportunityCount: number;
  valueTrapCount: number;
}

export interface RankingItem {
  rank: number;
  stockCode: string;
  companyName: string;
  fromYear: number;
  toYear: number;
  numberOfYears: number;
  revenueGrowthRate: number;
  profitGrowthRate: number;
  averageRoe: number;
  averageDebtToEquity: number;
  averageCfoToProfit: number;
  qualityScore: number;
  note?: string;
}

export interface QualityCompanyItem {
  id: number;
  stockCode: string;
  companyName: string;
  fromYear: number;
  toYear: number;
  numberOfYears: number;
  revenueGrowthConsistency: number;
  profitGrowthConsistency: number;
  roeConsistency: number;
  cashFlowQuality: number;
  balanceSheetQuality: number;
  qualityScore: number;
  note?: string;
  marginStability?: number;
  shareDilutionScore?: number;
  capitalAllocationScore?: number;
  calculatedAt?: string;
}

export interface ThesisItem {
  id: number;
  stockCode: string;
  year: number;
  bullCase: string[];
  bearCase: string[];
  keyDrivers: string[];
  redFlags: string[];
  researchQuestions: string[];
  summary: string;
  createdAt?: string;
  disclaimer?: string;
}

export interface RadarItem {
  stockCode: string;
  companyName: string;
  industry?: string;
  exchange?: string;
  status?: string;

  latestPrice?: number;
  targetBuyPrice?: number;
  targetSellPrice?: number;

  distanceToTargetBuyPercent?: number;
  distanceToTargetSellPercent?: number;

  priceChange7D?: number;
  priceChange30D?: number;

  finalScore?: number;
  signalScore?: number;
  investmentOpportunityScore?: number;

  opportunityType?: string;
  decision?: string;
  alertLevel?: string;
  alerts?: string[];
  reason?: string;
}

export interface OpportunityRadar {
  topOpportunities: OpportunityItem[];
  researchNow: OpportunityItem[];
  deepValue: OpportunityItem[];
  qualityCompounders: OpportunityItem[];
  cyclicalRecovery: OpportunityItem[];
  balancedOpportunities: OpportunityItem[];
}

export interface OpportunityItem {
  code: string;
  name: string;
  exchange?: string;
  industry?: string;
  subIndustry?: string;
  industryGroup?: string;

  fromYear?: number;
  toYear?: number;

  latestPriceDate?: string;
  latestPrice?: number;

  finalScore?: number;
  qualityScore?: number;
  growthScore?: number;
  cashFlowScore?: number;
  balanceSheetScore?: number;
  valuationScore?: number;
  riskPenalty?: number;

  averageVolume20d?: number;
  averageTradingValue20d?: number;
  liquidityScore?: number;
  liquidityLevel?: string;
  liquidityWarning?: boolean;

  cheapPriceBonus?: number;
  cheapPriceLevel?: string;

  industryRuleScore?: number;
  industryValuationScore?: number;
  industryRiskPenalty?: number;
  industryTotalScoreImpact?: number;
  industryMaxDecision?: string;

  signalScore?: number;
  investmentOpportunityScore?: number;
  valueScore?: number;
  marginOfSafetyScore?: number;
  qualityFloorScore?: number;
  longTermScore?: number;

  opportunityType?: string;

  revenueCagr?: number;
  profitCagr?: number;
  averageRoe?: number;
  latestNetProfitMargin?: number;
  averageDebtToEquity?: number;
  averageCfoToNetProfit?: number;

  eps?: number;
  pe?: number;
  pb?: number;

  decision?: string;

  mainReasons?: string[];
  mainRisks?: string[];
  reasons?: string[];
  risks?: string[];
}

export interface RiskRadarItem {
  stockCode: string;
  companyName: string;
  riskType: string;
  severity: string;
  message: string;
  suggestedAction: string;
  finalScore?: number;
  opportunityType?: string;
  industryGroup?: string;
}

export interface ActionQueueItem {
  priority: string;
  actionType: string;
  stockCode: string;
  companyName: string;
  message: string;
}