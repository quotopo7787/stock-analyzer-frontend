import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  NativeSelect,
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
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import CheckIcon from "@mui/icons-material/Check";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import { decisionPlanApi } from "../api/decisionPlanApi";
import { valuationScenarioApi } from "../api/valuationScenarioApi";
import type { DecisionPlanDetail, DecisionPlanListItem } from "../types/decisionPlans";
import type {
  ValuationScenarioApplyResponse,
  ValuationScenarioCreateRequest,
  ValuationScenarioDetail,
  ValuationScenarioListItem,
  ValuationScenarioMethod,
  ValuationScenarioPage,
  ValuationScenarioStatus,
  ValuationScenarioUpdateRequest,
} from "../types/valuationScenarios";

const methods: ValuationScenarioMethod[] = ["PE", "PB", "MANUAL"];
const statuses: ValuationScenarioStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];
const pageSize = 20;
const currentYear = new Date().getFullYear();

const methodLabels: Record<ValuationScenarioMethod, string> = {
  PE: "P/E",
  PB: "P/B",
  MANUAL: "Thủ công",
};

const statusLabels: Record<ValuationScenarioStatus, string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang dùng",
  ARCHIVED: "Đã lưu trữ",
};

const decisionPlanActionLabels: Record<string, string> = {
  BUY: "Mua",
  WATCH: "Theo dõi",
  HOLD: "Nắm giữ",
  TRIM: "Giảm tỷ trọng",
  SELL: "Bán",
  AVOID: "Tránh",
};

const decisionPlanStatusLabels: Record<string, string> = {
  DRAFT: "Nháp",
  WATCH: "Theo dõi",
  ACTIVE: "Đang dùng",
  CLOSED: "Đã đóng",
  ARCHIVED: "Đã lưu trữ",
};

