import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8B9CFF',
      dark: '#6879E8',
      light: '#252F59',
      contrastText: '#101426',
    },
    secondary: {
      main: '#55D6C2',
      dark: '#2DB7A5',
      light: '#193F43',
      contrastText: '#09201E',
    },
    background: {
      default: '#0B1020',
      paper: '#151D30',
    },
    text: {
      primary: '#EDF1FA',
      secondary: '#9BA8C0',
      disabled: '#65728B',
    },
    divider: '#29344B',
    success: { main: '#4CCB91', light: '#173D35' },
    warning: { main: '#F0B65C', light: '#46351F' },
    error: { main: '#F07886', light: '#482832' },
    info: { main: '#75B8F5', light: '#1C3550' },
    action: {
      hover: 'rgba(177, 191, 224, 0.07)',
      selected: 'rgba(139, 156, 255, 0.14)',
      disabledBackground: 'rgba(177, 191, 224, 0.08)',
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '1.8rem', fontWeight: 750, letterSpacing: '-0.035em', color: '#EDF1FA' },
    h2: { fontSize: '1.5rem', fontWeight: 730, letterSpacing: '-0.025em', color: '#EDF1FA' },
    h3: { fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#EDF1FA' },
    h4: { fontSize: '1.125rem', fontWeight: 700, color: '#EDF1FA' },
    subtitle1: { fontWeight: 650 },
    button: { textTransform: 'none', fontWeight: 650, letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { minWidth: 320, backgroundColor: '#0B1020' },
        '::selection': { backgroundColor: 'rgba(139, 156, 255, 0.28)' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #29344B',
          boxShadow: '0 5px 18px rgba(0, 0, 0, 0.16)',
        },
        rounded: { borderRadius: 14 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #29344B',
          backgroundColor: '#151D30',
          boxShadow: '0 5px 18px rgba(0, 0, 0, 0.16)',
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, boxShadow: 'none', minHeight: 38 },
        contained: {
          boxShadow: '0 3px 10px rgba(0, 0, 0, 0.18)',
          '&:hover': { boxShadow: '0 5px 14px rgba(0, 0, 0, 0.24)' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#10182A',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#35415B' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#64728F' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#8B9CFF',
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid #29344B',
          backgroundColor: '#151D30',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: '#AAB6CE',
          fontWeight: 700,
          fontSize: '0.76rem',
          letterSpacing: '0.035em',
          textTransform: 'uppercase',
          backgroundColor: '#1B263B',
          borderColor: '#29344B',
        },
        root: { borderColor: '#29344B' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 650 },
      },
    },
  },
})

export default theme
