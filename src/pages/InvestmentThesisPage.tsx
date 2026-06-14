import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { investmentThesisApi } from "../api/investmentThesisApi";
import type { InvestmentThesis } from "../types/investmentThesis";

export default function InvestmentThesisPage() {
  const navigate = useNavigate();

  const [stockCode, setStockCode] = useState("");
  const [year, setYear] = useState(new Date().getFullYear() - 1);

  const [items, setItems] = useState<InvestmentThesis[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const validate = () => {
    if (!stockCode.trim()) {
      return "Bạn cần nhập mã cổ phiếu.";
    }

    if (!year || year < 2000) {
      return "Năm không hợp lệ.";
    }

    return "";
  };

  const loadThesis = async () => {
    try {
      setLoading(true);
      setSuccessMessage("");
      setErrorMessage("");

      if (!stockCode.trim()) {
        setErrorMessage("Bạn cần nhập mã cổ phiếu để tải thesis.");
        return;
      }

      const data = await investmentThesisApi.getByStockCode(
        stockCode.trim().toUpperCase()
      );

      setItems(data ?? []);
    } catch (err) {
      console.error(err);
      setErrorMessage("Không tải được luận điểm đầu tư. Kiểm tra API GET /api/investment-thesis/{stockCode}.");
    } finally {
      setLoading(false);
    }
  };

  const generateThesis = async () => {
    try {
      setGenerating(true);
      setSuccessMessage("");
      setErrorMessage("");

      const validationError = validate();

      if (validationError) {
        setErrorMessage(validationError);
        return;
      }

      const created = await investmentThesisApi.generate(
        stockCode.trim().toUpperCase(),
        year
      );

      setSuccessMessage("Đã tạo luận điểm đầu tư thành công.");

      setItems((prev) => {
        const existed = prev.some((item) => item.id === created.id);

        if (existed) {
          return prev.map((item) => (item.id === created.id ? created : item));
        }

        return [created, ...prev];
      });
    } catch (err) {
      console.error(err);
      setErrorMessage("Tạo luận điểm đầu tư thất bại. Kiểm tra API POST /api/investment-thesis/{stockCode}/{year} hoặc dữ liệu backend.");
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
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
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

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Mã cổ phiếu"
                placeholder="VD: FPT, HPG, MWG"
                fullWidth
                value={stockCode}
                onChange={(e) => setStockCode(e.target.value.toUpperCase())}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                label="Năm"
                type="number"
                fullWidth
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                helperText="Năm dùng để tạo thesis"
              />
            </Grid>

            <Grid item xs={12} md={5}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Button
                  variant="outlined"
                  onClick={loadThesis}
                  disabled={loading || generating}
                  sx={{ height: 56 }}
                >
                  {loading ? "Đang tải..." : "Tải thesis"}
                </Button>

                <Button
                  variant="contained"
                  onClick={generateThesis}
                  disabled={loading || generating}
                  sx={{ height: 56 }}
                >
                  {generating ? "Đang tạo..." : "Tạo thesis mới"}
                </Button>
              </Stack>
            </Grid>
          </Grid>
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

      <Stack spacing={3}>
        {items.map((item) => (
          <ThesisCard
            key={item.id}
            thesis={item}
            formatDate={formatDate}
            onOpenStock={() => navigate(`/stocks/${item.stockCode}`)}
          />
        ))}

        {items.length === 0 && !loading && !generating && (
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Chưa có luận điểm đầu tư. Nhập mã cổ phiếu rồi bấm “Tải thesis” hoặc “Tạo thesis mới”.
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
}: {
  thesis: InvestmentThesis;
  formatDate: (value?: string) => string;
  onOpenStock: () => void;
}) {
  return (
    <Card>
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
          sx={{ mb: 2 }}
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