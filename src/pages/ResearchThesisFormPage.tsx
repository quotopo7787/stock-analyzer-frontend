import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createResearchThesisDraftId,
  researchThesisDraftStorage,
} from "../api/researchThesisDraftStorage";
import { investmentThesisApi } from "../api/investmentThesisApi";
import { watchlistApi } from "../api/watchlistApi";
import type { InvestmentThesis } from "../types/investmentThesis";
import type { ResearchThesisDraft, ResearchThesisStatus } from "../types/researchThesis";
import type { ReactNode } from "react";

const statusOptions: Array<{ value: ResearchThesisStatus; label: string }> = [
  { value: "DRAFT", label: "Bản nháp" },
  { value: "RESEARCHING", label: "Đang nghiên cứu" },
  { value: "WATCHLIST", label: "Theo dõi" },
  { value: "WAITING_DATA", label: "Chờ bổ sung dữ liệu" },
  { value: "REJECTED", label: "Đã loại bỏ" },
];

const emptyDraft = (stockCode = ""): ResearchThesisDraft => {
  const now = new Date().toISOString();
  return {
    id: createResearchThesisDraftId("MANUAL"),
    stockCode,
    thesisStatus: "DRAFT",
    bullCase: [],
    bearCase: [],
    keyRisks: [],
    missingData: [],
    buyConditions: [],
    rejectConditions: [],
    personalNote: "",
    nextReviewDate: "",
    source: "MANUAL",
    createdAt: now,
    updatedAt: now,
  };
};

