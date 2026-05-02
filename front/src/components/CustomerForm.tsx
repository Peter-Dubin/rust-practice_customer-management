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
import { Customer } from '@/types/customer';

interface Props {
  open: boolean;
  customer?: Customer;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const OPTIONAL_FIELDS: [keyof Customer, string][] = [
  ['contact_name', 'Contact Name'],
  ['contact_title', 'Contact Title'],
  ['address', 'Address'],
  ['city', 'City'],
  ['region', 'Region'],
  ['postal_code', 'Postal Code'],
  ['country', 'Country'],
  ['phone', 'Phone'],
  ['fax', 'Fax'],
];

export default function CustomerForm({ open, customer, onClose, onSuccess }: Props) {
  const isEdit = !!customer;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Customer>({ defaultValues: customer ?? {} });

  const onSubmit = async (data: Customer) => {
    try {
      if (isEdit && customer) {
        await api.updateCustomer(customer.customer_id, data);
        onSuccess(`"${data.company_name}" updated successfully.`);
      } else {
        await api.createCustomer(data);
        onSuccess(`"${data.company_name}" created successfully.`);
      }
    } catch {
      onSuccess('Operation failed. Please try again.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Colored header */}
        <DialogTitle
          sx={{
            background: 'linear-gradient(120deg, #0D47A1 0%, #1976D2 100%)',
            color: '#FFFFFF',
            py: 2.5,
            px: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
            {isEdit ? `Edit — ${customer?.company_name}` : 'Add New Customer'}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            {isEdit ? 'Update customer details below' : 'Fill in the details to create a new customer'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, px: 3 }}>
          {/* Identity section */}
          <Typography variant="overline" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.7rem' }}>
            Identity
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.25, mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Customer ID *"
                fullWidth
                disabled={isEdit}
                {...register('customer_id', { required: !isEdit })}
                error={!!errors.customer_id}
                helperText={errors.customer_id ? 'Required' : ''}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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

          {/* Location section */}
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

          {/* Contact section */}
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
