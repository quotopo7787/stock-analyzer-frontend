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
          Quản lý macro indicators, regime và lớp điều chỉnh tham khảo cho cơ hội đầu tư.
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
                  Regime hiện tại
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  MacroContextService dùng regime mới nhất để tính macroScore và adjustedScore.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={syncWorldBank} disabled={Boolean(actionLoading)}>
                  {actionLoading === "sync" ? "Đang sync..." : "Sync World Bank"}
                </Button>
                <Button variant="contained" onClick={classify} disabled={Boolean(actionLoading)}>
                  {actionLoading === "classify" ? "Đang phân loại..." : "Tạo regime tự động"}
                </Button>
              </Stack>
            </Stack>

            {latestRegime ? <RegimeSummary regime={latestRegime} /> : (
              <Alert severity="info">Chưa có regime. Hãy sync World Bank hoặc tạo override thủ công.</Alert>
            )}

            {syncResult && (
              <Alert severity={syncResult.failedCount > 0 ? "warning" : "info"} sx={{ mt: 2 }}>
                World Bank: fetched {syncResult.fetchedCount}, inserted {syncResult.insertedCount}, updated {syncResult.updatedCount}, skipped {syncResult.skippedCount}, failed {syncResult.failedCount}.
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 850, mb: 1 }}>
              Manual override
            </Typography>
            <Stack spacing={1.25}>
              <TextField label="Ngày regime" type="date" size="small" value={form.contextDate} onChange={(event) => setForm((prev) => ({ ...prev, contextDate: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
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
                {actionLoading === "manual" ? "Đang lưu..." : "Lưu manual override"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 850, mb: 1 }}>
            Macro indicators gần nhất
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
                      <Alert severity="info">Chưa có indicator. Hãy bấm Sync World Bank.</Alert>
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
            Lịch sử regime
          </Typography>
          <Stack spacing={1}>
            {regimes.map((regime) => (
              <RegimeSummary key={`${regime.id ?? regime.contextDate}-${regime.generatedBy}`} regime={regime} compact />
            ))}
            {regimes.length === 0 && <Alert severity="info">Chưa có regime persisted.</Alert>}
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
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: compact ? 1.25 : 1.5, bgcolor: "background.default" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ justifyContent: "space-between", mb: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant={compact ? "subtitle2" : "h6"} sx={{ fontWeight: 850 }}>
            {formatDate(regime.contextDate)}
          </Typography>
          <Chip size="small" label={regime.generatedBy} color={regime.generatedBy === "MANUAL_OVERRIDE" ? "warning" : "primary"} variant="outlined" />
          <Chip size="small" label={`Tin cậy: ${regime.confidenceLevel}`} variant="outlined" />
        </Stack>
        {regime.notes && <Typography variant="caption" color="text.secondary">{regime.notes}</Typography>}
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" }, gap: 1 }}>
        <RegimeMetric label="Lãi suất" value={trendLabel(regime.interestRateTrend)} />
        <RegimeMetric label="Lạm phát" value={trendLabel(regime.inflationTrend)} />
        <RegimeMetric label="Tín dụng" value={trendLabel(regime.creditCondition)} />
        <RegimeMetric label="Tỷ giá" value={trendLabel(regime.fxPressure)} />
        <RegimeMetric label="Thanh khoản" value={trendLabel(regime.marketLiquidity)} />
      </Box>
    </Box>
  );
}

function RegimeMetric({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 800 }}>{value}</Typography>
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
