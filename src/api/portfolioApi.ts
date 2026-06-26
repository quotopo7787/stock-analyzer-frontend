import axios from "axios";
import type { PortfolioPage, PortfolioPosition, PortfolioPositionPayload, PortfolioPositionStatus, PortfolioSummary } from "../types/portfolio";

const portfolioClient = axios.create({ headers: { "Content-Type": "application/json" } });

export const portfolioApi = {
  async list(status: PortfolioPositionStatus, page = 0, size = 100) {
    const response = await portfolioClient.get<PortfolioPage>("/api/portfolio/positions", { params: { status, page, size } });
    return response.data;
  },
  async listAll(status: PortfolioPositionStatus) {
    const first = await this.list(status, 0, 100);
    let items = first.content;
    for (let page = 1; page < first.totalPages; page += 1) items = items.concat((await this.list(status, page, 100)).content);
    return items;
  },
  async get(id: number) {
    const response = await portfolioClient.get<PortfolioPosition>(`/api/portfolio/positions/${id}`);
    return response.data;
  },
  async summary() {
    const response = await portfolioClient.get<PortfolioSummary>("/api/portfolio/summary");
    return response.data;
  },
  async create(payload: PortfolioPositionPayload) {
    const response = await portfolioClient.post<PortfolioPosition>("/api/portfolio/positions", payload);
    return response.data;
  },
  async update(id: number, payload: PortfolioPositionPayload) {
    const { stockCode: omittedStockCode, ...body } = payload;
    void omittedStockCode;
    const response = await portfolioClient.put<PortfolioPosition>(`/api/portfolio/positions/${id}`, body);
    return response.data;
  },
  async close(id: number) {
    const response = await portfolioClient.patch<PortfolioPosition>(`/api/portfolio/positions/${id}/close`);
    return response.data;
  },
  async activate(id: number) {
    const response = await portfolioClient.patch<PortfolioPosition>(`/api/portfolio/positions/${id}/activate`);
    return response.data;
  },
};
