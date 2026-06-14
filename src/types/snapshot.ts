export interface CompanySnapshotResponse {
  stockCode: string;
  companyName: string;
  industry: string;
  exchange: string;
  year: number;
  analysis: AnalysisResponse | null;
  qualityScore: QualityScoreResponse | null;
  companyProfile: CompanyProfileResponse | null;
  latestThesis: InvestmentThesisResponse | null;
  note: string;
}

export interface AnalysisResponse {
  stockCode: string;
  year: number;
  roe: number;
  roa: number;
  netProfitMargin: number;
  debtToEquity: number;
  cfoToProfit: number;
  eps: number;
  pe: number;
  pb: number;
  score: number;
  decision: string;
  summary: string;
}

export interface QualityScoreResponse {
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
  note: string;
  marginStability: number;
  shareDilutionScore: number;
  capitalAllocationScore: number;
  calculatedAt: string;
}

export interface CompanyProfileResponse {
  id: number;
  stockCode: string;
  businessModel: string;
  customers: string;
  competitiveAdvantage: string;
  risks: string;
  managementNotes: string;
  industry: string;
  subIndustry: string;
  marketPosition: string;
  competitors: string;
  cyclicalIndustry: boolean;
  managementQuality: string;
  allocationSkill: string;
  ownershipStructure: string;
  updatedAt: string;
}

export interface InvestmentThesisResponse {
  id: number;
  stockCode: string;
  year: number;
  bullCase: string[];
  bearCase: string[];
  keyDrivers: string[];
  redFlags: string[];
  researchQuestions: string[];
  summary: string;
  createdAt: string;
  disclaimer: string;
}