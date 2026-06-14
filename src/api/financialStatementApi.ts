import axiosClient from "./axiosClient";
import type {
  FinancialStatementRequest,
  FinancialStatementResponse,
} from "../types/financialStatement";

export const financialStatementApi = {
  /**
   * Tạo mới báo cáo tài chính cho một mã cổ phiếu và một năm.
   *
   * Backend:
   * POST /api/financial-statements
   */
  create: async (
    request: FinancialStatementRequest
  ): Promise<FinancialStatementResponse> => {
    const response = await axiosClient.post<FinancialStatementResponse>(
      "/api/financial-statements",
      request
    );

    return response.data;
  },
};