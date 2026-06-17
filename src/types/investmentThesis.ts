export interface InvestmentThesis {
  id: number;
  stockCode: string;
  year: number;
  thesisStatus?: string;
  decision?: string;
  decisionConfidence?: string;
  thesisType?: string;
  bullCase: string[];
  bearCase: string[];
  keyDrivers: string[];
  redFlags: string[];
  researchQuestions: string[];
  keyRisks?: string[];
  missingData?: string[];
  buyConditions?: string[];
  rejectConditions?: string[];
  personalNote?: string;
  nextReviewDate?: string;
  source?: string;
  summary: string;
  createdAt: string;
  updatedAt?: string;
  disclaimer: string;
}
