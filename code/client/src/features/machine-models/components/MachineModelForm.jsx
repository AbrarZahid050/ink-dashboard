import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AddRounded, CloseRounded } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  initialMachineModelValues,
  machineModelSchema,
  toMachineModelPayload,
} from '../schemas/machineModelSchema.js'
import { useCreateMachineModelMutation } from '../../../services/api.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import MachineModelFields from './MachineModelFields.jsx'
import MachineModelDimensions from './MachineModelDimensions.jsx'

function MachineModelForm({ manufacturers, manufacturersLoading, onCreated }) {
  const [serverError, setServerError] = useState('')
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
  const needsRollWidth = configuration === 'ROLL_TO_ROLL' || configuration === 'HYBRID'
  const needsFlatbedDimensions = configuration === 'FLATBED' || configuration === 'HYBRID'
  const submitting = saving || isSubmitting

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

  const handleFormSubmit = async (values) => {
    setServerError('')

    try {
      await createMachineModel(toMachineModelPayload(values)).unwrap()
      reset(initialMachineModelValues)
      onCreated()
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Unable to save this machine model.'))
    }
  }

  const handleClear = () => {
    reset(initialMachineModelValues)
    setServerError('')
  }

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit(handleFormSubmit)}
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
          startIcon={submitting ? <CircularProgress size={17} color="inherit" /> : <AddRounded />}
          disabled={submitting || manufacturersLoading || manufacturers.length === 0}
        >
          {submitting ? 'Saving...' : 'Add machine model'}
        </Button>
      </Stack>
    </Paper>
  )
}

export default MachineModelForm
