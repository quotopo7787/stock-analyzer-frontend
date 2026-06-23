import axios from "axios";
import type {
  DataGapReason,
  ManualFinancialStatementCurrent,
  ManualFinancialStatementRequest,
  ManualFinancialStatementResult,
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

  async getFinancialStatement(stockCode: string, year: number) {
    const response = await dataGapClient.get<ManualFinancialStatementCurrent>(
      "/api/admin/manual-data/financial-statement",
      { params: { stockCode, year } }
    );
    return response.data;
  },

  async saveFinancialStatement(request: ManualFinancialStatementRequest) {
    const body = Object.fromEntries(
      Object.entries(request).filter(([, value]) => value !== undefined && value !== null)
    );
    const response = await dataGapClient.post<ManualFinancialStatementResult>(
      "/api/admin/manual-data/financial-statement",
      body
    );
    return response.data;
  },
};
