import { createTheme } from "@mui/material";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#667eea",
      dark: "#764ba2",
      contrastText: "#fff"
    },
    secondary: {
      main: "#764ba2",
      contrastText: "#fff"
    },
    
    success: {
      main: "#43a047"
    },
    warning: {
      main: "#ffa726"
    },
    error: {
      main: "#e53935"
    }
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
    fontSize: 11
  },

  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: {
          outline: "none",
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": {
            outline: "none",
            boxShadow: "0 0 0 2px rgba(102,126,234,0.3)"
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": {
            outline: "none",
            boxShadow: "0 0 0 2px rgba(102,126,234,0.3)"
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": {
            outline: "none",
            boxShadow: "0 0 0 2px rgba(102,126,234,0.3)"
          }
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": { outline: "none" }
        }
      }
    }
  }
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#7c8cf8", // slightly brighter for dark mode
      dark: "#5f6bd6",
      contrastText: "#fff"
    },
    secondary: {
      main: "#8a66c2",
      contrastText: "#fff"
    },
    background: {
      default: "#0f1115",
      paper: "#151922"
    },
    text: {
      primary: "#e6e6e6",
      secondary: "#b3b3b3"
    },
    success: { main: "#66bb6a" },
    warning: { main: "#ffb74d" },
    error: { main: "#ef5350" }
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
    fontSize: 11
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none"
        }
      }
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          outline: "none",
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": {
            outline: "none",
            boxShadow: "0 0 0 2px rgba(124,140,248,0.35)"
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": {
            outline: "none",
            boxShadow: "0 0 0 2px rgba(124,140,248,0.35)"
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": {
            outline: "none",
            boxShadow: "0 0 0 2px rgba(124,140,248,0.35)"
          }
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&:focus": { outline: "none" },
          "&.Mui-focusVisible": { outline: "none" }
        }
      }
    }
  }
});

export const gradientPrimary = "linear-gradient(90deg, #667eea 0%, #764ba2 100%)"
