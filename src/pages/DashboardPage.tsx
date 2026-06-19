import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Card, CardContent, Chip, Divider, LinearProgress, Stack, Typography,
} from "@mui/material";
import {
  AccountBalanceWalletOutlined, ArrowForward, AssignmentOutlined, BalanceOutlined, BlockOutlined,
  CheckCircleOutlined, DataUsageOutlined, DescriptionOutlined, DonutSmallOutlined,
  GroupsOutlined, HistoryToggleOffOutlined, NotificationsNoneOutlined, PercentOutlined, Refresh,
  ShowChartOutlined, StorageOutlined, TrendingUpOutlined, WarningAmberOutlined,
} from "@mui/icons-material";
import { portfolioApi } from "../api/portfolioApi";
import { decisionPlanApi } from "../api/decisionPlanApi";
import { dataGapApi } from "../api/dataGapApi";
import type { PortfolioPosition, PortfolioSummary } from "../types/portfolio";
import type { DecisionPlanListItem } from "../types/decisionPlans";
import type { DataGapReason, OpportunityDataGapPage } from "../types/dataGaps";

type DashboardErrors = Partial<Record<"portfolio" | "plans" | "gaps", string>>;

const gapLabels: Record<DataGapReason, string> = {
  MISSING_SHARE_INFO: "Thiếu thông tin cổ phiếu",
  MISSING_FINANCIAL_YEAR: "Thiếu năm tài chính",
  MISSING_FINANCIAL_STATEMENTS: "Thiếu báo cáo tài chính",
  OLD_STOCK_PRICE: "Giá cổ phiếu đã cũ",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [plans, setPlans] = useState<DecisionPlanListItem[]>([]);
  const [gaps, setGaps] = useState<OpportunityDataGapPage | null>(null);
  const [errors, setErrors] = useState<DashboardErrors>({});
  const [loading, setLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const [summaryResult, positionsResult, plansResult, gapsResult] = await Promise.allSettled([
      portfolioApi.summary(),
      portfolioApi.listAll("ACTIVE"),
      decisionPlanApi.listAllActive(),
      dataGapApi.getGaps({ page: 0, size: 20 }),
    ]);

    const nextErrors: DashboardErrors = {};
    if (summaryResult.status === "fulfilled") setSummary(summaryResult.value);
    else nextErrors.portfolio = "Không tải được tổng quan danh mục.";
    if (positionsResult.status === "fulfilled") setPositions(positionsResult.value);
    else nextErrors.portfolio = "Không tải được các vị thế đang nắm giữ.";
    if (plansResult.status === "fulfilled") setPlans(plansResult.value);
    else nextErrors.plans = "Không tải được kế hoạch đầu tư đang hoạt động.";
    if (gapsResult.status === "fulfilled") setGaps(gapsResult.value);
    else nextErrors.gaps = "Không tải được danh sách dữ liệu còn thiếu.";
    setErrors(nextErrors);
    setLoading(false);
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const warnings = useMemo(() => positions.filter((item) => item.positionWarning || item.priceDataWarning), [positions]);
  const duePlans = useMemo(() => plans.filter(isDueReview).slice(0, 5), [plans]);
  const positionCodes = useMemo(() => new Set(positions.map((item) => item.stockCode)), [positions]);
  const positionsWithoutPlan = useMemo(() => positions.filter((item) => !item.activeDecisionPlanId).slice(0, 5), [positions]);
  const plansWithoutPosition = useMemo(() => plans.filter((item) => !positionCodes.has(item.stockCode)).slice(0, 5), [plans, positionCodes]);

  return <Box sx={{ textAlign: "left" }}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3, justifyContent: "space-between", alignItems: { sm: "center" } }}>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: 27, md: 32 } }}>Tổng quan hành động</Typography>
        <Typography color="text.secondary" sx={{ fontSize: 14 }}>Những việc cần xem trước khi ra quyết định đầu tư.</Typography>
      </Box>
      <Button variant="outlined" startIcon={<Refresh />} onClick={() => void loadDashboard()} disabled={loading}>Tải lại</Button>
    </Stack>
    {loading && <LinearProgress sx={{ mb: 2 }} />}

    {errors.portfolio && <Alert severity="warning" sx={{ mb: 2 }}>{errors.portfolio}</Alert>}
    <Box sx={{ ...cardGridSx, mb: 2.5 }}>
      <Metric label="Tổng giá trị danh mục" value={formatVnd(summary?.totalMarketValue)} icon={<AccountBalanceWalletOutlined />} iconTone="blue" />
      <Metric label="Lãi/lỗ tạm tính" value={formatVnd(summary?.totalUnrealizedPnL)} tone={numberTone(summary?.totalUnrealizedPnL)} icon={<TrendingUpOutlined />} iconTone="green" subValue={summary?.totalUnrealizedPnLPercent != null ? `▲ ${formatPercent(summary.totalUnrealizedPnLPercent)}` : undefined} />
      <Metric label="% lãi/lỗ" value={formatPercent(summary?.totalUnrealizedPnLPercent)} tone={numberTone(summary?.totalUnrealizedPnLPercent)} icon={<PercentOutlined />} iconTone="green" />
      <Metric label="Số mã đang nắm" value={formatNumber(summary?.activePositionCount)} icon={<DonutSmallOutlined />} iconTone="blue" />
      <Metric label="Số mã vượt tỷ trọng" value={formatNumber(summary?.overMaxPositionCount)} tone="warning" icon={<WarningAmberOutlined />} iconTone="orange" />
      <Metric label="Số mã thiếu giá" value={formatNumber(summary?.missingPriceCount)} tone={summary?.missingPriceCount ? "warning" : undefined} icon={<BlockOutlined />} iconTone="purple" />
    </Box>

    <Box sx={sectionGridSx}>
      <Section title="Cảnh báo danh mục" icon={<NotificationsNoneOutlined />} error={errors.portfolio}>
        <Stack spacing={1.5}>
          {warnings.map((item) => <Card variant="outlined" key={item.id} sx={{ bgcolor: item.positionWarning ? "#fff8f3" : "#fff7f7", borderColor: item.positionWarning ? "#ffc7a3" : "#ffc5c7", boxShadow: "none" }}><CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Box sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: "50%", bgcolor: "white", border: 1, borderColor: "divider", color: "primary.main", display: "grid", placeItems: "center", fontWeight: 800 }}>{item.stockCode.slice(0, 3)}</Box>
                <Box><Typography sx={{ fontWeight: 700 }}>{item.stockCode} · {item.companyName}</Typography>
                  <Stack direction="row" spacing={2.5} sx={{ mt: .8 }}><Box><Typography variant="caption" color="text.secondary">Tỷ trọng hiện tại</Typography><Typography sx={{ fontWeight: 750 }}>{formatPercent(item.portfolioWeightPercent)}</Typography></Box>{item.maxPositionPercent != null && <Box sx={{ pl: 2.5, borderLeft: 1, borderColor: "#f2c9ad" }}><Typography variant="caption" color="text.secondary">Tỷ trọng tối đa</Typography><Typography sx={{ fontWeight: 750 }}>{formatPercent(item.maxPositionPercent)}</Typography></Box>}</Stack>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                {item.positionWarning === "OVER_MAX_POSITION" && <Chip color="warning" size="small" label="Vượt tỷ trọng" />}
                {item.priceDataWarning === "MISSING_LATEST_PRICE" && <Chip color="error" size="small" label="Thiếu giá gần nhất" />}
                <Button size="small" onClick={() => navigate("/portfolio")}>Xem danh mục</Button>
              </Stack>
            </Stack>
          </CardContent></Card>)}
          {!errors.portfolio && warnings.length === 0 && <Empty text="Không có cảnh báo danh mục." />}
        </Stack>
      </Section>

      <Section title="Kế hoạch cần review" icon={<AssignmentOutlined />} error={errors.plans}>
        <Stack spacing={1.5}>
          {duePlans.map((plan) => <Card variant="outlined" key={plan.id}><CardContent>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
              <Box><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Typography sx={{ fontWeight: 700 }}>{plan.stockCode}</Typography><Chip size="small" label={actionLabel(plan.action)} /></Stack>
                <Typography variant="body2" color="text.secondary">Review: {formatDate(plan.reviewDate)}{plan.targetBuyPrice != null ? ` · Giá mua ${formatVnd(plan.targetBuyPrice)}` : ""}{plan.fairValue != null ? ` · Fair value ${formatVnd(plan.fairValue)}` : ""}</Typography></Box>
              <Button size="small" onClick={() => navigate(`/decision-plans?stockCode=${encodeURIComponent(plan.stockCode)}`)}>Mở kế hoạch</Button>
            </Stack>
          </CardContent></Card>)}
          {!errors.plans && duePlans.length === 0 && <Empty text="Không có kế hoạch quá hạn review." detail="Tất cả kế hoạch đang trong thời hạn review." icon={<AssignmentOutlined />} />}
        </Stack>
      </Section>
    </Box>

    <Box sx={sectionGridSx}>
      <Section title="Thiếu dữ liệu quan trọng" icon={<StorageOutlined />} error={errors.gaps}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5 }}>
          {(Object.keys(gapLabels) as DataGapReason[]).map((reason) => <Metric key={reason} label={gapLabels[reason]} value={formatNumber(gaps?.reasonCounts?.[reason])} compact icon={gapIcon(reason)} iconTone="blue" />)}
        </Box>
        {gaps && <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mt: 1.5, pt: 1.5, borderTop: 1, borderColor: "divider" }}><Typography variant="body2" color="text.secondary">Tổng cộng <strong>{formatNumber(gaps.totalElements)}</strong> mã đang thiếu dữ liệu.</Typography><Button size="small" endIcon={<ArrowForward />} onClick={() => navigate("/admin/data-gaps")}>Mở bổ sung dữ liệu</Button></Stack>}
      </Section>

      <Section title="Đối chiếu kế hoạch / danh mục" icon={<BalanceOutlined />} error={errors.portfolio || errors.plans}>
        <MismatchGroup title="Có vị thế nhưng chưa có kế hoạch" items={positionsWithoutPlan.map((item) => item.stockCode)} empty="Mọi vị thế đều đã có kế hoạch ACTIVE." />
        <Divider sx={{ my: 2 }} />
        <MismatchGroup title="Có kế hoạch nhưng chưa có vị thế" items={plansWithoutPosition.map((item) => item.stockCode)} empty="Mọi kế hoạch ACTIVE đều đã có vị thế." />
        <Box sx={{ textAlign: "right", mt: 1.5 }}><Button size="small" endIcon={<ArrowForward />} onClick={() => navigate("/decision-plans")}>Xem kế hoạch đầu tư</Button></Box>
      </Section>
    </Box>

    <Section title="Đi nhanh đến công việc cần làm" icon={<DataUsageOutlined />}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button variant="outlined" onClick={() => navigate("/opportunities")}>Mở Cơ hội</Button>
        <Button variant="outlined" onClick={() => navigate("/investment-thesis")}>Mở Hồ sơ nghiên cứu</Button>
        <Button variant="outlined" onClick={() => navigate("/watchlist")}>Mở Watchlist</Button>
        <Button variant="outlined" onClick={() => navigate("/decision-plans")}>Mở Kế hoạch đầu tư</Button>
        <Button variant="outlined" onClick={() => navigate("/portfolio")}>Mở Danh mục đầu tư</Button>
        <Button variant="outlined" onClick={() => navigate("/admin/data-gaps")}>Mở Bổ sung dữ liệu thiếu</Button>
      </Stack>
    </Section>
  </Box>;
}

