import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SyncIcon from "@mui/icons-material/Sync";
import { adminSnapshotApi } from "../api/adminSnapshotApi";
import type { BatchJobRun, OpportunitySnapshotStatus } from "../types/adminSnapshot";

type BadgeColor = "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info";

export default function DataStatusPage() {
  const [status, setStatus] = useState<OpportunitySnapshotStatus | null>(null);
  const [latestJob, setLatestJob] = useState<BatchJobRun | null>(null);
  const [history, setHistory] = useState<BatchJobRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [recalculatingChanged, setRecalculatingChanged] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const warnings = useMemo(() => buildWarnings(status), [status]);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [nextStatus, nextLatestJob, nextHistory] = await Promise.all([
        adminSnapshotApi.getOpportunitySnapshotStatus(2023, 2025, 30),
        adminSnapshotApi.getLatestOpportunitySnapshotJob(),
        adminSnapshotApi.getOpportunitySnapshotJobHistory(20),
      ]);

      setStatus(nextStatus);
      setLatestJob(nextLatestJob);
      setHistory(nextHistory);
    } catch (error) {
      console.error(error);
      setErrorMessage("Không tải được trạng thái dữ liệu. Kiểm tra backend và các API admin snapshot.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStatus]);

  const recalculateOpportunities = async () => {
    const confirmed = window.confirm(
      "Bạn muốn refresh lại toàn bộ Opportunities Snapshot? Việc này có thể mất vài giây."
    );
    if (!confirmed) return;

    try {
      setRecalculating(true);
      setMessage("");
      setErrorMessage("");

      const response = await adminSnapshotApi.recalculateOpportunities();
      if (response.status === "SKIPPED") {
        setMessage(response.message ?? "Job refresh đã được bỏ qua.");
      } else {
        setMessage(`Đã refresh Opportunities Snapshot: ${formatNumber(response.processedCount, 0)} mã.`);
      }
      await loadStatus();
    } catch (error) {
      console.error(error);
      setErrorMessage("Refresh snapshot thất bại.");
    } finally {
      setRecalculating(false);
    }
  };

  const recalculateChangedOpportunities = async () => {
    try {
      setRecalculatingChanged(true);
      setMessage("");
      setErrorMessage("");

      const response = await adminSnapshotApi.recalculateChangedOpportunities(200);
      if (response.status === "SKIPPED") {
        setMessage(response.message ?? "Job refresh thay đổi đã được bỏ qua.");
      } else {
        const failedCount = response.failedCount ?? 0;
        const durationText = response.durationMs ? ` trong ${formatNumber(response.durationMs, 0)}ms` : "";
        setMessage(
          `Đã refresh phần thay đổi: ${formatNumber(response.processedCount, 0)} mã, lỗi ${formatNumber(
            failedCount,
            0
          )}${durationText}.`
        );
      }
      await loadStatus();
    } catch (error) {
      console.error(error);
      setErrorMessage("Refresh phần thay đổi thất bại.");
    } finally {
      setRecalculatingChanged(false);
    }
  };

  return (
    <Box sx={{ textAlign: "left" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 3, justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Trạng thái dữ liệu
          </Typography>
          <Typography color="text.secondary">
            Theo dõi snapshot Opportunities, lịch sử batch và refresh thủ công khi cần.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={loadStatus}
            disabled={loading || recalculating || recalculatingChanged}
          >
            Refresh trạng thái
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={recalculatingChanged ? <CircularProgress size={16} /> : <SyncIcon />}
            onClick={recalculateChangedOpportunities}
            disabled={loading || recalculating || recalculatingChanged}
          >
            Recalculate phần thay đổi
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={recalculating ? <CircularProgress size={16} /> : <SyncIcon />}
            onClick={recalculateOpportunities}
            disabled={loading || recalculating || recalculatingChanged}
          >
            Recalculate toàn bộ
          </Button>
        </Stack>
      </Stack>

      {(loading || recalculating || recalculatingChanged) && <LinearProgress sx={{ mb: 2 }} />}

      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>
          {message}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, mb: 2 }}
            >
              <Box>
                <Typography variant="h6">Opportunity Snapshots</Typography>
                <Typography variant="body2" color="text.secondary">
                  Phạm vi {status?.fromYear ?? 2023}-{status?.toYear ?? 2025}, giá gần đây{" "}
                  {status?.recentPriceDays ?? 30} ngày.
                </Typography>
              </Box>
              <Chip
                label={status?.latestJobStatus ? jobStatusLabel(status.latestJobStatus) : "Chưa có job"}
                color={jobStatusColor(status?.latestJobStatus)}
              />
            </Stack>

            {warnings.length > 0 && (
              <Stack spacing={1} sx={{ mb: 2 }}>
                {warnings.map((warning) => (
                  <Alert key={warning.message} severity={warning.severity}>
                    {warning.message}
                  </Alert>
                ))}
              </Stack>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 2,
              }}
            >
              <MetricCard label="Snapshot count" value={formatNumber(status?.snapshotCount, 0)} helper="Bản ghi snapshot" />
              <MetricCard label="Stock count" value={formatNumber(status?.stockCount, 0)} helper="Số mã riêng biệt" />
              <MetricCard label="Duplicate count" value={formatNumber(status?.duplicateCount, 0)} helper="Trùng stock/range" />
              <MetricCard label="Latest generated" value={formatDateTime(status?.latestGeneratedAt)} helper="Lần generate mới nhất" />
              <MetricCard label="Oldest generated" value={formatDateTime(status?.oldestGeneratedAt)} helper="Bản snapshot cũ nhất" />
              <MetricCard
                label="Latest job duration"
                value={formatDuration(latestJob?.durationMs)}
                helper={`${latestJob?.triggerType ?? "-"} · ${formatNumber(latestJob?.recordsProcessed, 0)} mã`}
              />
            </Box>

            {(latestJob?.reason || latestJob?.errorMessage) && (
              <Alert severity={latestJob.errorMessage ? "error" : "info"} sx={{ mt: 2 }}>
                {latestJob.errorMessage ?? latestJob.reason}
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">Source Data Freshness</Typography>
              <Typography variant="body2" color="text.secondary">
                Độ mới của dữ liệu nguồn so với snapshot hiện tại.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2, flexWrap: "wrap", rowGap: 1 }}>
              <Chip
                label={freshnessStatusLabel(status?.dataFreshnessStatus)}
                color={freshnessStatusColor(status?.dataFreshnessStatus)}
              />
              <Typography variant="body2" color="text.secondary">
                Nguồn mới nhất: {formatDateTime(status?.latestSourceUpdatedAt)}
              </Typography>
            </Stack>

            {status?.sourceFreshnessBreakdown && Object.keys(status.sourceFreshnessBreakdown).length > 0 && (
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 420 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nguồn dữ liệu</TableCell>
                      <TableCell>Cập nhật lần cuối</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(status.sourceFreshnessBreakdown).map(([source, updatedAt]) => (
                      <TableRow key={source}>
                        <TableCell>{sourceLabel(source)}</TableCell>
                        <TableCell>{formatDateTime(updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">Lịch sử job</Typography>
              <Typography variant="body2" color="text.secondary">
                20 lần chạy hoặc skip gần nhất của Opportunity Snapshot Refresh.
              </Typography>
            </Box>

            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 980 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Bắt đầu</TableCell>
                    <TableCell>Trigger</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Duration</TableCell>
                    <TableCell align="right">Records</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>{formatDateTime(job.startedAt)}</TableCell>
                      <TableCell>{triggerLabel(job.triggerType)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={jobStatusLabel(job.status)} color={jobStatusColor(job.status)} />
                      </TableCell>
                      <TableCell align="right">{formatDuration(job.durationMs)}</TableCell>
                      <TableCell align="right">{formatNumber(job.recordsProcessed, 0)}</TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>{job.reason ?? "-"}</TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>{job.errorMessage ?? "-"}</TableCell>
                    </TableRow>
                  ))}

                  {history.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>Chưa có job refresh nào.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ wordBreak: "break-word" }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

function buildWarnings(status: OpportunitySnapshotStatus | null) {
  if (!status) return [];
  const warnings: Array<{ severity: "warning" | "error"; message: string }> = [];

  if ((status.duplicateCount ?? 0) > 0) {
    warnings.push({
      severity: "error",
      message: "Có snapshot trùng. Cần kiểm tra unique stock/range.",
    });
  }
  if ((status.snapshotCount ?? 0) < (status.stockCount ?? 0)) {
    warnings.push({
      severity: "warning",
      message: "Snapshot chưa đủ số mã. Có thể cần recalculate.",
    });
  }
  if (status.latestJobStatus === "FAILED") {
    warnings.push({
      severity: "error",
      message: "Job refresh gần nhất thất bại.",
    });
  }
  if (isOlderThanOneDay(status.latestGeneratedAt)) {
    warnings.push({
      severity: "warning",
      message: "Snapshot đã cũ hơn 1 ngày.",
    });
  }
  if (status.isSourceNewerThanSnapshot) {
    warnings.push({
      severity: "warning",
      message: "Dữ liệu nguồn mới hơn snapshot. Hãy Recalculate để xem kết quả mới nhất.",
    });
  }

  return warnings;
}

function formatNumber(value?: number | null, maximumFractionDigits = 2) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return value.toLocaleString("vi-VN", { maximumFractionDigits });
}

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có thông tin";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(value?: number | null) {
  if (value === undefined || value === null) return "-";
  if (value < 1000) return `${formatNumber(value, 0)}ms`;
  return `${formatNumber(value / 1000, 1)}s`;
}

function isOlderThanOneDay(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() > 24 * 60 * 60 * 1000;
}

function jobStatusColor(status?: string | null): BadgeColor {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "error";
    case "SKIPPED":
      return "default";
    case "RUNNING":
      return "info";
    default:
      return "default";
  }
}

function jobStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    SUCCESS: "Thành công",
    FAILED: "Batch lỗi",
    SKIPPED: "Không cần refresh",
    RUNNING: "Đang chạy",
  };
  return status ? labels[status] ?? status : "-";
}

function triggerLabel(value?: string | null) {
  const labels: Record<string, string> = {
    MANUAL: "Thủ công",
    SCHEDULED: "Theo lịch",
  };
  return value ? labels[value] ?? value : "-";
}

function freshnessStatusLabel(status?: string | null) {
  switch (status) {
    case "FRESH":
      return "FRESH - Snapshot đang mới";
    case "SOURCE_NEWER_THAN_SNAPSHOT":
      return "STALE - Nguồn mới hơn snapshot";
    case "UNKNOWN_SOURCE_FRESHNESS":
      return "UNKNOWN - Chưa xác định";
    default:
      return status ?? "Chưa có thông tin";
  }
}

type BadgeFreshnessColor = "default" | "success" | "warning" | "error" | "info";

function freshnessStatusColor(status?: string | null): BadgeFreshnessColor {
  switch (status) {
    case "FRESH":
      return "success";
    case "SOURCE_NEWER_THAN_SNAPSHOT":
      return "warning";
    case "UNKNOWN_SOURCE_FRESHNESS":
      return "default";
    default:
      return "default";
  }
}

function sourceLabel(key: string) {
  const labels: Record<string, string> = {
    financialStatements: "Báo cáo tài chính",
    stockPrices: "Giá cổ phiếu",
    shareInfo: "Cổ phần lưu hành",
    companyProfiles: "Hồ sơ công ty",
    stocks: "Danh mục mã CK",
  };
  return labels[key] ?? key;
}
