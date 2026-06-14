import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { financialStatementApi } from "../api/financialStatementApi";
import type {
  FinancialStatementRequest,
  FinancialStatementResponse,
} from "../types/financialStatement";

const initialForm: FinancialStatementRequest = {
  stockCode: "",
  year: new Date().getFullYear(),
  revenue: 0,
  netProfit: 0,
  totalAssets: 0,
  totalLiabilities: 0,
  equity: 0,
  operatingCashFlow: 0,
};

export default function FinancialStatementFormPage() {
  const [form, setForm] = useState<FinancialStatementRequest>(initialForm);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savedData, setSavedData] = useState<FinancialStatementResponse | null>(null);

  const handleTextChange = (field: keyof FinancialStatementRequest, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value.toUpperCase(),
    }));
  };

  const handleNumberChange = (field: keyof FinancialStatementRequest, value: string) => {
    const cleanValue = value.replace(/,/g, "");

    setForm((prev) => ({
      ...prev,
      [field]: cleanValue === "" ? 0 : Number(cleanValue),
    }));
  };

  const validateForm = () => {
    if (!form.stockCode.trim()) {
      return "Bạn cần nhập mã cổ phiếu.";
    }

    if (!form.year || form.year < 2000) {
      return "Năm báo cáo tài chính không hợp lệ.";
    }

    if (form.revenue < 0) {
      return "Doanh thu không được âm.";
    }

    if (form.totalAssets < 0) {
      return "Tổng tài sản không được âm.";
    }

    if (form.totalLiabilities < 0) {
      return "Tổng nợ không được âm.";
    }

    if (form.equity < 0) {
      return "Vốn chủ sở hữu không được âm.";
    }

    return "";
  };

  const formatMoney = (value?: number) => {
    if (value === undefined || value === null) return "-";
    return value.toLocaleString("vi-VN");
  };

  const handleSubmit = async () => {
    try {
      setSuccessMessage("");
      setErrorMessage("");
      setSavedData(null);

      const validationError = validateForm();

      if (validationError) {
        setErrorMessage(validationError);
        return;
      }

      setSaving(true);

      const response = await financialStatementApi.create({
        ...form,
        stockCode: form.stockCode.trim().toUpperCase(),
      });

      setSavedData(response);
      setSuccessMessage("Đã lưu báo cáo tài chính thành công.");
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Lưu báo cáo tài chính thất bại. Kiểm tra API /api/financial-statements hoặc dữ liệu nhập."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setSuccessMessage("");
    setErrorMessage("");
    setSavedData(null);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Nhập báo cáo tài chính
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Màn này dùng để nhập thủ công dữ liệu BCTC còn thiếu cho từng mã cổ phiếu.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Quy ước nhập liệu: các trường tiền tệ nhập theo đơn vị <strong>đồng Việt Nam - VND</strong>,
        không nhập theo tỷ đồng. Ví dụ doanh thu 465 tỷ thì nhập <strong>465000000000</strong>.
      </Alert>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            {successMessage && (
              <Alert severity="success">
                {successMessage}
              </Alert>
            )}

            {errorMessage && (
              <Alert severity="error">
                {errorMessage}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Mã cổ phiếu"
                  placeholder="VD: FPT, HPG, MWG"
                  fullWidth
                  value={form.stockCode}
                  onChange={(e) => handleTextChange("stockCode", e.target.value)}
                  helperText="Mã chứng khoán của doanh nghiệp"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Năm báo cáo"
                  type="number"
                  fullWidth
                  value={form.year}
                  onChange={(e) => handleNumberChange("year", e.target.value)}
                  helperText="Đơn vị: năm. Ví dụ: 2024"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Doanh thu"
                  type="number"
                  fullWidth
                  value={form.revenue}
                  onChange={(e) => handleNumberChange("revenue", e.target.value)}
                  helperText="Đơn vị: VND. Ví dụ 465 tỷ nhập 465000000000"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Lợi nhuận sau thuế"
                  type="number"
                  fullWidth
                  value={form.netProfit}
                  onChange={(e) => handleNumberChange("netProfit", e.target.value)}
                  helperText="Đơn vị: VND. Lợi nhuận ròng sau thuế"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Dòng tiền kinh doanh"
                  type="number"
                  fullWidth
                  value={form.operatingCashFlow}
                  onChange={(e) => handleNumberChange("operatingCashFlow", e.target.value)}
                  helperText="Đơn vị: VND. CFO / dòng tiền từ hoạt động kinh doanh"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Tổng tài sản"
                  type="number"
                  fullWidth
                  value={form.totalAssets}
                  onChange={(e) => handleNumberChange("totalAssets", e.target.value)}
                  helperText="Đơn vị: VND. Tổng tài sản cuối kỳ"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Tổng nợ phải trả"
                  type="number"
                  fullWidth
                  value={form.totalLiabilities}
                  onChange={(e) => handleNumberChange("totalLiabilities", e.target.value)}
                  helperText="Đơn vị: VND. Tổng liabilities / nợ phải trả"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Vốn chủ sở hữu"
                  type="number"
                  fullWidth
                  value={form.equity}
                  onChange={(e) => handleNumberChange("equity", e.target.value)}
                  helperText="Đơn vị: VND. Equity / vốn chủ sở hữu"
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu báo cáo tài chính"}
              </Button>

              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={saving}
              >
                Xóa form
              </Button>
            </Stack>

            {savedData && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Dữ liệu vừa lưu
                  </Typography>

                  <Typography>Mã cổ phiếu: {savedData.stockCode}</Typography>
                  <Typography>Năm: {savedData.year}</Typography>
                  <Typography>Doanh thu: {formatMoney(savedData.revenue)} VND</Typography>
                  <Typography>Lợi nhuận sau thuế: {formatMoney(savedData.netProfit)} VND</Typography>
                  <Typography>Dòng tiền kinh doanh: {formatMoney(savedData.operatingCashFlow)} VND</Typography>
                  <Typography>Tổng tài sản: {formatMoney(savedData.totalAssets)} VND</Typography>
                  <Typography>Tổng nợ phải trả: {formatMoney(savedData.totalLiabilities)} VND</Typography>
                  <Typography>Vốn chủ sở hữu: {formatMoney(savedData.equity)} VND</Typography>
                </CardContent>
              </Card>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}