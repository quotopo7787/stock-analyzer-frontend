import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import { useNavigate } from "react-router-dom";
import { rankingApi } from "../api/rankingApi";
import type { RankingItem, RankingMeta, RankingSnapshotStatus } from "../types/ranking";

const currentYear = new Date().getFullYear();

export default function RankingPage() {
  const navigate = useNavigate();
  const didInitialLoad = useRef(false);

  const [fromYear, setFromYear] = useState(currentYear - 3);
  const [toYear, setToYear] = useState(currentYear - 1);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const [items, setItems] = useState<RankingItem[]>([]);
  const [meta, setMeta] = useState<RankingMeta>({ source: "UNKNOWN" });
  const [snapshotStatus, setSnapshotStatus] = useState<RankingSnapshotStatus | null>(null);
  const [statusWarning, setStatusWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshingSnapshot, setRefreshingSnapshot] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState("");

  const isInvalidRange = fromYear > toYear;
  const hasNextPage = meta.totalElements !== undefined
    ? (page + 1) * size < meta.totalElements
    : items.length === size;

  const summary = useMemo(() => {
    const validScores = items
      .map((item) => item.qualityScore)
      .filter((value): value is number => Number.isFinite(value));

    const validRoe = items
      .map((item) => item.averageRoe)
      .filter((value): value is number => Number.isFinite(value));

    const averageQuality =
      validScores.length === 0
        ? null
        : validScores.reduce((total, value) => total + value, 0) / validScores.length;

    const averageRoe =
      validRoe.length === 0
        ? null
        : validRoe.reduce((total, value) => total + value, 0) / validRoe.length;

    return {
      topCompany: items[0],
      averageQuality,
      averageRoe,
    };
  }, [items]);

  const loadRankings = useCallback(async (targetPage: number = page, targetSize: number = size) => {
    if (!fromYear || !toYear || fromYear > toYear) {
      setErrorMessage("Giai đoạn xếp hạng không hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const result = await rankingApi.getRankings(fromYear, toYear, targetPage, targetSize);

      setItems(result.items);
      setMeta(result.meta);
      setPage(targetPage);

      try {
        setSnapshotStatus(await rankingApi.getSnapshotStatus(fromYear, toYear));
        setStatusWarning("");
      } catch (statusError) {
        console.warn("Không tải được trạng thái Ranking Snapshot", statusError);
        setSnapshotStatus(null);
        setStatusWarning("Không tải được trạng thái chi tiết của Ranking Snapshot.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Không tải được dữ liệu xếp hạng. Kiểm tra backend, CORS hoặc endpoint /api/rankings."
      );
    } finally {
      setLoading(false);
    }
  }, [fromYear, page, size, toYear]);

  useEffect(() => {
    if (didInitialLoad.current) return;
    didInitialLoad.current = true;
    const timer = window.setTimeout(() => {
      void loadRankings(0);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRankings]);

  const formatNumber = (value?: number | null, maximumFractionDigits = 2) => {
    if (value === undefined || value === null || Number.isNaN(value)) return "-";

    return value.toLocaleString("vi-VN", {
      maximumFractionDigits,
    });
  };

  const formatPercent = (value?: number | null) => {
    if (value === undefined || value === null || Number.isNaN(value)) return "-";

    return `${value.toLocaleString("vi-VN", {
      maximumFractionDigits: 2,
    })}%`;
  };

  const getScoreColor = (score?: number | null) => {
    if (score === undefined || score === null) return "default";
    if (score >= 8) return "success";
    if (score >= 6) return "warning";
    return "error";
  };

  const getRankColor = (rank?: number | null) => {
    if (!rank) return "default";
    if (rank <= 3) return "success";
    if (rank <= 10) return "primary";
    return "default";
  };

  const handleSearch = () => {
    loadRankings(0);
  };

  const handleRefresh = () => {
    loadRankings(page);
  };

  const handleRefreshSnapshot = async () => {
    if (isInvalidRange) return;
    try {
      setRefreshingSnapshot(true);
      setErrorMessage("");
      const result = await rankingApi.refreshSnapshot(fromYear, toYear);
      setToast(
        `Đã làm mới ${formatNumber(result.snapshotCount, 0)} mã trong ${formatNumber(result.durationMs, 0)} ms.`
      );
      await loadRankings(0, size);
    } catch (err) {
      console.error(err);
      setErrorMessage("Không làm mới được Ranking Snapshot. Vui lòng thử lại sau.");
    } finally {
      setRefreshingSnapshot(false);
    }
  };

  const handleSizeChange = (nextSize: number) => {
    setSize(nextSize);
    loadRankings(0, nextSize);
  };

  const handlePreviousPage = () => {
    if (page <= 0) return;
    loadRankings(page - 1);
  };

  const handleNextPage = () => {
    if (!hasNextPage) return;
    loadRankings(page + 1);
  };

  return (
    <Box sx={{ textAlign: "left" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Xếp hạng doanh nghiệp
          </Typography>

          <Typography color="text.secondary">
            Lọc các doanh nghiệp đáng nghiên cứu theo tăng trưởng, ROE, dòng tiền,
            đòn bẩy và điểm chất lượng từ API ranking.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading || refreshingSnapshot}
          >
            Tải lại
          </Button>
          <Button
            variant="contained"
            startIcon={refreshingSnapshot ? <CircularProgress size={16} color="inherit" /> : <StorageOutlinedIcon />}
            onClick={() => void handleRefreshSnapshot()}
            disabled={loading || refreshingSnapshot || isInvalidRange}
          >
            Làm mới Snapshot
          </Button>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 2,
          mb: 3,
        }}
      >
        <MetricCard
          label="Kết quả trang này"
          value={formatNumber(items.length, 0)}
          helper={`Trang ${page + 1}`}
        />
        <MetricCard
          label="Dẫn đầu"
          value={summary.topCompany?.stockCode ?? "-"}
          helper={summary.topCompany?.companyName ?? "Chưa có dữ liệu"}
        />
        <MetricCard
          label="Điểm chất lượng TB"
          value={formatNumber(summary.averageQuality)}
          helper="Tính trên dữ liệu đang hiển thị"
        />
        <MetricCard
          label="ROE trung bình"
          value={formatPercent(summary.averageRoe)}
          helper={`${fromYear} - ${toYear}`}
        />
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ alignItems: { xs: "stretch", md: "flex-start" } }}
          >
            <TextField
              label="Từ năm"
              type="number"
              value={fromYear}
              onChange={(e) => setFromYear(Number(e.target.value))}
              error={isInvalidRange}
              helperText="Năm bắt đầu"
              sx={{ minWidth: { md: 150 } }}
            />

            <TextField
              label="Đến năm"
              type="number"
              value={toYear}
              onChange={(e) => setToYear(Number(e.target.value))}
              error={isInvalidRange}
              helperText={isInvalidRange ? "Phải lớn hơn hoặc bằng từ năm" : "Năm kết thúc"}
              sx={{ minWidth: { md: 150 } }}
            />

            <TextField
              select
              label="Số dòng"
              value={size}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              helperText="Kích thước trang"
              sx={{ minWidth: { md: 140 } }}
            >
              {[10, 20, 50, 100].map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading || isInvalidRange}
              sx={{ minWidth: 160, height: 56 }}
            >
              Xem xếp hạng
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <RankingStatusBar
        meta={meta}
        status={snapshotStatus}
        fromYear={fromYear}
        toYear={toYear}
        fallbackTotal={items.length}
        warning={statusWarning}
      />

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Card>
        {loading && <LinearProgress />}

        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            sx={{
              mb: 2,
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
            }}
          >
            <Box>
              <Typography variant="h6">Danh sách xếp hạng</Typography>
              <Typography variant="body2" color="text.secondary">
                API: GET /api/rankings?fromYear={fromYear}&toYear={toYear}&page={page}&size={size}
              </Typography>
            </Box>

            <Typography color="text.secondary">
              Hiển thị {items.length} mã cổ phiếu
            </Typography>
          </Stack>

          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 1160 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Hạng</TableCell>
                  <TableCell>Mã</TableCell>
                  <TableCell>Công ty</TableCell>
                  <TableCell>Giai đoạn</TableCell>
                  <TableCell align="right">Số năm</TableCell>
                  <TableCell align="right">Doanh thu</TableCell>
                  <TableCell align="right">Lợi nhuận</TableCell>
                  <TableCell align="right">ROE TB</TableCell>
                  <TableCell align="right">Nợ/VCSH TB</TableCell>
                  <TableCell align="right">CFO/LNST TB</TableCell>
                  <TableCell align="center">Chất lượng</TableCell>
                  <TableCell>Ghi chú</TableCell>
                  <TableCell align="center">Chi tiết</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={`${item.rank}-${item.stockCode}`}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate(`/stocks/${item.stockCode}`)}
                  >
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.rank ?? "-"}
                        color={getRankColor(item.rank)}
                        variant={item.rank && item.rank <= 10 ? "filled" : "outlined"}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ fontWeight: 700 }}>{item.stockCode}</Typography>
                    </TableCell>

                    <TableCell sx={{ minWidth: 180 }}>{item.companyName}</TableCell>

                    <TableCell>
                      {item.fromYear} - {item.toYear}
                    </TableCell>

                    <TableCell align="right">{formatNumber(item.numberOfYears, 0)}</TableCell>
                    <TableCell align="right">{formatPercent(item.revenueGrowthRate)}</TableCell>
                    <TableCell align="right">{formatPercent(item.profitGrowthRate)}</TableCell>
                    <TableCell align="right">{formatPercent(item.averageRoe)}</TableCell>
                    <TableCell align="right">{formatNumber(item.averageDebtToEquity)}</TableCell>
                    <TableCell align="right">{formatNumber(item.averageCfoToProfit)}</TableCell>

                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={formatNumber(item.qualityScore)}
                        color={getScoreColor(item.qualityScore)}
                      />
                    </TableCell>

                    <TableCell sx={{ minWidth: 220 }}>{item.note || "-"}</TableCell>

                    <TableCell align="center">
                      <Tooltip title={`Mở ${item.stockCode}`}>
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/stocks/${item.stockCode}`);
                          }}
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}

                {items.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={13}>
                      <Box sx={{ py: 5, textAlign: "center" }}>
                        <Typography variant="h6">Chưa có dữ liệu xếp hạng</Typography>
                        <Typography color="text.secondary">
                          Hãy đổi khoảng năm hoặc kiểm tra dữ liệu backend cho endpoint ranking.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              mt: 2,
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <Tooltip title="Trang trước">
              <span>
                <IconButton onClick={handlePreviousPage} disabled={page <= 0 || loading}>
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Typography sx={{ minWidth: 86, textAlign: "center" }}>Trang {page + 1}</Typography>

            <Tooltip title="Trang sau">
              <span>
                <IconButton onClick={handleNextPage} disabled={!hasNextPage || loading}>
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={6000}
        onClose={() => setToast("")}
        message={toast}
      />
    </Box>
  );
}

function RankingStatusBar({
  meta,
  status,
  fromYear,
  toYear,
  fallbackTotal,
  warning,
}: {
  meta: RankingMeta;
  status: RankingSnapshotStatus | null;
  fromYear: number;
  toYear: number;
  fallbackTotal: number;
  warning: string;
}) {
  const sourceLabel = meta.source === "SNAPSHOT"
    ? "Snapshot"
    : meta.source === "REALTIME"
      ? "Realtime"
      : "Không rõ";
  const generatedAt = meta.snapshotGeneratedAt ?? status?.latestGeneratedAt;
  const total = meta.totalElements ?? status?.snapshotCount ?? fallbackTotal;

  return (
    <Paper
      variant="outlined"
      sx={{ mb: 3, p: 1.5, borderColor: meta.source === "REALTIME" ? "warning.main" : "divider" }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between" }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
          <StorageOutlinedIcon color={meta.source === "REALTIME" ? "warning" : "primary"} fontSize="small" />
          <Typography variant="body2">
            Đang dùng <strong>{sourceLabel}</strong>
            {" · "}Cập nhật {formatDateTime(generatedAt)}
            {" · "}{formatInteger(total)} mã
            {" · "}Giai đoạn {fromYear}–{toYear}
          </Typography>
          {status && (
            <>
              <Chip
                size="small"
                label={status.dataFreshnessStatus === "FRESH" ? "Dữ liệu mới" : status.dataFreshnessStatus}
                color={status.dataFreshnessStatus === "FRESH" ? "success" : "warning"}
                variant="outlined"
              />
              <Tooltip title="Số bản ghi trùng trong snapshot">
                <Chip
                  size="small"
                  label={`Trùng: ${formatInteger(status.duplicateCount)}`}
                  color={status.duplicateCount === 0 ? "success" : "error"}
                  variant="outlined"
                />
              </Tooltip>
            </>
          )}
        </Stack>
        <Typography variant="caption" color={meta.source === "REALTIME" ? "warning.main" : "text.secondary"}>
          {meta.source === "REALTIME"
            ? "Đang dùng dữ liệu realtime vì snapshot chưa có hoặc chưa sẵn sàng."
            : meta.source === "SNAPSHOT"
              ? "Dữ liệu ranking đang dùng snapshot để tải nhanh hơn."
              : "Không rõ nguồn dữ liệu ranking."}
        </Typography>
      </Stack>
      {warning && (
        <Typography variant="caption" color="warning.main" sx={{ display: "block", mt: 0.75 }}>
          {warning}
        </Typography>
      )}
    </Paper>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
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

function formatInteger(value?: number | null) {
  return value === undefined || value === null ? "-" : value.toLocaleString("vi-VN");
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card>
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
