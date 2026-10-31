import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AddRounded,
  CloseRounded,
  PrecisionManufacturingOutlined,
  RefreshRounded,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  InputAdornment,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import {
  initialMachineModelValues,
  machineModelSchema,
  toMachineModelPayload,
} from '../features/machine-models/schemas/machineModelSchema.js'
import {
  useCreateMachineModelMutation,
  useGetMachineModelsQuery,
  useGetManufacturersQuery,
} from '../services/api.js'

const technologyOptions = [
  { value: 'SOLVENT', label: 'Solvent' },
  { value: 'LATEX', label: 'Latex' },
  { value: 'UV', label: 'UV' },
  { value: 'SUBLIMATION', label: 'Sublimation' },
  { value: 'OTHER', label: 'Other' },
]

const configurationOptions = [
  { value: 'ROLL_TO_ROLL', label: 'Roll to roll' },
  { value: 'FLATBED', label: 'Flatbed' },
  { value: 'HYBRID', label: 'Hybrid' },
]

function getApiErrorMessage(error, fallback) {
  const payload = error?.data

  if (Array.isArray(payload?.errors)) {
    const details = payload.errors
      .map((item) => item.message)
      .filter(Boolean)
      .join(', ')

    if (details) return details
  }

  return payload?.message || error?.error || fallback
}

