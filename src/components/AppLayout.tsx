import {
  AppBar, Avatar, Badge, Box, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Paper, Stack, Toolbar, Typography,
} from "@mui/material";
import {
  DashboardOutlined, EventNoteOutlined, ExpandMore, FolderOutlined, LightModeOutlined,
  NotificationsNoneOutlined, PieChartOutlined, QueryStatsOutlined, ShowChart, SignalCellularAlt,
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
  { label: "Danh mục đầu tư", to: "/portfolio", icon: <PieChartOutlined /> },
];

export default function AppLayout() {
  const location = useLocation();
  const now = new Date();

  return <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
    <AppBar position="fixed" color="inherit" elevation={0} sx={{ ml: `${drawerWidth}px`, width: `calc(100% - ${drawerWidth}px)`, borderBottom: 1, borderColor: "divider", bgcolor: "rgba(255,255,255,.92)", backdropFilter: "blur(10px)" }}>
      <Toolbar sx={{ minHeight: "68px !important", justifyContent: "flex-end", gap: 1 }}>
        <IconButton aria-label="Giao diện sáng"><LightModeOutlined /></IconButton>
        <IconButton aria-label="Thông báo"><Badge badgeContent={3} color="primary"><NotificationsNoneOutlined /></Badge></IconButton>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", ml: 1 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: "#eef2f7", color: "text.primary", fontSize: 14 }}>AD</Avatar>
          <ExpandMore fontSize="small" color="action" />
        </Stack>
      </Toolbar>
    </AppBar>

    <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box", borderColor: "divider", bgcolor: "#fff" } }}>
      <Toolbar sx={{ minHeight: "68px !important", px: "22px !important", borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: "primary.main", color: "white", display: "grid", placeItems: "center", mr: 1.5 }}><ShowChart /></Box>
        <Typography variant="h6" color="primary.main" sx={{ whiteSpace: "nowrap" }}>Stock Analyzer</Typography>
      </Toolbar>
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1, p: 1.5 }}>
        <List sx={{ pt: 1 }}>
          {navItems.map((item) => {
            const active = item.to === "/" ? location.pathname === item.to : location.pathname.startsWith(item.to);
            return <ListItemButton key={item.to} component={Link} to={item.to} selected={active} sx={{ borderRadius: 1.5, mb: 0.6, minHeight: 50, px: 1.5, "&.Mui-selected": { bgcolor: "#eaf3ff", color: "primary.dark" }, "&.Mui-selected:hover": { bgcolor: "#e3efff" } }}>
              <ListItemIcon sx={{ minWidth: 42, color: active ? "primary.main" : "#5d6a7e" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: active ? 700 : 500, fontSize: 14 } } }} />
            </ListItemButton>;
          })}
        </List>
        <Box sx={{ mt: "auto" }}>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#f8fbff", boxShadow: "none" }}>
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
