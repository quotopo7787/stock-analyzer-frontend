import { useEffect, useMemo, useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { rankingApi } from "../api/rankingApi";
import type { RankingItem } from "../types/ranking";

const currentYear = new Date().getFullYear();

export default function RankingPage() {
  const navigate = useNavigate();

  const [fromYear, setFromYear] = useState(currentYear - 3);
  const [toYear, setToYear] = useState(currentYear - 1);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isInvalidRange = fromYear > toYear;
  const hasNextPage = items.length === size;

  useEffect(() => {
    loadRankings(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const loadRankings = async (targetPage: number = page, targetSize: number = size) => {
    if (!fromYear || !toYear || fromYear > toYear) {
      setErrorMessage("Giai đoạn xếp hạng không hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const data = await rankingApi.getRankings(fromYear, toYear, targetPage, targetSize);

      setItems(data ?? []);
      setPage(targetPage);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Không tải được dữ liệu xếp hạng. Kiểm tra backend, CORS hoặc endpoint /api/rankings."
      );
    } finally {
      setLoading(false);
    }
  };

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

        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Tải lại
        </Button>
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
    </Box>
  );
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