export default function ResearchThesisFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draftId");
  const thesisId = Number(searchParams.get("thesisId") || 0) || null;
  const stockCodeParam = searchParams.get("stockCode")?.trim().toUpperCase() ?? "";
  const initialDraft = useMemo(
    () => (draftId ? researchThesisDraftStorage.getById(draftId) ?? emptyDraft() : emptyDraft(stockCodeParam)),
    [draftId, stockCodeParam]
  );

  const [draft, setDraft] = useState<ResearchThesisDraft>(initialDraft);
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDraft(initialDraft);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialDraft]);

  useEffect(() => {
    if (!thesisId) return;

    let ignore = false;
    investmentThesisApi
      .getById(thesisId)
      .then((thesis) => {
        if (!ignore) {
          setDraft(investmentThesisToDraft(thesis));
        }
      })
      .catch((error) => {
        console.error(error);
        if (!ignore) {
          setErrorMessage("Không tải được hồ sơ nghiên cứu từ backend.");
        }
      });

    return () => {
      ignore = true;
    };
  }, [thesisId]);

  const updateField = <K extends keyof ResearchThesisDraft>(field: K, value: ResearchThesisDraft[K]) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isEditing = Boolean(draftId || thesisId || draft.backendId);

  const saveDraft = async () => {
    const stockCode = draft.stockCode.trim().toUpperCase();
    const validationError = validateDraft(draft);
    if (validationError) {
      setErrorMessage(validationError);
      setSavedMessage("");
      return;
    }

    try {
      const saved = await persistDraftToBackend({
        ...draft,
        stockCode,
        id: draft.id.includes("MANUAL") && stockCode ? createResearchThesisDraftId(stockCode) : draft.id,
      });

      setDraft(saved);
      setErrorMessage("");
      setSavedMessage(isEditing ? "Đã cập nhật hồ sơ nghiên cứu." : "Đã lưu hồ sơ nghiên cứu.");
    } catch (err) {
      console.error(err);
      setSavedMessage("");
      setErrorMessage("Không lưu được hồ sơ nghiên cứu.");
    }
  };

  const addToWatchlist = async () => {
    const stockCode = draft.stockCode.trim().toUpperCase();
    if (!stockCode) {
      setSavedMessage("");
      setErrorMessage("Bạn cần nhập mã cổ phiếu trước khi đưa vào danh sách theo dõi.");
      return;
    }

    try {
      setWatchlistLoading(true);
      setSavedMessage("");
      setErrorMessage("");

      const saved = await persistDraftToBackend({
        ...draft,
        stockCode,
        id: draft.id.includes("MANUAL") && stockCode ? createResearchThesisDraftId(stockCode) : draft.id,
        thesisStatus: "WATCHLIST",
      });
      setDraft(saved);

      if (!saved.backendId) {
        throw new Error("Backend chưa trả về thesis id.");
      }

      await watchlistApi.addFromThesis(saved.backendId);
      setSavedMessage(`Đã thêm ${stockCode} vào danh sách theo dõi.`);
    } catch (err) {
      console.error(err);
      setSavedMessage("");
      setErrorMessage("Không thêm được hồ sơ vào danh sách theo dõi.");
    } finally {
      setWatchlistLoading(false);
    }
  };

  return (
    <Box sx={{ textAlign: "left" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3, justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Hồ sơ nghiên cứu
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 860 }}>
            Biến một mã đã lọc thành hồ sơ nghiên cứu có điều kiện mua, điều kiện loại bỏ, dữ liệu cần kiểm tra và lịch review tiếp theo.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate("/opportunities")}>
            Quay lại Cơ hội
          </Button>
          <Button variant="outlined" onClick={() => navigate("/investment-thesis")}>
            Lịch sử hồ sơ
          </Button>
        </Stack>
      </Stack>

      {draft.source === "OPPORTUNITIES" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Hồ sơ này được prefill từ màn Cơ hội. Bạn vẫn cần đọc báo cáo và tự hoàn thiện trước khi ra quyết định.
        </Alert>
      )}

      {savedMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {savedMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      <Snackbar
        open={Boolean(savedMessage)}
        autoHideDuration={3200}
        onClose={() => setSavedMessage("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSavedMessage("")}>
          {savedMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={4200}
        onClose={() => setErrorMessage("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="error" variant="filled" onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      </Snackbar>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6">{isEditing ? "Sửa hồ sơ nghiên cứu" : "Tạo hồ sơ nghiên cứu"}</Typography>
              {isEditing && draft.stockCode && (
                <Typography variant="body2" color="text.secondary">
                  Đang sửa: {draft.stockCode}
                </Typography>
              )}
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="contained" onClick={saveDraft}>
                Lưu hồ sơ nghiên cứu
              </Button>
              <Button variant="outlined" onClick={addToWatchlist} disabled={watchlistLoading}>
                {watchlistLoading ? "Đang thêm..." : "Đưa vào danh sách theo dõi"}
              </Button>
              <Button variant="outlined" onClick={() => navigate("/watchlist")}>
                Mở danh sách theo dõi
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        <SectionCard title="Thông tin chung">
          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "220px 260px 220px 1fr" },
                gap: 2,
                alignItems: "center",
              }}
            >
              <TextField
                label="Mã cổ phiếu"
                value={draft.stockCode}
                onChange={(event) => updateField("stockCode", event.target.value.toUpperCase())}
              />
              <TextField
                select
                label="Trạng thái hồ sơ"
                value={draft.thesisStatus}
                onChange={(event) => updateField("thesisStatus", event.target.value as ResearchThesisStatus)}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Ngày review tiếp theo"
                type="date"
                value={draft.nextReviewDate}
                onChange={(event) => updateField("nextReviewDate", event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              {draft.sourceMeta && (
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
                  {draft.sourceMeta.decision && (
                    <Chip size="small" label={`Trạng thái: ${decisionLabel(draft.sourceMeta.decision)}`} />
                  )}
                  {draft.sourceMeta.researchReadiness && (
                    <Chip size="small" label={`Nghiên cứu: ${researchReadinessLabel(draft.sourceMeta.researchReadiness)}`} />
                  )}
                  {draft.sourceMeta.conclusionConfidenceLevel && (
                    <Chip size="small" label={`Tin cậy: ${confidenceLabel(draft.sourceMeta.conclusionConfidenceLevel)}`} />
                  )}
                </Stack>
              )}
            </Box>
          </Stack>
        </SectionCard>

        <SectionCard title="Luận điểm đầu tư">
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
            <TextAreaList
              label="Luận điểm tích cực"
              value={draft.bullCase}
              onChange={(value) => updateField("bullCase", value)}
              helperText="Mỗi dòng là một luận điểm tích cực."
            />
            <TextAreaList
              label="Luận điểm tiêu cực / điểm chưa chắc"
              value={draft.bearCase}
              onChange={(value) => updateField("bearCase", value)}
              helperText="Mỗi dòng là một luận điểm phản biện hoặc điểm chưa chắc."
            />
          </Box>
        </SectionCard>

        <SectionCard title="Rủi ro & dữ liệu cần kiểm tra">
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
            <TextAreaList
              label="Rủi ro chính"
              value={draft.keyRisks}
              onChange={(value) => updateField("keyRisks", value)}
              helperText="Prefill từ rủi ro chính nếu tạo từ Opportunities."
            />
            <TextAreaList
              label="Dữ liệu/câu hỏi cần kiểm tra thêm"
              value={draft.missingData}
              onChange={(value) => updateField("missingData", value)}
              helperText="Các cảnh báo dữ liệu, câu hỏi còn mở và chỉ số ngành cần bổ sung."
            />
          </Box>
        </SectionCard>

        <SectionCard title="Điều kiện hành động">
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
            <TextAreaList
              label="Điều kiện để cân nhắc mua"
              value={draft.buyConditions}
              onChange={(value) => updateField("buyConditions", value)}
              helperText="Điều kiện cần đúng trước khi cân nhắc mua."
            />
            <TextAreaList
              label="Điều kiện để loại bỏ"
              value={draft.rejectConditions}
              onChange={(value) => updateField("rejectConditions", value)}
              helperText="Điều kiện khiến hồ sơ bị loại bỏ."
            />
          </Box>
        </SectionCard>

        <SectionCard title="Ghi chú cá nhân">
            <TextField
              label="Ghi chú cá nhân"
              value={draft.personalNote}
              onChange={(event) => updateField("personalNote", event.target.value)}
              multiline
              minRows={4}
              fullWidth
            />
        </SectionCard>
      </Stack>
    </Box>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

function validateDraft(draft: ResearchThesisDraft) {
  if (!draft.stockCode.trim()) {
    return "Bạn cần nhập mã cổ phiếu.";
  }

  if (!draft.thesisStatus) {
    return "Bạn cần chọn trạng thái hồ sơ.";
  }

  if (draft.bullCase.length === 0) {
    return "Bạn cần nhập ít nhất một luận điểm tích cực.";
  }

  if (!draft.nextReviewDate) {
    return "Bạn cần chọn ngày review tiếp theo.";
  }

  return "";
}

function TextAreaList({
  label,
  value,
  onChange,
  helperText,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  helperText?: string;
}) {
  return (
    <TextField
      label={label}
      value={value.join("\n")}
      onChange={(event) => onChange(splitLines(event.target.value))}
      multiline
      minRows={4}
      fullWidth
      helperText={helperText}
    />
  );
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

async function persistDraftToBackend(draft: ResearchThesisDraft) {
  const saved = await investmentThesisApi.saveManual({
    id: draft.backendId,
    stockCode: draft.stockCode.trim().toUpperCase(),
    year: draft.year ?? new Date().getFullYear(),
    thesisStatus: draft.thesisStatus,
    bullCase: draft.bullCase,
    bearCase: draft.bearCase,
    keyRisks: draft.keyRisks,
    missingData: draft.missingData,
    buyConditions: draft.buyConditions,
    rejectConditions: draft.rejectConditions,
    personalNote: draft.personalNote,
    nextReviewDate: draft.nextReviewDate,
    source: draft.source ?? "MANUAL",
  });

  const nextDraft = investmentThesisToDraft(saved, draft.id);
  return researchThesisDraftStorage.save(nextDraft);
}

function investmentThesisToDraft(thesis: InvestmentThesis, existingId?: string): ResearchThesisDraft {
  return {
    id: existingId ?? `BE-${thesis.id}`,
    backendId: thesis.id,
    stockCode: thesis.stockCode,
    year: thesis.year,
    thesisStatus: normalizeResearchStatus(thesis.thesisStatus ?? thesis.decision),
    bullCase: thesis.bullCase ?? [],
    bearCase: thesis.bearCase ?? [],
    keyRisks: thesis.keyRisks ?? thesis.redFlags ?? [],
    missingData: thesis.missingData ?? thesis.researchQuestions ?? [],
    buyConditions: thesis.buyConditions ?? [],
    rejectConditions: thesis.rejectConditions ?? [],
    personalNote: thesis.personalNote ?? "",
    nextReviewDate: thesis.nextReviewDate ?? "",
    source: thesis.source === "OPPORTUNITIES" ? "OPPORTUNITIES" : "MANUAL",
    createdAt: thesis.createdAt,
    updatedAt: thesis.updatedAt ?? thesis.createdAt,
  };
}

function normalizeResearchStatus(value?: string): ResearchThesisStatus {
  if (value === "RESEARCHING" || value === "WATCHLIST" || value === "WAITING_DATA" || value === "REJECTED") {
    return value;
  }
  return "DRAFT";
}

function decisionLabel(value: string) {
  const labels: Record<string, string> = {
    WATCHLIST: "Theo dõi",
    REVIEW: "Cần review",
    AVOID: "Tạm tránh",
    RESEARCH_NOW: "Nghiên cứu ngay",
  };
  return labels[value] ?? value;
}

function researchReadinessLabel(value: string) {
  const labels: Record<string, string> = {
    READY_FOR_RESEARCH: "Nghiên cứu",
    WATCH_ONLY: "Theo dõi",
    PRELIMINARY_ONLY: "Sơ bộ",
    LOW_CONFIDENCE_DATA: "Dữ liệu yếu",
    AVOID_FOR_NOW: "Tạm tránh",
  };
  return labels[value] ?? value;
}

function confidenceLabel(value: string) {
  const labels: Record<string, string> = {
    HIGH: "Cao",
    MEDIUM: "Trung bình",
    LOW: "Thấp",
  };
  return labels[value] ?? value;
}