function Section({ title, icon, actionLabel, onAction, error, children }: { title: string; icon?: React.ReactNode; actionLabel?: string; onAction?: () => void; error?: string; children: React.ReactNode }) {
  return <Card sx={{ mb: 2.5, height: "calc(100% - 20px)" }}><CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
    <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "#173f7a" }}>{icon}{<Typography variant="h6" color="text.primary" sx={{ fontSize: 17 }}>{title}</Typography>}</Stack>
      {actionLabel && onAction && <Button size="small" onClick={onAction}>{actionLabel}</Button>}
    </Stack>
    {error && <Alert severity="warning" sx={{ mb: 2 }}>{error} Các phần khác vẫn có thể sử dụng.</Alert>}
    {children}
  </CardContent></Card>;
}

function Metric({ label, value, tone, compact, icon, iconTone = "blue", subValue }: { label: string; value: string; tone?: "positive" | "negative" | "warning"; compact?: boolean; icon?: React.ReactNode; iconTone?: "blue" | "green" | "orange" | "purple"; subValue?: string }) {
  const iconColors = { blue: { bg: "#eaf3ff", fg: "#1677ee" }, green: { bg: "#e8f7ee", fg: "#17974c" }, orange: { bg: "#fff0e5", fg: "#f46b18" }, purple: { bg: "#f2ecff", fg: "#6d5ce7" } }[iconTone];
  return <Card variant="outlined" sx={{ boxShadow: compact ? "none" : undefined, minWidth: 0 }}><CardContent sx={{ p: compact ? 1.4 : 2, minHeight: compact ? 112 : 138, "&:last-child": { pb: compact ? 1.4 : 2 } }}>
    {icon && <Box sx={{ width: compact ? 32 : 40, height: compact ? 32 : 40, borderRadius: 1.5, bgcolor: iconColors.bg, color: iconColors.fg, display: "grid", placeItems: "center", mb: compact ? 1 : 1.4, "& svg": { fontSize: compact ? 19 : 23 } }}>{icon}</Box>}
    <Typography variant="body2" color="text.secondary" sx={{ fontSize: compact ? 12 : 13 }}>{label}</Typography>
    <Typography variant={compact ? "h6" : "h5"} sx={{ color: toneColor(tone), mt: 0.45, fontSize: compact ? 20 : 21 }}>{value}</Typography>
    {subValue && <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700 }}>{subValue}</Typography>}
  </CardContent></Card>;
}

