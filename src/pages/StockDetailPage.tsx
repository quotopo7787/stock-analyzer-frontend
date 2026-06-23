import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { snapshotApi } from "../api/snapshotApi";
import type { CompanySnapshotResponse } from "../types/snapshot";

const AUTO_LOAD_DEDUP_MS = 1200;
const recentAutoLoads = new Map<string, number>();

export default function StockDetailPage() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [stockCode, setStockCode] = useState(code ?? "");
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [snapshot, setSnapshot] = useState<CompanySnapshotResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadSnapshotFor = useCallback(async (targetStockCode: string, targetYear: number) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSnapshot(null);

      const normalizedStockCode = targetStockCode.trim().toUpperCase();

      if (!normalizedStockCode) {
        setErrorMessage("Bạn cần nhập mã cổ phiếu.");
        return;
      }

      if (!targetYear || targetYear < 2000) {
        setErrorMessage("Năm phân tích không hợp lệ.");
        return;
      }

      const data = await snapshotApi.getSnapshot(normalizedStockCode, targetYear);
      setSnapshot(data);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Không tải được snapshot. Kiểm tra API /api/company-snapshots/{stockCode}?year=... hoặc dữ liệu backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const routeStockCode = code?.trim().toUpperCase();
    if (!routeStockCode) return;

    setStockCode(routeStockCode);

    const key = `${routeStockCode}:${year}`;
    const lastLoadedAt = recentAutoLoads.get(key) ?? 0;
    const now = Date.now();
    if (now - lastLoadedAt < AUTO_LOAD_DEDUP_MS) return;
    recentAutoLoads.set(key, now);

    void loadSnapshotFor(routeStockCode, year);
  }, [code, loadSnapshotFor, year]);

  const loadSnapshot = () => {
    void loadSnapshotFor(stockCode, year);
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

  const translateDecision = (value?: string) => {
    if (!value) return "-";

    const upper = value.toUpperCase();

    if (upper === "PASS") return "Đạt";
    if (upper === "BUY") return "Có thể mua";
    if (upper === "REVIEW") return "Cần xem xét";
    if (upper === "AVOID") return "Tạm tránh";
    if (upper === "HOLD") return "Tiếp tục nắm giữ";
    if (upper === "SELL") return "Cân nhắc bán";

    return value;
  };

  const getDecisionColor = (value?: string) => {
    if (!value) return "default";

    const upper = value.toUpperCase();

    if (upper === "PASS" || upper.includes("BUY")) return "success";
    if (upper.includes("REVIEW") || upper.includes("HOLD")) return "warning";
    if (upper.includes("AVOID") || upper.includes("SELL")) return "error";

    return "default";
  };

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ mb: 3, justifyContent: "space-between", alignItems: "center" }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Chi tiết cổ phiếu
          </Typography>

          <Typography color="text.secondary">
            Xem toàn bộ snapshot gồm chỉ số phân tích, điểm chất lượng, hồ sơ doanh nghiệp và luận điểm đầu tư.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/valuation-scenarios?stockCode=${encodeURIComponent(stockCode.trim().toUpperCase())}`)}
            disabled={!stockCode.trim()}
          >
            Xem định giá
          </Button>
          <Button variant="outlined" onClick={() => navigate("/stocks")}>
            Quay lại danh sách
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Box>
              <TextField
                label="Mã cổ phiếu"
                fullWidth
                value={stockCode}
                onChange={(e) => setStockCode(e.target.value.toUpperCase())}
                helperText="Ví dụ: FPT, HPG, MWG"
              />
            </Box>

            <Box>
              <TextField
                label="Năm phân tích"
                type="number"
                fullWidth
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                helperText="Ví dụ: 2025"
              />
            </Box>

            <Box>
              <Button
                variant="contained"
                fullWidth
                sx={{ height: "56px" }}
                onClick={loadSnapshot}
                disabled={loading}
              >
                {loading ? "Đang tải..." : "Tải snapshot"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {loading && <CircularProgress />}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {snapshot && (
        <Stack spacing={3}>
          <CompanyOverviewCard snapshot={snapshot} />

          <AnalysisCard
            snapshot={snapshot}
            formatNumber={formatNumber}
            formatPercent={formatPercent}
            translateDecision={translateDecision}
            getDecisionColor={getDecisionColor}
          />

          <QualityScoreCard snapshot={snapshot} formatNumber={formatNumber} />

          <CompanyProfileCard snapshot={snapshot} />

          <InvestmentThesisCard snapshot={snapshot} />

          {snapshot.note && (
            <Alert severity="info">
              {snapshot.note}
            </Alert>
          )}
        </Stack>
      )}
    </Box>
  );
}

function CompanyOverviewCard({
  snapshot,
}: {
  snapshot: CompanySnapshotResponse;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Thông tin doanh nghiệp
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          <Box>
            <InfoItem label="Mã cổ phiếu" value={snapshot.stockCode} />
          </Box>

          <Box>
            <InfoItem label="Tên doanh nghiệp" value={snapshot.companyName} />
          </Box>

          <Box>
            <InfoItem label="Sàn giao dịch" value={snapshot.exchange} />
          </Box>

          <Box>
            <InfoItem label="Ngành" value={snapshot.industry} />
          </Box>

          <Box>
            <InfoItem label="Năm phân tích" value={String(snapshot.year)} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function AnalysisCard({
  snapshot,
  formatNumber,
  formatPercent,
  translateDecision,
  getDecisionColor,
}: {
  snapshot: CompanySnapshotResponse;
  formatNumber: (value?: number | null) => string;
  formatPercent: (value?: number | null) => string;
  translateDecision: (value?: string) => string;
  getDecisionColor: (value?: string) => "default" | "success" | "warning" | "error";
}) {
  const analysis = snapshot.analysis;

  if (!analysis) {
    return (
      <Alert severity="warning">
        Chưa có dữ liệu phân tích chỉ số cho mã này.
      </Alert>
    );
  }

  const items = [
    {
      label: "ROE",
      value: formatPercent(analysis.roe),
      note: "Hiệu quả sinh lời trên vốn chủ sở hữu",
    },
    {
      label: "ROA",
      value: formatPercent(analysis.roa),
      note: "Hiệu quả sinh lời trên tổng tài sản",
    },
    {
      label: "Biên lợi nhuận ròng",
      value: formatPercent(analysis.netProfitMargin),
      note: "Lợi nhuận sau thuế / doanh thu",
    },
    {
      label: "Nợ / Vốn chủ sở hữu",
      value: formatNumber(analysis.debtToEquity),
      note: "Mức sử dụng đòn bẩy tài chính",
    },
    {
      label: "CFO / Lợi nhuận",
      value: formatNumber(analysis.cfoToProfit),
      note: "Chất lượng lợi nhuận theo dòng tiền",
    },
    {
      label: "EPS",
      value: formatNumber(analysis.eps),
      note: "Lợi nhuận trên mỗi cổ phiếu",
    },
    {
      label: "P/E",
      value: formatNumber(analysis.pe),
      note: "Định giá theo lợi nhuận",
    },
    {
      label: "P/B",
      value: formatNumber(analysis.pb),
      note: "Định giá theo giá trị sổ sách",
    },
  ];

  return (
    <Card>
      <CardContent>
        <Stack
          direction="row"
          sx={{ mb: 2, justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="h6">
            Phân tích chỉ số
          </Typography>

          <Chip
            label={translateDecision(analysis.decision)}
            color={getDecisionColor(analysis.decision)}
          />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 2,
          }}
        >
          {items.map((item) => (
            <Card key={item.label} variant="outlined">
              <CardContent>
                <Typography color="text.secondary">
                  {item.label}
                </Typography>

                <Typography variant="h5">
                  {item.value}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {item.note}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">
            Điểm phân tích: {formatNumber(analysis.score)}
          </Typography>

          <Typography color="text.secondary">
            {analysis.summary}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function QualityScoreCard({
  snapshot,
  formatNumber,
}: {
  snapshot: CompanySnapshotResponse;
  formatNumber: (value?: number | null) => string;
}) {
  const quality = snapshot.qualityScore;

  if (!quality) {
    return (
      <Alert severity="warning">
        Chưa có điểm chất lượng cho mã này.
      </Alert>
    );
  }

  const items = [
    {
      label: "Tăng trưởng doanh thu",
      value: quality.revenueGrowthConsistency,
    },
    {
      label: "Tăng trưởng lợi nhuận",
      value: quality.profitGrowthConsistency,
    },
    {
      label: "Ổn định ROE",
      value: quality.roeConsistency,
    },
    {
      label: "Chất lượng dòng tiền",
      value: quality.cashFlowQuality,
    },
    {
      label: "Sức khỏe bảng cân đối",
      value: quality.balanceSheetQuality,
    },
    {
      label: "Ổn định biên lợi nhuận",
      value: quality.marginStability,
    },
    {
      label: "Pha loãng cổ phiếu",
      value: quality.shareDilutionScore,
    },
    {
      label: "Phân bổ vốn",
      value: quality.capitalAllocationScore,
    },
  ];

  return (
    <Card>
      <CardContent>
        <Stack
          direction="row"
          sx={{ mb: 2, justifyContent: "space-between", alignItems: "center" }}
        >
          <Box>
            <Typography variant="h6">
              Điểm chất lượng doanh nghiệp
            </Typography>

            <Typography color="text.secondary">
              Giai đoạn: {quality.fromYear} - {quality.toYear}, số năm dữ liệu: {quality.numberOfYears}
            </Typography>
          </Box>

          <Chip
            label={`Tổng điểm: ${formatNumber(quality.qualityScore)}`}
            color="primary"
          />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 2,
          }}
        >
          {items.map((item) => (
            <Card key={item.label} variant="outlined">
              <CardContent>
                <Typography color="text.secondary">
                  {item.label}
                </Typography>

                <Typography variant="h5">
                  {formatNumber(item.value)}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {quality.note && (
          <Typography sx={{ mt: 2 }} color="text.secondary">
            {quality.note}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function CompanyProfileCard({
  snapshot,
}: {
  snapshot: CompanySnapshotResponse;
}) {
  const profile = snapshot.companyProfile;

  if (!profile) {
    return (
      <Alert severity="warning">
        Chưa có hồ sơ doanh nghiệp cho mã này.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Hồ sơ doanh nghiệp
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          <InfoItem
            label="Mô hình kinh doanh"
            value={profile.businessModel}
            multiline
          />

          <InfoItem
            label="Khách hàng"
            value={profile.customers}
            multiline
          />

          <Box sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}>
            <InfoItem
              label="Lợi thế cạnh tranh"
              value={profile.competitiveAdvantage}
              multiline
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}>
            <InfoItem
              label="Rủi ro chính"
              value={profile.risks}
              multiline
            />
          </Box>

          <InfoItem
            label="Vị thế thị trường"
            value={profile.marketPosition}
            multiline
          />

          <InfoItem
            label="Đối thủ cạnh tranh"
            value={profile.competitors}
            multiline
          />

          <InfoItem
            label="Chất lượng ban lãnh đạo"
            value={profile.managementQuality}
            multiline
          />

          <InfoItem
            label="Khả năng phân bổ vốn"
            value={profile.allocationSkill}
            multiline
          />

          <Box sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}>
            <InfoItem
              label="Cơ cấu sở hữu"
              value={profile.ownershipStructure}
              multiline
            />
          </Box>

          <InfoItem
            label="Ngành phụ"
            value={profile.subIndustry}
          />

          <InfoItem
            label="Ngành chu kỳ"
            value={profile.cyclicalIndustry ? "Có" : "Không"}
          />

          <Box sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}>
            <InfoItem
              label="Ghi chú ban lãnh đạo"
              value={profile.managementNotes}
              multiline
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function InvestmentThesisCard({
  snapshot,
}: {
  snapshot: CompanySnapshotResponse;
}) {
  const thesis = snapshot.latestThesis;

  if (!thesis) {
    return (
      <Alert severity="warning">
        Chưa có luận điểm đầu tư cho mã này.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Luận điểm đầu tư mới nhất
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Typography sx={{ mb: 2, lineHeight: 1.7 }}>
          {thesis.summary}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          <Box>
            <ListBlock title="Luận điểm tích cực" items={thesis.bullCase} />
          </Box>

          <Box>
            <ListBlock title="Luận điểm tiêu cực" items={thesis.bearCase} />
          </Box>

          <Box>
            <ListBlock title="Động lực chính" items={thesis.keyDrivers} />
          </Box>

          <Box>
            <ListBlock title="Cờ đỏ rủi ro" items={thesis.redFlags} />
          </Box>

          <Box sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}>
            <ListBlock title="Câu hỏi cần nghiên cứu thêm" items={thesis.researchQuestions} />
          </Box>
        </Box>

        {thesis.disclaimer && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {thesis.disclaimer}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function InfoItem({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value?: string | null;
  multiline?: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        height: "100%",
        borderRadius: 2,
        backgroundColor: "#fafafa",
        boxSizing: "border-box",
        minWidth: 0,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mb: 0.75,
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          whiteSpace: multiline ? "pre-line" : "normal",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          lineHeight: 1.7,
        }}
      >
        {value || "-"}
      </Typography>
    </Paper>
  );
}

function ListBlock({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        height: "100%",
        borderRadius: 2,
        backgroundColor: "#fafafa",
      }}
    >
      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ fontWeight: 600 }}
      >
        {title}
      </Typography>

      {items && items.length > 0 ? (
        <Box component="ul" sx={{ pl: 2, mb: 0 }}>
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.7,
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                {item}
              </Typography>
            </li>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Chưa có dữ liệu.
        </Typography>
      )}
    </Paper>
  );
}
