import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { portfolioAllocationApi } from "../api/portfolioAllocationApi";
import MoneyTextField from "../components/MoneyTextField";
import type {
  PortfolioAllocationCashSource,
  PortfolioAllocationIndustry,
  PortfolioAllocationPosition,
  PortfolioAllocationPriority,
  PortfolioAllocationReviewRequest,
  PortfolioAllocationReviewResponse,
  PortfolioAllocationRiskLevel,
  PortfolioAllocationStatus,
} from "../types/portfolioAllocation";

type ReviewForm = {
  totalCapital: string;
  cashAmount: string;
  maxStockWeightPercent: string;
  maxIndustryWeightPercent: string;
  minCashPercent: string;
  targetCashPercent: string;
};

const defaultForm: ReviewForm = {
  totalCapital: "",
  cashAmount: "",
  maxStockWeightPercent: "20",
  maxIndustryWeightPercent: "35",
  minCashPercent: "10",
  targetCashPercent: "20",
};

export default function PortfolioAllocationPage() {
  const navigate = useNavigate();
  const didInitialReview = useRef(false);
  const [form, setForm] = useState<ReviewForm>(defaultForm);
  const [data, setData] = useState<PortfolioAllocationReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const review = useCallback(async (payload?: PortfolioAllocationReviewRequest) => {
    try {
      setLoading(true);
      setError("");
      const result = await portfolioAllocationApi.review(payload ?? formPayload(form));
      setData(result);
      setForm((current) => ({
        ...current,
        totalCapital: current.totalCapital || valueString(result.summary.totalCapital),
      }));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    if (didInitialReview.current) return;
    didInitialReview.current = true;
    const timer = window.setTimeout(() => {
      void review(formPayload(defaultForm));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [review]);

  const submit = () => {
    const validation = validateForm(form);
    if (validation) {
      setError(validation);
      return;
    }
    void review();
  };

  const field = (key: keyof ReviewForm) => ({
    value: form[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [key]: event.target.value })),
  });
  const moneyField = (key: keyof ReviewForm) => ({
    value: form[key],
    onChange: (value: string) => setForm((current) => ({ ...current, [key]: value })),
  });

  return (
    <Box sx={{ textAlign: "left" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Phân bổ vốn</Typography>
          <Typography color="text.secondary">
            Kiểm tra tỷ trọng danh mục, tiền mặt, rủi ro tập trung và các gợi ý theo điều kiện. Đây không phải công cụ đặt lệnh mua/bán.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate("/portfolio")}>Mở danh mục</Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Cấu hình review</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(6, minmax(0, 1fr))" }, gap: 2 }}>
            <MoneyTextField label="Tổng vốn đầu tư" {...moneyField("totalCapital")} helperText="Có thể để trống để lấy tiền mặt + giá trị vị thế" />
            <MoneyTextField label="Tiền mặt" {...moneyField("cashAmount")} helperText="Để trống để dùng số dư cash ledger" />
            <TextField label="Max mỗi mã (%)" type="number" {...field("maxStockWeightPercent")} />
            <TextField label="Max mỗi ngành (%)" type="number" {...field("maxIndustryWeightPercent")} />
            <TextField label="Tiền mặt tối thiểu (%)" type="number" {...field("minCashPercent")} />
            <TextField label="Tiền mặt mục tiêu (%)" type="number" {...field("targetCashPercent")} />
          </Box>
          <Stack direction="row" spacing={1.5} sx={{ mt: 2, alignItems: "center" }}>
            <Button variant="contained" onClick={submit} disabled={loading}>Review phân bổ</Button>
            <Button variant="text" onClick={() => { setForm(defaultForm); void review(formPayload(defaultForm)); }} disabled={loading}>Reset</Button>
            <Typography variant="body2" color="text.secondary">
              Gợi ý chỉ dùng các nhãn WATCH / CONSIDER / REDUCE_RISK / HOLD_CASH, không tự động sửa danh mục.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {data && (
        <Stack spacing={3}>
          <SummaryCards data={data} />
          <PositionsTable positions={data.positions} />
          <IndustryAllocation industries={data.industries} maxIndustryWeight={optionalNumber(form.maxIndustryWeightPercent) ?? 35} />
          <Suggestions suggestions={data.suggestions} warnings={data.warnings} />
        </Stack>
      )}
    </Box>
  );
}

function SummaryCards({ data }: { data: PortfolioAllocationReviewResponse }) {
  const summary = data.summary;
  return (
    <Stack spacing={2}>
      <CashSourceNotice
        source={summary.cashSource}
        note={summary.cashSourceNote}
        cashLedgerBalance={summary.cashLedgerBalance}
      />
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 2 }}>
        <Metric label="Tổng vốn" value={formatVnd(summary.totalCapital)} />
        <Metric label="Tiền mặt" value={formatVnd(summary.cashAmount)} />
        <Metric label="Đã đầu tư" value={formatVnd(summary.investedAmount)} />
        <Metric label="Tỷ lệ tiền mặt" value={formatPercent(summary.cashPercent)} />
        <Metric label="Số mã nắm giữ" value={formatNumber(summary.positionCount)} />
        <Metric label="Rủi ro tổng quan" value={riskLabel(summary.riskLevel)} tone={riskTone(summary.riskLevel)} />
        <Metric label="Top mã" value={formatPercent(summary.topStockWeight)} />
        <Metric label="Top ngành" value={formatPercent(summary.topIndustryWeight)} />
      </Box>
    </Stack>
  );
}

function CashSourceNotice({
  source,
  note,
  cashLedgerBalance,
}: {
  source?: PortfolioAllocationCashSource;
  note?: string | null;
  cashLedgerBalance?: number | null;
}) {
  if (!source) return null;
  const severity = source === "CASH_LEDGER_EMPTY" ? "warning" : source === "MANUAL_OVERRIDE" ? "info" : "success";
  return (
    <Alert severity={severity}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
        <Chip size="small" color={cashSourceColor(source)} label={cashSourceLabel(source)} />
        <Typography variant="body2">
          {cashSourceMessage(source, note)}
          {source === "CASH_LEDGER" && cashLedgerBalance != null ? ` Số dư ledger: ${formatVnd(cashLedgerBalance)}.` : ""}
        </Typography>
      </Stack>
    </Alert>
  );
}

function PositionsTable({ positions }: { positions: PortfolioAllocationPosition[] }) {
  return (
    <Card>
      <CardContent>
        <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", mb: 2 }} spacing={1}>
          <Box>
            <Typography variant="h6">Vị thế đang nắm giữ</Typography>
            <Typography variant="body2" color="text.secondary">Tỷ trọng tính trên tổng vốn review, không tự động thay đổi Portfolio.</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">{positions.length} mã</Typography>
        </Stack>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 1450 }}>
            <TableHead>
              <TableRow>
                <TableCell>Mã</TableCell>
                <TableCell>Ngành</TableCell>
                <TableCell align="right">Số lượng</TableCell>
                <TableCell align="right">Giá vốn TB</TableCell>
                <TableCell align="right">Giá hiện tại</TableCell>
                <TableCell align="right">Giá trị</TableCell>
                <TableCell align="right">Lãi/lỗ</TableCell>
                <TableCell align="right">Tỷ trọng</TableCell>
                <TableCell align="right">Fair value</TableCell>
                <TableCell align="right">Giá mua mục tiêu</TableCell>
                <TableCell>Kế hoạch</TableCell>
                <TableCell>Trạng thái phân bổ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {positions.map((item) => (
                <TableRow key={item.stockCode} hover>
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography sx={{ fontWeight: 750 }}>{item.stockCode}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.companyName}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{item.industry || "-"}</TableCell>
                  <TableCell align="right">{formatNumber(item.quantity)}</TableCell>
                  <TableCell align="right">{formatVnd(item.averageCost)}</TableCell>
                  <TableCell align="right">{formatVnd(item.currentPrice)}</TableCell>
                  <TableCell align="right">{formatVnd(item.marketValue)}</TableCell>
                  <TableCell align="right" sx={{ color: signedColor(item.unrealizedPnl), fontWeight: 700 }}>
                    {formatVnd(item.unrealizedPnl)}<br />
                    <Typography component="span" variant="caption">{formatPercent(item.unrealizedPnlPercent)}</Typography>
                  </TableCell>
                  <TableCell align="right">{formatPercent(item.weightPercent)}</TableCell>
                  <TableCell align="right">{formatVnd(item.valuationFairValue)}</TableCell>
                  <TableCell align="right">{formatVnd(item.targetBuyPrice)}</TableCell>
                  <TableCell>{planLabel(item)}</TableCell>
                  <TableCell><Chip size="small" label={allocationStatusLabel(item.allocationStatus)} color={allocationStatusColor(item.allocationStatus)} variant={item.allocationStatus === "OK" ? "outlined" : "filled"} /></TableCell>
                </TableRow>
              ))}
              {positions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12}>
                    <Alert severity="info" action={<Button size="small" onClick={() => window.location.assign("/portfolio")}>Nhập vị thế</Button>}>
                      Chưa có portfolio positions ACTIVE. Hãy vào Danh mục đầu tư để nhập vị thế trước khi review phân bổ.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

