import { createTheme } from "@mui/material";

export const lightTheme = createTheme({
  shape: {
    borderRadius: 6,
  },
  palette: {
    mode: "light",
    primary: {
      main: "#667eea",
      dark: "#764ba2",
      contrastText: "#fff",
    },
    secondary: {
      main: "#764ba2",
      contrastText: "#fff",
    },

    success: {
      main: "#43a047",
    },
    warning: {
      main: "#ffa726",
    },
    error: {
      main: "#e53935",
    },
  },

  typography: {
    fontFamily: "Lucida Sans Unicode",
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 700 },
    fontSize: 11,
  },

  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 18,
          boxShadow: "0 22px 64px rgba(17, 24, 39, 0.18)",
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(246,249,255,0.98) 100%)",
          overflow: "hidden",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          padding: "18px 22px 10px",
          letterSpacing: 0.2,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "14px 22px",
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "10px 22px 20px",
          gap: 8,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          "&.MuiTypography-h5": {
            color: "#667eea",
          },
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          outline: "none",
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": {
            outline: "none",
            boxShadow: "0 0 0 2px rgba(102,126,234,0.3)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": {
            outline: "none",
            boxShadow: "0 0 0 2px rgba(102,126,234,0.3)",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": {
            outline: "none",
            boxShadow: "0 0 0 2px rgba(102,126,234,0.3)",
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": { outline: "none" },
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  shape: {
    borderRadius: 6,
  },
  palette: {
    mode: "dark",
    primary: {
      main: "#7c8cf8", // slightly brighter for dark mode
      dark: "#5f6bd6",
      contrastText: "#fff",
    },
    secondary: {
      main: "#8a66c2",
      contrastText: "#fff",
    },
    background: {
      default: "#0f1115",
      paper: "#151922",
    },
    text: {
      primary: "#e6e6e6",
      secondary: "#b3b3b3",
    },
    success: { main: "#66bb6a" },
    warning: { main: "#ffb74d" },
    error: { main: "#ef5350" },
  },
  typography: {
    fontFamily: "Lucida Sans Unicode",
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 700 },
    fontSize: 11,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 6,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 18,
          boxShadow: "0 24px 68px rgba(0, 0, 0, 0.45)",
          backgroundImage:
            "linear-gradient(180deg, rgba(25,30,40,0.98) 0%, rgba(18,22,31,0.98) 100%)",
          overflow: "hidden",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          padding: "18px 22px 10px",
          letterSpacing: 0.2,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "14px 22px",
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "10px 22px 20px",
          gap: 8,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          "&.MuiTypography-h5": {
            color: "#7c8cf8",
          },
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          outline: "none",
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": {
            outline: "none",
            boxShadow: "0 0 0 2px rgba(124,140,248,0.35)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": {
            outline: "none",
            boxShadow: "0 0 0 2px rgba(124,140,248,0.35)",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": {
            outline: "none",
            boxShadow: "0 0 0 2px rgba(124,140,248,0.35)",
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": { outline: "none" },
        },
      },
    },
  },
});

export const gradientPrimary =
  "linear-gradient(90deg, #667eea 0%, #764ba2 100%)";
