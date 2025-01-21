import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    common: {
      black: '#000',
      white: '#fff',
    },
    primary: {
      main: '#0174C3',
      light: '#36B4E5',
      dark: '#015A99',
      contrastText: '#fff',
    },
    secondary: {
      main: '#2BBA7E',
      light: '#5dc695',
      dark: '#007B45',
      contrastText: '#fff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
      contrastText: '#fff',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#fff',
    },
    info: {
      main: '#0288d1',
      light: '#36B4E5',
      dark: '#015A99',
      contrastText: '#fff',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#fff',
    },
    background: {
      paper: '#fff',
      default: '#fff',
    },
    grey: {
      50: '#F7F8FA',
      100: '#E9EEF1',
      200: '#D2DCE3',
      300: '#C1CBD3',
      400: '#ABB6BF',
      500: '#909CA5',
      600: '#707E86',
      700: '#5E6C75',
      800: '#48565E',
      900: '#334147',
      A100: '#f5f5f5',
      A200: '#eeeeee',
      A400: '#bdbdbd',
      A700: '#616161',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.125rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    body1: {
      fontSize: '1rem',
      color: 'rgba(0, 0, 0, 0.87)',
    },
    body2: {
      fontSize: '0.875rem',
      color: 'rgba(0, 0, 0, 0.6)',
    },
  },
});
export default theme;