export default function ValuationScenariosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stockInput, setStockInput] = useState(searchParams.get("stockCode")?.toUpperCase() ?? "");
  const [stockCode, setStockCode] = useState(searchParams.get("stockCode")?.toUpperCase() ?? "");
  const [method, setMethod] = useState<ValuationScenarioMethod | "">("");
  const [status, setStatus] = useState<ValuationScenarioStatus | "">("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<ValuationScenarioPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ValuationScenarioDetail | null>(null);
  const [applyingItem, setApplyingItem] = useState<ValuationScenarioListItem | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const code = searchParams.get("stockCode")?.trim().toUpperCase() ?? "";
      setStockInput(code);
      setStockCode(code);
      setPage(0);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setData(await valuationScenarioApi.list({
        stockCode: stockCode || undefined,
        method: method || undefined,
        status: status || undefined,
        page,
        size: pageSize,
      }));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [method, page, status, stockCode]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const applyStockFilter = () => {
    const code = stockInput.trim().toUpperCase();
    setStockCode(code);
    setPage(0);
    setSearchParams(code ? { stockCode: code } : {}, { replace: true });
  };

  const resetFilters = () => {
    setStockInput("");
    setStockCode("");
    setMethod("");
    setStatus("");
    setPage(0);
    setSearchParams({}, { replace: true });
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = async (item: ValuationScenarioListItem) => {
    try {
      setError("");
      setEditing(await valuationScenarioApi.get(item.id));
      setDialogOpen(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const archiveScenario = async (item: ValuationScenarioListItem) => {
    try {
      await valuationScenarioApi.archive(item.id);
      setToast(`Đã lưu trữ kịch bản ${item.stockCode} ${item.scenarioName}.`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const activateScenario = async (item: ValuationScenarioListItem) => {
    try {
      await valuationScenarioApi.activate(item.id);
      setToast(`Đã kích hoạt kịch bản ${item.stockCode} ${item.scenarioName}.`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <Box sx={{ textAlign: "left" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, mb: 3 }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>Kịch bản định giá</Typography>
          <Typography color="text.secondary">
            Lưu các kịch bản P/E, P/B hoặc định giá thủ công theo từng mã để so sánh fair value, giá mua và upside.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />} onClick={() => void load()} disabled={loading}>
            Tải lại
          </Button>
          <Button variant="contained" onClick={openCreate}>Thêm kịch bản</Button>
        </Stack>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
            <TextField
              label="Mã cổ phiếu"
              value={stockInput}
              onChange={(event) => setStockInput(event.target.value.toUpperCase())}
              onKeyDown={(event) => { if (event.key === "Enter") applyStockFilter(); }}
              placeholder="FPT, CMG..."
              sx={{ minWidth: { md: 190 } }}
            />
            <FormControl sx={{ minWidth: 170 }}>
              <InputLabel htmlFor="valuation-method-filter">Phương pháp</InputLabel>
              <NativeSelect
                id="valuation-method-filter"
                value={method}
                onChange={(event) => { setMethod(event.target.value as ValuationScenarioMethod | ""); setPage(0); }}
              >
                <option value="">Tất cả</option>
                {methods.map((value) => <option key={value} value={value}>{methodLabels[value]}</option>)}
              </NativeSelect>
            </FormControl>
            <FormControl sx={{ minWidth: 170 }}>
              <InputLabel htmlFor="valuation-status-filter">Trạng thái</InputLabel>
              <NativeSelect
                id="valuation-status-filter"
                value={status}
                onChange={(event) => { setStatus(event.target.value as ValuationScenarioStatus | ""); setPage(0); }}
              >
                <option value="">Tất cả</option>
                {statuses.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
              </NativeSelect>
            </FormControl>
            <Button variant="contained" onClick={applyStockFilter}>Áp dụng</Button>
            <Button variant="outlined" onClick={resetFilters}>Reset</Button>
            <Typography color="text.secondary" sx={{ ml: { md: "auto" } }}>
              {data?.totalElements ?? 0} kịch bản
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { md: "center" }, mb: 2 }}>
            <Box>
              <Typography variant="h6">Danh sách kịch bản</Typography>
              <Typography variant="body2" color="text.secondary">
                Đơn vị tiền: VND/cp. Frontend không chia 1.000; backend trả giá đã chuẩn hóa.
              </Typography>
            </Box>
          </Stack>

          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 1420 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Mã</TableCell>
                  <TableCell>Tên công ty</TableCell>
                  <TableCell align="right">Năm</TableCell>
                  <TableCell>Kịch bản</TableCell>
                  <TableCell>Phương pháp</TableCell>
                  <TableCell align="right">Fair value</TableCell>
                  <TableCell align="right">Giá mua</TableCell>
                  <TableCell align="right">Giá hiện tại</TableCell>
                  <TableCell align="right">Upside</TableCell>
                  <TableCell align="right">Margin of safety</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Cập nhật</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.content.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell><Typography sx={{ fontWeight: 750 }}>{item.stockCode}</Typography></TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{item.companyName || "-"}</TableCell>
                    <TableCell align="right">{item.valuationYear}</TableCell>
                    <TableCell>{item.scenarioName}</TableCell>
                    <TableCell><Chip size="small" label={methodLabels[item.method]} variant="outlined" /></TableCell>
                    <TableCell align="right">{formatVndPerShare(item.fairValue)}</TableCell>
                    <TableCell align="right">{formatVndPerShare(item.targetBuyPrice)}</TableCell>
                    <TableCell align="right">{formatVndPerShare(item.currentPrice)}</TableCell>
                    <TableCell align="right" sx={{ color: percentColor(item.upsidePercent), fontWeight: 700 }}>
                      {formatPercent(item.upsidePercent)}
                    </TableCell>
                    <TableCell align="right">{formatPercent(item.marginOfSafetyPercent)}</TableCell>
                    <TableCell><Chip size="small" label={statusLabels[item.status]} color={statusColor(item.status)} /></TableCell>
                    <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Xem / sửa">
                          <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => void openEdit(item)}>Sửa</Button>
                        </Tooltip>
                        {item.status !== "ARCHIVED" && (
                          <Button size="small" color="warning" startIcon={<ArchiveOutlinedIcon />} onClick={() => void archiveScenario(item)}>
                            Archive
                          </Button>
                        )}
                        {item.status !== "ACTIVE" && (
                          <Button size="small" color="success" startIcon={<CheckIcon />} onClick={() => void activateScenario(item)}>
                            Activate
                          </Button>
                        )}
                        {item.status !== "ARCHIVED" && (
                          <Button size="small" color="primary" startIcon={<SyncAltIcon />} onClick={() => setApplyingItem(item)}>
                            Áp dụng vào kế hoạch
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && !data?.content.length && (
                  <TableRow>
                    <TableCell colSpan={13}>
                      <Box sx={{ py: 6, textAlign: "center" }}>
                        <Typography variant="h6">Chưa có kịch bản định giá</Typography>
                        <Typography color="text.secondary">
                          Hãy thêm kịch bản đầu tiên hoặc đổi bộ lọc để xem dữ liệu khác.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", alignItems: "center", mt: 2 }}>
            <Button disabled={!data || page === 0 || loading} onClick={() => setPage((value) => value - 1)}>Trang trước</Button>
            <Typography>Trang {data ? data.number + 1 : 1}/{Math.max(data?.totalPages ?? 1, 1)}</Typography>
            <Button disabled={!data || page + 1 >= data.totalPages || loading} onClick={() => setPage((value) => value + 1)}>Trang sau</Button>
          </Stack>
        </CardContent>
      </Card>

      <ValuationScenarioDialog
        open={dialogOpen}
        scenario={editing}
        defaultStockCode={stockCode}
        onClose={() => setDialogOpen(false)}
        onSaved={async (message) => {
          setDialogOpen(false);
          setToast(message);
          await load();
        }}
      />

      <ApplyToDecisionPlanDialog
        item={applyingItem}
        onClose={() => setApplyingItem(null)}
        onApplied={async (response) => {
          setApplyingItem(null);
          const warningText = response.warnings?.length ? ` Cảnh báo: ${response.warnings.join("; ")}` : "";
          setToast(`Đã áp dụng định giá vào Decision Plan #${response.decisionPlanId}.${warningText}`);
          await load();
        }}
      />

      <Snackbar open={Boolean(toast)} autoHideDuration={6000} onClose={() => setToast("")}>
        <Alert severity="success" onClose={() => setToast("")}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}

type FormState = {
  stockCode: string;
  linkedDecisionPlanId: string;
  valuationYear: string;
  method: ValuationScenarioMethod;
  scenarioName: string;
  status: ValuationScenarioStatus;
  eps: string;
  bookValuePerShare: string;
  peMultiple: string;
  pbMultiple: string;
  fairValue: string;
  targetBuyPrice: string;
  targetSellPrice: string;
  marginOfSafetyPercent: string;
  assumptions: string;
  sourceNote: string;
  notes: string;
};

const emptyForm: FormState = {
  stockCode: "",
  linkedDecisionPlanId: "",
  valuationYear: String(currentYear - 1),
  method: "PE",
  scenarioName: "BASE",
  status: "DRAFT",
  eps: "",
  bookValuePerShare: "",
  peMultiple: "",
  pbMultiple: "",
  fairValue: "",
  targetBuyPrice: "",
  targetSellPrice: "",
  marginOfSafetyPercent: "",
  assumptions: "",
  sourceNote: "",
  notes: "",
};

function ValuationScenarioDialog({
  open,
  scenario,
  defaultStockCode,
  onClose,
  onSaved,
}: {
  open: boolean;
  scenario: ValuationScenarioDetail | null;
  defaultStockCode: string;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!open) return;
      setError("");
      setForm(scenario ? {
        stockCode: scenario.stockCode,
        linkedDecisionPlanId: valueString(scenario.linkedDecisionPlanId),
        valuationYear: valueString(scenario.valuationYear),
        method: scenario.method,
        scenarioName: scenario.scenarioName,
        status: scenario.status,
        eps: valueString(scenario.eps),
        bookValuePerShare: valueString(scenario.bookValuePerShare),
        peMultiple: valueString(scenario.peMultiple),
        pbMultiple: valueString(scenario.pbMultiple),
        fairValue: valueString(scenario.fairValue),
        targetBuyPrice: valueString(scenario.targetBuyPrice),
        targetSellPrice: valueString(scenario.targetSellPrice),
        marginOfSafetyPercent: valueString(scenario.marginOfSafetyPercent),
        assumptions: (scenario.assumptions ?? []).join("\n"),
        sourceNote: scenario.sourceNote ?? "",
        notes: scenario.notes ?? "",
      } : {
        ...emptyForm,
        stockCode: defaultStockCode,
        valuationYear: String(currentYear - 1),
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [defaultStockCode, open, scenario]);

  const preview = useMemo(() => {
    const eps = optionalNumber(form.eps);
    const pe = optionalNumber(form.peMultiple);
    const bvps = optionalNumber(form.bookValuePerShare);
    const pb = optionalNumber(form.pbMultiple);
    const manualFairValue = optionalNumber(form.fairValue);
    const margin = optionalNumber(form.marginOfSafetyPercent);
    const fairValuePreview = form.method === "PE" && eps && pe
      ? eps * pe
      : form.method === "PB" && bvps && pb
        ? bvps * pb
        : form.method === "MANUAL"
          ? manualFairValue
          : undefined;
    const targetBuyPreview = fairValuePreview && margin !== undefined
      ? fairValuePreview * (1 - margin / 100)
      : undefined;
    return { fairValuePreview, targetBuyPreview };
  }, [form.bookValuePerShare, form.eps, form.fairValue, form.marginOfSafetyPercent, form.method, form.pbMultiple, form.peMultiple]);

  const field = (name: keyof FormState) => ({
    value: form[name],
    onChange: (event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [name]: event.target.value })),
  });

  const save = async () => {
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      const sharedPayload: ValuationScenarioUpdateRequest = {
        linkedDecisionPlanId: optionalNumber(form.linkedDecisionPlanId),
        valuationYear: Number(form.valuationYear),
        method: form.method,
        scenarioName: form.scenarioName.trim().toUpperCase(),
        eps: optionalNumber(form.eps),
        bookValuePerShare: optionalNumber(form.bookValuePerShare),
        peMultiple: optionalNumber(form.peMultiple),
        pbMultiple: optionalNumber(form.pbMultiple),
        fairValue: optionalNumber(form.fairValue),
        targetBuyPrice: optionalNumber(form.targetBuyPrice),
        targetSellPrice: optionalNumber(form.targetSellPrice),
        marginOfSafetyPercent: optionalNumber(form.marginOfSafetyPercent),
        assumptions: lines(form.assumptions),
        sourceNote: form.sourceNote.trim() || undefined,
        notes: form.notes.trim() || undefined,
        status: form.status,
      };

      if (scenario) {
        await valuationScenarioApi.update(scenario.id, sharedPayload);
        await onSaved("Đã cập nhật kịch bản định giá.");
      } else {
        const payload: ValuationScenarioCreateRequest = {
          ...sharedPayload,
          stockCode: form.stockCode.trim().toUpperCase(),
        };
        const created = await valuationScenarioApi.create(payload);
        await onSaved(`Đã tạo kịch bản định giá ${created.stockCode} ${created.scenarioName}.`);
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{scenario ? `Sửa kịch bản định giá ${scenario.stockCode}` : "Thêm kịch bản định giá"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mt: 1 }}>
          {error && <Alert severity="error" sx={{ gridColumn: "1 / -1" }}>{error}</Alert>}

          <TextField label="Mã cổ phiếu" {...field("stockCode")} disabled={Boolean(scenario)} required />
          <TextField label="Năm định giá" type="number" {...field("valuationYear")} required />
          <TextField label="Tên kịch bản" {...field("scenarioName")} required />
          <TextField
            select
            label="Phương pháp"
            value={form.method}
            onChange={(event) => setForm((current) => ({ ...current, method: event.target.value as ValuationScenarioMethod }))}
          >
            {methods.map((value) => <MenuItem key={value} value={value}>{methodLabels[value]}</MenuItem>)}
          </TextField>
          <TextField
            select
            label="Trạng thái"
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ValuationScenarioStatus }))}
          >
            {statuses.map((value) => <MenuItem key={value} value={value}>{statusLabels[value]}</MenuItem>)}
          </TextField>
          <TextField label="Decision Plan ID liên kết" type="number" {...field("linkedDecisionPlanId")} helperText="Không bắt buộc" />

          {form.method === "PE" && (
            <>
              <TextField label="EPS (VND/cp)" type="number" {...field("eps")} required />
              <TextField label="P/E mục tiêu" type="number" {...field("peMultiple")} required />
            </>
          )}
          {form.method === "PB" && (
            <>
              <TextField label="Book value/share (VND/cp)" type="number" {...field("bookValuePerShare")} required />
              <TextField label="P/B mục tiêu" type="number" {...field("pbMultiple")} required />
            </>
          )}
          {form.method === "MANUAL" && (
            <TextField label="Fair value (VND/cp)" type="number" {...field("fairValue")} required />
          )}

          <TextField label="Margin of safety (%)" type="number" {...field("marginOfSafetyPercent")} />
          <TextField label="Giá mua mục tiêu (VND/cp)" type="number" {...field("targetBuyPrice")} helperText="Có thể để trống để backend tự tính theo margin" />
          <TextField label="Giá bán mục tiêu (VND/cp)" type="number" {...field("targetSellPrice")} />
          <TextField label="Ghi chú nguồn" {...field("sourceNote")} />

          <Paper variant="outlined" sx={{ gridColumn: "1 / -1", p: 2, bgcolor: "#f8fbff" }}>
            <Typography variant="subtitle2" gutterBottom>Preview nhanh</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
              <Typography>Fair value: <strong>{formatVndPerShare(preview.fairValuePreview)}</strong></Typography>
              <Typography>Giá mua theo margin: <strong>{formatVndPerShare(preview.targetBuyPreview)}</strong></Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Preview chỉ để tham khảo; giá trị cuối cùng lấy từ backend sau khi lưu.
            </Typography>
          </Paper>

          <TextField
            label="Assumptions / Giả định (mỗi dòng một ý)"
            multiline
            minRows={4}
            {...field("assumptions")}
          />
          <TextField label="Ghi chú" multiline minRows={4} {...field("notes")} />

          {scenario?.priceDataWarning && (
            <Alert severity="warning" sx={{ gridColumn: "1 / -1" }}>
              Cảnh báo dữ liệu giá: {scenario.priceDataWarning === "MISSING_LATEST_PRICE" ? "chưa có giá gần nhất" : scenario.priceDataWarning}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        <Button variant="contained" onClick={() => void save()} disabled={saving}>
          {saving ? <CircularProgress size={22} /> : "Lưu kịch bản"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type ApplyFlags = {
  fairValue: boolean;
  targetBuyPrice: boolean;
  targetSellPrice: boolean;
};

function ApplyToDecisionPlanDialog({
  item,
  onClose,
  onApplied,
}: {
  item: ValuationScenarioListItem | null;
  onClose: () => void;
  onApplied: (response: ValuationScenarioApplyResponse) => Promise<void>;
}) {
  const [scenario, setScenario] = useState<ValuationScenarioDetail | null>(null);
  const [plans, setPlans] = useState<DecisionPlanListItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<DecisionPlanDetail | null>(null);
  const [flags, setFlags] = useState<ApplyFlags>({ fairValue: false, targetBuyPrice: false, targetSellPrice: false });
  const [confirmedTarget, setConfirmedTarget] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!item) return;
    let cancelled = false;
    const loadPreview = async () => {
      try {
        setLoading(true);
        setError("");
        setScenario(null);
        setPlans([]);
        setSelectedPlanId("");
        setSelectedPlan(null);
        setConfirmedTarget(false);
        const [scenarioDetail, planPage] = await Promise.all([
          valuationScenarioApi.get(item.id),
          decisionPlanApi.list({ stockCode: item.stockCode, page: 0, size: 100 }),
        ]);
        if (cancelled) return;
        setScenario(scenarioDetail);
        setFlags({
          fairValue: scenarioDetail.fairValue != null,
          targetBuyPrice: scenarioDetail.targetBuyPrice != null,
          targetSellPrice: scenarioDetail.targetSellPrice != null,
        });
        setPlans(planPage.content);
        const defaultPlanId = scenarioDetail.linkedDecisionPlanId
          ?? planPage.content.find((plan) => plan.status === "ACTIVE")?.id
          ?? planPage.content[0]?.id;
        if (defaultPlanId) {
          setSelectedPlanId(String(defaultPlanId));
          setSelectedPlan(await decisionPlanApi.get(defaultPlanId));
        } else {
          setError("Chưa có Decision Plan cùng mã cổ phiếu. Hãy tạo Decision Plan trước rồi quay lại áp dụng định giá.");
        }
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadPreview();
    return () => { cancelled = true; };
  }, [item]);

  const changeSelectedPlan = async (id: string) => {
    setSelectedPlanId(id);
    setSelectedPlan(null);
    setConfirmedTarget(false);
    setError("");
    if (!id) return;
    try {
      setSelectedPlan(await decisionPlanApi.get(Number(id)));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const apply = async () => {
    if (!scenario || !selectedPlanId) {
      setError("Bạn cần chọn Decision Plan trước khi áp dụng.");
      return;
    }
    if (!flags.fairValue && !flags.targetBuyPrice && !flags.targetSellPrice) {
      setError("Cần chọn ít nhất một trường giá để áp dụng.");
      return;
    }
    if (!confirmedTarget) {
      setError("Bạn cần xác nhận đã kiểm tra đúng Decision Plan cần cập nhật.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const response = await valuationScenarioApi.applyToDecisionPlan(scenario.id, {
        decisionPlanId: Number(selectedPlanId),
        applyFairValue: flags.fairValue,
        applyTargetBuyPrice: flags.targetBuyPrice,
        applyTargetSellPrice: flags.targetSellPrice,
        confirm: true,
      });
      await onApplied(response);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const open = Boolean(item);
  const selectedPlanStatus = selectedPlan?.status as string | undefined;
  const selectedPlanNote = decisionPlanNote(selectedPlan);
  const selectedPlanIsTest = isTestDecisionPlan(selectedPlan);
  const selectedPlanIsActive = selectedPlanStatus === "ACTIVE";
  const selectedPlanIsClosedOrArchived = selectedPlanStatus === "CLOSED" || selectedPlanStatus === "ARCHIVED";
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Áp dụng định giá vào Decision Plan</DialogTitle>
      <DialogContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Alert severity="info">
            Thao tác này chỉ cập nhật fair value, giá mua mục tiêu và/hoặc giá bán mục tiêu. Nó không thay đổi khuyến nghị mua/bán, action, status hay portfolio.
          </Alert>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
            <InfoBox label="Mã cổ phiếu" value={scenario?.stockCode ?? item?.stockCode ?? "-"} />
            <InfoBox label="Kịch bản" value={scenario ? `${scenario.scenarioName} · ${methodLabels[scenario.method]}` : "-"} />
            <InfoBox label="Trạng thái" value={scenario ? statusLabels[scenario.status] : "-"} />
          </Box>

          <TextField
            select
            label="Decision Plan target"
            value={selectedPlanId}
            onChange={(event) => void changeSelectedPlan(event.target.value)}
            disabled={loading || saving || plans.length === 0}
            helperText={scenario?.linkedDecisionPlanId ? `Mặc định theo linkedDecisionPlanId #${scenario.linkedDecisionPlanId}` : "Chọn Decision Plan cùng mã cổ phiếu"}
          >
            {plans.map((plan) => (
              <MenuItem key={plan.id} value={String(plan.id)}>
                #{plan.id} · {plan.stockCode} · {decisionPlanActionLabels[plan.action] ?? plan.action} · {decisionPlanStatusLabels[plan.status] ?? plan.status}
              </MenuItem>
            ))}
          </TextField>

          {selectedPlan && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: selectedPlanIsTest ? "#fff8e1" : "#f8fbff" }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    Target Decision Plan #{selectedPlan.id} · {selectedPlan.stockCode}
                  </Typography>
                  <Chip size="small" label={decisionPlanActionLabels[selectedPlan.action] ?? selectedPlan.action} color="primary" variant="outlined" />
                  <Chip size="small" label={decisionPlanStatusLabels[selectedPlanStatus ?? ""] ?? selectedPlanStatus} color={selectedPlanIsActive ? "success" : "default"} />
                  {selectedPlanIsTest && <Chip size="small" label="TEST PLAN" color="warning" variant="outlined" />}
                </Stack>
                {selectedPlanNote && (
                  <Typography variant="body2" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    Ghi chú: {selectedPlanNote}
                  </Typography>
                )}
              </Stack>
            </Paper>
          )}

          {selectedPlanIsActive && (
            <Alert severity="warning">
              Bạn đang áp dụng vào Decision Plan đang hoạt động. Hãy kiểm tra kỹ trước khi xác nhận.
            </Alert>
          )}
          {selectedPlanIsClosedOrArchived && (
            <Alert severity="warning">
              Plan này đã đóng/lưu trữ. Chỉ áp dụng nếu bạn có chủ đích test hoặc cập nhật lịch sử.
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Trường</TableCell>
                  <TableCell align="right">Giá trị hiện tại</TableCell>
                  <TableCell align="right">Giá trị từ kịch bản</TableCell>
                  <TableCell align="center">Áp dụng</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <ApplyPreviewRow
                  label="Fair value"
                  oldValue={selectedPlan?.fairValue}
                  newValue={scenario?.fairValue}
                  checked={flags.fairValue}
                  onChange={(checked) => setFlags((current) => ({ ...current, fairValue: checked }))}
                />
                <ApplyPreviewRow
                  label="Giá mua mục tiêu"
                  oldValue={selectedPlan?.targetBuyPrice}
                  newValue={scenario?.targetBuyPrice}
                  checked={flags.targetBuyPrice}
                  onChange={(checked) => setFlags((current) => ({ ...current, targetBuyPrice: checked }))}
                />
                <ApplyPreviewRow
                  label="Giá bán mục tiêu"
                  oldValue={selectedPlan?.targetSellPrice}
                  newValue={scenario?.targetSellPrice}
                  checked={flags.targetSellPrice}
                  onChange={(checked) => setFlags((current) => ({ ...current, targetSellPrice: checked }))}
                />
              </TableBody>
            </Table>
          </TableContainer>

          <FormControlLabel
            control={
              <Checkbox
                checked={confirmedTarget}
                onChange={(event) => setConfirmedTarget(event.target.checked)}
                disabled={saving || loading || !selectedPlanId}
              />
            }
            label="Tôi đã kiểm tra đúng Decision Plan cần cập nhật"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        <Button variant="contained" onClick={() => void apply()} disabled={saving || loading || !selectedPlanId || !confirmedTarget}>
          {saving ? <CircularProgress size={22} /> : "Áp dụng"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#f8fbff" }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography sx={{ fontWeight: 700 }}>{value}</Typography>
    </Paper>
  );
}

function ApplyPreviewRow({
  label,
  oldValue,
  newValue,
  checked,
  onChange,
}: {
  label: string;
  oldValue?: number;
  newValue?: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const hasNewValue = newValue != null;
  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell align="right">{oldValue == null ? "Chưa có" : formatVndPerShare(oldValue)}</TableCell>
      <TableCell align="right">{checked && hasNewValue ? formatVndPerShare(newValue) : "-"}</TableCell>
      <TableCell align="center">
        <FormControlLabel
          label=""
          control={<Checkbox checked={checked && hasNewValue} disabled={!hasNewValue} onChange={(event) => onChange(event.target.checked)} />}
          sx={{ m: 0 }}
        />
      </TableCell>
    </TableRow>
  );
}

function validateForm(form: FormState) {
  const stockCode = form.stockCode.trim();
  const scenarioName = form.scenarioName.trim();
  const year = Number(form.valuationYear);
  const margin = optionalNumber(form.marginOfSafetyPercent);
  const targetBuyPrice = optionalNumber(form.targetBuyPrice);
  const targetSellPrice = optionalNumber(form.targetSellPrice);

  if (!stockCode) return "Mã cổ phiếu là bắt buộc.";
  if (!scenarioName) return "Tên kịch bản là bắt buộc.";
  if (!Number.isInteger(year) || year < 1900 || year > currentYear + 1) return `Năm định giá phải nằm trong khoảng 1900 - ${currentYear + 1}.`;
  if (margin !== undefined && (margin < 0 || margin > 100)) return "Margin of safety phải nằm trong khoảng 0-100%.";
  if (targetBuyPrice !== undefined && targetBuyPrice <= 0) return "Giá mua mục tiêu phải lớn hơn 0.";
  if (targetSellPrice !== undefined && targetSellPrice <= 0) return "Giá bán mục tiêu phải lớn hơn 0.";

  if (form.method === "PE") {
    if (!positiveNumber(form.eps)) return "EPS phải lớn hơn 0 cho phương pháp P/E.";
    if (!positiveNumber(form.peMultiple)) return "P/E mục tiêu phải lớn hơn 0.";
  }
  if (form.method === "PB") {
    if (!positiveNumber(form.bookValuePerShare)) return "Book value/share phải lớn hơn 0 cho phương pháp P/B.";
    if (!positiveNumber(form.pbMultiple)) return "P/B mục tiêu phải lớn hơn 0.";
  }
  if (form.method === "MANUAL" && !positiveNumber(form.fairValue)) return "Fair value phải lớn hơn 0 cho phương pháp thủ công.";

  return "";
}

function apiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 409) return "Đã có kịch bản ACTIVE trùng mã, năm và tên kịch bản.";
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (error.response?.status === 400 && message) {
      if (message.includes("confirm must be true")) return "Cần xác nhận trước khi áp dụng.";
      if (message.includes("Archived valuation scenario cannot be applied")) return "Không thể áp dụng kịch bản đã lưu trữ.";
      if (message.includes("Decision Plan does not belong")) return "Decision Plan không cùng mã cổ phiếu với kịch bản định giá.";
      if (message.includes("at least one apply flag")) return "Cần chọn ít nhất một trường giá để áp dụng.";
      if (message.includes("decisionPlanId is required")) return "Cần chọn Decision Plan trước khi áp dụng.";
      if (message.includes("No selected valuation field")) return "Các trường đã chọn không có giá trị để áp dụng.";
    }
    if (message) return message;
    if (error.response?.status === 404) return "Không tìm thấy mã cổ phiếu/kịch bản/Decision Plan.";
    if (error.response?.status === 400) return "Dữ liệu định giá chưa hợp lệ. Vui lòng kiểm tra lại.";
  }
  return "Không thể xử lý yêu cầu Valuation Scenario. Vui lòng thử lại.";
}

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function optionalNumber(value: string) {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function positiveNumber(value: string) {
  const parsed = optionalNumber(value);
  return parsed !== undefined && parsed > 0;
}

function valueString(value?: number) {
  return value == null ? "" : String(value);
}

function formatVndPerShare(value?: number) {
  return value == null || Number.isNaN(value)
    ? "-"
    : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} đ/cp`;
}

function decisionPlanNote(plan?: DecisionPlanDetail | null) {
  return plan?.personalNotes || plan?.sourceNote || plan?.notes || plan?.title || "";
}

function isTestDecisionPlan(plan?: DecisionPlanDetail | null) {
  return [plan?.personalNotes, plan?.sourceNote, plan?.notes, plan?.title]
    .some((value) => value?.toUpperCase().includes("TEST_DO_NOT_USE"));
}

function formatPercent(value?: number) {
  return value == null || Number.isNaN(value)
    ? "-"
    : `${value.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function formatDateTime(value?: string) {
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

function percentColor(value?: number) {
  if (value == null || Number.isNaN(value)) return "text.secondary";
  if (value > 0) return "success.main";
  if (value < 0) return "error.main";
  return "text.secondary";
}

function statusColor(status: ValuationScenarioStatus): "default" | "success" | "warning" {
  if (status === "ACTIVE") return "success";
  if (status === "DRAFT") return "warning";
  return "default";
}
