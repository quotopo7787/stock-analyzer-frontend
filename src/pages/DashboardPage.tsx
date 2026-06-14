import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { dashboardApi } from "../api/dashboardApi";
import type {
  ActionQueueItem,
  DashboardSummary,
  OpportunityItem,
  RadarItem,
  RankingItem,
  RiskRadarItem,
} from "../types/dashboard";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await dashboardApi.getDashboard();
      setDashboard(data);
    } catch (err) {
      console.error(err);
      setError("Không tải được dữ liệu tổng quan. Kiểm tra API /api/dashboard hoặc cấu hình CORS.");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value?: number) => {
    if (value === undefined || value === null) return "-";
    return value.toLocaleString("vi-VN");
  };

  const formatPercent = (value?: number) => {
    if (value === undefined || value === null) return "-";
    return `${value.toFixed(2)}%`;
  };

  const translateDecision = (value?: string) => {
    if (!value) return "-";

    const upper = value.toUpperCase();

    if (upper === "BUY") return "Có thể mua";
    if (upper === "REVIEW") return "Cần xem xét";
    if (upper === "AVOID") return "Tạm tránh";
    if (upper === "WATCHING") return "Đang theo dõi";
    if (upper === "RESEARCH_NOW") return "Nghiên cứu ngay";
    if (upper === "HOLD") return "Tiếp tục nắm giữ";
    if (upper === "SELL") return "Cân nhắc bán";
    if (upper === "STRONG_BUY") return "Ưu tiên mua";
    if (upper === "WAIT") return "Chờ thêm";
    if (upper === "AVOID_FOR_NOW") return "Tạm thời tránh";

    return value;
  };

  const translateStatus = (value?: string) => {
    if (!value) return "-";

    const upper = value.toUpperCase();

    if (upper === "WATCHING") return "Đang theo dõi";
    if (upper === "HOLDING") return "Đang nắm giữ";
    if (upper === "SOLD") return "Đã bán";
    if (upper === "REVIEW") return "Cần xem lại";

    return value;
  };

  const translatePriority = (value?: string) => {
    if (!value) return "-";

    const upper = value.toUpperCase();

    if (upper === "HIGH") return "Cao";
    if (upper === "MEDIUM") return "Trung bình";
    if (upper === "LOW") return "Thấp";
    if (upper === "URGENT") return "Khẩn cấp";

    return value;
  };

  const translateSeverity = (value?: string) => {
    if (!value) return "-";

    const upper = value.toUpperCase();

    if (upper === "HIGH") return "Cao";
    if (upper === "MEDIUM") return "Trung bình";
    if (upper === "LOW") return "Thấp";
    if (upper === "CRITICAL") return "Nghiêm trọng";

    return value;
  };

  const translateOpportunityType = (value?: string) => {
    if (!value) return "-";

    const upper = value.toUpperCase();

    if (upper === "DEEP_VALUE") return "Giá trị sâu";
    if (upper === "QUALITY_COMPOUNDER") return "Doanh nghiệp chất lượng";
    if (upper === "CYCLICAL_RECOVERY") return "Phục hồi chu kỳ";
    if (upper === "BALANCED_OPPORTUNITY") return "Cơ hội cân bằng";
    if (upper === "VALUE_TRAP") return "Bẫy giá trị";

    return value;
  };

  const getDecisionColor = (decision?: string) => {
    if (!decision) return "default";

    const upper = decision.toUpperCase();

    if (
      upper.includes("BUY") ||
      upper.includes("RESEARCH") ||
      upper.includes("WATCH")
    ) {
      return "success";
    }

    if (
      upper.includes("REVIEW") ||
      upper.includes("HOLD") ||
      upper.includes("WAIT")
    ) {
      return "warning";
    }

    if (
      upper.includes("AVOID") ||
      upper.includes("SELL")
    ) {
      return "error";
    }

    return "default";
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Tổng quan
          </Typography>

          <Typography color="text.secondary">
            Trung tâm điều khiển dữ liệu, cơ hội đầu tư, rủi ro và các việc cần xử lý.
          </Typography>
        </Box>

        <Button variant="contained" onClick={loadDashboard}>
          Tải lại
        </Button>
      </Stack>

      {loading && <CircularProgress />}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {dashboard && (
        <Box>
          <SummaryCards dashboard={dashboard} />

          <Box sx={{ mt: 3 }}>
            <DataCoverageCards dashboard={dashboard} />
          </Box>

          <Box sx={{ mt: 3 }}>
            <TopOpportunitiesTable
              title="Top cơ hội đáng nghiên cứu"
              items={dashboard.opportunityRadar?.topOpportunities ?? []}
              formatNumber={formatNumber}
              formatPercent={formatPercent}
              getDecisionColor={getDecisionColor}
              translateDecision={translateDecision}
              translateOpportunityType={translateOpportunityType}
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <TopOpportunitiesTable
              title="Cần nghiên cứu ngay"
              items={dashboard.opportunityRadar?.researchNow ?? []}
              formatNumber={formatNumber}
              formatPercent={formatPercent}
              getDecisionColor={getDecisionColor}
              translateDecision={translateDecision}
              translateOpportunityType={translateOpportunityType}
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <TopRankingsTable
              items={dashboard.topRankings ?? []}
              formatPercent={formatPercent}
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <RadarTable
              title="Radar danh sách theo dõi"
              items={dashboard.watchlistRadar ?? []}
              formatNumber={formatNumber}
              formatPercent={formatPercent}
              getDecisionColor={getDecisionColor}
              translateDecision={translateDecision}
              translateStatus={translateStatus}
              translateOpportunityType={translateOpportunityType}
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <RadarTable
              title="Radar danh mục đang nắm giữ"
              items={dashboard.holdingRadar ?? []}
              formatNumber={formatNumber}
              formatPercent={formatPercent}
              getDecisionColor={getDecisionColor}
              translateDecision={translateDecision}
              translateStatus={translateStatus}
              translateOpportunityType={translateOpportunityType}
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <RiskRadarTable
              items={dashboard.riskRadar ?? []}
              translateSeverity={translateSeverity}
              translateOpportunityType={translateOpportunityType}
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <ActionQueueTable
              items={dashboard.actionQueue ?? []}
              translatePriority={translatePriority}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}

function SummaryCards({ dashboard }: { dashboard: DashboardSummary }) {
  const cards = [
    {
      label: "Cổ phiếu",
      value: dashboard.totalStocks,
      description: "Tổng số mã cổ phiếu",
    },
    {
      label: "Báo cáo tài chính",
      value: dashboard.totalFinancialStatements,
      description: "Tổng số BCTC đã có",
    },
    {
      label: "Hồ sơ doanh nghiệp",
      value: dashboard.totalCompanyProfiles,
      description: "Tổng số hồ sơ doanh nghiệp",
    },
    {
      label: "Luận điểm đầu tư",
      value: dashboard.totalThesis,
      description: "Tổng số luận điểm đã tạo",
    },
    {
      label: "Điểm chất lượng",
      value: dashboard.totalQualityScores,
      description: "Tổng số điểm chất lượng",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 2,
      }}
    >
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              {card.label}
            </Typography>

            <Typography variant="h4">
              {card.value ?? 0}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {card.description}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

function DataCoverageCards({ dashboard }: { dashboard: DashboardSummary }) {
  const dataCoverage = dashboard.dataCoverage;

  if (!dataCoverage) {
    return null;
  }

  const cards = [
    {
      label: "Vũ trụ cơ hội",
      value: dataCoverage.opportunityUniverseCount,
    },
    {
      label: "Cần nghiên cứu ngay",
      value: dataCoverage.researchNowCount,
    },
    {
      label: "Đang theo dõi",
      value: dataCoverage.watchlistCount,
    },
    {
      label: "Cần xem lại",
      value: dataCoverage.reviewCount,
    },
    {
      label: "Tạm tránh",
      value: dataCoverage.avoidForNowCount,
    },
    {
      label: "Thiếu ngành",
      value: dataCoverage.missingIndustryCount,
    },
    {
      label: "Giá trị sâu",
      value: dataCoverage.deepValueCount,
    },
    {
      label: "Doanh nghiệp chất lượng",
      value: dataCoverage.qualityCompounderCount,
    },
    {
      label: "Phục hồi chu kỳ",
      value: dataCoverage.cyclicalRecoveryCount,
    },
    {
      label: "Cơ hội cân bằng",
      value: dataCoverage.balancedOpportunityCount,
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Độ phủ dữ liệu
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 2,
          }}
        >
          {cards.map((card) => (
            <Box key={card.label}>
              <Typography variant="body2" color="text.secondary">
                {card.label}
              </Typography>

              <Typography variant="h6">
                {card.value ?? 0}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

function TopOpportunitiesTable({
  title,
  items,
  formatNumber,
  formatPercent,
  getDecisionColor,
  translateDecision,
  translateOpportunityType,
}: {
  title: string;
  items: OpportunityItem[];
  formatNumber: (value?: number) => string;
  formatPercent: (value?: number) => string;
  getDecisionColor: (decision?: string) => "default" | "success" | "warning" | "error";
  translateDecision: (value?: string) => string;
  translateOpportunityType: (value?: string) => string;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Mã</TableCell>
              <TableCell>Tên doanh nghiệp</TableCell>
              <TableCell>Ngành</TableCell>
              <TableCell>Loại cơ hội</TableCell>
              <TableCell>Giá hiện tại</TableCell>
              <TableCell>Điểm tổng</TableCell>
              <TableCell>Điểm chất lượng</TableCell>
              <TableCell>P/E</TableCell>
              <TableCell>P/B</TableCell>
              <TableCell>ROE TB</TableCell>
              <TableCell>Kết luận</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.map((item) => (
              <TableRow key={`${title}-${item.code}`}>
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.industry ?? "-"}</TableCell>
                <TableCell>{translateOpportunityType(item.opportunityType)}</TableCell>
                <TableCell>{formatNumber(item.latestPrice)}</TableCell>
                <TableCell>{formatNumber(item.finalScore)}</TableCell>
                <TableCell>{formatNumber(item.qualityScore)}</TableCell>
                <TableCell>{formatNumber(item.pe)}</TableCell>
                <TableCell>{formatNumber(item.pb)}</TableCell>
                <TableCell>{formatPercent(item.averageRoe)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={translateDecision(item.decision)}
                    color={getDecisionColor(item.decision)}
                  />
                </TableCell>
              </TableRow>
            ))}

            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={11}>
                  Chưa có dữ liệu cơ hội.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TopRankingsTable({
  items,
  formatPercent,
}: {
  items: RankingItem[];
  formatPercent: (value?: number) => string;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Top xếp hạng
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Hạng</TableCell>
              <TableCell>Mã</TableCell>
              <TableCell>Công ty</TableCell>
              <TableCell>Giai đoạn</TableCell>
              <TableCell>Tăng trưởng doanh thu</TableCell>
              <TableCell>Tăng trưởng lợi nhuận</TableCell>
              <TableCell>ROE trung bình</TableCell>
              <TableCell>Điểm chất lượng</TableCell>
              <TableCell>Ghi chú</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.map((item) => (
              <TableRow key={`${item.rank}-${item.stockCode}`}>
                <TableCell>{item.rank}</TableCell>
                <TableCell>{item.stockCode}</TableCell>
                <TableCell>{item.companyName}</TableCell>
                <TableCell>
                  {item.fromYear} - {item.toYear}
                </TableCell>
                <TableCell>{formatPercent(item.revenueGrowthRate)}</TableCell>
                <TableCell>{formatPercent(item.profitGrowthRate)}</TableCell>
                <TableCell>{formatPercent(item.averageRoe)}</TableCell>
                <TableCell>{item.qualityScore}</TableCell>
                <TableCell>{item.note ?? "-"}</TableCell>
              </TableRow>
            ))}

            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  Chưa có dữ liệu xếp hạng.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RadarTable({
  title,
  items,
  formatNumber,
  formatPercent,
  getDecisionColor,
  translateDecision,
  translateStatus,
  translateOpportunityType,
}: {
  title: string;
  items: RadarItem[];
  formatNumber: (value?: number) => string;
  formatPercent: (value?: number) => string;
  getDecisionColor: (decision?: string) => "default" | "success" | "warning" | "error";
  translateDecision: (value?: string) => string;
  translateStatus: (value?: string) => string;
  translateOpportunityType: (value?: string) => string;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Mã</TableCell>
              <TableCell>Công ty</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Loại cơ hội</TableCell>
              <TableCell>Giá hiện tại</TableCell>
              <TableCell>Giá mua mục tiêu</TableCell>
              <TableCell>Giá bán mục tiêu</TableCell>
              <TableCell>Biến động 7 ngày</TableCell>
              <TableCell>Biến động 30 ngày</TableCell>
              <TableCell>Điểm tổng</TableCell>
              <TableCell>Kết luận</TableCell>
              <TableCell>Lý do</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.map((item) => (
              <TableRow key={`${title}-${item.stockCode}`}>
                <TableCell>{item.stockCode}</TableCell>
                <TableCell>{item.companyName}</TableCell>
                <TableCell>{translateStatus(item.status)}</TableCell>
                <TableCell>{translateOpportunityType(item.opportunityType)}</TableCell>
                <TableCell>{formatNumber(item.latestPrice)}</TableCell>
                <TableCell>{formatNumber(item.targetBuyPrice)}</TableCell>
                <TableCell>{formatNumber(item.targetSellPrice)}</TableCell>
                <TableCell>{formatPercent(item.priceChange7D)}</TableCell>
                <TableCell>{formatPercent(item.priceChange30D)}</TableCell>
                <TableCell>{formatNumber(item.finalScore)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={translateDecision(item.decision)}
                    color={getDecisionColor(item.decision)}
                  />
                </TableCell>
                <TableCell>{item.reason ?? "-"}</TableCell>
              </TableRow>
            ))}

            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={12}>
                  Chưa có dữ liệu radar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RiskRadarTable({
  items,
  translateSeverity,
  translateOpportunityType,
}: {
  items: RiskRadarItem[];
  translateSeverity: (value?: string) => string;
  translateOpportunityType: (value?: string) => string;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Radar rủi ro
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Mã</TableCell>
              <TableCell>Công ty</TableCell>
              <TableCell>Loại rủi ro</TableCell>
              <TableCell>Mức độ</TableCell>
              <TableCell>Loại cơ hội</TableCell>
              <TableCell>Nội dung cảnh báo</TableCell>
              <TableCell>Hành động gợi ý</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.map((item) => (
              <TableRow key={`${item.stockCode}-${item.riskType}`}>
                <TableCell>{item.stockCode}</TableCell>
                <TableCell>{item.companyName}</TableCell>
                <TableCell>{item.riskType}</TableCell>
                <TableCell>
                  <Chip size="small" label={translateSeverity(item.severity)} />
                </TableCell>
                <TableCell>{translateOpportunityType(item.opportunityType)}</TableCell>
                <TableCell>{item.message}</TableCell>
                <TableCell>{item.suggestedAction}</TableCell>
              </TableRow>
            ))}

            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  Chưa có cảnh báo rủi ro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ActionQueueTable({
  items,
  translatePriority,
}: {
  items: ActionQueueItem[];
  translatePriority: (value?: string) => string;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Việc cần xử lý
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ưu tiên</TableCell>
              <TableCell>Hành động</TableCell>
              <TableCell>Mã</TableCell>
              <TableCell>Công ty</TableCell>
              <TableCell>Nội dung</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.map((item) => (
              <TableRow key={`${item.priority}-${item.actionType}-${item.stockCode}`}>
                <TableCell>
                  <Chip size="small" label={translatePriority(item.priority)} />
                </TableCell>
                <TableCell>{item.actionType}</TableCell>
                <TableCell>{item.stockCode}</TableCell>
                <TableCell>{item.companyName}</TableCell>
                <TableCell>{item.message}</TableCell>
              </TableRow>
            ))}

            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  Chưa có việc cần xử lý.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}