'use client';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  IconButton,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';

import { Supplier } from '@/types/supplier';

interface Props {
  suppliers: Supplier[];
  total: number;
  page: number;
  perPage: number;
  orderBy?: string;
  orderDir: 'ASC' | 'DESC';
  onSort: (col: string) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onEdit: (s: Supplier) => void;
  onDelete: (s: Supplier) => void;
}

const SORTABLE_COLS = [
  { id: 'CompanyName', label: 'Company Name' },
  { id: 'ContactName', label: 'Contact Name' },
  { id: 'City', label: 'City' },
  { id: 'Country', label: 'Country' },
];

export default function SupplierTable({
  suppliers,
  total,
  page,
  perPage,
  orderBy,
  orderDir,
  onSort,
  onPageChange,
  onPerPageChange,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {SORTABLE_COLS.map(col => (
                <TableCell key={col.id}>
                  <TableSortLabel
                    active={orderBy === col.id}
                    direction={orderBy === col.id ? (orderDir.toLowerCase() as 'asc' | 'desc') : 'asc'}
                    onClick={() => onSort(col.id)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Phone</TableCell>
              <TableCell>Home Page</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers.map(s => (
              <TableRow key={s.supplier_id}>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: '#0F172A' }}
                  >
                    {s.company_name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ color: '#334155' }}>{s.contact_name ?? '—'}</TableCell>
                <TableCell sx={{ color: '#334155' }}>{s.city ?? '—'}</TableCell>
                <TableCell>
                  {s.country ? (
                    <Box
                      component="span"
                      sx={{
                        px: 1.25,
                        py: 0.4,
                        borderRadius: 10,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                      }}
                    >
                      {s.country}
                    </Box>
                  ) : '—'}
                </TableCell>
                <TableCell sx={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                  {s.phone ?? '—'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.82rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.home_page ? (
                    <Link href={s.home_page} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ color: '#1565C0' }}>
                      {s.home_page}
                    </Link>
                  ) : '—'}
                </TableCell>
                <TableCell align="right" sx={{ pr: 1 }}>
                  <Tooltip title="Edit" placement="top">
                    <IconButton
                      size="small"
                      onClick={() => onEdit(s)}
                      sx={{
                        color: '#64748B',
                        '&:hover': { backgroundColor: '#EFF6FF', color: '#1565C0' },
                        mr: 0.5,
                      }}
                    >
                      <EditIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete" placement="top">
                    <IconButton
                      size="small"
                      onClick={() => onDelete(s)}
                      sx={{
                        color: '#94A3B8',
                        '&:hover': { backgroundColor: '#FEF2F2', color: '#DC2626' },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {suppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8, color: '#94A3B8' }}>
                  No suppliers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        rowsPerPage={perPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={(_, p) => onPageChange(p + 1)}
        onRowsPerPageChange={e => onPerPageChange(parseInt(e.target.value, 10))}
        sx={{ borderTop: '1px solid #F1F5F9', color: '#64748B' }}
      />
    </Paper>
  );
}
