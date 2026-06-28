import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Box, Tooltip, Typography } from "@mui/material";
import type { ReactNode } from "react";

type MetricTooltipProps = {
  label: ReactNode;
  title: ReactNode;
};

export default function MetricTooltip({ label, title }: MetricTooltipProps) {
  return (
    <Tooltip title={title} arrow placement="top">
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.4,
          cursor: "help",
          verticalAlign: "middle",
        }}
      >
        <Typography component="span" variant="inherit">
          {label}
        </Typography>
        <InfoOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
      </Box>
    </Tooltip>
  );
}
