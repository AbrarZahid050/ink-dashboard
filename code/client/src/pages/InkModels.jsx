import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AddRounded,
  CloseRounded,
  ColorLensOutlined,
  EditOutlined,
  RefreshRounded,
} from '@mui/icons-material'
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
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  useCreateInkModelMutation,
  useDeleteInkModelMutation,
  useGetInkModelsQuery,
  useGetManufacturersQuery,
  useUpdateInkModelMutation,
} from '../services/api.js'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'

const inkTypes = [
  { value: 'UV', label: 'UV' },
  { value: 'SOLVENT', label: 'Solvent' },
  { value: 'ECO_SOLVENT', label: 'Eco-solvent' },
  { value: 'SUBLIMATION', label: 'Sublimation' },
  { value: 'LATEX', label: 'Latex' },
  { value: 'OTHER', label: 'Other' },
]

const inkModelSchema = z.object({
  manufacturerId: z.string().uuid('Select a manufacturer'),
  inkName: z.string().trim().min(1, 'Ink name is required'),
  inkType: z.enum(['UV', 'SOLVENT', 'ECO_SOLVENT', 'SUBLIMATION', 'LATEX', 'OTHER'], {
    error: 'Select an ink type',
  }),
  notes: z.string(),
})

const initialValues = {
  manufacturerId: '',
  inkName: '',
  inkType: '',
  notes: '',
}

