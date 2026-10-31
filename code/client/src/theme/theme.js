import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#78A9FF',
      dark: '#4D83D8',
      light: '#20385E',
      contrastText: '#081426',
    },
    secondary: {
      main: '#45C7B8',
      dark: '#25998F',
      light: '#173F42',
      contrastText: '#071A1A',
    },
    background: {
      default: '#0B1220',
      paper: '#111C2E',
    },
    text: {
      primary: '#E8EEF8',
      secondary: '#9AAAC0',
      disabled: '#637189',
    },
    divider: '#26364D',
    action: {
      hover: 'rgba(148, 174, 210, 0.08)',
      selected: 'rgba(120, 169, 255, 0.14)',
      disabledBackground: 'rgba(148, 163, 184, 0.12)',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Inter, Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '1.75rem', fontWeight: 700 },
    h2: { fontSize: '1.5rem', fontWeight: 700 },
    h3: { fontSize: '1.25rem', fontWeight: 700 },
    h4: { fontSize: '1.125rem', fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minWidth: 320,
          backgroundColor: '#0B1220',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          boxShadow: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#34445D',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#7186A5',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#78A9FF',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: '#AAB9CE',
          fontWeight: 700,
          backgroundColor: '#162338',
        },
        root: {
          borderColor: '#26364D',
        },
      },
    },
  },
})

export default theme
