import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1769e0", dark: "#0b4eb3", light: "#e9f2ff" },
    success: { main: "#12824a", light: "#e7f6ed" },
    warning: { main: "#ea7a12", light: "#fff3e6" },
    error: { main: "#d83a42", light: "#fff0f1" },
    background: { default: "#f3f6fb", paper: "#ffffff" },
    text: { primary: "#101828", secondary: "#667085" },
    divider: "#e6edf5",
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Inter, "Segoe UI", Roboto, Arial, sans-serif',
    h4: { fontWeight: 760, letterSpacing: 0, color: "#0b1f3a" },
    h5: { fontWeight: 730, letterSpacing: 0, color: "#0b1f3a" },
    h6: { fontWeight: 730, letterSpacing: 0, color: "#0b1f3a" },
    button: { fontWeight: 650, textTransform: "none" },
    body2: { lineHeight: 1.55 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(circle at 16% -8%, rgba(23, 105, 224, 0.14), transparent 28%), radial-gradient(circle at 88% 4%, rgba(18, 130, 74, 0.10), transparent 24%), linear-gradient(180deg, #f8fbff 0%, #f3f6fb 46%, #eef3f8 100%)",
        },
        "::selection": {
          backgroundColor: "rgba(23, 105, 224, 0.16)",
        },
        "*": {
          scrollbarWidth: "thin",
          scrollbarColor: "#c8d4e4 transparent",
        },
        "*::-webkit-scrollbar": { width: 8, height: 8 },
        "*::-webkit-scrollbar-thumb": { background: "#c8d4e4", borderRadius: 999 },
        "*::-webkit-scrollbar-track": { background: "transparent" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(16, 24, 40, 0.08)",
          boxShadow: "0 12px 34px rgba(16, 24, 40, 0.07)",
          borderRadius: 16,
          backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(251,253,255,0.96) 100%)",
          backdropFilter: "blur(12px)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: "0 0 auto 0",
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(23,105,224,0.28), transparent)",
            pointerEvents: "none",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 16 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          minHeight: 38,
          transition: "transform .16s ease, box-shadow .16s ease, background-color .16s ease, border-color .16s ease",
          "&:hover": { transform: "translateY(-1px)" },
        },
        contained: {
          backgroundImage: "linear-gradient(135deg, #1d7fff 0%, #0b55c6 100%)",
          boxShadow: "0 10px 22px rgba(23, 105, 224, 0.22)",
          "&:hover": { boxShadow: "0 14px 28px rgba(23, 105, 224, 0.28)" },
        },
        outlined: {
          borderColor: "#cbd7e6",
          backgroundColor: "#ffffff",
          "&:hover": { backgroundColor: "#f7fbff", borderColor: "#9db6d8" },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
        variant: "outlined",
        slotProps: { inputLabel: { shrink: true } },
      },
    },
    MuiInputLabel: {
      defaultProps: { shrink: true },
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          paddingInline: 4,
          color: "#667085",
          fontSize: 13,
          fontWeight: 550,
          "&.Mui-focused": { color: "#1769e0" },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: "#ffffff",
          textAlign: "left",
          boxShadow: "inset 0 1px 0 rgba(16, 24, 40, 0.02)",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#9db6d8",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#1769e0",
            borderWidth: 1,
          },
          "&.Mui-focused": {
            boxShadow: "0 0 0 3px rgba(23, 105, 224, 0.08)",
          },
        },
        input: {
          textAlign: "left",
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        displayEmpty: true,
      },
      styleOverrides: {
        select: {
          minHeight: "1.4375em",
          display: "flex",
          alignItems: "center",
          textAlign: "left",
          paddingRight: "34px !important",
        },
        icon: {
          color: "#667085",
          right: 10,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          marginTop: 6,
          borderRadius: 12,
          border: "1px solid #e6edf5",
          backgroundImage: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
          boxShadow: "0 18px 46px rgba(15, 23, 42, 0.18)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: 38,
          fontSize: 14,
          borderRadius: 8,
          marginInline: 6,
          marginBlock: 2,
          "&.Mui-selected": {
            backgroundColor: "#e9f2ff",
            color: "#0b4eb3",
            fontWeight: 700,
          },
          "&.Mui-selected:hover": {
            backgroundColor: "#dbeafe",
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: "#475467",
          fontSize: 12,
          fontWeight: 750,
          backgroundColor: "#f7faff",
          borderBottom: "1px solid #e6edf5",
          whiteSpace: "nowrap",
        },
        body: {
          borderBottom: "1px solid #edf2f7",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color .14s ease",
          "&:hover td": {
            backgroundColor: "rgba(23, 105, 224, 0.035)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 9, fontWeight: 680 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 13,
          border: "1px solid rgba(16, 24, 40, 0.06)",
          boxShadow: "0 6px 18px rgba(16, 24, 40, 0.05)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 18,
          border: "1px solid rgba(16, 24, 40, 0.08)",
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.22)",
          backgroundImage: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 780,
          letterSpacing: 0,
          color: "#0b1f3a",
          paddingBottom: 10,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: "14px !important",
          border: "1px solid rgba(16, 24, 40, 0.08)",
          boxShadow: "none",
          overflow: "hidden",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 6,
          borderRadius: 999,
          backgroundColor: "#e7eef7",
        },
        bar: {
          borderRadius: 999,
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