function InkModels() {
  const [confirmationValues, setConfirmationValues] = useState(null)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [createError, setCreateError] = useState('')
  const [notice, setNotice] = useState('')
  const [modelToEdit, setModelToEdit] = useState(null)
  const [editValues, setEditValues] = useState(initialValues)
  const [editError, setEditError] = useState('')
  const [modelToDelete, setModelToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  const {
    data: manufacturers = [],
    isLoading: manufacturersLoading,
    error: manufacturersError,
    refetch: refetchManufacturers,
  } = useGetManufacturersQuery()

  const {
    data: inkModels = [],
    isLoading: inkModelsLoading,
    isFetching: inkModelsFetching,
    error: inkModelsError,
    refetch: refetchInkModels,
  } = useGetInkModelsQuery()

  const [createInkModel, { isLoading: creating }] = useCreateInkModelMutation()
  const [updateInkModel, { isLoading: updating }] = useUpdateInkModelMutation()
  const [deleteInkModel, { isLoading: deleting }] = useDeleteInkModelMutation()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inkModelSchema),
    defaultValues: initialValues,
  })

  const loading = manufacturersLoading || inkModelsLoading
  const loadError = manufacturersError || inkModelsError

  const refresh = () => {
    refetchManufacturers()
    refetchInkModels()
  }

  const findDuplicate = (manufacturerId, inkName, excludedId) => {
    const normalizedName = inkName.trim().toLowerCase()
    return inkModels.some(
      (model) =>
        model.id !== excludedId &&
        model.manufacturerId === manufacturerId &&
        model.inkName.trim().toLowerCase() === normalizedName,
    )
  }

  const handleReview = (values) => {
    if (findDuplicate(values.manufacturerId, values.inkName)) {
      setCreateError('This ink name already exists for the selected manufacturer.')
      return
    }

    setCreateError('')
    setConfirmationValues(values)
    setConfirmationOpen(true)
  }

  const handleCreate = async () => {
    if (!confirmationValues) return

    setCreateError('')

    try {
      await createInkModel({
        manufacturerId: confirmationValues.manufacturerId,
        inkName: confirmationValues.inkName.trim(),
        inkType: confirmationValues.inkType,
        notes: confirmationValues.notes.trim() || null,
      }).unwrap()

      setConfirmationOpen(false)
      setConfirmationValues(null)
      reset(initialValues)
      setNotice('Ink model added successfully.')
    } catch (error) {
      setCreateError(getApiErrorMessage(error, 'Unable to add this ink model.'))
    }
  }

  const handleOpenEdit = (model) => {
    setEditError('')
    setModelToEdit(model)
    setEditValues({
      manufacturerId: model.manufacturerId,
      inkName: model.inkName,
      inkType: model.inkType,
      notes: model.notes ?? '',
    })
  }

  const handleCloseEdit = () => {
    if (!updating) {
      setModelToEdit(null)
      setEditError('')
    }
  }

  const handleSaveEdit = async () => {
    if (!modelToEdit) return

    const inkName = editValues.inkName.trim()

    if (!editValues.manufacturerId) {
      setEditError('Select a manufacturer.')
      return
    }

    if (!inkName) {
      setEditError('Ink name is required.')
      return
    }

    if (findDuplicate(editValues.manufacturerId, inkName, modelToEdit.id)) {
      setEditError('This ink name already exists for the selected manufacturer.')
      return
    }

    setEditError('')

    try {
      await updateInkModel({
        id: modelToEdit.id,
        version: modelToEdit.version,
        manufacturerId: editValues.manufacturerId,
        inkName,
        inkType: editValues.inkType,
        notes: editValues.notes.trim() || null,
      }).unwrap()

      setModelToEdit(null)
      setNotice('Ink model updated successfully.')
    } catch (error) {
      setEditError(getApiErrorMessage(error, 'Unable to update this ink model.'))
    }
  }

  const handleOpenDelete = (model) => {
    setDeleteError('')
    setModelToDelete(model)
  }

  const handleCloseDelete = () => {
    if (!deleting) {
      setModelToDelete(null)
      setDeleteError('')
    }
  }

  const handleConfirmDelete = async () => {
    if (!modelToDelete) return

    setDeleteError('')

    try {
      await deleteInkModel(modelToDelete.id).unwrap()
      setModelToDelete(null)
      setNotice('Ink model deleted successfully.')
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, 'Unable to delete this ink model.'))
    }
  }

  const confirmedManufacturer = manufacturers.find(
    (manufacturer) => manufacturer.id === confirmationValues?.manufacturerId,
  )
  const confirmedInkType = inkTypes.find(
    (type) => type.value === confirmationValues?.inkType,
  )?.label

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
            Ink models
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage ink families by manufacturer and printing technology.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshRounded />}
          onClick={refresh}
          disabled={inkModelsFetching}
        >
          Refresh
        </Button>
      </Stack>

      {loadError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={refresh}>
              Retry
            </Button>
          }
        >
          {getApiErrorMessage(loadError, 'Unable to load ink model data.')} Check that the backend API is running and try again.
        </Alert>
      )}

      <Paper
        component="form"
        onSubmit={handleSubmit(handleReview)}
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
            <ColorLensOutlined />
          </Box>
          <Box>
            <Typography variant="h4">Add an ink model</Typography>
            <Typography variant="body2" color="text.secondary">
              Define an ink family before adding its colour and packaging products.
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
                <TextField
                  {...field}
                  select
                  fullWidth
                  required
                  label="Manufacturer"
                  disabled={manufacturersLoading}
                  error={Boolean(errors.manufacturerId)}
                  helperText={errors.manufacturerId?.message}
                >
                  <MenuItem value="">Select manufacturer</MenuItem>
                  {manufacturers.map((manufacturer) => (
                    <MenuItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              {...register('inkName')}
              fullWidth
              required
              label="Ink name"
              placeholder="e.g. LUS-120, LUS-170, CS250"
              error={Boolean(errors.inkName)}
              helperText={errors.inkName?.message}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="inkType"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  required
                  label="Ink type"
                  error={Boolean(errors.inkType)}
                  helperText={errors.inkType?.message}
                >
                  <MenuItem value="">Select ink type</MenuItem>
                  {inkTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              {...register('notes')}
              fullWidth
              multiline
              minRows={2}
              label="Notes"
              placeholder="Optional details about this ink family"
            />
          </Grid>
        </Grid>

        {createError && <Alert severity="error" sx={{ mt: 2 }}>{createError}</Alert>}

        <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 3 }}>
          <Button
            type="button"
            color="inherit"
            onClick={() => {
              reset(initialValues)
              setCreateError('')
            }}
            disabled={creating}
          >
            Clear
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddRounded />}
            disabled={creating || manufacturersLoading || manufacturers.length === 0}
          >
            Review details
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4">Registered ink models</Typography>
              <Typography variant="body2" color="text.secondary">
                {inkModels.length} {inkModels.length === 1 ? 'ink model' : 'ink models'} in your catalogue
              </Typography>
            </Box>
            <ColorLensOutlined color="action" />
          </Box>
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 150 }}>
            <CircularProgress size={28} />
          </Box>
        ) : inkModels.length === 0 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: 150, px: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No ink models have been registered yet.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Manufacturer</TableCell>
                  <TableCell>Ink name</TableCell>
                  <TableCell>Ink type</TableCell>
                  <TableCell align="right">Products</TableCell>
                  <TableCell align="right" sx={{ width: 112 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inkModels.map((model) => (
                  <TableRow key={model.id} hover>
                    <TableCell>{model.manufacturer?.name ?? '—'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{model.inkName}</TableCell>
                    <TableCell>
                      {inkTypes.find((type) => type.value === model.inkType)?.label ?? model.inkType}
                    </TableCell>
                    <TableCell align="right">{model._count?.products ?? 0}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={`Edit ${model.inkName}`}>
                        <IconButton
                          aria-label={`Edit ${model.inkName}`}
                          size="small"
                          onClick={() => handleOpenEdit(model)}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={`Delete ${model.inkName}`}>
                        <IconButton
                          aria-label={`Delete ${model.inkName}`}
                          color="error"
                          size="small"
                          onClick={() => handleOpenDelete(model)}
                        >
                          <CloseRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={confirmationOpen}
        onClose={() => !creating && setConfirmationOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Confirm ink model details</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please review these details before saving the ink model.
          </Typography>
          <Stack spacing={1.5}>
            <ConfirmationDetail label="Manufacturer" value={confirmedManufacturer?.name} />
            <ConfirmationDetail label="Ink name" value={confirmationValues?.inkName?.trim()} />
            <ConfirmationDetail label="Ink type" value={confirmedInkType} />
            <Divider />
            <Box>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5 }}>Notes</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {confirmationValues?.notes?.trim() || '—'}
              </Typography>
            </Box>
          </Stack>
          {createError && <Alert severity="error" sx={{ mt: 2 }}>{createError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmationOpen(false)} color="inherit" disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={creating}
            startIcon={creating ? <CircularProgress size={17} color="inherit" /> : <AddRounded />}
          >
            {creating ? 'Saving...' : 'Confirm & Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(modelToEdit)} onClose={handleCloseEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit ink model</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                required
                label="Manufacturer"
                value={editValues.manufacturerId}
                onChange={(event) => setEditValues((current) => ({ ...current, manufacturerId: event.target.value }))}
              >
                {manufacturers.map((manufacturer) => (
                  <MenuItem key={manufacturer.id} value={manufacturer.id}>{manufacturer.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Ink name"
                value={editValues.inkName}
                onChange={(event) => setEditValues((current) => ({ ...current, inkName: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                required
                label="Ink type"
                value={editValues.inkType}
                onChange={(event) => setEditValues((current) => ({ ...current, inkType: event.target.value }))}
              >
                {inkTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Notes"
                value={editValues.notes}
                onChange={(event) => setEditValues((current) => ({ ...current, notes: event.target.value }))}
              />
            </Grid>
          </Grid>
          {editError && <Alert severity="error" sx={{ mt: 2 }}>{editError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEdit} color="inherit" disabled={updating}>Cancel</Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={updating}
            startIcon={updating ? <CircularProgress size={17} color="inherit" /> : <EditOutlined />}
          >
            {updating ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(modelToDelete)} onClose={handleCloseDelete} fullWidth maxWidth="xs">
        <DialogTitle>Delete ink model?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete{' '}
            <Typography component="span" fontWeight={700} color="text.primary">
              {modelToDelete?.inkName}
            </Typography>
            ? This action cannot be undone.
          </Typography>
          {(modelToDelete?._count?.products ?? 0) > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This ink model has {modelToDelete._count.products}{' '}
              {modelToDelete._count.products === 1 ? 'product' : 'products'}. The database may prevent deletion while those records exist.
            </Alert>
          )}
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDelete} color="inherit" disabled={deleting}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={17} color="inherit" /> : <CloseRounded />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setNotice('')} severity="success" variant="filled" sx={{ width: '100%' }}>
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  )
}

function ConfirmationDetail({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography color="text.secondary" variant="body2">{label}</Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">{value || '—'}</Typography>
    </Stack>
  )
}

export default InkModels
