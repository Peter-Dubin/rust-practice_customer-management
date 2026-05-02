'use client';

import { ReactNode } from 'react';
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from '@mui/material';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import NavigationTabs from '@/components/NavigationTabs';

const theme = createTheme({
  palette: {
    primary: { main: '#1565C0' },
    background: { default: '#F1F5F9', paper: '#FFFFFF' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
    button: { textTransform: 'none' as const, fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, paddingLeft: 20, paddingRight: 20 },
        contained: {
          boxShadow: '0 2px 8px rgba(21,101,192,0.25)',
          '&:hover': { boxShadow: '0 4px 14px rgba(21,101,192,0.35)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#1565C0',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: '0.8rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          borderBottom: 'none',
          padding: '14px 16px',
        },
        body: {
          fontSize: '0.875rem',
          borderBottom: '1px solid #F1F5F9',
          padding: '12px 16px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even) td': { backgroundColor: '#F8FAFF' },
          '&:hover td': { backgroundColor: '#EFF6FF !important' },
          transition: 'background 0.15s',
        },
      },
    },
    MuiTableSortLabel: {
      styleOverrides: {
        root: {
          color: 'rgba(255,255,255,0.85) !important',
          '&:hover': { color: '#FFFFFF !important' },
          '&.Mui-active': { color: '#FFFFFF !important' },
          '& .MuiTableSortLabel-icon': { color: '#90CAF9 !important' },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' as const },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16 },
      },
    },
  },
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#F1F5F9' }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppBar
            position="static"
            elevation={0}
            sx={{
              background: 'linear-gradient(120deg, #0D47A1 0%, #1976D2 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Toolbar sx={{ gap: 1.5, py: 0.5 }}>
              <PeopleAltRoundedIcon sx={{ fontSize: 26, opacity: 0.9 }} />
              <Typography
                variant="h6"
                component="div"
                sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}
              >
                Customer Management
              </Typography>
            </Toolbar>
          </AppBar>
          <NavigationTabs />
          <Container maxWidth="xl">
            <Box sx={{ mt: 3, pb: 5 }}>{children}</Box>
          </Container>
        </ThemeProvider>
      </body>
    </html>
  );
}
