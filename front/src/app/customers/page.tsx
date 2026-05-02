'use client';

import { useCallback, useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';

import ConfirmDialog from '@/components/ConfirmDialog';
import CustomerForm from '@/components/CustomerForm';
import CustomerTable from '@/components/CustomerTable';
import { api } from '@/lib/api';
import { Customer, CustomerQuery } from '@/types/customer';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [nameFilter, setNameFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
  const [orderDir, setOrderDir] = useState<'ASC' | 'DESC'>('ASC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q: CustomerQuery = { page, per_page: perPage };
      if (nameFilter) q.name_filter = nameFilter;
      if (orderBy) { q.order_by = orderBy; q.order_direction = orderDir; }
      const result = await api.listCustomers(q);
      setCustomers(result.data);
      setTotal(result.total);
    } catch {
      setError('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, nameFilter, orderBy, orderDir]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSearch = () => { setPage(1); setNameFilter(searchInput); };

  const handleSort = (col: string) => {
    if (orderBy === col) {
      setOrderDir(d => d === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setOrderBy(col);
      setOrderDir('ASC');
    }
    setPage(1);
  };

  const handleEdit = (c: Customer) => { setEditCustomer(c); setFormKey(k => k + 1); setFormOpen(true); };
  const handleAdd = () => { setEditCustomer(undefined); setFormKey(k => k + 1); setFormOpen(true); };

  const handleFormSuccess = (msg: string) => {
    setFormOpen(false);
    setSnackbar(msg);
    fetchCustomers();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteCustomer(deleteTarget.customer_id);
      setSnackbar(`"${deleteTarget.company_name}" deleted.`);
      setDeleteTarget(null);
      fetchCustomers();
    } catch {
      setSnackbar('Failed to delete customer.');
      setDeleteTarget(null);
    }
  };

  return (
    <Box>
      {/* Page header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}
          >
            Customers
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
            <Typography variant="body2" color="text.secondary">
              Manage your customer database
            </Typography>
            {total > 0 && (
              <Chip
                label={`${total} records`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: '#EFF6FF',
                  color: '#1565C0',
                  border: '1px solid #BFDBFE',
                }}
              />
            )}
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          size="large"
          sx={{ height: 44 }}
        >
          Add Customer
        </Button>
      </Box>

      {/* Search bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          border: '1px solid #E2E8F0',
        }}
      >
        <TextField
          size="small"
          placeholder="Search by company name…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
              </InputAdornment>
            ),
            sx: { borderRadius: 8 },
          }}
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          sx={{ height: 40, minWidth: 100 }}
        >
          Search
        </Button>
        {nameFilter && (
          <Button
            variant="text"
            color="inherit"
            size="small"
            onClick={() => { setSearchInput(''); setNameFilter(''); setPage(1); }}
            sx={{ color: 'text.secondary', minWidth: 'auto' }}
          >
            Clear
          </Button>
        )}
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <CustomerTable
          customers={customers}
          total={total}
          page={page}
          perPage={perPage}
          orderBy={orderBy}
          orderDir={orderDir}
          onSort={handleSort}
          onPageChange={setPage}
          onPerPageChange={p => { setPerPage(p); setPage(1); }}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
      )}

      <CustomerForm
        key={formKey}
        open={formOpen}
        customer={editCustomer}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.company_name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3500}
        onClose={() => setSnackbar(null)}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: { borderRadius: 3, fontWeight: 500 },
        }}
      />
    </Box>
  );
}
