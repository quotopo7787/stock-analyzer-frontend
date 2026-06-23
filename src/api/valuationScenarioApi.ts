import axios from "axios";
import type {
  ValuationScenarioApplyRequest,
  ValuationScenarioApplyResponse,
  ValuationScenarioCreateRequest,
  ValuationScenarioDetail,
  ValuationScenarioListItem,
  ValuationScenarioMethod,
  ValuationScenarioPage,
  ValuationScenarioStatus,
  ValuationScenarioUpdateRequest,
} from "../types/valuationScenarios";

const valuationScenarioClient = axios.create({ headers: { "Content-Type": "application/json" } });

export const valuationScenarioApi = {
  async list(params: {
    stockCode?: string;
    status?: ValuationScenarioStatus;
    method?: ValuationScenarioMethod;
    page?: number;
    size?: number;
  }) {
    const response = await valuationScenarioClient.get<ValuationScenarioPage>("/api/valuation-scenarios", { params });
    return response.data;
  },

  async get(id: number) {
    const response = await valuationScenarioClient.get<ValuationScenarioDetail>(`/api/valuation-scenarios/${id}`);
    return response.data;
  },

  async getByStock(stockCode: string) {
    const response = await valuationScenarioClient.get<ValuationScenarioListItem[]>(
      `/api/valuation-scenarios/by-stock/${encodeURIComponent(stockCode)}`,
    );
    return response.data;
  },

  async create(payload: ValuationScenarioCreateRequest) {
    const response = await valuationScenarioClient.post<ValuationScenarioDetail>("/api/valuation-scenarios", payload);
    return response.data;
  },

  async update(id: number, payload: ValuationScenarioUpdateRequest) {
    const response = await valuationScenarioClient.put<ValuationScenarioDetail>(`/api/valuation-scenarios/${id}`, payload);
    return response.data;
  },

  async archive(id: number) {
    const response = await valuationScenarioClient.patch<ValuationScenarioDetail>(`/api/valuation-scenarios/${id}/archive`);
    return response.data;
  },

  async activate(id: number) {
    const response = await valuationScenarioClient.patch<ValuationScenarioDetail>(`/api/valuation-scenarios/${id}/activate`);
    return response.data;
  },

  async applyToDecisionPlan(id: number, payload: ValuationScenarioApplyRequest) {
    const response = await valuationScenarioClient.post<ValuationScenarioApplyResponse>(
      `/api/valuation-scenarios/${id}/apply-to-decision-plan`,
      payload,
    );
    return response.data;
  },
};
