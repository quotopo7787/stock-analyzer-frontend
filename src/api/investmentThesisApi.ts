import axiosClient from "./axiosClient";
import type { InvestmentThesis } from "../types/investmentThesis";
import type { ResearchThesisDraft } from "../types/researchThesis";

export interface SaveResearchThesisRequest {
  id?: number;
  stockCode: string;
  year?: number;
  thesisStatus: ResearchThesisDraft["thesisStatus"];
  bullCase: string[];
  bearCase: string[];
  keyRisks: string[];
  missingData: string[];
  buyConditions: string[];
  rejectConditions: string[];
  personalNote: string;
  nextReviewDate: string;
  source?: ResearchThesisDraft["source"];
}

export const investmentThesisApi = {
  getByStockCode: async (stockCode: string): Promise<InvestmentThesis[]> => {
    const response = await axiosClient.get<InvestmentThesis[]>(
      `/api/investment-thesis/${stockCode}`
    );

    return response.data;
  },

  generate: async (
    stockCode: string,
    year: number
  ): Promise<InvestmentThesis> => {
    const response = await axiosClient.post<InvestmentThesis>(
      `/api/investment-thesis/${stockCode}/${year}`
    );

    return response.data;
  },

  saveManual: async (
    payload: SaveResearchThesisRequest
  ): Promise<InvestmentThesis> => {
    const response = await axiosClient.post<InvestmentThesis>(
      "/api/investment-thesis/manual",
      payload
    );

    return response.data;
  },

  getById: async (id: number): Promise<InvestmentThesis> => {
    const response = await axiosClient.get<InvestmentThesis>(
      `/api/investment-thesis/id/${id}`
    );

    return response.data;
  },

  getLatestByStockAndYear: async (
    stockCode: string,
    year: number
  ): Promise<InvestmentThesis> => {
    const response = await axiosClient.get<InvestmentThesis>(
      `/api/investment-thesis/${stockCode}/${year}/latest`
    );

    return response.data;
  },
};
