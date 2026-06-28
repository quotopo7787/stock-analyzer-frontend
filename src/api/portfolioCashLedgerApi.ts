import axios from "axios";
import type {
  PortfolioCashLedgerAdjustmentRequest,
  PortfolioCashLedgerListParams,
  PortfolioCashLedgerPage,
  PortfolioCashLedgerEntry,
  PortfolioCashLedgerSummary,
  PortfolioCashRebuildResponse,
} from "../types/portfolioCashLedger";

const portfolioCashLedgerClient = axios.create({ headers: { "Content-Type": "application/json" } });

export const portfolioCashLedgerApi = {
  async getSummary() {
    const response = await portfolioCashLedgerClient.get<PortfolioCashLedgerSummary>("/api/portfolio-cash-ledger/summary");
    return response.data;
  },
  async listEntries(params: PortfolioCashLedgerListParams = {}) {
    const response = await portfolioCashLedgerClient.get<PortfolioCashLedgerPage>("/api/portfolio-cash-ledger", { params });
    return response.data;
  },
  async createAdjustment(payload: PortfolioCashLedgerAdjustmentRequest) {
    const response = await portfolioCashLedgerClient.post<PortfolioCashLedgerEntry>("/api/portfolio-cash-ledger/adjustment", payload);
    return response.data;
  },
  async deleteEntry(id: number) {
    await portfolioCashLedgerClient.delete(`/api/portfolio-cash-ledger/${id}`);
  },
  async rebuildFromTransactions() {
    const response = await portfolioCashLedgerClient.post<PortfolioCashRebuildResponse>("/api/portfolio-cash-ledger/rebuild-from-transactions");
    return response.data;
  },
};
