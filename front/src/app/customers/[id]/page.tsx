'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from '@mui/material';

import CustomerForm from '@/components/CustomerForm';
import { api } from '@/lib/api';
import { Customer } from '@/types/customer';

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body1">{value ?? '—'}</Typography>
    </Grid>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setCustomer(await api.getCustomer(id));
    } catch {
      setError('Customer not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !customer) {
    return <Alert severity="error">{error ?? 'Not found'}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/customers')}>
          Back
        </Button>
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
          Edit
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>{customer.company_name}</Typography>
        <Grid container spacing={2}>
          <Field label="Customer ID" value={customer.customer_id} />
          <Field label="Contact Name" value={customer.contact_name} />
          <Field label="Contact Title" value={customer.contact_title} />
          <Field label="Address" value={customer.address} />
          <Field label="City" value={customer.city} />
          <Field label="Region" value={customer.region} />
          <Field label="Postal Code" value={customer.postal_code} />
          <Field label="Country" value={customer.country} />
          <Field label="Phone" value={customer.phone} />
          <Field label="Fax" value={customer.fax} />
        </Grid>
      </Paper>

      <CustomerForm
        open={editOpen}
        customer={customer}
        onClose={() => setEditOpen(false)}
        onSuccess={() => { setEditOpen(false); load(); }}
      />
    </Box>
  );
}