function Empty({ text, detail, icon }: { text: string; detail?: string; icon?: React.ReactNode }) { return <Box sx={{ py: icon ? 4 : 1, textAlign: icon ? "center" : "left" }}>{icon && <Box sx={{ width: 58, height: 58, borderRadius: "50%", bgcolor: "#eaf3ff", color: "primary.main", display: "grid", placeItems: "center", mx: "auto", mb: 1.5, "& svg": { fontSize: 28 } }}>{icon}</Box>}<Typography color={icon ? "text.primary" : "text.secondary"} sx={{ fontWeight: icon ? 600 : 400 }}>{text}</Typography>{detail && <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{detail}</Typography>}</Box>; }

function MismatchGroup({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  const statusOk = items.length === 0;
  return <Box><Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>{statusOk ? <CheckCircleOutlined color="success" fontSize="small" /> : <WarningAmberOutlined color="warning" fontSize="small" />}<Typography sx={{ fontWeight: 650 }}>{title}</Typography></Stack>
    {items.length > 0 ? <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.5, pl: 3.5 }}>{items.map((code) => <Chip key={code} label={code} size="small" sx={{ bgcolor: "#e7f6ed", color: "#17743d" }} />)}</Stack> : <Box sx={{ pl: 3.5 }}><Empty text={empty} /></Box>}
  </Box>;
}

