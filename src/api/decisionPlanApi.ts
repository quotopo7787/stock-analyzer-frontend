import axios from "axios";
import type {
  DecisionPlanAction, DecisionPlanDetail, DecisionPlanPage, DecisionPlanPayload, DecisionPlanStatus,
} from "../types/decisionPlans";

// Same-origin API path avoids browser CORS restrictions for PATCH; Vite proxies /api in development.
const decisionPlanClient = axios.create({ headers: { "Content-Type": "application/json" } });

export const decisionPlanApi = {
  async list(params: {
    status?: DecisionPlanStatus;
    action?: DecisionPlanAction;
    stockCode?: string;
    page?: number;
    size?: number;
  }) {
    const response = await decisionPlanClient.get<DecisionPlanPage>("/api/decision-plans", { params });
    return response.data;
  },

  async get(id: number) {
    const response = await decisionPlanClient.get<DecisionPlanDetail>(`/api/decision-plans/${id}`);
    return response.data;
  },

  async getActiveByStock(stockCode: string) {
    try {
      const response = await decisionPlanClient.get<DecisionPlanDetail>(`/api/decision-plans/by-stock/${encodeURIComponent(stockCode)}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },

  async listAllActive() {
    const first = await this.list({ status: "ACTIVE", page: 0, size: 100 });
    let items = first.content;
    for (let page = 1; page < first.totalPages; page += 1) {
      const next = await this.list({ status: "ACTIVE", page, size: 100 });
      items = items.concat(next.content);
    }
    return items;
  },

  async create(payload: DecisionPlanPayload) {
    const response = await decisionPlanClient.post<DecisionPlanDetail>("/api/decision-plans", payload);
    return response.data;
  },

  async update(id: number, payload: DecisionPlanPayload) {
    const { stockCode: omittedStockCode, ...body } = payload;
    void omittedStockCode;
    const response = await decisionPlanClient.put<DecisionPlanDetail>(`/api/decision-plans/${id}`, body);
    return response.data;
  },

  async close(id: number) {
    const response = await decisionPlanClient.patch<DecisionPlanDetail>(`/api/decision-plans/${id}/close`);
    return response.data;
  },

  async activate(id: number) {
    const response = await decisionPlanClient.patch<DecisionPlanDetail>(`/api/decision-plans/${id}/activate`);
    return response.data;
  },
};
