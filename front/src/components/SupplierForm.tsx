'use client';

import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Typography,
} from '@mui/material';

import { api } from '@/lib/api';
import { CreateSupplierRequest, Supplier } from '@/types/supplier';

interface Props {
  open: boolean;
  supplier?: Supplier;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function SupplierForm({ open, supplier, onClose, onSuccess }: Props) {
  const isEdit = !!supplier;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSupplierRequest>({
    defaultValues: supplier
      ? {
          company_name: supplier.company_name,
          contact_name: supplier.contact_name,
          contact_title: supplier.contact_title,
          address: supplier.address,
          city: supplier.city,
          region: supplier.region,
          postal_code: supplier.postal_code,
          country: supplier.country,
          phone: supplier.phone,
          fax: supplier.fax,
          home_page: supplier.home_page,
        }
      : {},
  });

  const onSubmit = async (data: CreateSupplierRequest) => {
    try {
      if (isEdit && supplier) {
        await api.updateSupplier(supplier.supplier_id, data);
        onSuccess(`"${data.company_name}" updated successfully.`);
      } else {
        await api.createSupplier(data);
        onSuccess(`"${data.company_name}" created successfully.`);
      }
    } catch {
      onSuccess('Operation failed. Please try again.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle
          sx={{
            background: 'linear-gradient(120deg, #0D47A1 0%, #1976D2 100%)',
            color: '#FFFFFF',
            py: 2.5,
            px: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
            {isEdit ? `Edit — ${supplier?.company_name}` : 'Add New Supplier'}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            {isEdit ? 'Update supplier details below' : 'Fill in the details to create a new supplier'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, px: 3 }}>
          <Typography variant="overline" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.7rem' }}>
            Identity
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.25, mb: 2 }}>
            {isEdit && (
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 0.5 }}>
                  Supplier ID
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                  {supplier?.supplier_id}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12} sm={isEdit ? 6 : 12}>
              <TextField
                label="Company Name *"
                fullWidth
                {...register('company_name', { required: true })}
                error={!!errors.company_name}
                helperText={errors.company_name ? 'Required' : ''}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Name" fullWidth {...register('contact_name')} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Title" fullWidth {...register('contact_title')} size="small" />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="overline" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.7rem' }}>
            Location
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.25, mb: 2 }}>
            <Grid item xs={12}>
              <TextField label="Address" fullWidth {...register('address')} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="City" fullWidth {...register('city')} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Region" fullWidth {...register('region')} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Postal Code" fullWidth {...register('postal_code')} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Country" fullWidth {...register('country')} size="small" />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="overline" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.7rem' }}>
            Contact
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.25 }}>
            <Grid item xs={12} sm={6}>
              <TextField label="Phone" fullWidth {...register('phone')} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Fax" fullWidth {...register('fax')} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Home Page" fullWidth {...register('home_page')} size="small" placeholder="https://..." />
            </Grid>
          </Grid>
        </DialogContent>

        <Box sx={{ borderTop: '1px solid #F1F5F9' }}>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={onClose} color="inherit" sx={{ color: '#64748B' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ minWidth: 120 }}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </form>
    </Dialog>
  );
}
