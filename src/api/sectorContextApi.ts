import axiosClient from "./axiosClient";
import type { SectorDecisionContext } from "../types/opportunities";

export const sectorContextApi = {
  getBySymbol: async (stockCode: string): Promise<SectorDecisionContext> => {
    const response = await axiosClient.get<SectorDecisionContext>(`/api/sector-context/${encodeURIComponent(stockCode)}`);
    return response.data;
  },
};
