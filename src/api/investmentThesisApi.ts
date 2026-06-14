import axiosClient from "./axiosClient";
import type { InvestmentThesis } from "../types/investmentThesis";

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
};