function MachineModels() {
  const [serverError, setServerError] = useState('')
  const [notice, setNotice] = useState('')

  const {
    control,
    register,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(machineModelSchema),
    defaultValues: initialMachineModelValues,
  })

  const {
    data: manufacturers = [],
    isLoading: manufacturersLoading,
    isFetching: manufacturersFetching,
    error: manufacturersError,
    refetch: refetchManufacturers,
  } = useGetManufacturersQuery()

  const {
    data: models = [],
    isLoading: modelsLoading,
    isFetching: modelsFetching,
    error: modelsError,
    refetch: refetchModels,
  } = useGetMachineModelsQuery()

  const [createMachineModel, { isLoading: saving }] = useCreateMachineModelMutation()

  const configuration = watch('configuration')
  const needsRollWidth = configuration === 'ROLL_TO_ROLL' || configuration === 'HYBRID'
  const needsFlatbedDimensions = configuration === 'FLATBED' || configuration === 'HYBRID'
  const loading = manufacturersLoading || modelsLoading
  const refreshing = manufacturersFetching || modelsFetching
  const loadError = manufacturersError || modelsError

  const handleRefresh = () => {
    refetchManufacturers()
    refetchModels()
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

  const handleFormSubmit = async (values) => {
    setServerError('')

    try {
      await createMachineModel(toMachineModelPayload(values)).unwrap()
      reset(initialMachineModelValues)
      setNotice('Machine model added successfully.')
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Unable to save this machine model.'))
    }
  }

  const handleClear = () => {
    reset(initialMachineModelValues)
    setServerError('')
  }

  return (
    <Box sx={{ maxWidth: 1500, mx: 'auto', pt: { xs: 3, sm: 4 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h1" sx={{ fontSize: { xs: 25, sm: 28 }, mb: 0.75 }}>
            Machine models
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Register printer models and define their supported configurations.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshRounded />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          Refresh
        </Button>
      </Stack>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={handleRefresh}>Retry</Button>
        }>
          {getApiErrorMessage(loadError, 'Unable to load machine model data.')}. Check that the backend API is running and try again.
        </Alert>
      )}

      <Paper
        component="form"
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
        variant="outlined"
        sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderColor: 'divider', borderRadius: 3 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
          <Box sx={{ width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 2, color: 'primary.main', bgcolor: 'primary.light' }}>
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
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="manufacturerId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth required error={Boolean(errors.manufacturerId)}>
                  <InputLabel id="manufacturer-label">Manufacturer</InputLabel>
                  <Select
                    {...field}
                    labelId="manufacturer-label"
                    label="Manufacturer"
                    disabled={loading || manufacturers.length === 0}
                  >
                    {manufacturers.map((manufacturer) => (
                      <MenuItem key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.manufacturerId && (
                    <FormHelperText>{errors.manufacturerId.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
            {manufacturers.length === 0 && !loading && (
              <Typography variant="caption" color="text.secondary">
                Add a manufacturer before registering a machine model.
              </Typography>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              {...register('modelName')}
              fullWidth
              required
              label="Model name"
              placeholder="e.g. CJV330-160"
              error={Boolean(errors.modelName)}
              helperText={errors.modelName?.message}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="technology"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth required error={Boolean(errors.technology)}>
                  <InputLabel id="technology-label">Printing technology</InputLabel>
                  <Select {...field} labelId="technology-label" label="Printing technology">
                    {technologyOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                  {errors.technology && (
                    <FormHelperText>{errors.technology.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="configuration"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth required error={Boolean(errors.configuration)}>
                  <InputLabel id="configuration-label">Machine configuration</InputLabel>
                  <Select
                    {...field}
                    labelId="configuration-label"
                    label="Machine configuration"
                    onChange={(event) => handleConfigurationChange(event.target.value, field.onChange)}
                  >
                    {configurationOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                  {errors.configuration && (
                    <FormHelperText>{errors.configuration.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>

          {needsRollWidth && (
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                {...register('maxRollWidthMm')}
                fullWidth
                required
                type="number"
                label="Maximum roll width"
                error={Boolean(errors.maxRollWidthMm)}
                helperText={errors.maxRollWidthMm?.message}
                slotProps={{
                  htmlInput: { min: 1, step: 1 },
                  input: {
                    endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                  },
                }}
              />
            </Grid>
          )}

          {needsFlatbedDimensions && (
            <>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  {...register('flatbedWidthMm')}
                  fullWidth
                  required
                  type="number"
                  label="Flatbed width"
                  error={Boolean(errors.flatbedWidthMm)}
                  helperText={errors.flatbedWidthMm?.message}
                  slotProps={{
                    htmlInput: { min: 1, step: 1 },
                    input: {
                      endAdornment: <Typography variant="body2" color="text.secondary">mm</Typography>,
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  {...register('flatbedLengthMm')}
                  fullWidth
                  required
                  type="number"
                  label="Flatbed length"
                  error={Boolean(errors.flatbedLengthMm)}
                  helperText={errors.flatbedLengthMm?.message}
                  slotProps={{
                    htmlInput: { min: 1, step: 1 },
                    input: {
                      endAdornment: <Typography variant="body2" color="text.secondary">mm</Typography>,
                    },
                  }}
                />
              </Grid>
            </>
          )}

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
            variant="text"
            color="inherit"
            startIcon={<CloseRounded />}
            onClick={handleClear}
            disabled={saving || isSubmitting}
          >
            Clear
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving || isSubmitting ? <CircularProgress size={17} color="inherit" /> : <AddRounded />}
            disabled={saving || isSubmitting || loading || manufacturers.length === 0}
          >
            {saving || isSubmitting ? 'Saving...' : 'Add machine model'}
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.25 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h4">Registered models</Typography>
              <Typography variant="body2" color="text.secondary">
                {models.length} {models.length === 1 ? 'model' : 'models'} in your catalogue
              </Typography>
            </Box>
            <PrecisionManufacturingOutlined color="action" />
          </Stack>
        </Box>
        <Divider />
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 150 }}>
            <CircularProgress size={28} />
          </Box>
        ) : models.length === 0 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: 150, px: 2 }}>
            <Typography variant="body2" color="text.secondary">No machine models have been registered yet.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>Manufacturer</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Technology</TableCell>
                  <TableCell>Configuration</TableCell>
                  <TableCell align="right">Machines</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id} hover>
                    <TableCell>{model.manufacturer?.name ?? manufacturers.find((manufacturer) => manufacturer.id === model.manufacturerId)?.name ?? '—'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{model.modelName}</TableCell>
                    <TableCell>{technologyOptions.find((item) => item.value === model.technology)?.label ?? model.technology}</TableCell>
                    <TableCell>{configurationOptions.find((item) => item.value === model.configuration)?.label ?? model.configuration}</TableCell>
                    <TableCell align="right">{model._count?.machines ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setNotice('')} severity="success" variant="filled" sx={{ width: '100%' }}>
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default MachineModels
