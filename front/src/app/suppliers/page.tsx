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
import SupplierForm from '@/components/SupplierForm';
import SupplierTable from '@/components/SupplierTable';
import { api } from '@/lib/api';
import { Supplier, SupplierQuery } from '@/types/supplier';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
  const [editSupplier, setEditSupplier] = useState<Supplier | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q: SupplierQuery = { page, per_page: perPage };
      if (nameFilter) q.name_filter = nameFilter;
      if (orderBy) { q.order_by = orderBy; q.order_direction = orderDir; }
      const result = await api.listSuppliers(q);
      setSuppliers(result.data);
      setTotal(result.total);
    } catch {
      setError('Failed to load suppliers.');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, nameFilter, orderBy, orderDir]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

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

  const handleEdit = (s: Supplier) => { setEditSupplier(s); setFormKey(k => k + 1); setFormOpen(true); };
  const handleAdd = () => { setEditSupplier(undefined); setFormKey(k => k + 1); setFormOpen(true); };

  const handleFormSuccess = (msg: string) => {
    setFormOpen(false);
    setSnackbar(msg);
    fetchSuppliers();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteSupplier(deleteTarget.supplier_id);
      setSnackbar(`"${deleteTarget.company_name}" deleted.`);
      setDeleteTarget(null);
      fetchSuppliers();
    } catch {
      setSnackbar('Failed to delete supplier.');
      setDeleteTarget(null);
    }
  };

  return (
    <Box>
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
            Suppliers
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
            <Typography variant="body2" color="text.secondary">
              Manage your supplier database
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
          Add Supplier
        </Button>
      </Box>

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
        <SupplierTable
          suppliers={suppliers}
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

      <SupplierForm
        key={formKey}
        open={formOpen}
        supplier={editSupplier}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Supplier"
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
