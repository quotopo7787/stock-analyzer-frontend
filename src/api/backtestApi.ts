import axiosClient from "./axiosClient";
import type {
  BacktestRunRequest,
  BacktestRunResponse,
  BacktestSummaryResponse,
  DecisionMatrixSimulationResponse,
} from "../types/backtest";

const BASE = "/api/admin/paper-trading/backtests";

export const backtestApi = {
  run: (req: BacktestRunRequest) =>
    axiosClient.post<BacktestRunResponse>(`${BASE}/run`, req).then((r) => r.data),

  list: () =>
    axiosClient.get<BacktestRunResponse[]>(BASE).then((r) => r.data),

  summary: (runId: number) =>
    axiosClient.get<BacktestSummaryResponse>(`${BASE}/${runId}/summary`).then((r) => r.data),

  decisionMatrixSimulation: (runId: number) =>
    axiosClient.get<DecisionMatrixSimulationResponse>(`${BASE}/${runId}/decision-matrix-simulation`).then((r) => r.data),
};
