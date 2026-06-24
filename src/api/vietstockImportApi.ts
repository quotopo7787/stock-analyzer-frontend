import axios from "axios";
import type {
  VietstockFinancialStatementConfirmRequest,
  VietstockFinancialStatementConfirmResponse,
  VietstockFinancialStatementPastePreviewRequest,
  VietstockFinancialStatementPreviewRequest,
  VietstockFinancialStatementPreviewResponse,
  VietstockImportCandidateResponse,
  VietstockImportSessionResponse,
} from "../types/vietstockImport";

const vietstockImportClient = axios.create({ headers: { "Content-Type": "application/json" } });

export const vietstockImportApi = {
  async candidates(limit = 20) {
    const response = await vietstockImportClient.get<VietstockImportCandidateResponse>(
      "/api/admin/vietstock-import/financial-statements/candidates",
      { params: { limit } },
    );
    return response.data;
  },

  async checkSession() {
    const response = await vietstockImportClient.post<VietstockImportSessionResponse>(
      "/api/admin/vietstock-import/session/check",
    );
    return response.data;
  },

  async openSession() {
    const response = await vietstockImportClient.post<VietstockImportSessionResponse>(
      "/api/admin/vietstock-import/session/open",
    );
    return response.data;
  },

  async previewFinancialStatements(request: VietstockFinancialStatementPreviewRequest) {
    const response = await vietstockImportClient.post<VietstockFinancialStatementPreviewResponse>(
      "/api/admin/vietstock-import/financial-statements/preview",
      request,
    );
    return response.data;
  },

  async previewPastedFinancialStatements(request: VietstockFinancialStatementPastePreviewRequest) {
    const response = await vietstockImportClient.post<VietstockFinancialStatementPreviewResponse>(
      "/api/admin/vietstock-import/financial-statements/preview-pasted",
      request,
    );
    return response.data;
  },

  async confirmFinancialStatements(request: VietstockFinancialStatementConfirmRequest) {
    const response = await vietstockImportClient.post<VietstockFinancialStatementConfirmResponse>(
      "/api/admin/vietstock-import/financial-statements/confirm",
      request,
    );
    return response.data;
  },
};
