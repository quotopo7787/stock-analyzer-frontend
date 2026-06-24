import axios from "axios";
import type {
  PortfolioAllocationPosition,
  PortfolioAllocationReviewRequest,
  PortfolioAllocationReviewResponse,
  PortfolioAllocationSummary,
} from "../types/portfolioAllocation";

const portfolioAllocationClient = axios.create({ headers: { "Content-Type": "application/json" } });

export const portfolioAllocationApi = {
  async summary() {
    const response = await portfolioAllocationClient.get<PortfolioAllocationSummary>("/api/portfolio-allocation/summary");
    return response.data;
  },
  async positions() {
    const response = await portfolioAllocationClient.get<PortfolioAllocationPosition[]>("/api/portfolio-allocation/positions");
    return response.data;
  },
  async review(payload: PortfolioAllocationReviewRequest) {
    const response = await portfolioAllocationClient.post<PortfolioAllocationReviewResponse>("/api/portfolio-allocation/review", payload);
    return response.data;
  },
};
