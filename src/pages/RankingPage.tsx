import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { rankingApi } from "../api/rankingApi";
import type { RankingItem } from "../types/ranking";

export default function RankingPage() {
  const navigate = useNavigate();

  const [fromYear, setFromYear] = useState(new Date().getFullYear() - 2);
  const [toYear, setToYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(0);
  const [size] = useState(20);

  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadRankings(0);
  }, []);

  const loadRankings = async (targetPage: number = page) => {
    try {
      setLoading(true);
      setErrorMessage("");

      if (!fromYear || !toYear || fromYear > toYear) {
        setErrorMessage("Giai đoạn xếp hạng không hợp lệ.");
        return;
      }

      const data = await rankingApi.getRankings(fromYear, toYear, targetPage, size);

      setItems(data ?? []);
      setPage(targetPage);
    } catch (err) {
      console.error(err);
      setErrorMessage("Không tải được dữ liệu xếp hạng. Kiểm tra API /api/rankings.");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value?: number | null) => {
    if (value === undefined || value === null) return "-";
    return value.toLocaleString("vi-VN", {
      maximumFractionDigits: 2,
    });
  };

  const formatPercent = (value?: number | null) => {
    if (value === undefined || value === null) return "-";
    return `${value.toLocaleString("vi-VN", {
      maximumFractionDigits: 2,
    })}%`;
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined || score === null) return "default";
    if (score >= 8) return "success";
    if (score >= 6) return "warning";
    return "error";
  };

  const handleSearch = () => {
    loadRankings(0);
  };

  const handlePreviousPage = () => {
    if (page <= 0) return;
    loadRankings(page - 1);
  };

  const handleNextPage = () => {
    if (items.length < size) return;
    loadRankings(page + 1);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Xếp hạng doanh nghiệp
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Màn này dùng để lọc ra các doanh nghiệp đáng nghiên cứu dựa trên tăng trưởng, ROE,
        dòng tiền, đòn bẩy và điểm chất lượng.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Từ năm"
              type="number"
              value={fromYear}
              onChange={(e) => setFromYear(Number(e.target.value))}
              helperText="Ví dụ: 2023"
            />

            <TextField
              label="Đến năm"
              type="number"
              value={toYear}
              onChange={(e) => setToYear(Number(e.target.value))}
              helperText="Ví dụ: 2025"
            />

            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              sx={{ minWidth: 160, height: 56 }}
            >
              {loading ? "Đang tải..." : "Tải xếp hạng"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {loading && <CircularProgress />}

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            sx={{ mb: 2 }}
            spacing={1}
          >
            <Typography variant="h6">
              Danh sách xếp hạng
            </Typography>

            <Typography color="text.secondary">
              Trang hiện tại: {page + 1} · Số kết quả trên trang: {items.length}
            </Typography>
          </Stack>

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Hạng</TableCell>
                  <TableCell>Mã</TableCell>
                  <TableCell>Công ty</TableCell>
                  <TableCell>Giai đoạn</TableCell>
                  <TableCell>Số năm</TableCell>
                  <TableCell>Tăng trưởng doanh thu</TableCell>
                  <TableCell>Tăng trưởng lợi nhuận</TableCell>
                  <TableCell>ROE TB</TableCell>
                  <TableCell>Nợ/VCSH TB</TableCell>
                  <TableCell>CFO/LNST TB</TableCell>
                  <TableCell>Điểm chất lượng</TableCell>
                  <TableCell>Ghi chú</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {items.map((item) => (
                  <TableRow key={`${item.rank}-${item.stockCode}`}>
                    <TableCell>{item.rank}</TableCell>

                    <TableCell>
                      <strong>{item.stockCode}</strong>
                    </TableCell>

                    <TableCell>{item.companyName}</TableCell>

                    <TableCell>
                      {item.fromYear} - {item.toYear}
                    </TableCell>

                    <TableCell>{item.numberOfYears}</TableCell>

                    <TableCell>{formatPercent(item.revenueGrowthRate)}</TableCell>
                    <TableCell>{formatPercent(item.profitGrowthRate)}</TableCell>
                    <TableCell>{formatPercent(item.averageRoe)}</TableCell>
                    <TableCell>{formatNumber(item.averageDebtToEquity)}</TableCell>
                    <TableCell>{formatNumber(item.averageCfoToProfit)}</TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={formatNumber(item.qualityScore)}
                        color={getScoreColor(item.qualityScore)}
                      />
                    </TableCell>

                    <TableCell>{item.note ?? "-"}</TableCell>

                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/stocks/${item.stockCode}`)}
                      >
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {items.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={13}>
                      Chưa có dữ liệu xếp hạng.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>

          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={handlePreviousPage}
              disabled={page <= 0 || loading}
            >
              Trang trước
            </Button>

            <Typography sx={{ display: "flex", alignItems: "center" }}>
              Trang {page + 1}
            </Typography>

            <Button
              variant="outlined"
              onClick={handleNextPage}
              disabled={items.length < size || loading}
            >
              Trang sau
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}