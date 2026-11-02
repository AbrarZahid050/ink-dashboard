import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4059D8',
      dark: '#3045B5',
      light: '#E8ECFF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0D9488',
      dark: '#0B766E',
      light: '#DDF5F1',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F4F6FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#17233B',
      secondary: '#68758D',
      disabled: '#A5AEC0',
    },
    divider: '#E6EAF1',
    success: { main: '#15966B', light: '#E1F5EC' },
    warning: { main: '#D58A22', light: '#FFF3DD' },
    error: { main: '#D65362', light: '#FCE9EC' },
    info: { main: '#3C83D8', light: '#E8F2FF' },
    action: {
      hover: 'rgba(47, 65, 110, 0.045)',
      selected: 'rgba(64, 89, 216, 0.09)',
      disabledBackground: 'rgba(23, 35, 59, 0.06)',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Inter, Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '1.8rem', fontWeight: 750, letterSpacing: '-0.035em', color: '#17233B' },
    h2: { fontSize: '1.5rem', fontWeight: 730, letterSpacing: '-0.025em', color: '#17233B' },
    h3: { fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#17233B' },
    h4: { fontSize: '1.125rem', fontWeight: 700, color: '#17233B' },
    subtitle1: { fontWeight: 650 },
    button: { textTransform: 'none', fontWeight: 650, letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minWidth: 320,
          backgroundColor: '#F4F6FA',
        },
        '::selection': {
          backgroundColor: 'rgba(64, 89, 216, 0.18)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #E9EDF4',
          boxShadow: '0 2px 8px rgba(22, 34, 58, 0.035)',
        },
        rounded: {
          borderRadius: 14,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E9EDF4',
          boxShadow: '0 3px 12px rgba(22, 34, 58, 0.045)',
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          minHeight: 38,
        },
        contained: {
          boxShadow: '0 2px 5px rgba(64, 89, 216, 0.16)',
          '&:hover': {
            boxShadow: '0 4px 10px rgba(64, 89, 216, 0.2)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#DCE2EC',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#AAB6CC',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#4059D8',
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid #E9EDF4',
          boxShadow: '0 2px 8px rgba(22, 34, 58, 0.025)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: '#586780',
          fontWeight: 700,
          fontSize: '0.76rem',
          letterSpacing: '0.035em',
          textTransform: 'uppercase',
          backgroundColor: '#F7F8FC',
          borderColor: '#E9EDF4',
        },
        root: {
          borderColor: '#EDF0F5',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 650,
        },
      },
    },
  },
})

export default theme
