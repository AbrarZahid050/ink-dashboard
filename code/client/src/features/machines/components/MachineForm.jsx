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
import {
  useCreateMachineMutation,
  useGetCustomerSitesQuery,
  useGetMachineModelsQuery,
} from '../../../services/api.js'
import { getApiErrorMessage } from '../../machine-models/utils/getApiErrorMessage.js'

const machineSchema = z.object({
  serialNumber: z.string().trim().min(1, 'Serial number is required'),
  machineModelId: z.string().uuid('Select a machine model'),
  siteId: z.string().uuid('Select a customer site'),
  installationDate: z.string().min(1, 'Installation date is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DECOMMISSIONED']),
  notes: z.string().trim(),
})

function MachineForm({ onCreated }) {
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [confirmationData, setConfirmationData] = useState(null)
  const [serverError, setServerError] = useState('')
  const [createMachine, { isLoading: saving }] = useCreateMachineMutation()
  const { data: models = [], isLoading: modelsLoading } = useGetMachineModelsQuery()
  const { data: sites = [], isLoading: sitesLoading } = useGetCustomerSitesQuery()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(machineSchema),
    defaultValues: {
      serialNumber: '',
      machineModelId: '',
      siteId: '',
      installationDate: '',
      status: 'ACTIVE',
      notes: '',
    },
  })

  const handleReview = (values) => {
    const duplicate = machines.some(
      (machine) => machine.serialNumber?.trim().toLowerCase() === values.serialNumber.trim().toLowerCase(),
    )
    if (duplicate) {
      setError('serialNumber', { type: 'manual', message: 'A machine with this serial number already exists.' })
      return
    }

    setServerError('')
    setConfirmationData({ ...values, serialNumber: values.serialNumber.trim(), notes: values.notes.trim() })
    setConfirmationOpen(true)
  }

  const handleConfirm = async () => {
    if (!confirmationData) return
    setServerError('')
    try {
      await createMachine({
        ...confirmationData,
        notes: confirmationData.notes || null,
      }).unwrap()
      setConfirmationOpen(false)
      setConfirmationData(null)
      reset()
      onCreated()
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Unable to register this machine.'))
    }
  }

  const selectedModel = models.find((model) => model.id === confirmationData?.machineModelId)
  const selectedSite = sites.find((site) => site.id === confirmationData?.siteId)

  return (
    <>
      <Paper
        component="form"
        onSubmit={handleSubmit(handleReview)}
        variant="outlined"
        sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderColor: 'divider', borderRadius: 3 }}
      >
        <Typography variant="h4" sx={{ mb: 0.5 }}>Register a machine</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Register an individual printer and link it to its model and installation site.
        </Typography>

        {models.length === 0 && !modelsLoading && (
          <Alert severity="info" sx={{ mb: 2 }}>Add a machine model before registering a physical machine.</Alert>
        )}
        {sites.length === 0 && !sitesLoading && (
          <Alert severity="info" sx={{ mb: 2 }}>Add a customer site before registering a physical machine.</Alert>
        )}

        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              {...register('serialNumber', { onChange: () => clearErrors('serialNumber') })}
              fullWidth required label="Serial number" placeholder="Manufacturer serial number"
              error={Boolean(errors.serialNumber)} helperText={errors.serialNumber?.message}
            />
            <TextField
              {...register('installationDate')}
              fullWidth required type="date" label="Installation date"
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.installationDate)} helperText={errors.installationDate?.message}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              {...register('machineModelId')}
              select fullWidth required label="Machine model"
              error={Boolean(errors.machineModelId)} helperText={errors.machineModelId?.message}
              disabled={modelsLoading || models.length === 0}
            >
              {models.map((model) => (
                <MenuItem key={model.id} value={model.id}>
                  {model.manufacturer?.name} {model.modelName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              {...register('siteId')}
              select fullWidth required label="Customer site"
              error={Boolean(errors.siteId)} helperText={errors.siteId?.message}
              disabled={sitesLoading || sites.length === 0}
            >
              {sites.map((site) => (
                <MenuItem key={site.id} value={site.id}>
                  {site.customer?.name} — {site.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField {...register('status')} select fullWidth label="Status">
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
              <MenuItem value="DECOMMISSIONED">Decommissioned</MenuItem>
            </TextField>
            <TextField {...register('notes')} fullWidth label="Notes" placeholder="Optional machine details" />
          </Stack>
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddRounded />}
            disabled={modelsLoading || sitesLoading || models.length === 0 || sites.length === 0}
            sx={{ alignSelf: 'flex-start', minWidth: 170, minHeight: 48 }}
          >
            Review details
          </Button>
        </Stack>
      </Paper>

      <Dialog open={confirmationOpen} onClose={() => !saving && setConfirmationOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Confirm machine registration</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Review the machine details before saving.
          </Typography>
          <Stack spacing={1}>
            <Typography><strong>Serial number:</strong> {confirmationData?.serialNumber}</Typography>
            <Typography><strong>Model:</strong> {selectedModel?.manufacturer?.name} {selectedModel?.modelName}</Typography>
            <Typography><strong>Customer site:</strong> {selectedSite?.customer?.name} — {selectedSite?.name}</Typography>
            <Typography><strong>Installation:</strong> {confirmationData?.installationDate}</Typography>
            <Typography><strong>Status:</strong> {confirmationData?.status}</Typography>
            {confirmationData?.notes && <Typography><strong>Notes:</strong> {confirmationData.notes}</Typography>}
          </Stack>
          {serverError && <Alert severity="error" sx={{ mt: 2 }}>{serverError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmationOpen(false)} color="inherit" disabled={saving}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={17} color="inherit" /> : <AddRounded />}>
            {saving ? 'Saving...' : 'Confirm & Register'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default MachineForm
