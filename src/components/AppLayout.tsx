import {
  AppBar, Avatar, Badge, Box, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Paper, Stack, Toolbar, Typography,
} from "@mui/material";
import {
  AccountBalanceWalletOutlined, CalculateOutlined, DashboardOutlined, EventNoteOutlined, ExpandMore, FolderOutlined, LightModeOutlined,
  NotificationsNoneOutlined, PieChartOutlined, QueryStatsOutlined, ScienceOutlined, ShowChart, SignalCellularAlt,
  StarBorderOutlined,
} from "@mui/icons-material";
import { Link, Outlet, useLocation } from "react-router-dom";

const drawerWidth = 252;
const navItems = [
  { label: "Tổng quan", to: "/", icon: <DashboardOutlined /> },
  { label: "Cơ hội", to: "/opportunities", icon: <QueryStatsOutlined /> },
  { label: "Hồ sơ nghiên cứu", to: "/investment-thesis", icon: <FolderOutlined /> },
  { label: "Watchlist", to: "/watchlist", icon: <StarBorderOutlined /> },
  { label: "Kế hoạch đầu tư", to: "/decision-plans", icon: <EventNoteOutlined /> },
  { label: "Định giá", to: "/valuation-scenarios", icon: <CalculateOutlined /> },
  { label: "Danh mục đầu tư", to: "/portfolio", icon: <PieChartOutlined /> },
  { label: "Phân bổ vốn", to: "/portfolio-allocation", icon: <AccountBalanceWalletOutlined /> },
  { label: "Paper Trading", to: "/paper-trading", icon: <ScienceOutlined /> },
  { label: "Backtest tín hiệu", to: "/backtest", icon: <ScienceOutlined /> },
  { label: "Bảng giá realtime", to: "/realtime", icon: <ShowChart /> },
];

export default function AppLayout() {
  const location = useLocation();
  const now = new Date();

  return <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        ml: `${drawerWidth}px`,
        width: `calc(100% - ${drawerWidth}px)`,
        borderBottom: 0,
        bgcolor: "rgba(255,255,255,.92)",
        backdropFilter: "blur(10px)",
        boxShadow: "inset 0 -1px 0 rgba(15, 23, 42, 0.045)",
      }}
    >
      <Toolbar sx={{ minHeight: "68px !important", justifyContent: "flex-end", gap: 1 }}>
        <IconButton aria-label="Giao diện sáng"><LightModeOutlined /></IconButton>
        <IconButton aria-label="Thông báo"><Badge badgeContent={3} color="primary"><NotificationsNoneOutlined /></Badge></IconButton>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", ml: 1 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: "#eef2f7", color: "text.primary", fontSize: 14 }}>AD</Avatar>
          <ExpandMore fontSize="small" color="action" />
        </Stack>
      </Toolbar>
    </AppBar>

    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: 0,
          bgcolor: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            top: 68,
            right: 0,
            bottom: 0,
            width: 1,
            background: "linear-gradient(180deg, rgba(15, 23, 42, 0), rgba(15, 23, 42, 0.055) 18%, rgba(15, 23, 42, 0.045))",
            pointerEvents: "none",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 68,
            left: 22,
            right: 18,
            height: 1,
            background: "linear-gradient(90deg, rgba(15, 23, 42, 0), rgba(15, 23, 42, 0.045) 18%, rgba(15, 23, 42, 0.035) 72%, rgba(15, 23, 42, 0))",
            pointerEvents: "none",
          },
        },
      }}
    >
      <Toolbar sx={{ minHeight: "68px !important", px: "22px !important", borderBottom: 0 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1d7fff 0%, #0b55c6 100%)",
            color: "white",
            display: "grid",
            placeItems: "center",
            mr: 1.5,
            boxShadow: "0 10px 22px rgba(13, 71, 161, 0.18)",
            "& svg": { fontSize: 21 },
          }}
        >
          <ShowChart />
        </Box>
        <Typography variant="h6" color="text.primary" sx={{ whiteSpace: "nowrap", fontWeight: 800, letterSpacing: 0 }}>Stock Analyzer</Typography>
      </Toolbar>
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1, p: 1.5 }}>
        <List sx={{ pt: 1.2 }}>
          {navItems.map((item) => {
            const active = item.to === "/" ? location.pathname === item.to : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return <ListItemButton
              key={item.to}
              component={Link}
              to={item.to}
              selected={active}
              sx={{
                borderRadius: 3,
                mb: 0.45,
                minHeight: 48,
                px: 1.15,
                color: active ? "primary.dark" : "#162033",
                transition: "background-color .18s ease, color .18s ease, transform .18s ease",
                "&:hover": { bgcolor: "#f4f8ff", transform: "translateX(2px)" },
                "&.Mui-selected": { bgcolor: "#eaf3ff", color: "primary.dark" },
                "&.Mui-selected:hover": { bgcolor: "#e4efff" },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: active ? "primary.main" : "#68758a",
                  "& svg": {
                    fontSize: 22,
                    p: active ? 0.55 : 0,
                    borderRadius: active ? 2 : 0,
                    bgcolor: active ? "rgba(25, 118, 210, 0.10)" : "transparent",
                    boxSizing: "content-box",
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: active ? 750 : 560, fontSize: 14, letterSpacing: 0 } } }} />
            </ListItemButton>;
          })}
        </List>
        <Box sx={{ mt: "auto" }}>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#f8fbff", boxShadow: "none", borderColor: "rgba(15, 23, 42, 0.08)", borderRadius: 3 }}>
            <Stack direction="row" spacing={1.2} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 34, height: 34, borderRadius: 1.2, bgcolor: "white", color: "primary.main", display: "grid", placeItems: "center", border: 1, borderColor: "divider" }}><SignalCellularAlt fontSize="small" /></Box>
              <Box sx={{ minWidth: 0, flex: 1 }}><Typography variant="body2" sx={{ fontWeight: 650 }}>Dữ liệu cập nhật</Typography><Typography variant="caption" color="text.secondary">{now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} {now.toLocaleDateString("vi-VN")}</Typography></Box>
              <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "success.main" }} />
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Drawer>

    <Box component="main" sx={{ flexGrow: 1, minWidth: 0, bgcolor: "background.default" }}>
      <Toolbar sx={{ minHeight: "68px !important" }} />
      <Box sx={{ px: { xs: 2, lg: 4 }, py: 3, maxWidth: 1600, mx: "auto" }}><Outlet /></Box>
    </Box>
  </Box>;
}
