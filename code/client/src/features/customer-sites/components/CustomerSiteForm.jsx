import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AddRounded } from '@mui/icons-material'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { z } from 'zod'
import { useCreateCustomerSiteMutation, useGetCustomerSitesQuery, useGetCustomersQuery } from '../../../services/api.js'
import { getApiErrorMessage } from '../../machine-models/utils/getApiErrorMessage.js'

const siteSchema = z.object({
  customerId: z.string().uuid('Select a customer'),
  name: z.string().trim().min(1, 'Site name is required'),
  address: z.string().trim(),
  city: z.string().trim(),
  country: z.string().trim(),
})

function CustomerSiteForm({ onCreated }) {
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [confirmationData, setConfirmationData] = useState(null)
  const [serverError, setServerError] = useState('')
  const [createCustomerSite, { isLoading: saving }] = useCreateCustomerSiteMutation()
  const { data: customers = [], isLoading: customersLoading } = useGetCustomersQuery()
  const { data: sites = [] } = useGetCustomerSitesQuery()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(siteSchema),
    defaultValues: { customerId: '', name: '', address: '', city: '', country: '' },
  })

  const handleReview = (values) => {
    const duplicate = sites.some((site) =>
      site.customerId === values.customerId &&
      site.name?.trim().toLowerCase() === values.name.trim().toLowerCase(),
    )
    if (duplicate) {
      setError('name', { type: 'manual', message: 'This customer already has a site with this name.' })
      return
    }
    setServerError('')
    setConfirmationData({
      ...values,
      name: values.name.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      country: values.country.trim(),
    })
    setConfirmationOpen(true)
  }

  const handleConfirm = async () => {
    if (!confirmationData) return
    setServerError('')
    try {
      await createCustomerSite({
        ...confirmationData,
        address: confirmationData.address || null,
        city: confirmationData.city || null,
        country: confirmationData.country || null,
      }).unwrap()
      setConfirmationOpen(false)
      setConfirmationData(null)
      reset()
      onCreated()
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Unable to add this customer site.'))
    }
  }

  const selectedCustomer = customers.find((customer) => customer.id === confirmationData?.customerId)

  return (
    <>
      <Paper
        component="form"
        onSubmit={handleSubmit(handleReview)}
        variant="outlined"
        sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderColor: 'divider', borderRadius: 3 }}
      >
        <Typography variant="h4" sx={{ mb: 0.5 }}>Add a customer site</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Register a branch or physical location under an existing customer.
        </Typography>

        {customers.length === 0 && !customersLoading && (
          <Alert severity="info" sx={{ mb: 2 }}>Add a customer company first, then register its sites.</Alert>
        )}

        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              {...register('customerId', { onChange: () => clearErrors('customerId') })}
              select
              fullWidth
              required
              label="Customer / company"
              error={Boolean(errors.customerId)}
              helperText={errors.customerId?.message}
              disabled={customersLoading || customers.length === 0}
            >
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>{customer.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              {...register('name', { onChange: () => clearErrors('name') })}
              fullWidth
              required
              label="Site / branch name"
              placeholder="e.g. Dubai Branch"
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />
          </Stack>
          <TextField {...register('address')} fullWidth label="Address" placeholder="Street, building, area" />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField {...register('city')} fullWidth label="City" />
            <TextField {...register('country')} fullWidth label="Country" />
          </Stack>
          <BoxSubmit disabled={customersLoading || customers.length === 0} />
        </Stack>
      </Paper>

      <Dialog open={confirmationOpen} onClose={() => !saving && setConfirmationOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Confirm customer site</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Please review the site details before saving.</Typography>
          <Typography fontWeight={700}>{selectedCustomer?.name} — {confirmationData?.name}</Typography>
          {[confirmationData?.address, confirmationData?.city, confirmationData?.country].filter(Boolean).join(', ') || 'No address details provided'}
          {serverError && <Alert severity="error" sx={{ mt: 2 }}>{serverError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmationOpen(false)} color="inherit" disabled={saving}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={17} color="inherit" /> : <AddRounded />}>
            {saving ? 'Saving...' : 'Confirm & Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

function BoxSubmit({ disabled }) {
  return (
    <Button type="submit" variant="contained" startIcon={<AddRounded />} disabled={disabled} sx={{ alignSelf: 'flex-start', minWidth: 160, minHeight: 48 }}>
      Review details
    </Button>
  )
}

export default CustomerSiteForm
