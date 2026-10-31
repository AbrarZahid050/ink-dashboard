import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AddRounded, CloseRounded } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  configurationOptions,
  technologyOptions,
} from '../constants/machineModelOptions.js'
import {
  initialMachineModelValues,
  machineModelSchema,
  toMachineModelPayload,
} from '../schemas/machineModelSchema.js'
import { useCreateMachineModelMutation } from '../../../services/api.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import MachineModelFields from './MachineModelFields.jsx'
import MachineModelDimensions from './MachineModelDimensions.jsx'

function ConfirmationDetail({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography color="text.secondary" variant="body2">{label}</Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">
        {value || '—'}
      </Typography>
    </Stack>
  )
}

function MachineModelForm({ manufacturers, manufacturersLoading, onCreated }) {
  const [serverError, setServerError] = useState('')
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [confirmationValues, setConfirmationValues] = useState(null)
  const [createMachineModel, { isLoading: saving }] = useCreateMachineModelMutation()

  const {
    control,
    register,
    setValue,
    clearErrors,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(machineModelSchema),
    defaultValues: initialMachineModelValues,
  })

  const configuration = useWatch({ control, name: 'configuration' })
  const manufacturerId = useWatch({ control, name: 'manufacturerId' })
  const technology = useWatch({ control, name: 'technology' })
  const modelName = useWatch({ control, name: 'modelName' })
  const selectedManufacturer = manufacturers.find(
    (manufacturer) => manufacturer.id === manufacturerId,
  )
  const isHpLatex =
    selectedManufacturer?.name?.trim().toUpperCase() === 'HP' && technology === 'LATEX'
  const isWhiteVariant = /W$/i.test(modelName.trim())
  const needsRollWidth = configuration === 'ROLL_TO_ROLL' || configuration === 'HYBRID'
  const needsFlatbedDimensions = configuration === 'FLATBED' || configuration === 'HYBRID'
  const submitting = saving || isSubmitting

  const handleWhiteVariantChange = () => {
    const baseModelName = modelName.trim().replace(/\s*W$/i, '')
    const nextModelName = isWhiteVariant ? baseModelName : `${baseModelName}W`

    setValue('modelName', nextModelName, { shouldDirty: true, shouldValidate: true })
  }

  const handleConfigurationChange = (nextConfiguration, onChange) => {
    onChange(nextConfiguration)
    clearErrors(['maxRollWidthMm', 'flatbedWidthMm', 'flatbedLengthMm'])

    if (nextConfiguration === 'ROLL_TO_ROLL') {
      setValue('flatbedWidthMm', '')
      setValue('flatbedLengthMm', '')
    } else if (nextConfiguration === 'FLATBED') {
      setValue('maxRollWidthMm', '')
    }
  }

  const handleOpenConfirmation = (values) => {
    setServerError('')
    setConfirmationValues(values)
    setConfirmationOpen(true)
  }

  const handleFormSubmit = async () => {
    if (!confirmationValues) return

    setServerError('')

    try {
      await createMachineModel(toMachineModelPayload(confirmationValues)).unwrap()
      setConfirmationOpen(false)
      setConfirmationValues(null)
      reset(initialMachineModelValues)
      onCreated()
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Unable to save this machine model.'))
    }
  }

  const handleClear = () => {
    reset(initialMachineModelValues)
    setServerError('')
    setConfirmationValues(null)
    setConfirmationOpen(false)
  }

  const confirmedManufacturer = manufacturers.find(
    (manufacturer) => manufacturer.id === confirmationValues?.manufacturerId,
  )
  const confirmedTechnology = technologyOptions.find(
    (option) => option.value === confirmationValues?.technology,
  )?.label
  const confirmedConfiguration = configurationOptions.find(
    (option) => option.value === confirmationValues?.configuration,
  )?.label
  const confirmedNeedsRollWidth =
    confirmationValues?.configuration === 'ROLL_TO_ROLL' ||
    confirmationValues?.configuration === 'HYBRID'
  const confirmedNeedsFlatbed =
    confirmationValues?.configuration === 'FLATBED' ||
    confirmationValues?.configuration === 'HYBRID'

  return (
    <>
      <Paper
        component="form"
        onSubmit={handleSubmit(handleOpenConfirmation)}
        noValidate
        variant="outlined"
        sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderColor: 'divider', borderRadius: 3 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2,
              color: 'primary.main',
              bgcolor: 'primary.light',
            }}
          >
            <AddRounded />
          </Box>
          <Box>
            <Typography variant="h4">Add a machine model</Typography>
            <Typography variant="body2" color="text.secondary">
              Enter the manufacturer and technical specifications.
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2.25}>
          <MachineModelFields
            control={control}
            register={register}
            errors={errors}
            manufacturers={manufacturers}
            disabled={manufacturersLoading}
            isHpLatex={isHpLatex}
            isWhiteVariant={isWhiteVariant}
            onWhiteVariantChange={handleWhiteVariantChange}
            onConfigurationChange={handleConfigurationChange}
          />

          <MachineModelDimensions
            register={register}
            errors={errors}
            needsRollWidth={needsRollWidth}
            needsFlatbedDimensions={needsFlatbedDimensions}
          />

          <Grid size={{ xs: 12 }}>
            <TextField
              {...register('notes')}
              fullWidth
              multiline
              minRows={3}
              label="Notes"
              placeholder="Optional technical details or remarks"
            />
          </Grid>
        </Grid>

        {serverError && <Alert severity="error" sx={{ mt: 2 }}>{serverError}</Alert>}

        <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 3 }}>
          <Button
            type="button"
            variant="text"
            color="inherit"
            startIcon={<CloseRounded />}
            onClick={handleClear}
            disabled={submitting}
          >
            Clear
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddRounded />}
            disabled={submitting || manufacturersLoading || manufacturers.length === 0}
          >
            Review details
          </Button>
        </Stack>
      </Paper>

      <Dialog
        open={confirmationOpen}
        onClose={() => !submitting && setConfirmationOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Confirm machine model details</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please review these details before saving the machine model.
          </Typography>

          <Stack spacing={1.5}>
            <ConfirmationDetail label="Manufacturer" value={confirmedManufacturer?.name} />
            <ConfirmationDetail label="Model name" value={confirmationValues?.modelName?.trim()} />
            <ConfirmationDetail label="Technology" value={confirmedTechnology} />
            <ConfirmationDetail label="Configuration" value={confirmedConfiguration} />

            {confirmedNeedsRollWidth && (
              <ConfirmationDetail
                label="Maximum roll width"
                value={confirmationValues?.maxRollWidthMm ? `${confirmationValues.maxRollWidthMm} mm` : ''}
              />
            )}
            {confirmedNeedsFlatbed && (
              <>
                <ConfirmationDetail
                  label="Flatbed width"
                  value={confirmationValues?.flatbedWidthMm ? `${confirmationValues.flatbedWidthMm} mm` : ''}
                />
                <ConfirmationDetail
                  label="Flatbed length"
                  value={confirmationValues?.flatbedLengthMm ? `${confirmationValues.flatbedLengthMm} mm` : ''}
                />
              </>
            )}
            <Divider />
            <Box>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5 }}>
                Notes
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {confirmationValues?.notes?.trim() || '—'}
              </Typography>
            </Box>
          </Stack>

          {serverError && <Alert severity="error" sx={{ mt: 2 }}>{serverError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmationOpen(false)}
            color="inherit"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={17} color="inherit" /> : <AddRounded />}
          >
            {submitting ? 'Saving...' : 'Confirm & Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default MachineModelForm
