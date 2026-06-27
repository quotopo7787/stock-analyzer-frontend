import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { backtestApi } from "../api/backtestApi";
import type {
  BacktestRunRequest,
  BacktestRunResponse,
  BacktestSummaryResponse,
  DiagnosticSection,
  GroupSummary,
  SignalDetail,
} from "../types/backtest";

/* ---------- helpers ---------- */

function fmt(v: number | null | undefined, digits = 2): string {
  if (v == null) return "—";
  return v.toFixed(digits);
}

function dateFmt(iso: string): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

function durationFmt(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const statusColor: Record<string, "success" | "warning" | "error" | "default"> = {
  COMPLETED: "success",
  RUNNING: "warning",
  FAILED: "error",
};

const statusLabel: Record<string, string> = {
  COMPLETED: "Hoàn thành",
  RUNNING: "Đang chạy",
  FAILED: "Lỗi",
};

const outcomeColor: Record<string, "success" | "error" | "default"> = {
  WIN: "success",
  LOSS: "error",
  FLAT: "default",
};

const outcomeLabel: Record<string, string> = {
  WIN: "Thắng",
  LOSS: "Thua",
  FLAT: "Ngang",
};

const biasColor: Record<string, "success" | "warning" | "error" | "default"> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "error",
};

const reliabilityColor: Record<string, "success" | "warning" | "error" | "default"> = {
  HIGH: "success",
  MEDIUM: "success",
  LOW: "warning",
  INSUFFICIENT: "error",
};

function returnColor(v: number): string {
  if (v > 0) return "green";
  if (v < 0) return "red";
  return "inherit";
}

/* ---------- component ---------- */

