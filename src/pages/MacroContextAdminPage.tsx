import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  MenuItem,
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
import axios from "axios";
import { macroAdminApi } from "../api/macroAdminApi";
import type {
  MacroIndicator,
  MacroIndicatorSyncResponse,
  MacroPressureLevel,
  MacroRegime,
  MacroRegimeRequest,
  MacroTrend,
} from "../types/macroAdmin";

const trendOptions: MacroTrend[] = ["RISING", "FALLING", "STABLE", "UNKNOWN"];
const pressureOptions: MacroPressureLevel[] = ["LOW", "MEDIUM", "HIGH", "UNKNOWN"];
const today = new Date().toISOString().slice(0, 10);

const defaultForm: MacroRegimeRequest = {
  contextDate: today,
  interestRateTrend: "UNKNOWN",
  inflationTrend: "UNKNOWN",
  creditCondition: "UNKNOWN",
  fxPressure: "UNKNOWN",
  marketLiquidity: "UNKNOWN",
  commodityCycle: "MIXED",
  realEstateCycle: "MIXED",
  confidenceLevel: "MEDIUM",
  notes: "",
};

export default function MacroContextAdminPage() {
  const [indicators, setIndicators] = useState<MacroIndicator[]>([]);
  const [regimes, setRegimes] = useState<MacroRegime[]>([]);
  const [latestRegime, setLatestRegime] = useState<MacroRegime | null>(null);
  const [form, setForm] = useState<MacroRegimeRequest>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"" | "sync" | "classify" | "manual">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [syncResult, setSyncResult] = useState<MacroIndicatorSyncResponse | null>(null);

  const groupedIndicators = useMemo(() => indicators.slice(0, 24), [indicators]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [indicatorResult, latestResult, regimeResult] = await Promise.all([
        macroAdminApi.listIndicators(),
        macroAdminApi.latestRegime(),
        macroAdminApi.listRegimes(),
      ]);
      setIndicators(indicatorResult);
      setLatestRegime(latestResult);
      setRegimes(regimeResult.slice(0, 10));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const syncWorldBank = async () => {
    try {
      setActionLoading("sync");
      setError("");
      setMessage("");
      const result = await macroAdminApi.syncWorldBank();
      setSyncResult(result);
      setMessage(`Da sync World Bank: fetched ${result.fetchedCount}, inserted ${result.insertedCount}, updated ${result.updatedCount}.`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  };

  const classify = async () => {
    try {
      setActionLoading("classify");
      setError("");
      setMessage("");
      const result = await macroAdminApi.classifyFromIndicators();
      setLatestRegime(result);
      setMessage(`Da tao macro regime tu indicators: ${result.generatedBy} - ${result.contextDate}.`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  };

  const createManual = async () => {
    if (!form.contextDate) {
      setError("Ngay regime la bat buoc.");
      return;
    }
    try {
      setActionLoading("manual");
      setError("");
      setMessage("");
      const result = await macroAdminApi.createRegime({
        ...form,
        notes: form.notes?.trim() || undefined,
      });
      setLatestRegime(result);
      setForm(defaultForm);
      setMessage(`Da tao manual override cho ngay ${result.contextDate}.`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 0 }}>
          Bối cảnh vĩ mô
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Theo dõi lãi suất, lạm phát, tín dụng, tỷ giá và thanh khoản để đọc cơ hội đầu tư theo bối cảnh thị trường.
        </Typography>
      </Box>

      {loading && <LinearProgress />}
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" }, gap: 2 }}>
        <Card variant="outlined">
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" }, mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 850 }}>
                  Trạng thái thị trường hiện tại
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Đây là lớp tham khảo riêng, không làm thay đổi điểm cơ bản của doanh nghiệp.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                <Button variant="outlined" onClick={syncWorldBank} disabled={Boolean(actionLoading)}>
                  {actionLoading === "sync" ? "Đang đồng bộ..." : "Đồng bộ World Bank"}
                </Button>
                <Button variant="contained" onClick={classify} disabled={Boolean(actionLoading)}>
                  {actionLoading === "classify" ? "Đang tạo..." : "Tạo bối cảnh tự động"}
                </Button>
              </Stack>
            </Stack>

            {latestRegime ? <RegimeSummary regime={latestRegime} /> : (
              <Alert severity="info">Chưa có bối cảnh vĩ mô. Hãy đồng bộ World Bank hoặc tạo thủ công.</Alert>
            )}

            {syncResult && (
              <Alert severity={syncResult.failedCount > 0 ? "warning" : "info"} sx={{ mt: 2 }}>
                World Bank: lấy {syncResult.fetchedCount}, thêm {syncResult.insertedCount}, cập nhật {syncResult.updatedCount}, bỏ qua {syncResult.skippedCount}, lỗi {syncResult.failedCount}.
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 850, mb: 1 }}>
              Ghi nhận thủ công
            </Typography>
            <Stack spacing={1.25}>
              <TextField label="Ngày bối cảnh" type="date" size="small" value={form.contextDate} onChange={(event) => setForm((prev) => ({ ...prev, contextDate: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
                <SelectField label="Lãi suất" value={form.interestRateTrend} options={trendOptions} onChange={(value) => setForm((prev) => ({ ...prev, interestRateTrend: value as MacroTrend }))} />
                <SelectField label="Lạm phát" value={form.inflationTrend} options={trendOptions} onChange={(value) => setForm((prev) => ({ ...prev, inflationTrend: value as MacroTrend }))} />
                <SelectField label="Tín dụng" value={form.creditCondition} options={trendOptions} onChange={(value) => setForm((prev) => ({ ...prev, creditCondition: value as MacroTrend }))} />
                <SelectField label="Tỷ giá" value={form.fxPressure} options={pressureOptions} onChange={(value) => setForm((prev) => ({ ...prev, fxPressure: value as MacroPressureLevel }))} />
                <SelectField label="Thanh khoản" value={form.marketLiquidity} options={trendOptions} onChange={(value) => setForm((prev) => ({ ...prev, marketLiquidity: value as MacroTrend }))} />
                <TextField label="Độ tin cậy" size="small" value={form.confidenceLevel ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, confidenceLevel: event.target.value }))} />
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
                <TextField label="Chu kỳ hàng hóa" size="small" value={form.commodityCycle ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, commodityCycle: event.target.value }))} />
                <TextField label="Chu kỳ BĐS" size="small" value={form.realEstateCycle ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, realEstateCycle: event.target.value }))} />
              </Box>
              <TextField label="Ghi chú" size="small" multiline minRows={2} value={form.notes ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
              <Button variant="contained" onClick={createManual} disabled={Boolean(actionLoading)}>
                {actionLoading === "manual" ? "Đang lưu..." : "Lưu bối cảnh thủ công"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 850, mb: 1 }}>
            Chỉ số vĩ mô gần nhất
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ngày</TableCell>
                  <TableCell>Chỉ số</TableCell>
                  <TableCell>Nguồn</TableCell>
                  <TableCell align="right">Giá trị</TableCell>
                  <TableCell>Đơn vị</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupedIndicators.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.periodDate)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.indicatorName}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.indicatorCode}</Typography>
                    </TableCell>
                    <TableCell>{item.source}</TableCell>
                    <TableCell align="right">{formatNumber(item.value)}</TableCell>
                    <TableCell>{item.unit ?? "-"}</TableCell>
                  </TableRow>
                ))}
                {groupedIndicators.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Alert severity="info">Chưa có chỉ số vĩ mô. Hãy bấm Đồng bộ World Bank.</Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 850, mb: 1 }}>
            Lịch sử bối cảnh
          </Typography>
          <Stack spacing={1}>
            {regimes.map((regime) => (
              <RegimeSummary key={`${regime.id ?? regime.contextDate}-${regime.generatedBy}`} regime={regime} compact />
            ))}
            {regimes.length === 0 && <Alert severity="info">Chưa có bối cảnh nào được lưu.</Alert>}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <TextField select label={label} size="small" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <MenuItem key={option} value={option}>{trendLabel(option)}</MenuItem>
      ))}
    </TextField>
  );
}

