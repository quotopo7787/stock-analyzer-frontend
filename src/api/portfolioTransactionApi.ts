import axios from "axios";
import type {
  PortfolioTransaction,
  PortfolioTransactionListParams,
  PortfolioTransactionPage,
  PortfolioTransactionRequest,
  PortfolioTransactionSummary,
} from "../types/portfolioTransaction";

const portfolioTransactionClient = axios.create({ headers: { "Content-Type": "application/json" } });

export const portfolioTransactionApi = {
  async getSummary() {
    const response = await portfolioTransactionClient.get<PortfolioTransactionSummary>("/api/portfolio-transactions/summary");
    return response.data;
  },
  async listTransactions(params: PortfolioTransactionListParams = {}) {
    const response = await portfolioTransactionClient.get<PortfolioTransactionPage>("/api/portfolio-transactions", { params });
    return response.data;
  },
  async getTransaction(id: number) {
    const response = await portfolioTransactionClient.get<PortfolioTransaction>(`/api/portfolio-transactions/${id}`);
    return response.data;
  },
  async createTransaction(payload: PortfolioTransactionRequest) {
    const response = await portfolioTransactionClient.post<PortfolioTransaction>("/api/portfolio-transactions", payload);
    return response.data;
  },
  async updateTransaction(id: number, payload: PortfolioTransactionRequest) {
    const response = await portfolioTransactionClient.put<PortfolioTransaction>(`/api/portfolio-transactions/${id}`, payload);
    return response.data;
  },
  async deleteTransaction(id: number) {
    await portfolioTransactionClient.delete(`/api/portfolio-transactions/${id}`);
  },
};