export default function BacktestPage() {
  /* form state */
  const [fromDate, setFromDate] = useState(daysAgo(30));
  const [toDate, setToDate] = useState(today());
  const [symbolsText, setSymbolsText] = useState("");
  const [horizonsText, setHorizonsText] = useState("7,14,30");
  const [maxSymbols, setMaxSymbols] = useState(50);
  const [dryRun, setDryRun] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* data state */
  const [runs, setRuns] = useState<BacktestRunResponse[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [summary, setSummary] = useState<BacktestSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  /* snackbar */
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<"success" | "error">("success");
  const [snackOpen, setSnackOpen] = useState(false);

  const showSnack = (msg: string, severity: "success" | "error") => {
    setSnackMsg(msg);
    setSnackSeverity(severity);
    setSnackOpen(true);
  };

  /* load runs */
  const loadRuns = useCallback(async () => {
    setRunsLoading(true);
    try {
      const data = await backtestApi.list();
      setRuns(data);
    } catch {
      showSnack("Không thể tải danh sách backtest", "error");
    } finally {
      setRunsLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      loadRuns();
    }, 0);
    return () => clearTimeout(id);
  }, [loadRuns]);

  /* load summary */
  const loadSummary = useCallback(async (runId: number) => {
    setSelectedRunId(runId);
    setSummaryLoading(true);
    setSummary(null);
    try {
      const data = await backtestApi.summary(runId);
      setSummary(data);
    } catch {
      showSnack("Không thể tải kết quả backtest", "error");
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  /* submit form */
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const symbols = symbolsText.trim()
        ? symbolsText.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
        : undefined;
      const horizons = horizonsText.trim()
        ? horizonsText.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n))
        : undefined;

      const req: BacktestRunRequest = {
        fromDate,
        toDate,
        symbols,
        horizons,
        maxSymbols,
        dryRun,
        confirmRun: !dryRun,
      };

      const result = await backtestApi.run(req);

      if (dryRun) {
        showSnack(
          `Dry run: ${result.symbolsCount} mã, ${result.evaluationDaysCount} ngày, ~${result.totalSignals} tín hiệu`,
          "success",
        );
      } else {
        showSnack(`Backtest #${result.id} đã bắt đầu chạy`, "success");
        loadRuns();
      }
    } catch {
      showSnack("Lỗi khi chạy backtest", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* derived data for decision summary table */
  const allHorizonKeys = summary
    ? [
        ...new Set(
          Object.values(summary.byDecision).flatMap((d) =>
            Object.keys(d.avgReturnByHorizon),
          ),
        ),
      ].sort((a, b) => Number(a) - Number(b))
    : [];

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Backtest tín hiệu
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Kết quả mô phỏng lịch sử - Không phải khuyến nghị đầu tư
      </Typography>

      {/* ===== FORM ===== */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Chạy backtest mới
        </Typography>
        <Grid container spacing={2} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Từ ngày"
              type="date"
              fullWidth
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Đến ngày"
              type="date"
              fullWidth
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Mã cổ phiếu"
              fullWidth
              size="small"
              value={symbolsText}
              onChange={(e) => setSymbolsText(e.target.value)}
              placeholder="VD: HPG,MWG,FPT"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Horizons"
              fullWidth
              size="small"
              value={horizonsText}
              onChange={(e) => setHorizonsText(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              label="Số mã tối đa"
              type="number"
              fullWidth
              size="small"
              value={maxSymbols}
              onChange={(e) => setMaxSymbols(Number(e.target.value))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControlLabel
              control={
                <Switch checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
              }
              label="Dry Run"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} /> : undefined}
            >
              Chạy backtest
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ===== RUNS TABLE ===== */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
          <Typography variant="h6">Lịch sử backtest</Typography>
          {runsLoading && <CircularProgress size={20} />}
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Từ ngày</TableCell>
                <TableCell>Đến ngày</TableCell>
                <TableCell>Số mã</TableCell>
                <TableCell>Số ngày</TableCell>
                <TableCell>Tổng tín hiệu</TableCell>
                <TableCell align="right">LN TB 7D</TableCell>
                <TableCell align="right">Alpha TB 7D</TableCell>
                <TableCell align="right">LN ròng TB 7D</TableCell>
                <TableCell align="right">Win rate 7D</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data mode</TableCell>
                <TableCell>Bias</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runs.length === 0 && !runsLoading && (
                <TableRow>
                  <TableCell colSpan={16} align="center">
                    Chưa có backtest nào
                  </TableCell>
                </TableRow>
              )}
              {runs.map((r) => (
                <TableRow key={r.id} selected={r.id === selectedRunId}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{dateFmt(r.fromDate)}</TableCell>
                  <TableCell>{dateFmt(r.toDate)}</TableCell>
                  <TableCell>{r.symbolsCount}</TableCell>
                  <TableCell>{r.evaluationDaysCount}</TableCell>
                  <TableCell>{r.totalSignals}</TableCell>
                  <TableCell align="right" sx={{ color: returnColor(r.averageReturn7D ?? 0) }}>
                    {fmt(r.averageReturn7D)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: returnColor(r.averageAlphaReturn7D ?? 0) }}>
                    {fmt(r.averageAlphaReturn7D)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: returnColor(r.averageNetReturn7D ?? 0) }}>
                    {fmt(r.averageNetReturn7D)}
                  </TableCell>
                  <TableCell align="right">{fmt(r.winRate7D)}</TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabel[r.status] ?? r.status}
                      color={statusColor[r.status] ?? "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={r.dataMode ?? "Chưa rõ"} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={r.lookAheadBiasLevel ?? "Chưa rõ"}
                      color={biasColor[r.lookAheadBiasLevel ?? ""] ?? "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{durationFmt(r.durationMs)}</TableCell>
                  <TableCell>{dateFmt(r.createdAt)}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => loadSummary(r.id)}
                      disabled={r.status !== "COMPLETED"}
                    >
                      Xem
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ===== SUMMARY ===== */}
      {summaryLoading && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {summary && (
        <Stack spacing={3}>
          {/* warnings */}
          {summary.warnings.length > 0 && (
            <Alert severity="warning">
              {summary.warnings.map((w, i) => (
                <Typography key={i} variant="body2">
                  {w}
                </Typography>
              ))}
            </Alert>
          )}
          {(summary.lowSampleWarnings ?? []).length > 0 && (
            <Alert severity="warning">
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Máº«u tháº¥p, chÆ°a nÃªn káº¿t luáº­n
              </Typography>
              {summary.lowSampleWarnings?.map((w, i) => (
                <Typography key={i} variant="body2">
                  {w}
                </Typography>
              ))}
            </Alert>
          )}

          {/* metric cards */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Tổng tín hiệu
                </Typography>
                <Typography variant="h5">{summary.totalSignals}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Đã đánh giá
                </Typography>
                <Typography variant="h5">{summary.evaluatedSignals}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Không có giá thoát
                </Typography>
                <Typography variant="h5">{summary.noExitPriceCount}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Benchmark / phí
                </Typography>
                <Typography variant="h6">
                  {summary.benchmarkCode} / {fmt(summary.transactionCostPct)}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="body2" color="text.secondary">
                Data mode / bias
              </Typography>
              <Chip label={summary.dataMode ?? "Chưa rõ"} size="small" variant="outlined" />
              <Chip
                label={summary.lookAheadBiasLevel ?? "Chưa rõ"}
                color={biasColor[summary.lookAheadBiasLevel ?? ""] ?? "default"}
                size="small"
              />
            </Stack>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="body2" color="text.secondary">
                Äá»™ tin cáº­y máº«u
              </Typography>
              <Chip
                label={summary.sampleReliabilityLevel ?? "ChÆ°a rÃµ"}
                color={reliabilityColor[summary.sampleReliabilityLevel ?? ""] ?? "default"}
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                NgÆ°á»¡ng tá»‘i thiá»ƒu: {summary.minSampleThreshold ?? 30}
              </Typography>
            </Stack>
          </Paper>

          {/* horizon summary */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Theo horizon
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Horizon</TableCell>
                    <TableCell align="right">Số lượng</TableCell>
                    <TableCell align="right">Lợi nhuận TB (%)</TableCell>
                    <TableCell align="right">Trung vị (%)</TableCell>
                    <TableCell align="right">Mẫu đánh giá</TableCell>
                    <TableCell>Độ tin cậy</TableCell>
                    <TableCell align="right">Tốt nhất (%)</TableCell>
                    <TableCell align="right">Xấu nhất (%)</TableCell>
                    <TableCell align="right">Dương / Âm</TableCell>
                    <TableCell align="right">Top1 / Top3</TableCell>
                    <TableCell align="right">Benchmark {summary.benchmarkCode} (%)</TableCell>
                    <TableCell align="right">Benchmark VN30 (%)</TableCell>
                    <TableCell align="right">Alpha TB (%)</TableCell>
                    <TableCell align="right">LN ròng TB (%)</TableCell>
                    <TableCell align="right">Alpha WR (%)</TableCell>
                    <TableCell align="right">Win Rate (%)</TableCell>
                    <TableCell align="right">Thắng</TableCell>
                    <TableCell align="right">Thua</TableCell>
                    <TableCell align="right">Ngang</TableCell>
                    <TableCell align="right">Không có giá</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(summary.byHorizon).map(([key, h]) => (
                    <TableRow key={key}>
                      <TableCell>{h.horizonDays} ngày</TableCell>
                      <TableCell align="right">{h.count}</TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: returnColor(h.avgReturnPct) }}
                      >
                        {fmt(h.avgReturnPct)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: returnColor(h.medianReturnPct) }}
                      >
                        {fmt(h.medianReturnPct)}
                      </TableCell>
                      <TableCell align="right">{h.evaluatedSampleSize ?? h.count}</TableCell>
                      <TableCell>
                        <Chip
                          label={h.reliabilityLevel ?? "Chưa rõ"}
                          color={reliabilityColor[h.reliabilityLevel ?? ""] ?? "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ color: returnColor(h.bestReturnPct ?? 0) }}>
                        {fmt(h.bestReturnPct)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: returnColor(h.worstReturnPct ?? 0) }}>
                        {fmt(h.worstReturnPct)}
                      </TableCell>
                      <TableCell align="right">
                        {h.positiveCount ?? 0} / {h.negativeCount ?? 0}
                      </TableCell>
                      <TableCell align="right">
                        {fmt(h.top1WinnerContributionPct)} / {fmt(h.top3WinnerContributionPct)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: returnColor(h.avgBenchmarkReturnPct ?? 0) }}>
                        {fmt(h.avgBenchmarkReturnPct)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: returnColor(h.avgBenchmarkReturnPctVn30 ?? 0) }}>
                        {fmt(h.avgBenchmarkReturnPctVn30)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: returnColor(h.avgAlphaReturnPct ?? 0), fontWeight: 600 }}>
                        {fmt(h.avgAlphaReturnPct)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: returnColor(h.avgNetReturnPct ?? 0) }}>
                        {fmt(h.avgNetReturnPct)}
                      </TableCell>
                      <TableCell align="right">{fmt(h.alphaWinRate)}</TableCell>
                      <TableCell align="right">{fmt(h.winRate)}</TableCell>
                      <TableCell align="right">{h.winCount}</TableCell>
                      <TableCell align="right">{h.lossCount}</TableCell>
                      <TableCell align="right">{h.flatCount}</TableCell>
                      <TableCell align="right">{h.noExitCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* decision summary */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Theo quyết định
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Quyết định</TableCell>
                    <TableCell align="right">Số lượng</TableCell>
                    <TableCell align="right">Mẫu đánh giá</TableCell>
                    <TableCell>Độ tin cậy</TableCell>
                    {allHorizonKeys.map((hk) => (
                      <TableCell key={`h-avg-${hk}`} align="right">
                        {hk}d - LN TB
                      </TableCell>
                    ))}
                    {allHorizonKeys.map((hk) => (
                      <TableCell key={`h-alpha-${hk}`} align="right">
                        {hk}d - Alpha
                      </TableCell>
                    ))}
                    {allHorizonKeys.map((hk) => (
                      <TableCell key={`h-net-${hk}`} align="right">
                        {hk}d - LN ròng
                      </TableCell>
                    ))}
                    {allHorizonKeys.map((hk) => (
                      <TableCell key={`h-wr-${hk}`} align="right">
                        {hk}d - WR
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(summary.byDecision).map(([key, d]) => (
                    <TableRow key={key}>
                      <TableCell>{d.decision}</TableCell>
                      <TableCell align="right">{d.count}</TableCell>
                      <TableCell align="right">{d.evaluatedSampleSize ?? d.count}</TableCell>
                      <TableCell>
                        <Chip
                          label={d.reliabilityLevel ?? "Chưa rõ"}
                          color={reliabilityColor[d.reliabilityLevel ?? ""] ?? "default"}
                          size="small"
                        />
                      </TableCell>
                      {allHorizonKeys.map((hk) => (
                        <TableCell
                          key={`avg-${hk}`}
                          align="right"
                          sx={{
                            color: returnColor(d.avgReturnByHorizon[hk] ?? 0),
                          }}
                        >
                          {fmt(d.avgReturnByHorizon[hk])}
                        </TableCell>
                      ))}
                      {allHorizonKeys.map((hk) => (
                        <TableCell
                          key={`alpha-${hk}`}
                          align="right"
                          sx={{ color: returnColor(d.avgAlphaReturnByHorizon?.[hk] ?? 0) }}
                        >
                          {fmt(d.avgAlphaReturnByHorizon?.[hk])}
                        </TableCell>
                      ))}
                      {allHorizonKeys.map((hk) => (
                        <TableCell
                          key={`net-${hk}`}
                          align="right"
                          sx={{ color: returnColor(d.avgNetReturnByHorizon?.[hk] ?? 0) }}
                        >
                          {fmt(d.avgNetReturnByHorizon?.[hk])}
                        </TableCell>
                      ))}
                      {allHorizonKeys.map((hk) => (
                        <TableCell key={`wr-${hk}`} align="right">
                          {fmt(d.winRateByHorizon[hk])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <GroupSummaryTable
            title="Theo độ tin cậy dữ liệu"
            groups={summary.byConfidence}
            horizons={allHorizonKeys}
          />

          <GroupSummaryTable
            title="Theo ngành"
            groups={summary.byIndustry}
            horizons={allHorizonKeys}
          />

          {/* top winners */}
          <SignalTable title="Top winners (lợi nhuận)" signals={summary.topWinners} />

          {/* top losers */}
          <SignalTable title="Top losers (lợi nhuận)" signals={summary.topLosers} />

          {/* top alpha signals */}
          <SignalTable title="Top positive alpha" signals={summary.topPositiveAlpha ?? []} />
          <SignalTable title="Top negative alpha" signals={summary.topNegativeAlpha ?? []} />

          {/* diagnostic */}
          {summary.diagnostic && <DiagnosticPanel diagnostic={summary.diagnostic} />}
        </Stack>
      )}

      {/* snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity={snackSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

/* ---------- signal detail table ---------- */

function GroupSummaryTable({
  title,
  groups,
  horizons,
}: {
  title: string;
  groups: Record<string, GroupSummary>;
  horizons: string[];
}) {
  const entries = Object.entries(groups ?? {});
  if (entries.length === 0) return null;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nhóm</TableCell>
              <TableCell align="right">Số lượng</TableCell>
              <TableCell align="right">Mẫu đánh giá</TableCell>
              <TableCell>Độ tin cậy</TableCell>
              {horizons.map((hk) => (
                <TableCell key={`group-alpha-${hk}`} align="right">
                  {hk}d - Alpha
                </TableCell>
              ))}
              {horizons.map((hk) => (
                <TableCell key={`group-net-${hk}`} align="right">
                  {hk}d - LN ròng
                </TableCell>
              ))}
              {horizons.map((hk) => (
                <TableCell key={`group-alpha-wr-${hk}`} align="right">
                  {hk}d - Alpha WR
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map(([key, group]) => (
              <TableRow key={key}>
                <TableCell>{group.group}</TableCell>
                <TableCell align="right">{group.count}</TableCell>
                <TableCell align="right">{group.evaluatedSampleSize ?? group.count}</TableCell>
                <TableCell>
                  <Chip
                    label={group.reliabilityLevel ?? "Chưa rõ"}
                    color={reliabilityColor[group.reliabilityLevel ?? ""] ?? "default"}
                    size="small"
                  />
                </TableCell>
                {horizons.map((hk) => (
                  <TableCell
                    key={`group-${key}-alpha-${hk}`}
                    align="right"
                    sx={{ color: returnColor(group.avgAlphaReturnByHorizon[hk] ?? 0) }}
                  >
                    {fmt(group.avgAlphaReturnByHorizon[hk])}
                  </TableCell>
                ))}
                {horizons.map((hk) => (
                  <TableCell
                    key={`group-${key}-net-${hk}`}
                    align="right"
                    sx={{ color: returnColor(group.avgNetReturnByHorizon[hk] ?? 0) }}
                  >
                    {fmt(group.avgNetReturnByHorizon[hk])}
                  </TableCell>
                ))}
                {horizons.map((hk) => (
                  <TableCell key={`group-${key}-alpha-wr-${hk}`} align="right">
                    {fmt(group.alphaWinRateByHorizon[hk])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function SignalTable({
  title,
  signals,
}: {
  title: string;
  signals: SignalDetail[];
}) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Mã</TableCell>
              <TableCell>Ngày</TableCell>
              <TableCell>Quyết định</TableCell>
              <TableCell align="right">Giá vào</TableCell>
              <TableCell align="right">Giá ra</TableCell>
              <TableCell align="right">Lợi nhuận (%)</TableCell>
              <TableCell>Kết quả</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {signals.map((s) => (
              <TableRow key={s.signalId}>
                <TableCell>{s.stockCode}</TableCell>
                <TableCell>{dateFmt(s.signalDate)}</TableCell>
                <TableCell>{s.decision}</TableCell>
                <TableCell align="right">{fmt(s.entryPrice, 0)}</TableCell>
                <TableCell align="right">{fmt(s.exitPrice, 0)}</TableCell>
                <TableCell
                  align="right"
                  sx={{ color: returnColor(s.returnPct), fontWeight: 600 }}
                >
                  {fmt(s.returnPct)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={outcomeLabel[s.outcome] ?? s.outcome}
                    color={outcomeColor[s.outcome] ?? "default"}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function DiagnosticPanel({ diagnostic }: { diagnostic: DiagnosticSection }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Chẩn đoán alpha
      </Typography>

      {diagnostic.insights.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {diagnostic.insights.map((ins, i) => (
            <Typography key={i} variant="body2">
              {ins}
            </Typography>
          ))}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Quyết định tốt nhất
            </Typography>
            <Typography variant="h6" sx={{ color: "green" }}>
              {diagnostic.bestDecisionByAlpha ?? "—"}
            </Typography>
            <Typography variant="body2">
              Alpha: {fmt(diagnostic.bestDecisionAlphaValue)}%
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Quyết định yếu nhất
            </Typography>
            <Typography variant="h6" sx={{ color: "red" }}>
              {diagnostic.worstDecisionByAlpha ?? "—"}
            </Typography>
            <Typography variant="body2">
              Alpha: {fmt(diagnostic.worstDecisionAlphaValue)}%
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Ngành mạnh nhất
            </Typography>
            <Typography variant="h6" sx={{ color: "green" }}>
              {diagnostic.bestIndustryByAlpha ?? "—"}
            </Typography>
            <Typography variant="body2">
              Alpha: {fmt(diagnostic.bestIndustryAlphaValue)}%
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Ngành yếu nhất
            </Typography>
            <Typography variant="h6" sx={{ color: "red" }}>
              {diagnostic.worstIndustryByAlpha ?? "—"}
            </Typography>
            <Typography variant="body2">
              Alpha: {fmt(diagnostic.worstIndustryAlphaValue)}%
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Typography variant="body2">
          Benchmark drag (cổ phiếu tăng nhưng thua benchmark):{" "}
          <strong>{diagnostic.benchmarkDragCount}</strong> trường hợp
          {diagnostic.benchmarkDragPct != null && ` (${fmt(diagnostic.benchmarkDragPct)}%)`}
        </Typography>
      </Paper>

      {diagnostic.confidenceAlphaRanking.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Xếp hạng alpha theo độ tin cậy dữ liệu
          </Typography>
          <TableContainer sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nhóm</TableCell>
                  <TableCell align="right">Số lượng</TableCell>
                  <TableCell align="right">Alpha TB (%)</TableCell>
                  <TableCell align="right">Alpha WR (%)</TableCell>
                  <TableCell>Độ tin cậy</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diagnostic.confidenceAlphaRanking.map((r) => (
                  <TableRow key={r.group}>
                    <TableCell>{r.group}</TableCell>
                    <TableCell align="right">{r.count}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: returnColor(r.avgAlphaReturnPct ?? 0), fontWeight: 600 }}
                    >
                      {fmt(r.avgAlphaReturnPct)}
                    </TableCell>
                    <TableCell align="right">{fmt(r.alphaWinRate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={r.reliabilityLevel ?? "Chưa rõ"}
                        color={reliabilityColor[r.reliabilityLevel ?? ""] ?? "default"}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {diagnostic.repeatedLoserSymbols.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Mã thua nhiều lần (7D)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mã</TableCell>
                  <TableCell align="right">Số lần thua</TableCell>
                  <TableCell align="right">LN TB (%)</TableCell>
                  <TableCell align="right">Alpha TB (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diagnostic.repeatedLoserSymbols.map((l) => (
                  <TableRow key={l.stockCode}>
                    <TableCell>{l.stockCode}</TableCell>
                    <TableCell align="right">{l.lossCount}</TableCell>
                    <TableCell align="right" sx={{ color: "red" }}>
                      {fmt(l.avgReturnPct)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "red" }}>
                      {fmt(l.avgAlphaReturnPct)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Paper>
  );
}
