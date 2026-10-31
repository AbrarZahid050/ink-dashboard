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
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { z } from 'zod'
import { useCreateCustomerMutation, useGetCustomersQuery } from '../../../services/api.js'
import { getApiErrorMessage } from '../../machine-models/utils/getApiErrorMessage.js'

const customerSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required'),
})

function CustomerForm({ onCreated }) {
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [confirmationName, setConfirmationName] = useState('')
  const [serverError, setServerError] = useState('')
  const [createCustomer, { isLoading: saving }] = useCreateCustomerMutation()
  const { data: customers = [], isLoading: customersLoading } = useGetCustomersQuery()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '' },
  })

  const handleReview = ({ name }) => {
    const normalizedName = name.trim().toLowerCase()
    const duplicate = customers.some(
      (customer) => customer.name?.trim().toLowerCase() === normalizedName,
    )

    if (duplicate) {
      setError('name', {
        type: 'manual',
        message: 'This customer already exists.',
      })
      return
    }

    setServerError('')
    setConfirmationName(name.trim())
    setConfirmationOpen(true)
  }

  const handleConfirm = async () => {
    setServerError('')

    try {
      await createCustomer({ name: confirmationName }).unwrap()
      setConfirmationOpen(false)
      setConfirmationName('')
      reset({ name: '' })
      onCreated()
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Unable to add this customer.'))
    }
  }

  return (
    <>
      <Paper
        component="form"
        onSubmit={handleSubmit(handleReview)}
        variant="outlined"
        sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderColor: 'divider', borderRadius: 3 }}
      >
        <Typography variant="h4" sx={{ mb: 0.5 }}>Add a customer</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Register a customer company before adding its sites and installed machines.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
          <TextField
            {...register('name', { onChange: () => clearErrors('name') })}
            fullWidth
            required
            label="Customer / company name"
            placeholder="e.g. ABC Printing LLC"
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddRounded />}
            disabled={customersLoading}
            sx={{ minWidth: 160, minHeight: 56 }}
          >
            Review details
          </Button>
        </Stack>
      </Paper>

      <Dialog
        open={confirmationOpen}
        onClose={() => !saving && setConfirmationOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirm customer</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Please confirm the customer company name before saving.
          </Typography>
          <Typography variant="h6">{confirmationName}</Typography>
          {serverError && <Alert severity="error" sx={{ mt: 2 }}>{serverError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmationOpen(false)} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={17} color="inherit" /> : <AddRounded />}
          >
            {saving ? 'Saving...' : 'Confirm & Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default CustomerForm
