'use client';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  IconButton,
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

import { Customer } from '@/types/customer';

interface Props {
  customers: Customer[];
  total: number;
  page: number;
  perPage: number;
  orderBy?: string;
  orderDir: 'ASC' | 'DESC';
  onSort: (col: string) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onEdit: (c: Customer) => void;
  onDelete: (c: Customer) => void;
}

const SORTABLE_COLS = [
  { id: 'CompanyName', label: 'Company Name' },
  { id: 'ContactName', label: 'Contact Name' },
  { id: 'City', label: 'City' },
  { id: 'Country', label: 'Country' },
];

export default function CustomerTable({
  customers,
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
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map(c => (
              <TableRow key={c.customer_id}>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: '#0F172A' }}
                  >
                    {c.company_name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ color: '#334155' }}>{c.contact_name ?? '—'}</TableCell>
                <TableCell sx={{ color: '#334155' }}>{c.city ?? '—'}</TableCell>
                <TableCell>
                  {c.country ? (
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
                      {c.country}
                    </Box>
                  ) : '—'}
                </TableCell>
                <TableCell sx={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                  {c.phone ?? '—'}
                </TableCell>
                <TableCell align="right" sx={{ pr: 1 }}>
                  <Tooltip title="Edit" placement="top">
                    <IconButton
                      size="small"
                      onClick={() => onEdit(c)}
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
                      onClick={() => onDelete(c)}
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
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8, color: '#94A3B8' }}>
                  No customers found.
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
