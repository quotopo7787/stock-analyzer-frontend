import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
import { stockApi } from "../api/stockApi";
import type { Stock } from "../types/stock";

export default function StockListPage() {
  const navigate = useNavigate();

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [keyword, setKeyword] = useState("");
  const [exchangeFilter, setExchangeFilter] = useState("ALL");
  const [industryFilter, setIndustryFilter] = useState("ALL");

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await stockApi.getAll();
      setStocks(data ?? []);
    } catch (err) {
      console.error(err);
      setErrorMessage("Không tải được danh sách cổ phiếu. Kiểm tra API /api/stocks hoặc CORS.");
    } finally {
      setLoading(false);
    }
  };

  const exchangeOptions = useMemo(() => {
    const values = stocks
      .map((stock) => stock.exchange)
      .filter((value): value is string => Boolean(value && value.trim()));

    return Array.from(new Set(values)).sort();
  }, [stocks]);

  const industryOptions = useMemo(() => {
    const values = stocks
      .map((stock) => stock.industry)
      .filter((value): value is string => Boolean(value && value.trim()));

    return Array.from(new Set(values)).sort();
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return stocks.filter((stock) => {
      const matchKeyword =
        !normalizedKeyword ||
        stock.code?.toLowerCase().includes(normalizedKeyword) ||
        stock.name?.toLowerCase().includes(normalizedKeyword);

      const matchExchange =
        exchangeFilter === "ALL" || stock.exchange === exchangeFilter;

      const matchIndustry =
        industryFilter === "ALL" || stock.industry === industryFilter;

      return matchKeyword && matchExchange && matchIndustry;
    });
  }, [stocks, keyword, exchangeFilter, industryFilter]);

  const clearFilters = () => {
    setKeyword("");
    setExchangeFilter("ALL");
    setIndustryFilter("ALL");
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Danh sách cổ phiếu
          </Typography>

          <Typography color="text.secondary">
            Tra cứu nhanh mã cổ phiếu, lọc theo sàn và ngành để đi tới màn phân tích chi tiết.
          </Typography>
        </Box>

        <Button variant="contained" onClick={loadStocks} disabled={loading}>
          {loading ? "Đang tải..." : "Tải lại"}
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Bộ lọc
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Tìm theo mã hoặc tên công ty"
              placeholder="VD: FPT, HPG, Hòa Phát..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Sàn giao dịch</InputLabel>
              <Select
                label="Sàn giao dịch"
                value={exchangeFilter}
                onChange={(e) => setExchangeFilter(e.target.value)}
              >
                <MenuItem value="ALL">Tất cả sàn</MenuItem>

                {exchangeOptions.map((exchange) => (
                  <MenuItem key={exchange} value={exchange}>
                    {exchange}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Ngành</InputLabel>
              <Select
                label="Ngành"
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
              >
                <MenuItem value="ALL">Tất cả ngành</MenuItem>

                {industryOptions.map((industry) => (
                  <MenuItem key={industry} value={industry}>
                    {industry}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={clearFilters}
              sx={{ minWidth: 130 }}
            >
              Xóa lọc
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
            spacing={1}
            sx={{ mb: 2 }}
          >
            <Typography variant="h6">
              Kết quả
            </Typography>

            <Typography color="text.secondary">
              Hiển thị {filteredStocks.length} / {stocks.length} mã cổ phiếu
            </Typography>
          </Stack>

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mã</TableCell>
                  <TableCell>Tên công ty</TableCell>
                  <TableCell>Sàn</TableCell>
                  <TableCell>Ngành</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredStocks.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell>
                      <strong>{stock.code}</strong>
                    </TableCell>

                    <TableCell>{stock.name}</TableCell>
                    <TableCell>{stock.exchange || "-"}</TableCell>
                    <TableCell>{stock.industry || "-"}</TableCell>

                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/stocks/${stock.code}`)}
                      >
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredStocks.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      Không tìm thấy cổ phiếu phù hợp với bộ lọc.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}