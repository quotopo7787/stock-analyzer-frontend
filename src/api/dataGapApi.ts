import axios from "axios";
import type {
  DataGapReason,
  ManualShareInfoResult,
  ManualStockPriceResult,
  OpportunityDataGapPage,
} from "../types/dataGaps";

const dataGapClient = axios.create({ headers: { "Content-Type": "application/json" } });

export const dataGapApi = {
  async getGaps(params: { reason?: DataGapReason | ""; page: number; size: number }) {
    const response = await dataGapClient.get<OpportunityDataGapPage>(
      "/api/admin/data-gaps/opportunities",
      {
        params: {
          fromYear: 2023,
          toYear: 2025,
          ...params,
          reason: params.reason || undefined,
        },
      }
    );
    return response.data;
  },

  async saveShareInfo(request: {
    stockCode: string;
    year: number;
    sharesOutstanding: number;
    sourceNote: string;
  }) {
    const response = await dataGapClient.post<ManualShareInfoResult>(
      "/api/admin/manual-data/share-info",
      request
    );
    return response.data;
  },

  async saveStockPrice(request: {
    stockCode: string;
    priceDate: string;
    closePrice: number;
    sourceNote: string;
  }) {
    const response = await dataGapClient.post<ManualStockPriceResult>(
      "/api/admin/manual-data/stock-price",
      request
    );
    return response.data;
  },
};
