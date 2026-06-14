export interface InvestmentThesis {
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