function RegimeSummary({ regime, compact = false }: { regime: MacroRegime; compact?: boolean }) {
  const note = readableRegimeNote(regime.notes);
  const details = regimeMetricDetails(regime.notes);
  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: compact ? 1.25 : 1.5,
        bgcolor: compact ? "background.default" : "rgba(37, 99, 235, 0.04)",
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ justifyContent: "space-between", mb: 1.25 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant={compact ? "subtitle2" : "h6"} sx={{ fontWeight: 850 }}>
            {formatDate(regime.contextDate)}
          </Typography>
          <Chip size="small" label={generatedByLabel(regime.generatedBy)} color={regime.generatedBy === "MANUAL_OVERRIDE" ? "warning" : "primary"} variant="outlined" sx={{ fontWeight: 700 }} />
          <Chip size="small" label={`Độ tin cậy: ${confidenceLabel(regime.confidenceLevel)}`} color={confidenceColor(regime.confidenceLevel)} variant="outlined" sx={{ fontWeight: 700 }} />
        </Stack>
        {!compact && (
          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 360 }}>
            Bối cảnh này chỉ là lớp timing và rủi ro, không thay thế phân tích doanh nghiệp.
          </Typography>
        )}
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" }, gap: 1.1 }}>
        <RegimeMetric label="Lãi suất" value={trendLabel(regime.interestRateTrend)} detail={details.interestRate} tone={trendTone(regime.interestRateTrend)} />
        <RegimeMetric label="Lạm phát" value={trendLabel(regime.inflationTrend)} detail={details.inflation} tone={trendTone(regime.inflationTrend)} />
        <RegimeMetric label="Tín dụng" value={trendLabel(regime.creditCondition)} detail={details.credit} tone={trendTone(regime.creditCondition)} />
        <RegimeMetric label="Tỷ giá" value={trendLabel(regime.fxPressure)} detail={details.fx} tone={pressureTone(regime.fxPressure)} />
        <RegimeMetric label="Thanh khoản" value={trendLabel(regime.marketLiquidity)} detail={details.liquidity} tone={liquidityTone(regime.marketLiquidity)} />
      </Box>
      {note && !compact && (
        <Box sx={{ mt: 1.25, borderRadius: 1.5, bgcolor: "background.paper", border: 1, borderColor: "divider", px: 1.25, py: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
            Ghi chú tự động
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
            {note}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function RegimeMetric({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "good" | "warning" | "bad" | "neutral";
}) {
  const colorMap = {
    good: { bg: "rgba(22, 163, 74, 0.1)", text: "#15803d" },
    warning: { bg: "rgba(245, 158, 11, 0.12)", text: "#b45309" },
    bad: { bg: "rgba(220, 38, 38, 0.1)", text: "#b91c1c" },
    neutral: { bg: "rgba(15, 23, 42, 0.04)", text: "text.primary" },
  }[tone];
  return (
    <Box sx={{ borderRadius: 1.5, bgcolor: colorMap.bg, px: 1.1, py: 0.9, minHeight: 74 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 850, color: colorMap.text }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, lineHeight: 1.25 }}>
        {detail || "Chưa có số đo trực tiếp"}
      </Typography>
    </Box>
  );
}

function trendLabel(value?: string | null) {
  switch (value) {
    case "RISING":
      return "Tăng";
    case "FALLING":
      return "Giảm";
    case "STABLE":
      return "Ổn định";
    case "LOW":
      return "Thấp";
    case "MEDIUM":
      return "Trung bình";
    case "HIGH":
      return "Cao";
    default:
      return "Chưa rõ";
  }
}

function generatedByLabel(value?: string | null) {
  switch (value) {
    case "MANUAL_OVERRIDE":
      return "Nhập thủ công";
    case "AUTO_MARKET_DATA":
      return "Tự động từ dữ liệu thị trường";
    case "WORLD_BANK":
      return "World Bank";
    default:
      return value || "Không rõ nguồn";
  }
}

function confidenceLabel(value?: string | null) {
  switch (value) {
    case "HIGH":
      return "Cao";
    case "MEDIUM":
      return "Trung bình";
    case "LOW":
      return "Thấp";
    default:
      return "Chưa rõ";
  }
}

function confidenceColor(value?: string | null): "success" | "warning" | "default" {
  if (value === "HIGH") return "success";
  if (value === "MEDIUM") return "warning";
  return "default";
}

function trendTone(value?: string | null): "good" | "warning" | "bad" | "neutral" {
  if (value === "STABLE") return "good";
  if (value === "RISING") return "warning";
  if (value === "FALLING") return "neutral";
  return "neutral";
}

function liquidityTone(value?: string | null): "good" | "warning" | "bad" | "neutral" {
  if (value === "RISING") return "good";
  if (value === "FALLING") return "bad";
  return trendTone(value);
}

function pressureTone(value?: string | null): "good" | "warning" | "bad" | "neutral" {
  if (value === "LOW") return "good";
  if (value === "MEDIUM") return "warning";
  if (value === "HIGH") return "bad";
  return "neutral";
}

function regimeMetricDetails(notes?: string | null) {
  const text = notes ?? "";
  const volRatio = matchFirst(text, /vol 20 phi(?:ê|e)n\s*\/\s*60 phi(?:ê|e)n tr(?:ư|u)(?:ớ|o)c\s*=\s*([0-9]+(?:[,.][0-9]+)?)/i);
  const vnIndexRatio = matchFirst(text, /VN-Index SMA20\/SMA60\s*=\s*([0-9]+(?:[,.][0-9]+)?)/i);
  const bankAssets = matchFirst(text, /Bank total assets YoY:\s*([+-]?[0-9]+(?:[,.][0-9]+)?%)/i);
  const bankStocks = matchFirst(text, /Bank stocks change:\s*([+-]?[0-9]+(?:[,.][0-9]+)?%)/i);
  const realEstateRelative = matchFirst(text, /relative\s*=\s*([+-]?[0-9]+(?:[,.][0-9]+)?%)/i);
  const inflationProxy = matchFirst(text, /Inflation proxy[^|:]*[:=]\s*([+-]?[0-9]+(?:[,.][0-9]+)?%?)/i);
  const fxValue = matchFirst(text, /(?:FX|USD\/VND|Tỷ giá|Ty gia)[^|:=]*[:=]\s*([+-]?[0-9]+(?:[,.][0-9]+)?%?)/i);

  return {
    interestRate: inflationProxy ? `Proxy lạm phát ${inflationProxy}` : undefined,
    inflation: inflationProxy ? `Proxy ${inflationProxy}` : undefined,
    credit: bankAssets
      ? `Tài sản NH YoY ${bankAssets}`
      : bankStocks ? `Cổ phiếu NH ${bankStocks}` : undefined,
    fx: fxValue ? `USD/VND ${fxValue}` : undefined,
    liquidity: [volRatio ? `Vol20/60 ${volRatio}` : null, vnIndexRatio ? `SMA20/60 ${vnIndexRatio}` : null]
      .filter(Boolean)
      .join(" · ") || undefined,
    realEstate: realEstateRelative ? `BĐS lệch TT ${realEstateRelative}` : undefined,
  };
}

function matchFirst(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  return match?.[1]?.replace(".", ",");
}

function readableRegimeNote(value?: string | null) {
  if (!value) return "";
  return value
    .replaceAll("Thanh khoản TT", "Thanh khoản thị trường")
    .replaceAll("VN-Index trend", "Xu hướng VN-Index")
    .replaceAll("Bank stocks change", "Nhóm ngân hàng")
    .replaceAll("BĐS vs TT", "BĐS so với thị trường")
    .replaceAll("Inflation proxy", "Lạm phát ước tính")
    .replaceAll("Resource/Chemical stocks change", "Tài nguyên/Hóa chất")
    .replaceAll("Bank total assets YoY", "Tổng tài sản ngân hàng YoY")
    .replaceAll("Confidence=", "Độ tin cậy=")
    .replaceAll("data age=", "tuổi dữ liệu=")
    .replaceAll("days", "ngày");
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function formatNumber(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 4 });
}

function apiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Có lỗi xảy ra.";
}