function IndustryAllocation({ industries, maxIndustryWeight }: { industries: PortfolioAllocationIndustry[]; maxIndustryWeight: number }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Phân bổ theo ngành</Typography>
        <Stack spacing={1.25}>
          {industries.map((item) => (
            <Paper key={item.industry} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{item.industry}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatVnd(item.marketValue)}</Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 750 }}>{formatPercent(item.weightPercent)}</Typography>
                  {item.warning && <Chip size="small" color="warning" label="Vượt ngưỡng ngành" />}
                </Stack>
              </Stack>
              <Box sx={{ height: 8, borderRadius: 999, bgcolor: "#edf2f7", overflow: "hidden" }}>
                <Box sx={{
                  height: "100%",
                  width: `${Math.min(item.weightPercent ?? 0, 100)}%`,
                  bgcolor: (item.weightPercent ?? 0) > maxIndustryWeight ? "warning.main" : "primary.main",
                }} />
              </Box>
            </Paper>
          ))}
          {industries.length === 0 && <Typography color="text.secondary">Chưa có dữ liệu ngành.</Typography>}
        </Stack>
      </CardContent>
    </Card>
  );
}

function Suggestions({ suggestions, warnings }: { suggestions: PortfolioAllocationReviewResponse["suggestions"]; warnings: string[] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Gợi ý / cảnh báo</Typography>
        {warnings.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1, mb: 2 }}>
            {warnings.map((warning) => <Chip key={warning} size="small" label={warningLabel(warning)} color="warning" variant="outlined" />)}
          </Stack>
        )}
        <Stack spacing={1}>
          {suggestions.map((item, index) => (
            <Alert key={`${item.type}-${item.stockCode ?? "cash"}-${index}`} severity={suggestionSeverity(item)}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ alignItems: { md: "center" } }}>
                <Chip size="small" label={item.priority} color={priorityColor(item.priority)} />
                {(item.isActionable === false || item.blockedReason) && (
                  <Chip size="small" label={item.blockedReason ? `Bị chặn: ${blockedReasonLabel(item.blockedReason)}` : "Cẩn trọng"} color="warning" variant="outlined" />
                )}
                <Typography sx={{ fontWeight: 700 }}>{suggestionTypeLabel(item.type)}{item.stockCode ? ` · ${item.stockCode}` : ""}</Typography>
                <Typography>{item.message}</Typography>
                {(item.stockWeightPercent != null || item.industryWeightPercent != null) && (
                  <Typography variant="caption" color="text.secondary">
                    {item.stockWeightPercent != null ? `Tỷ trọng mã ${formatPercent(item.stockWeightPercent)}` : ""}
                    {item.stockWeightPercent != null && item.industryWeightPercent != null ? " · " : ""}
                    {item.industryWeightPercent != null ? `Tỷ trọng ngành ${formatPercent(item.industryWeightPercent)}` : ""}
                  </Typography>
                )}
              </Stack>
            </Alert>
          ))}
          {suggestions.length === 0 && <Alert severity="success">Chưa có cảnh báo lớn về phân bổ vốn theo cấu hình hiện tại.</Alert>}
        </Stack>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" | "error" }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5" sx={{ color: tone ? `${tone}.main` : "text.primary" }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

function validateForm(form: ReviewForm) {
  const totalCapital = optionalNumber(form.totalCapital);
  const cashAmount = optionalNumber(form.cashAmount);
  if (totalCapital !== undefined && totalCapital <= 0) return "Tổng vốn đầu tư phải lớn hơn 0 nếu nhập.";
  if (cashAmount !== undefined && cashAmount < 0) return "Tiền mặt phải >= 0.";
  if (totalCapital !== undefined && cashAmount !== undefined && cashAmount > totalCapital) return "Tiền mặt không được lớn hơn tổng vốn.";
  for (const [key, label, allowZero] of [
    ["maxStockWeightPercent", "Max tỷ trọng mỗi mã", false],
    ["maxIndustryWeightPercent", "Max tỷ trọng mỗi ngành", false],
    ["minCashPercent", "Tiền mặt tối thiểu", true],
    ["targetCashPercent", "Tiền mặt mục tiêu", true],
  ] as const) {
    const value = optionalNumber(form[key]);
    if (value === undefined) return `${label} là bắt buộc.`;
    if (allowZero ? value < 0 || value > 100 : value <= 0 || value > 100) return `${label} phải nằm trong khoảng ${allowZero ? "0-100" : "1-100"}%.`;
  }
  return "";
}

function formPayload(form: ReviewForm): PortfolioAllocationReviewRequest {
  return {
    totalCapital: optionalNumber(form.totalCapital),
    cashAmount: optionalNumber(form.cashAmount),
    maxStockWeightPercent: optionalNumber(form.maxStockWeightPercent),
    maxIndustryWeightPercent: optionalNumber(form.maxIndustryWeightPercent),
    minCashPercent: optionalNumber(form.minCashPercent),
    targetCashPercent: optionalNumber(form.targetCashPercent),
  };
}

function apiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (error.response?.status === 400) return "Cấu hình review chưa hợp lệ. Vui lòng kiểm tra tổng vốn, tiền mặt và ngưỡng tỷ trọng.";
  }
  return "Không tải được dữ liệu phân bổ vốn.";
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function valueString(value?: number) { return value == null ? "" : String(Math.round(value)); }
function formatVnd(value?: number) { return value == null ? "-" : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} đ`; }
function formatPercent(value?: number) { return value == null ? "-" : `${value.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`; }
function formatNumber(value?: number) { return value == null ? "-" : value.toLocaleString("vi-VN", { maximumFractionDigits: 4 }); }
function signedColor(value?: number) { if (value == null || value === 0) return "text.primary"; return value > 0 ? "success.main" : "error.main"; }
function cashSourceLabel(value: PortfolioAllocationCashSource) {
  if (value === "CASH_LEDGER") return "Nguồn tiền mặt: Cash ledger";
  if (value === "MANUAL_OVERRIDE") return "Nguồn tiền mặt: Nhập tay";
  return "Nguồn tiền mặt: Chưa có cash ledger";
}
function cashSourceMessage(value: PortfolioAllocationCashSource, note?: string | null) {
  if (note) return note;
  if (value === "CASH_LEDGER") return "Tiền mặt lấy từ cash ledger persisted.";
  if (value === "MANUAL_OVERRIDE") return "Đang dùng tiền mặt nhập tay, không phải số dư cash ledger.";
  return "Chưa có dữ liệu cash ledger. Hãy thêm ADJUSTMENT hoặc rebuild từ transaction ledger.";
}
function cashSourceColor(value: PortfolioAllocationCashSource): "success" | "info" | "warning" {
  if (value === "CASH_LEDGER") return "success";
  if (value === "MANUAL_OVERRIDE") return "info";
  return "warning";
}
function riskLabel(value: PortfolioAllocationRiskLevel) { return value === "HIGH" ? "Cao" : value === "MEDIUM" ? "Trung bình" : "Thấp"; }
function riskTone(value: PortfolioAllocationRiskLevel): "success" | "warning" | "error" { return value === "HIGH" ? "error" : value === "MEDIUM" ? "warning" : "success"; }
function allocationStatusLabel(value: PortfolioAllocationStatus) {
  if (value === "OK") return "Ổn";
  if (value === "OVERWEIGHT_STOCK") return "Vượt tỷ trọng mã";
  if (value === "OVERWEIGHT_INDUSTRY") return "Vượt tỷ trọng ngành";
  return "Thiếu dữ liệu";
}
function allocationStatusColor(value: PortfolioAllocationStatus): "default" | "success" | "warning" | "error" {
  if (value === "OK") return "success";
  if (value === "DATA_MISSING") return "warning";
  return "error";
}
function planLabel(item: PortfolioAllocationPosition) {
  if (!item.decisionPlanAction && !item.decisionPlanStatus) return "-";
  return `${decisionActionLabel(item.decisionPlanAction)} · ${decisionStatusLabel(item.decisionPlanStatus)}`;
}
function decisionActionLabel(value?: string) {
  const labels: Record<string, string> = { BUY: "Mua", WATCH: "Theo dõi", HOLD: "Nắm giữ", TRIM: "Giảm tỷ trọng", SELL: "Bán", AVOID: "Tránh" };
  return value ? labels[value] ?? value : "-";
}
function decisionStatusLabel(value?: string) {
  const labels: Record<string, string> = { DRAFT: "Nháp", ACTIVE: "Đang dùng", CLOSED: "Đã đóng" };
  return value ? labels[value] ?? value : "-";
}
function warningLabel(value: string) {
  const labels: Record<string, string> = {
    CASH_TOO_LOW: "Tiền mặt thấp",
    STOCK_OVERWEIGHT: "Vượt tỷ trọng mã",
    INDUSTRY_OVERWEIGHT: "Vượt tỷ trọng ngành",
    PRICE_MISSING: "Thiếu giá",
    VALUATION_MISSING: "Thiếu định giá",
    DECISION_PLAN_MISSING: "Thiếu kế hoạch",
  };
  return labels[value] ?? value;
}
function suggestionTypeLabel(value: string) {
  const labels: Record<string, string> = {
    HOLD_CASH: "Giữ tiền mặt",
    REDUCE_RISK: "Giảm rủi ro tập trung",
    REDUCE_INDUSTRY_CONCENTRATION: "Giảm tập trung ngành",
    WATCH_BUY_ZONE: "Theo dõi vùng giá",
    WATCH_BUY_ZONE_BLOCKED: "Vùng giá bị chặn bởi rủi ro",
    AVOID_CHASING: "Tránh mua đuổi",
    DATA_GAP: "Thiếu dữ liệu",
  };
  return labels[value] ?? value;
}
function blockedReasonLabel(value: string) {
  const labels: Record<string, string> = {
    CASH_TOO_LOW: "tiền mặt thấp",
    CASH_BELOW_TARGET: "tiền mặt dưới mục tiêu",
    STOCK_OVERWEIGHT: "vượt tỷ trọng mã",
    INDUSTRY_OVERWEIGHT: "vượt tỷ trọng ngành",
    DATA_GAP: "thiếu dữ liệu",
    ABOVE_FAIR_VALUE: "cao hơn fair value",
  };
  return labels[value] ?? value;
}
function suggestionSeverity(item: PortfolioAllocationReviewResponse["suggestions"][number]): "error" | "warning" | "info" | "success" {
  if (item.isActionable === false || item.blockedReason) return "warning";
  if (item.type === "WATCH_BUY_ZONE") return "info";
  return prioritySeverity(item.priority);
}
function prioritySeverity(priority: PortfolioAllocationPriority): "error" | "warning" | "info" {
  if (priority === "HIGH") return "error";
  if (priority === "MEDIUM") return "warning";
  return "info";
}
function priorityColor(priority: PortfolioAllocationPriority): "error" | "warning" | "info" {
  if (priority === "HIGH") return "error";
  if (priority === "MEDIUM") return "warning";
  return "info";
}
