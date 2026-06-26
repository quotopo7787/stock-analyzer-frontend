import { useEffect, useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { investmentThesisApi } from "../api/investmentThesisApi";
import { decisionPlanApi } from "../api/decisionPlanApi";
import { researchThesisDraftStorage } from "../api/researchThesisDraftStorage";
import { decisionPlanCreateUrl, decisionPlanOpenUrl } from "../utils/decisionPlanRouting";
import type { InvestmentThesis } from "../types/investmentThesis";
import type { ResearchThesisDraft } from "../types/researchThesis";

export default function InvestmentThesisPage() {
  const navigate = useNavigate();

  const [stockCode, setStockCode] = useState("");
  const [year, setYear] = useState(new Date().getFullYear() - 1);

  const [items, setItems] = useState<InvestmentThesis[]>([]);
  const [drafts, setDrafts] = useState<ResearchThesisDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activePlanCodes, setActivePlanCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDrafts(researchThesisDraftStorage.getAll());
      void decisionPlanApi.listAllActive()
        .then((plans) => setActivePlanCodes(new Set(plans.map((plan) => plan.stockCode.toUpperCase()))))
        .catch((err) => console.error("Không tải được ACTIVE decision plans", err));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const openDecisionPlanForThesis = (thesis: InvestmentThesis) => {
    if (activePlanCodes.has(thesis.stockCode.toUpperCase())) {
      navigate(decisionPlanOpenUrl(thesis.stockCode)); return;
    }
    navigate(decisionPlanCreateUrl({
      stockCode: thesis.stockCode, linkedThesisId: thesis.id, action: "WATCH", status: "ACTIVE",
      buyConditions: thesis.buyConditions, sellConditions: thesis.rejectConditions,
      riskNotes: thesis.keyRisks ?? thesis.redFlags, personalNotes: "Tạo từ hồ sơ nghiên cứu",
    }));
  };

  const openDecisionPlanForDraft = (draft: ResearchThesisDraft) => {
    if (activePlanCodes.has(draft.stockCode.toUpperCase())) {
      navigate(decisionPlanOpenUrl(draft.stockCode)); return;
    }
    navigate(decisionPlanCreateUrl({
      stockCode: draft.stockCode, action: "WATCH", status: "ACTIVE",
      buyConditions: draft.buyConditions, sellConditions: draft.rejectConditions,
      riskNotes: draft.keyRisks, personalNotes: "Tạo từ hồ sơ nghiên cứu",
    }));
  };

  const loadThesis = async () => {
    try {
      setLoading(true);
      setSuccessMessage("");
      setErrorMessage("");

      if (!stockCode.trim()) {
        setErrorMessage("Bạn cần nhập mã cổ phiếu để tải hồ sơ.");
        return;
      }

      const data = await investmentThesisApi.getByStockCode(
        stockCode.trim().toUpperCase()
      );

      setItems(data ?? []);
    } catch (err) {
      console.error(err);
      setErrorMessage("Không tải được hồ sơ nghiên cứu. Kiểm tra API hoặc dữ liệu backend.");
    } finally {
      setLoading(false);
    }
  };

  const generateThesis = async () => {
    try {
      setGenerating(true);
      setSuccessMessage("");
      setErrorMessage("");

      if (!stockCode.trim()) {
        navigate("/investment-thesis/new");
        return;
      }

      const normalizedStockCode = stockCode.trim().toUpperCase();
      const existingDraft = researchThesisDraftStorage.getByStockCode(normalizedStockCode);
      if (existingDraft) {
        navigate(`/investment-thesis/new?draftId=${encodeURIComponent(existingDraft.id)}`);
        return;
      }

      navigate(`/investment-thesis/new?stockCode=${encodeURIComponent(normalizedStockCode)}`);
    } catch (err) {
      console.error(err);
      setErrorMessage("Tạo hồ sơ nghiên cứu thất bại. Kiểm tra API hoặc dữ liệu backend.");
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleString("vi-VN");
    } catch {
      return value;
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 3, justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Luận điểm đầu tư
          </Typography>

          <Typography color="text.secondary">
            Tạo và xem luận điểm đầu tư theo từng mã cổ phiếu, gồm điểm tích cực, điểm tiêu cực, động lực tăng trưởng, rủi ro và câu hỏi cần nghiên cứu thêm.
          </Typography>
        </Box>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Bộ lọc và thao tác
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "4fr 3fr 5fr" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Box>
              <TextField
                label="Mã cổ phiếu"
                placeholder="VD: FPT, HPG, MWG"
                fullWidth
                value={stockCode}
                onChange={(e) => setStockCode(e.target.value.toUpperCase())}
              />
            </Box>

            <Box>
              <TextField
                label="Năm"
                type="number"
                fullWidth
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                helperText="Năm dùng để tạo hồ sơ"
              />
            </Box>

            <Box>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Button
                  variant="outlined"
                  onClick={loadThesis}
                  disabled={loading || generating}
                  sx={{ height: 56 }}
                >
                  {loading ? "Đang tải..." : "Tải hồ sơ"}
                </Button>

                <Button
                  variant="contained"
                  onClick={generateThesis}
                  disabled={loading || generating}
                  sx={{ height: 56 }}
                >
                  {generating ? "Đang tạo..." : "Tạo hồ sơ mới"}
                </Button>
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {(loading || generating) && <CircularProgress />}

      {drafts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Hồ sơ nghiên cứu đang theo dõi
          </Typography>
          <Stack spacing={2}>
            {drafts.map((draft) => (
              <ResearchDraftCard
                key={draft.id}
                draft={draft}
                onEdit={() => navigate(`/investment-thesis/new?draftId=${encodeURIComponent(draft.id)}`)}
                hasActivePlan={activePlanCodes.has(draft.stockCode.toUpperCase())}
                onDecisionPlan={() => openDecisionPlanForDraft(draft)}
              />
            ))}
          </Stack>
        </Box>
      )}

      <Stack spacing={3}>
        {items.map((item) => (
          <ThesisCard
            key={item.id}
            thesis={item}
            formatDate={formatDate}
            onOpenStock={() => navigate(`/stocks/${item.stockCode}`)}
            hasActivePlan={activePlanCodes.has(item.stockCode.toUpperCase())}
            onDecisionPlan={() => openDecisionPlanForThesis(item)}
          />
        ))}

        {items.length === 0 && drafts.length === 0 && !loading && !generating && (
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Chưa có hồ sơ nghiên cứu. Nhập mã cổ phiếu rồi bấm “Tải hồ sơ” hoặc “Tạo hồ sơ mới”.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}

function ThesisCard({
  thesis,
  formatDate,
  onOpenStock,
  hasActivePlan,
  onDecisionPlan,
}: {
  thesis: InvestmentThesis;
  formatDate: (value?: string) => string;
  onOpenStock: () => void;
  hasActivePlan: boolean;
  onDecisionPlan: () => void;
}) {
  return (
    <Card>
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 2, justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}
        >
          <Box>
            <Typography variant="h6">
              {thesis.stockCode} - Luận điểm đầu tư năm {thesis.year}
            </Typography>

            <Typography color="text.secondary">
              Tạo lúc: {formatDate(thesis.createdAt)}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Chip label={`ID: ${thesis.id}`} size="small" />

            <Button variant={hasActivePlan ? "contained" : "outlined"} color="secondary" size="small" onClick={onDecisionPlan}>
              {hasActivePlan ? "Mở kế hoạch hiện tại" : "Tạo kế hoạch đầu tư"}
            </Button>

            <Button variant="outlined" size="small" onClick={onOpenStock}>
              Xem chi tiết cổ phiếu
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: "#fafafa",
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Tóm tắt
          </Typography>

          <Typography sx={{ lineHeight: 1.7 }}>
            {thesis.summary || "-"}
          </Typography>
        </Paper>

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
          <ListBlock title="Luận điểm tích cực" items={thesis.bullCase} />
          <ListBlock title="Luận điểm tiêu cực" items={thesis.bearCase} />
          <ListBlock title="Động lực chính" items={thesis.keyDrivers} />
          <ListBlock title="Cờ đỏ rủi ro" items={thesis.redFlags} />

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
        boxSizing: "border-box",
        minWidth: 0,
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

function ResearchDraftCard({
  draft,
  onEdit,
  hasActivePlan,
  onDecisionPlan,
}: {
  draft: ResearchThesisDraft;
  onEdit: () => void;
  hasActivePlan: boolean;
  onDecisionPlan: () => void;
}) {
  return (
    <Card>
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 2, justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}
        >
          <Box>
            <Typography variant="h6">{draft.stockCode} - Hồ sơ nghiên cứu</Typography>
            <Typography color="text.secondary">
              Trạng thái: {translateResearchStatus(draft.thesisStatus)} · Ngày review tiếp: {draft.nextReviewDate || "-"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip size="small" label={translateResearchStatus(draft.thesisStatus)} variant="outlined" />
            {draft.updatedAt && <Chip size="small" label={`Cập nhật: ${formatShortDate(draft.updatedAt)}`} variant="outlined" />}
            {draft.source === "OPPORTUNITIES" && <Chip size="small" label="Nguồn: Cơ hội" variant="outlined" />}
            <Button variant={hasActivePlan ? "contained" : "outlined"} color="secondary" size="small" onClick={onDecisionPlan}>
              {hasActivePlan ? "Mở kế hoạch hiện tại" : "Tạo kế hoạch đầu tư"}
            </Button>
            <Button variant="outlined" size="small" onClick={onEdit}>
              Mở / sửa hồ sơ
            </Button>
          </Stack>
        </Stack>

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
          <ListBlock title="Luận điểm tích cực" items={draft.bullCase.slice(0, 4)} />
          <ListBlock title="Rủi ro chính" items={draft.keyRisks.slice(0, 4)} />
          <ListBlock title="Dữ liệu/câu hỏi cần kiểm tra" items={draft.missingData.slice(0, 4)} />
          <ListBlock title="Điều kiện cân nhắc mua" items={draft.buyConditions.slice(0, 4)} />
        </Box>
      </CardContent>
    </Card>
  );
}

function translateResearchStatus(value: ResearchThesisDraft["thesisStatus"]) {
  const labels: Record<ResearchThesisDraft["thesisStatus"], string> = {
    DRAFT: "Bản nháp",
    RESEARCHING: "Đang nghiên cứu",
    WATCHLIST: "Theo dõi",
    WAITING_DATA: "Chờ bổ sung dữ liệu",
    REJECTED: "Đã loại bỏ",
  };
  return labels[value] ?? value;
}

function formatShortDate(value?: string) {
  if (!value) return "-";
  return value.slice(0, 10);
}
