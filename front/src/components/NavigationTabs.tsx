'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tab, Tabs } from '@mui/material';

export default function NavigationTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const value = pathname.startsWith('/suppliers') ? '/suppliers' : '/customers';

  return (
    <Tabs
      value={value}
      onChange={(_, v) => router.push(v)}
      sx={{
        backgroundColor: '#1565C0',
        minHeight: 44,
        '& .MuiTab-root': {
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 600,
          minHeight: 44,
          textTransform: 'none',
        },
        '& .Mui-selected': { color: '#FFFFFF !important' },
        '& .MuiTabs-indicator': { backgroundColor: '#90CAF9', height: 3 },
      }}
    >
      <Tab label="Customers" value="/customers" />
      <Tab label="Suppliers" value="/suppliers" />
    </Tabs>
  );
}
