import { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Card, CardContent, Chip, Divider, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import { TrendingUpOutlined } from "@mui/icons-material";
import { marketIndexApi } from "../api/marketIndexApi";
import type { MarketRegime, MarketRegimeResponse } from "../types/marketIndex";

const INDEX_CODES = ["VNINDEX", "VN30", "HNXINDEX"] as const;

const regimeLabel: Record<string, string> = {
  BULL: "Tăng",
  BULL_SHORT_TERM: "Tăng (ngắn hạn)",
  BEAR: "Giảm",
  BEAR_SHORT_TERM: "Giảm (ngắn hạn)",
  SIDEWAYS: "Đi ngang",
  NOT_ENOUGH_DATA: "Chưa đủ dữ liệu",
};

const regimeColor: Record<string, "success" | "error" | "warning" | "default"> = {
  BULL: "success",
  BULL_SHORT_TERM: "success",
  BEAR: "error",
  BEAR_SHORT_TERM: "error",
  SIDEWAYS: "warning",
  NOT_ENOUGH_DATA: "default",
};

function interpretationText(regime: MarketRegime | null): string {
  if (!regime) return "Chưa đủ dữ liệu index để diễn giải bối cảnh thị trường.";
  switch (regime) {
    case "BULL":
    case "BULL_SHORT_TERM":
      return "Thị trường đang ở trạng thái tăng. Alpha âm có thể xuất hiện nếu cổ phiếu tín hiệu không bắt kịp chỉ số.";
    case "BEAR":
    case "BEAR_SHORT_TERM":
      return "Thị trường đang yếu. Cần đọc alpha cùng rủi ro giảm chung của thị trường.";
    case "SIDEWAYS":
      return "Thị trường đi ngang. Relative strength của từng mã quan trọng hơn hướng chỉ số.";
    default:
      return "Chưa đủ dữ liệu index để diễn giải bối cảnh thị trường.";
  }
}

function fmtPct(value: number | null): string {
  if (value == null) return "—";
  return `${value.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function fmtClose(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(value: string | null): string {
  return value ?? "—";
}

function pctColor(value: number | null): string {
  if (value == null || value === 0) return "inherit";
  return value > 0 ? "#17974c" : "#d32f2f";
}

export default function MarketContextCard() {
  const [data, setData] = useState<Map<string, MarketRegimeResponse>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        INDEX_CODES.map((code) => marketIndexApi.getRegime(code))
      );
      const next = new Map<string, MarketRegimeResponse>();
      results.forEach((r, i) => {
        if (r.status === "fulfilled") next.set(INDEX_CODES[i], r.value);
      });
      if (next.size === 0) setError("Không tải được dữ liệu chỉ số thị trường.");
      setData(next);
    } catch {
      setError("Không tải được dữ liệu chỉ số thị trường.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const vnindex = data.get("VNINDEX");

  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "#173f7a", mb: 2 }}>
          <TrendingUpOutlined />
          <Typography variant="h6" color="text.primary" sx={{ fontSize: 17 }}>
            Bối cảnh thị trường
          </Typography>
        </Stack>

        {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

        {!loading && data.size > 0 && (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Chỉ số</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Điểm đóng cửa</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Ngày dữ liệu</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Hiệu suất 7D</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Hiệu suất 30D</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Trạng thái thị trường</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {INDEX_CODES.map((code) => {
                    const row = data.get(code);
                    if (!row) return null;
                    const regime = row.regime;
                    return (
                      <TableRow key={code}>
                        <TableCell sx={{ fontWeight: 700 }}>{code}</TableCell>
                        <TableCell align="right">{fmtClose(row.latestClose)}</TableCell>
                        <TableCell>{fmtDate(row.latestDate)}</TableCell>
                        <TableCell align="right" sx={{ color: pctColor(row.return7d), fontWeight: 600 }}>
                          {fmtPct(row.return7d)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: pctColor(row.return30d), fontWeight: 600 }}>
                          {fmtPct(row.return30d)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={regimeLabel[regime] ?? "—"}
                            color={regimeColor[regime] ?? "default"}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 1.5, px: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                Nguồn dữ liệu: DNSE Chart API
              </Typography>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Alert severity="info" icon={false} sx={{ bgcolor: "#f5f9ff", "& .MuiAlert-message": { width: "100%" } }}>
              <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary" }}>
                {interpretationText(vnindex?.regime ?? null)}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
                Tín hiệu mô phỏng — Không phải khuyến nghị đầu tư.
              </Typography>
            </Alert>
          </>
        )}

        {loading && (
          <Typography variant="body2" color="text.secondary">
            Đang tải dữ liệu thị trường…
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
