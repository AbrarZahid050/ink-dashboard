import { useState } from 'react'
import {
  useCreateMachineModelMutation,
  useGetMachineModelsQuery,
  useGetManufacturersQuery,
} from '../services/api.js'
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

const initialForm = {
  manufacturerId: '',
  modelName: '',
  technology: '',
  configuration: '',
  maxRollWidthMm: '',
  flatbedWidthMm: '',
  flatbedLengthMm: '',
  notes: '',
}

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
  const [form, setForm] = useState(initialForm)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

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

  const loading = manufacturersLoading || modelsLoading
  const refreshing = manufacturersFetching || modelsFetching
  const loadError = manufacturersError || modelsError
  const handleRefresh = () => {
    refetchManufacturers()
    refetchModels()
  }

  const configuration = form.configuration
  const needsRollWidth = configuration === 'ROLL_TO_ROLL' || configuration === 'HYBRID'
  const needsFlatbedDimensions = configuration === 'FLATBED' || configuration === 'HYBRID'

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => {
      const next = { ...current, [name]: value }

      if (name === 'configuration') {
        if (value === 'ROLL_TO_ROLL') {
          next.flatbedWidthMm = ''
          next.flatbedLengthMm = ''
        } else if (value === 'FLATBED') {
          next.maxRollWidthMm = ''
        }
      }

      return next
    })
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const payload = {
      manufacturerId: form.manufacturerId,
      modelName: form.modelName.trim(),
      technology: form.technology,
      configuration: form.configuration,
      maxRollWidthMm: needsRollWidth ? Number(form.maxRollWidthMm) : null,
      flatbedWidthMm: needsFlatbedDimensions ? Number(form.flatbedWidthMm) : null,
      flatbedLengthMm: needsFlatbedDimensions ? Number(form.flatbedLengthMm) : null,
      notes: form.notes.trim() || null,
    }

    try {
      await createMachineModel(payload).unwrap()
      setForm(initialForm)
      setNotice('Machine model added successfully.')
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Unable to save this machine model.'))
    }
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

      <Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderColor: 'divider', borderRadius: 3 }}>
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
            <FormControl fullWidth required>
              <InputLabel id="manufacturer-label">Manufacturer</InputLabel>
              <Select
                labelId="manufacturer-label"
                name="manufacturerId"
                value={form.manufacturerId}
                label="Manufacturer"
                onChange={handleChange}
                disabled={loading || manufacturers.length === 0}
              >
                {manufacturers.map((manufacturer) => (
                  <MenuItem key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {manufacturers.length === 0 && !loading && (
              <Typography variant="caption" color="text.secondary">
                Add a manufacturer before registering a machine model.
              </Typography>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              required
              label="Model name"
              name="modelName"
              value={form.modelName}
              onChange={handleChange}
              placeholder="e.g. CJV330-160"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel id="technology-label">Printing technology</InputLabel>
              <Select
                labelId="technology-label"
                name="technology"
                value={form.technology}
                label="Printing technology"
                onChange={handleChange}
              >
                {technologyOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel id="configuration-label">Machine configuration</InputLabel>
              <Select
                labelId="configuration-label"
                name="configuration"
                value={form.configuration}
                label="Machine configuration"
                onChange={handleChange}
              >
                {configurationOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {needsRollWidth && (
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                required
                type="number"
                label="Maximum roll width"
                name="maxRollWidthMm"
                value={form.maxRollWidthMm}
                onChange={handleChange}
                inputProps={{ min: 1, step: 1 }}
                InputProps={{ endAdornment: <Typography variant="body2" color="text.secondary">mm</Typography> }}
              />
            </Grid>
          )}

          {needsFlatbedDimensions && (
            <>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Flatbed width"
                  name="flatbedWidthMm"
                  value={form.flatbedWidthMm}
                  onChange={handleChange}
                  inputProps={{ min: 1, step: 1 }}
                  InputProps={{ endAdornment: <Typography variant="body2" color="text.secondary">mm</Typography> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Flatbed length"
                  name="flatbedLengthMm"
                  value={form.flatbedLengthMm}
                  onChange={handleChange}
                  inputProps={{ min: 1, step: 1 }}
                  InputProps={{ endAdornment: <Typography variant="body2" color="text.secondary">mm</Typography> }}
                />
              </Grid>
            </>
          )}

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Optional technical details or remarks"
            />
          </Grid>
        </Grid>

        {formError && <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>}

        <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 3 }}>
          <Button
            variant="text"
            color="inherit"
            startIcon={<CloseRounded />}
            onClick={() => {
              setForm(initialForm)
              setFormError('')
            }}
            disabled={saving}
          >
            Clear
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={17} color="inherit" /> : <AddRounded />}
            disabled={saving || loading || manufacturers.length === 0}
          >
            {saving ? 'Saving...' : 'Add machine model'}
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
