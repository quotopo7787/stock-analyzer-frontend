import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { Link, Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Stock Analyzer
          </Typography>

          <Button color="inherit" component={Link} to="/">
            Tổng quan
          </Button>

          <Button color="inherit" component={Link} to="/stocks">
            Cổ phiếu
          </Button>

          <Button color="inherit" component={Link} to="/financial-statements/new">
            Nhập BCTC
          </Button>

          <Button color="inherit" component={Link} to="/rankings">
            Xếp hạng
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}