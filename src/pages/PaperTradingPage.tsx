import { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress, IconButton,
  LinearProgress, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography,
} from "@mui/material";
import {
  ErrorOutlined, InfoOutlined, Refresh,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { paperTradingApi } from "../api/paperTradingApi";
import type {
  AlphaByDecisionItem, AlphaOverviewResponse, AlphaTopItem,
  DailyCheckResponse, DailyMonitoringResponse, JobDailySummaryResponse, JobRunItem, MonitoringIssue,
  SchedulerStatusResponse,
} from "../types/paperTrading";

const healthLabel: Record<string, string> = {
  HEALTHY: "Ổn định",
  WARNING: "Cảnh báo",
  FAILED: "Lỗi",
  NOT_EXPECTED_TODAY: "Không cần chạy hôm nay",
};
const healthColor: Record<string, "success" | "warning" | "error" | "info"> = {
  HEALTHY: "success",
  WARNING: "warning",
  FAILED: "error",
  NOT_EXPECTED_TODAY: "info",
};
const captureLabel: Record<string, string> = {
  SUCCESS: "Thành công",
  FAILED: "Lỗi",
  NOT_RUN: "Chưa chạy",
};
const gradeLabel: Record<string, string> = {
  INSUFFICIENT: "Chưa đủ",
  EARLY: "Giai đoạn sớm",
  DEVELOPING: "Đang phát triển",
  STATISTICALLY_USEFUL: "Có giá trị thống kê",
  TRACK_RECORD_READY: "Đủ track record",
};
const severityIcon: Record<string, React.ReactNode> = {
  CRITICAL: <ErrorOutlined color="error" fontSize="small" />,
  WARNING: <WarningAmberOutlined color="warning" fontSize="small" />,
  INFO: <InfoOutlined color="info" fontSize="small" />,
};

function fmt(v: number | null | undefined, digits = 2): string {
  if (v == null) return "—";
  return v.toFixed(digits);
}

export default function PaperTradingPage() {
  const [daily, setDaily] = useState<DailyMonitoringResponse | null>(null);
  const [check, setCheck] = useState<DailyCheckResponse | null>(null);
  const [alpha, setAlpha] = useState<AlphaOverviewResponse | null>(null);
  const [byDecision, setByDecision] = useState<AlphaByDecisionItem[]>([]);
  const [winners, setWinners] = useState<AlphaTopItem[]>([]);
  const [losers, setLosers] = useState<AlphaTopItem[]>([]);
  const [scheduler, setScheduler] = useState<SchedulerStatusResponse | null>(null);
  const [jobSummary, setJobSummary] = useState<JobDailySummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, c, a, dec, w, l, s, js] = await Promise.all([
        paperTradingApi.getDaily(),
        paperTradingApi.getDailyCheck(),
        paperTradingApi.getAlphaOverview(),
        paperTradingApi.getAlphaByDecision(),
        paperTradingApi.getAlphaTopWinners(),
        paperTradingApi.getAlphaTopLosers(),
        paperTradingApi.getSchedulerStatus(),
        paperTradingApi.getJobsDailySummary().catch(() => null),
      ]);
      setDaily(d);
      setCheck(c);
      setAlpha(a);
      setByDecision(dec);
      setWinners(w);
      setLosers(l);
      setScheduler(s);
      setJobSummary(js);
      setLastRefresh(new Date());
    } catch {
      setError("Không kết nối được backend. Kiểm tra localhost:8080.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !daily) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }

  if (error && !daily) {
    return (
      <Alert severity="error" action={<IconButton onClick={load}><Refresh /></IconButton>}>
        {error}
      </Alert>
    );
  }

  const health = daily?.overallHealth ?? "WARNING";

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Theo dõi Paper Trading</Typography>
          <Typography variant="body2" color="text.secondary">
            Giám sát tín hiệu mô phỏng, alpha và tiến độ track record
          </Typography>
        </Box>
        <Stack direction="row" sx={{ alignItems: "center" }} spacing={1}>
          {lastRefresh && (
            <Typography variant="caption" color="text.secondary">
              {lastRefresh.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </Typography>
          )}
          <IconButton onClick={load} disabled={loading} size="small"><Refresh /></IconButton>
        </Stack>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* B. Health summary cards */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        {/* Card 1: Sức khỏe */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>Sức khỏe hôm nay</Typography>
            <Chip label={healthLabel[health] ?? health} color={healthColor[health] ?? "default"} size="small" />
            <Typography variant="caption" component="p" sx={{ mt: 1 }} color="text.secondary">
              {daily?.date}
            </Typography>
          </CardContent>
        </Card>

        {/* Card 2: Capture */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>Lưu tín hiệu hôm nay</Typography>
            <Chip
              label={captureLabel[daily?.capture?.status ?? "NOT_RUN"] ?? "—"}
              color={daily?.capture?.status === "SUCCESS" ? "success" : daily?.capture?.status === "FAILED" ? "error" : "default"}
              size="small"
            />
            <Typography variant="caption" component="p" sx={{ mt: 0.5 }}>
              Mới: {daily?.capture?.insertedCount ?? 0} · Trùng: {daily?.capture?.duplicateCount ?? 0}
            </Typography>
          </CardContent>
        </Card>

        {/* Card 3: Evaluate */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>Đánh giá tín hiệu</Typography>
            <Chip
              label={captureLabel[daily?.evaluation?.status ?? "NOT_RUN"] ?? "—"}
              color={daily?.evaluation?.status === "SUCCESS" ? "success" : daily?.evaluation?.status === "FAILED" ? "error" : "default"}
              size="small"
            />
            <Typography variant="caption" component="p" sx={{ mt: 0.5 }}>
              Đến hạn 7d: {daily?.evaluation?.dueCount7d ?? 0} · Đã đánh giá: {daily?.evaluation?.evaluatedCount7d ?? 0}
            </Typography>
          </CardContent>
        </Card>

        {/* Card 4: Track record */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>Tiến độ track record</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {daily?.trackRecordProgress?.totalSignals ?? 0} / {daily?.trackRecordProgress?.targetSignals ?? 500}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={daily?.trackRecordProgress?.progressPercent ?? 0}
              sx={{ my: 0.5, height: 6, borderRadius: 3 }}
            />
            <Chip
              label={gradeLabel[daily?.trackRecordProgress?.qualityGrade ?? ""] ?? daily?.trackRecordProgress?.qualityGrade ?? "—"}
              size="small"
              variant="outlined"
            />
          </CardContent>
        </Card>
      </Stack>

      {/* C. Alpha section */}
      {alpha && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
              Chênh lệch so với VNINDEX (Alpha 7D)
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
              <Box>
                <Typography variant="caption" color="text.secondary">Alpha trung bình</Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700 }}
                  color={(alpha.averageAlpha ?? 0) >= 0 ? "success.main" : "error.main"}
                >
                  {fmt(alpha.averageAlpha, 4)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Tỷ lệ thắng VNINDEX</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{fmt(alpha.positiveAlphaRate)}%</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Return tín hiệu</Typography>
                <Typography variant="h6">{fmt(alpha.averageSignalReturn, 4)}%</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Return VNINDEX</Typography>
                <Typography variant="h6">{fmt(alpha.averageBenchmarkReturn, 4)}%</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Độ tin cậy</Typography>
                <Chip label={alpha.alphaConfidenceLabel ?? "—"} size="small" variant="outlined" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Mẫu</Typography>
                <Typography variant="h6">{alpha.evaluationCount ?? alpha.count ?? 0}</Typography>
              </Box>
            </Stack>
            {(alpha.averageAlpha ?? 0) < 0 && (
              <Alert severity="warning" sx={{ mt: 1.5 }} icon={false}>
                Alpha âm nghĩa là tín hiệu đang kém VNINDEX trong mẫu hiện tại.
              </Alert>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              Alpha chỉ tính trên tín hiệu đã đủ hạn đánh giá. 30D/90D sẽ xuất hiện sau khi tín hiệu đủ ngày.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* D. Issues & recommendations */}
      {check && check.issues.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
              Cảnh báo & khuyến nghị ({check.issueCount})
            </Typography>
            <Stack spacing={1}>
              {check.issues.map((issue: MonitoringIssue, i: number) => (
                <Stack key={i} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                  {severityIcon[issue.severity] ?? <InfoOutlined fontSize="small" />}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{issue.message}</Typography>
                    {check.recommendations[i] && (
                      <Typography variant="caption" color="text.secondary">
                        → {check.recommendations[i]}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* E. Decision alpha table */}
      {byDecision.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>Alpha theo Decision</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Decision</TableCell>
                    <TableCell align="right">Số mẫu</TableCell>
                    <TableCell align="right">Alpha TB</TableCell>
                    <TableCell align="right">Thắng VNINDEX</TableCell>
                    <TableCell align="right">Signal return</TableCell>
                    <TableCell align="right">Benchmark return</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {byDecision.map((row) => (
                    <TableRow key={row.group}>
                      <TableCell>{row.group}</TableCell>
                      <TableCell align="right">{row.count}</TableCell>
                      <TableCell align="right" sx={{ color: (row.averageAlpha ?? 0) >= 0 ? "success.main" : "error.main" }}>
                        {fmt(row.averageAlpha, 4)}%
                      </TableCell>
                      <TableCell align="right">{fmt(row.positiveAlphaRate)}%</TableCell>
                      <TableCell align="right">{fmt(row.averageSignalReturn, 4)}%</TableCell>
                      <TableCell align="right">{fmt(row.averageBenchmarkReturn, 4)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* F. Top winners / losers */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TopTable title="Top Alpha Winners" items={winners} />
        <TopTable title="Top Alpha Losers" items={losers} />
      </Stack>

      {/* G. Scheduler status */}
      {scheduler && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>Trạng thái scheduler hiện tại</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
              {!scheduler.captureEnabled && !scheduler.evaluateEnabled && jobSummary && jobSummary.totalJobs > 0
                ? "Scheduler hiện tại đang tắt, nhưng lịch sử job đã chạy vẫn được lưu trong DB."
                : "Scheduler đang tắt là trạng thái an toàn nếu chưa bật live collection."}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
              <Box>
                <Typography variant="caption" color="text.secondary">Capture</Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <StatusDot on={scheduler.captureEnabled} />
                  <Typography variant="body2">
                    {scheduler.captureEnabled ? "Bật" : "Tắt"}
                    {scheduler.captureDryRun ? " (dry-run)" : ""}
                    {scheduler.captureRequireConfirm ? " (cần xác nhận)" : ""}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Lần chạy cuối: {scheduler.lastCaptureRunAt ?? "chưa chạy"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Evaluate</Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <StatusDot on={scheduler.evaluateEnabled} />
                  <Typography variant="body2">
                    {scheduler.evaluateEnabled ? "Bật" : "Tắt"}
                    {scheduler.evaluateDryRun ? " (dry-run)" : ""}
                    {scheduler.evaluateRequireConfirm ? " (cần xác nhận)" : ""}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Lần chạy cuối: {scheduler.lastEvaluateRunAt ?? "chưa chạy"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Tổng số lần chạy</Typography>
                <Typography variant="body2">
                  Capture: {scheduler.totalCaptureRuns} · Evaluate: {scheduler.totalEvaluateRuns}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* H. Job history */}
      {jobSummary && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
              Nhật ký job đã lưu DB ({jobSummary.date})
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Dữ liệu job được lưu DB, không mất khi restart app.
            </Typography>
            {jobSummary.totalJobs === 0 ? (
              <Typography variant="body2" color="text.secondary">Chưa có job nào hôm nay.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Job</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Started at</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Inserted</TableCell>
                      <TableCell align="right">Duplicates</TableCell>
                      <TableCell align="right">Evaluated</TableCell>
                      <TableCell align="right">Failed</TableCell>
                      <TableCell align="right">Duration</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[jobSummary.captureLatest, jobSummary.evaluateLatest]
                      .filter((r): r is JobRunItem => r != null)
                      .map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.jobName}</TableCell>
                          <TableCell>{r.runType}</TableCell>
                          <TableCell>{r.startedAt ? new Date(r.startedAt).toLocaleTimeString("vi-VN") : "—"}</TableCell>
                          <TableCell>
                            <Chip
                              label={r.status}
                              size="small"
                              color={r.status === "SUCCESS" ? "success" : r.status === "FAILED" ? "error" : r.status === "DRY_RUN" ? "info" : "default"}
                            />
                          </TableCell>
                          <TableCell align="right">{r.insertedCount}</TableCell>
                          <TableCell align="right">{r.duplicateCount}</TableCell>
                          <TableCell align="right">{r.evaluatedCount}</TableCell>
                          <TableCell align="right">{r.failedCount}</TableCell>
                          <TableCell align="right">{r.durationMs != null ? `${(r.durationMs / 1000).toFixed(1)}s` : "—"}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {jobSummary.warnings.length > 0 && (
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {jobSummary.warnings.map((w, i) => (
                  <Typography key={i} variant="caption" color="warning.main">⚠ {w}</Typography>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 2 }}>
        Đây là tín hiệu mô phỏng — Không phải khuyến nghị đầu tư.
      </Typography>
    </Box>
  );
}

function TopTable({ title, items }: { title: string; items: AlphaTopItem[] }) {
  return (
    <Card sx={{ flex: 1 }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }} gutterBottom>{title}</Typography>
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Chưa có dữ liệu</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mã</TableCell>
                  <TableCell>Decision</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">Signal</TableCell>
                  <TableCell align="right">Benchmark</TableCell>
                  <TableCell align="right">Alpha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontWeight: 600 }}>{r.symbol}</TableCell>
                    <TableCell>{r.decision}</TableCell>
                    <TableCell align="right">{r.score != null ? fmt(r.score, 1) : "—"}</TableCell>
                    <TableCell align="right">{fmt(r.signalReturn, 2)}%</TableCell>
                    <TableCell align="right">{fmt(r.benchmarkReturn, 2)}%</TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, color: (r.alpha ?? 0) >= 0 ? "success.main" : "error.main" }}
                    >
                      {fmt(r.alpha, 2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

function StatusDot({ on }: { on: boolean }) {
  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        bgcolor: on ? "success.main" : "text.disabled",
      }}
    />
  );
}