function gapIcon(reason: DataGapReason) {
  if (reason === "MISSING_SHARE_INFO") return <GroupsOutlined />;
  if (reason === "MISSING_FINANCIAL_YEAR") return <ShowChartOutlined />;
  if (reason === "MISSING_FINANCIAL_STATEMENTS") return <DescriptionOutlined />;
  return <HistoryToggleOffOutlined />;
}

function isDueReview(plan: DecisionPlanListItem) {
  if (plan.isDueReview) return true;
  if (!plan.reviewDate) return false;
  return plan.reviewDate <= new Date().toISOString().slice(0, 10);
}

function actionLabel(action: string) {
  const labels: Record<string, string> = { BUY: "Mua", WATCH: "Theo dõi", HOLD: "Nắm giữ", TRIM: "Giảm tỷ trọng", SELL: "Bán", AVOID: "Tránh" };
  return labels[action] ?? action;
}

function formatDate(value?: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : "-"; }
function formatVnd(value?: number) { return value == null ? "-" : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} ₫`; }
function formatPercent(value?: number) { return value == null ? "-" : `${value.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`; }
function formatNumber(value?: number) { return value == null ? "-" : value.toLocaleString("vi-VN"); }
function numberTone(value?: number): "positive" | "negative" | undefined { return value == null || value === 0 ? undefined : value > 0 ? "positive" : "negative"; }
function toneColor(tone?: "positive" | "negative" | "warning") { if (tone === "positive") return "success.main"; if (tone === "negative") return "error.main"; if (tone === "warning") return "warning.main"; return "inherit"; }

const cardGridSx = { display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" }, gap: 1.5 };
const sectionGridSx = { display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2.5 };
