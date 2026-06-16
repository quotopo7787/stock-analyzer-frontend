import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import { dataQualityApi, type DataQualityQuery } from "../api/dataQualityApi";
import type {
  DataQualitySummary,
  PriceSourceMismatch,
  ReferenceCoverage,
} from "../types/dataQuality";

const todayIso = new Date().toISOString().slice(0, 10);

export default function DataQualityPage() {
  const [query, setQuery] = useState<DataQualityQuery>({
    exchange: "HOSE",
    fromYear: 2023,
    toYear: 2025,
    recentPriceDays: 30,
    compareFromDate: "2024-01-01",
    compareToDate: todayIso,
  });
  const [referenceType, setReferenceType] = useState("ANY_MISSING");
  const [summary, setSummary] = useState<DataQualitySummary | null>(null);
  const [priceMismatches, setPriceMismatches] = useState<PriceSourceMismatch[]>([]);
  const [referenceCoverage, setReferenceCoverage] = useState<ReferenceCoverage[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const referenceSummary = useMemo(() => {
    if (!summary) return [];

    return [
      {
        label: "Overview",
        value: summary.stocksWithCompanyOverview,
        missing: summary.missingCompanyOverviewCount,
      },
      {
        label: "Cổ đông",
        value: summary.stocksWithShareholders,
        missing: summary.missingShareholdersCount,
      },
      {
        label: "Lãnh đạo",
        value: summary.stocksWithOfficers,
        missing: summary.missingOfficersCount,
      },
      {
        label: "Sự kiện",
        value: summary.stocksWithEvents,
        missing: summary.missingEventsCount,
      },
    ];
  }, [summary]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [nextSummary, nextPriceMismatches, nextReferenceCoverage] = await Promise.all([
        dataQualityApi.getSummary(query),
        dataQualityApi.getPriceMismatches(query, 100, 0),
        dataQualityApi.getReferenceCoverage(query.exchange ?? "", referenceType, 100, 0),
      ]);

      setSummary(nextSummary);
      setPriceMismatches(nextPriceMismatches);
      setReferenceCoverage(nextReferenceCoverage);
    } catch (error) {
      console.error(error);
      setErrorMessage("Không tải được dữ liệu chất lượng. Kiểm tra backend và endpoint /api/data-quality.");
    } finally {
      setLoading(false);
    }
  };

  const updateQuery = (field: keyof DataQualityQuery, value: string | number) => {
    setQuery((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatNumber = (value?: number | null, maximumFractionDigits = 2) => {
    if (value === undefined || value === null || Number.isNaN(value)) return "-";
    return value.toLocaleString("vi-VN", { maximumFractionDigits });
  };

  const formatMoney = (value?: number | null) => {
    if (value === undefined || value === null || Number.isNaN(value)) return "-";
    return value.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
  };

  const coveragePercent = (value?: number | null) => {
    if (!summary || !summary.totalStocks || value === undefined || value === null) return "-";
    return `${((value / summary.totalStocks) * 100).toFixed(1)}%`;
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
            Chất lượng dữ liệu
          </Typography>
          <Typography color="text.secondary">
            Kiểm tra độ phủ dữ liệu lõi, dữ liệu reference và so khớp giá VNDirect.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={loadData}
          disabled={loading}
        >
          Tải lại
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        {loading && <LinearProgress />}
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Sàn"
              value={query.exchange ?? ""}
              onChange={(event) => updateQuery("exchange", event.target.value)}
              sx={{ minWidth: { md: 130 } }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="HOSE">HOSE</MenuItem>
              <MenuItem value="HNX">HNX</MenuItem>
              <MenuItem value="UPCOM">UPCOM</MenuItem>
            </TextField>

            <TextField
              label="Từ năm BCTC"
              type="number"
              value={query.fromYear}
              onChange={(event) => updateQuery("fromYear", Number(event.target.value))}
              sx={{ minWidth: { md: 150 } }}
            />

            <TextField
              label="Đến năm BCTC"
              type="number"
              value={query.toYear}
              onChange={(event) => updateQuery("toYear", Number(event.target.value))}
              sx={{ minWidth: { md: 150 } }}
            />

            <TextField
              label="Giá gần đây"
              type="number"
              value={query.recentPriceDays}
              onChange={(event) => updateQuery("recentPriceDays", Number(event.target.value))}
              sx={{ minWidth: { md: 140 } }}
            />

            <TextField
              label="So giá từ ngày"
              type="date"
              value={query.compareFromDate}
              onChange={(event) => updateQuery("compareFromDate", event.target.value)}
              sx={{ minWidth: { md: 170 } }}
            />

            <TextField
              label="So giá đến ngày"
              type="date"
              value={query.compareToDate}
              onChange={(event) => updateQuery("compareToDate", event.target.value)}
              sx={{ minWidth: { md: 170 } }}
            />

            <TextField
              select
              label="Reference"
              value={referenceType}
              onChange={(event) => setReferenceType(event.target.value)}
              sx={{ minWidth: { md: 180 } }}
            >
              <MenuItem value="ANY_MISSING">Thiếu bất kỳ</MenuItem>
              <MenuItem value="OVERVIEW">Thiếu overview</MenuItem>
              <MenuItem value="SHAREHOLDERS">Thiếu cổ đông</MenuItem>
              <MenuItem value="OFFICERS">Thiếu lãnh đạo</MenuItem>
              <MenuItem value="EVENTS">Thiếu sự kiện</MenuItem>
              <MenuItem value="COMPLETE">Đã đủ</MenuItem>
            </TextField>

            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={loadData}
              disabled={loading || query.fromYear > query.toYear}
              sx={{ minWidth: 130 }}
            >
              Kiểm tra
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {summary && (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 2,
              mb: 3,
            }}
          >
            <MetricCard label="Tổng mã" value={formatNumber(summary.totalStocks, 0)} helper={query.exchange || "Tất cả"} />
            <MetricCard label="Đủ ranking" value={formatNumber(summary.stocksReadyForRanking, 0)} helper={coveragePercent(summary.stocksReadyForRanking)} />
            <MetricCard label="Đủ opportunity" value={formatNumber(summary.stocksReadyForOpportunity, 0)} helper={coveragePercent(summary.stocksReadyForOpportunity)} />
            <MetricCard label="Thiếu BCTC" value={formatNumber(summary.missingFullFinancialStatementCount, 0)} helper={`${summary.fromYear} - ${summary.toYear}`} />
            <MetricCard label="Thiếu shares" value={formatNumber(summary.missingShareInfoCount, 0)} helper="shares outstanding" />
            <MetricCard label="Thiếu giá" value={formatNumber(summary.missingRecentPriceCount, 0)} helper={`${summary.recentPriceDays} ngày`} />
            <MetricCard label="Thiếu ngành" value={formatNumber(summary.missingIndustryCount, 0)} helper="industry/profile" />
            <MetricCard label="Thiếu thanh khoản" value={formatNumber(summary.missingLiquidityCount, 0)} helper="volume/value" />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 2,
              mb: 3,
            }}
          >
            {referenceSummary.map((item) => (
              <MetricCard
                key={item.label}
                label={item.label}
                value={summary.companyReferenceTablesAvailable ? formatNumber(item.value, 0) : "-"}
                helper={summary.companyReferenceTablesAvailable ? `Thiếu ${formatNumber(item.missing, 0)} mã` : "Chưa có bảng"}
              />
            ))}
            <MetricCard
              label="VNDirect so khớp"
              value={summary.vndirectPriceTableAvailable ? formatNumber(summary.vndirectComparedRows, 0) : "-"}
              helper={summary.vndirectPriceTableAvailable ? `${formatNumber(summary.vndirectMismatchRows, 0)} dòng lệch` : "Chưa có bảng"}
            />
            <MetricCard
              label="Lệch giá đóng cửa"
              value={summary.vndirectPriceTableAvailable ? formatNumber(summary.vndirectClosePriceMismatchRows, 0) : "-"}
              helper={`${summary.compareFromDate} - ${summary.compareToDate}`}
            />
          </Box>
        </>
      )}

      <Stack spacing={3}>
        <PriceMismatchTable
          items={priceMismatches}
          formatNumber={formatNumber}
          formatMoney={formatMoney}
        />

        <ReferenceCoverageTable items={referenceCoverage} />
      </Stack>
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

function PriceMismatchTable({
  items,
  formatNumber,
  formatMoney,
}: {
  items: PriceSourceMismatch[];
  formatNumber: (value?: number | null, maximumFractionDigits?: number) => string;
  formatMoney: (value?: number | null) => string;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Lệch nguồn giá VNDirect
        </Typography>

        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow>
                <TableCell>Mã</TableCell>
                <TableCell>Ngày</TableCell>
                <TableCell>Lỗi</TableCell>
                <TableCell align="right">Giá app</TableCell>
                <TableCell align="right">Giá VNDirect</TableCell>
                <TableCell align="right">Chênh giá</TableCell>
                <TableCell align="right">Volume app</TableCell>
                <TableCell align="right">Volume VNDirect</TableCell>
                <TableCell align="right">GTGD app</TableCell>
                <TableCell align="right">GTGD VNDirect</TableCell>
                <TableCell align="right">Lệch GTGD</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {items.map((item) => (
                <TableRow key={`${item.stockCode}-${item.priceDate}`}>
                  <TableCell>{item.stockCode}</TableCell>
                  <TableCell>{item.priceDate}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                      {item.issues.map((issue) => (
                        <Chip key={issue} size="small" label={issue} color="warning" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{formatNumber(item.stockClosePrice)}</TableCell>
                  <TableCell align="right">{formatNumber(item.vndirectClosePrice)}</TableCell>
                  <TableCell align="right">{formatNumber(item.closePriceDiff)}</TableCell>
                  <TableCell align="right">{formatNumber(item.stockVolume, 0)}</TableCell>
                  <TableCell align="right">{formatNumber(item.vndirectVolume, 0)}</TableCell>
                  <TableCell align="right">{formatMoney(item.stockTradingValue)}</TableCell>
                  <TableCell align="right">{formatMoney(item.vndirectTradingValue)}</TableCell>
                  <TableCell align="right">{formatNumber(item.tradingValueDiffPercent)}%</TableCell>
                </TableRow>
              ))}

              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11}>
                    Không có dòng lệch trong khoảng so sánh.
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

function ReferenceCoverageTable({ items }: { items: ReferenceCoverage[] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Coverage dữ liệu doanh nghiệp
        </Typography>

        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>Mã</TableCell>
                <TableCell>Công ty</TableCell>
                <TableCell>Sàn</TableCell>
                <TableCell>Ngành</TableCell>
                <TableCell align="center">Overview</TableCell>
                <TableCell align="center">Cổ đông</TableCell>
                <TableCell align="center">Lãnh đạo</TableCell>
                <TableCell align="center">Sự kiện</TableCell>
                <TableCell>Thiếu</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {items.map((item) => (
                <TableRow key={item.stockCode}>
                  <TableCell>{item.stockCode}</TableCell>
                  <TableCell>{item.companyName}</TableCell>
                  <TableCell>{item.exchange}</TableCell>
                  <TableCell>{item.industry ?? "-"}</TableCell>
                  <BooleanCell value={item.hasCompanyOverview} />
                  <BooleanCell value={item.hasShareholders} />
                  <BooleanCell value={item.hasOfficers} />
                  <BooleanCell value={item.hasEvents} />
                  <TableCell>{item.missingReferenceReason}</TableCell>
                </TableRow>
              ))}

              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>
                    Không có mã trong nhóm reference đang chọn.
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

function BooleanCell({ value }: { value: boolean }) {
  return (
    <TableCell align="center">
      <Chip
        size="small"
        label={value ? "Có" : "Thiếu"}
        color={value ? "success" : "default"}
        variant={value ? "filled" : "outlined"}
      />
    </TableCell>
  );
}
