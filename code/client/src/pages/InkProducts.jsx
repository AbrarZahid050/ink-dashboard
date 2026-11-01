import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AddRounded,
  CloseRounded,
  EditOutlined,
  Inventory2Outlined,
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
  useCreateInkProductMutation,
  useDeleteInkProductMutation,
  useGetInkModelsQuery,
  useGetInkProductsQuery,
  useUpdateInkProductMutation,
} from '../services/api.js'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'

const packagingTypes = [
  { value: 'BOTTLE', label: 'Bottle' },
  { value: 'POUCH', label: 'Pouch' },
  { value: 'CARTRIDGE', label: 'Cartridge' },
  { value: 'BULK', label: 'Bulk' },
  { value: 'OTHER', label: 'Other' },
]

const inkProductSchema = z.object({
  inkModelId: z.string().uuid('Select an ink model'),
  color: z.string().trim().min(1, 'Colour is required'),
  packagingType: z.enum(['BOTTLE', 'POUCH', 'CARTRIDGE', 'BULK', 'OTHER'], {
    error: 'Select a packaging type',
  }),
  capacityMl: z.number().int().positive('Capacity must be greater than zero'),
  productCode: z.string(),
})

const initialValues = {
  inkModelId: '',
  color: '',
  packagingType: '',
  capacityMl: '',
  productCode: '',
}

function InkProducts() {
  const [confirmationValues, setConfirmationValues] = useState(null)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [createError, setCreateError] = useState('')
  const [notice, setNotice] = useState('')
  const [productToEdit, setProductToEdit] = useState(null)
  const [editValues, setEditValues] = useState(initialValues)
  const [editError, setEditError] = useState('')
  const [productToDelete, setProductToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  const {
    data: inkModels = [],
    isLoading: inkModelsLoading,
    error: inkModelsError,
    refetch: refetchInkModels,
  } = useGetInkModelsQuery()

  const {
    data: inkProducts = [],
    isLoading: inkProductsLoading,
    isFetching: inkProductsFetching,
    error: inkProductsError,
    refetch: refetchInkProducts,
  } = useGetInkProductsQuery()

  const [createInkProduct, { isLoading: creating }] = useCreateInkProductMutation()
  const [updateInkProduct, { isLoading: updating }] = useUpdateInkProductMutation()
  const [deleteInkProduct, { isLoading: deleting }] = useDeleteInkProductMutation()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inkProductSchema),
    defaultValues: initialValues,
    mode: 'onSubmit',
  })

  const loading = inkModelsLoading || inkProductsLoading
  const loadError = inkModelsError || inkProductsError

  const refresh = () => {
    refetchInkModels()
    refetchInkProducts()
  }

  const findDuplicateCode = (productCode, excludedId) => {
    const normalizedCode = productCode.trim().toLowerCase()
    if (!normalizedCode) return false

    return inkProducts.some(
      (product) =>
        product.id !== excludedId &&
        product.productCode?.trim().toLowerCase() === normalizedCode,
    )
  }

  const handleReview = (values) => {
    if (findDuplicateCode(values.productCode)) {
      setCreateError('This product code is already in use.')
      return
    }

    setCreateError('')
    setConfirmationValues({
      ...values,
      color: values.color.trim(),
      productCode: values.productCode.trim(),
    })
    setConfirmationOpen(true)
  }

  const handleCreate = async () => {
    if (!confirmationValues) return

    setCreateError('')

    try {
      await createInkProduct({
        inkModelId: confirmationValues.inkModelId,
        color: confirmationValues.color,
        packagingType: confirmationValues.packagingType,
        capacityMl: confirmationValues.capacityMl,
        productCode: confirmationValues.productCode || null,
      }).unwrap()

      setConfirmationOpen(false)
      setConfirmationValues(null)
      reset(initialValues)
      setNotice('Ink product added successfully.')
    } catch (error) {
      setCreateError(getApiErrorMessage(error, 'Unable to add this ink product.'))
    }
  }

  const handleOpenEdit = (product) => {
    setEditError('')
    setProductToEdit(product)
    setEditValues({
      inkModelId: product.inkModelId,
      color: product.color,
      packagingType: product.packagingType,
      capacityMl: String(product.capacityMl),
      productCode: product.productCode ?? '',
    })
  }

  const handleCloseEdit = () => {
    if (!updating) {
      setProductToEdit(null)
      setEditError('')
    }
  }

  const handleSaveEdit = async () => {
    if (!productToEdit) return

    const color = editValues.color.trim()
    const productCode = editValues.productCode.trim()
    const capacityMl = Number(editValues.capacityMl)

    if (!editValues.inkModelId) {
      setEditError('Select an ink model.')
      return
    }
    if (!color) {
      setEditError('Colour is required.')
      return
    }
    if (!Number.isInteger(capacityMl) || capacityMl <= 0) {
      setEditError('Capacity must be a positive whole number in ml.')
      return
    }
    if (!packagingTypes.some((type) => type.value === editValues.packagingType)) {
      setEditError('Select a packaging type.')
      return
    }
    if (findDuplicateCode(productCode, productToEdit.id)) {
      setEditError('This product code is already in use.')
      return
    }

    setEditError('')

    try {
      await updateInkProduct({
        id: productToEdit.id,
        version: productToEdit.version,
        inkModelId: editValues.inkModelId,
        color,
        packagingType: editValues.packagingType,
        capacityMl,
        productCode: productCode || null,
      }).unwrap()

      setProductToEdit(null)
      setNotice('Ink product updated successfully.')
    } catch (error) {
      setEditError(getApiErrorMessage(error, 'Unable to update this ink product.'))
    }
  }

  const handleOpenDelete = (product) => {
    setDeleteError('')
    setProductToDelete(product)
  }

  const handleCloseDelete = () => {
    if (!deleting) {
      setProductToDelete(null)
      setDeleteError('')
    }
  }

  const handleConfirmDelete = async () => {
    if (!productToDelete) return

    setDeleteError('')

    try {
      await deleteInkProduct(productToDelete.id).unwrap()
      setProductToDelete(null)
      setNotice('Ink product deleted successfully.')
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, 'Unable to delete this ink product.'))
    }
  }

  const getInkModelLabel = (model) =>
    model ? `${model.manufacturer?.name ?? 'Unknown manufacturer'} — ${model.inkName}` : '—'

  const confirmedInkModel = inkModels.find(
    (model) => model.id === confirmationValues?.inkModelId,
  )
  const confirmedPackaging = packagingTypes.find(
    (type) => type.value === confirmationValues?.packagingType,
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
            Ink products
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage ink colours, packaging formats and product capacities.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshRounded />}
          onClick={refresh}
          disabled={inkProductsFetching}
        >
          Refresh
        </Button>
      </Stack>

      {loadError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" onClick={refresh}>Retry</Button>}
        >
          {getApiErrorMessage(loadError, 'Unable to load ink product data.')} Check that the backend API is running and try again.
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
            <Inventory2Outlined />
          </Box>
          <Box>
            <Typography variant="h4">Add an ink product</Typography>
            <Typography variant="body2" color="text.secondary">
              Select an ink family, then define its colour and packaging variant.
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2.25}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="inkModelId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  required
                  label="Ink model"
                  disabled={inkModelsLoading || inkModels.length === 0}
                  error={Boolean(errors.inkModelId)}
                  helperText={errors.inkModelId?.message}
                >
                  <MenuItem value="">Select ink model</MenuItem>
                  {inkModels.map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      {getInkModelLabel(model)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              {...register('color')}
              fullWidth
              required
              label="Colour"
              placeholder="e.g. Cyan, Magenta, Light Black"
              error={Boolean(errors.color)}
              helperText={errors.color?.message}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="packagingType"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  required
                  label="Packaging type"
                  error={Boolean(errors.packagingType)}
                  helperText={errors.packagingType?.message}
                >
                  <MenuItem value="">Select packaging</MenuItem>
                  {packagingTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              {...register('capacityMl', { valueAsNumber: true })}
              fullWidth
              required
              type="number"
              label="Capacity (ml)"
              placeholder="e.g. 1000"
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              error={Boolean(errors.capacityMl)}
              helperText={errors.capacityMl?.message}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              {...register('productCode')}
              fullWidth
              label="Product code (optional)"
              placeholder="Manufacturer product code"
              error={Boolean(errors.productCode)}
              helperText={errors.productCode?.message}
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
            disabled={creating || inkModelsLoading || inkModels.length === 0}
          >
            Review details
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4">Registered ink products</Typography>
              <Typography variant="body2" color="text.secondary">
                {inkProducts.length} {inkProducts.length === 1 ? 'product' : 'products'} in your catalogue
              </Typography>
            </Box>
            <Inventory2Outlined color="action" />
          </Box>
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 150 }}>
            <CircularProgress size={28} />
          </Box>
        ) : inkProducts.length === 0 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: 150, px: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No ink products have been registered yet.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Manufacturer / Ink model</TableCell>
                  <TableCell>Colour</TableCell>
                  <TableCell>Packaging</TableCell>
                  <TableCell align="right">Capacity</TableCell>
                  <TableCell>Product code</TableCell>
                  <TableCell align="right">Lots</TableCell>
                  <TableCell align="right" sx={{ width: 112 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inkProducts.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell sx={{ minWidth: 190 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {product.inkModel?.manufacturer?.name ?? '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {product.inkModel?.inkName ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{product.color}</TableCell>
                    <TableCell>
                      {packagingTypes.find((type) => type.value === product.packagingType)?.label ?? product.packagingType}
                    </TableCell>
                    <TableCell align="right">{product.capacityMl.toLocaleString()} ml</TableCell>
                    <TableCell>{product.productCode || '—'}</TableCell>
                    <TableCell align="right">{product._count?.lots ?? 0}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={`Edit ${product.color} product`}>
                        <IconButton
                          aria-label={`Edit ${product.color} product`}
                          size="small"
                          onClick={() => handleOpenEdit(product)}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={`Delete ${product.color} product`}>
                        <IconButton
                          aria-label={`Delete ${product.color} product`}
                          color="error"
                          size="small"
                          onClick={() => handleOpenDelete(product)}
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
        <DialogTitle>Confirm ink product details</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please review these details before saving the ink product.
          </Typography>
          <Stack spacing={1.5}>
            <ConfirmationDetail label="Ink model" value={getInkModelLabel(confirmedInkModel)} />
            <ConfirmationDetail label="Colour" value={confirmationValues?.color} />
            <ConfirmationDetail label="Packaging" value={confirmedPackaging} />
            <ConfirmationDetail label="Capacity" value={confirmationValues?.capacityMl ? `${confirmationValues.capacityMl.toLocaleString()} ml` : '—'} />
            <ConfirmationDetail label="Product code" value={confirmationValues?.productCode || '—'} />
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

      <Dialog open={Boolean(productToEdit)} onClose={handleCloseEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit ink product</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                required
                label="Ink model"
                value={editValues.inkModelId}
                onChange={(event) => setEditValues((current) => ({ ...current, inkModelId: event.target.value }))}
              >
                {inkModels.map((model) => (
                  <MenuItem key={model.id} value={model.id}>{getInkModelLabel(model)}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Colour"
                value={editValues.color}
                onChange={(event) => setEditValues((current) => ({ ...current, color: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                required
                label="Packaging type"
                value={editValues.packagingType}
                onChange={(event) => setEditValues((current) => ({ ...current, packagingType: event.target.value }))}
              >
                {packagingTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                type="number"
                label="Capacity (ml)"
                value={editValues.capacityMl}
                onChange={(event) => setEditValues((current) => ({ ...current, capacityMl: event.target.value }))}
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Product code (optional)"
                value={editValues.productCode}
                onChange={(event) => setEditValues((current) => ({ ...current, productCode: event.target.value }))}
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

      <Dialog open={Boolean(productToDelete)} onClose={handleCloseDelete} fullWidth maxWidth="xs">
        <DialogTitle>Delete ink product?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete{' '}
            <Typography component="span" fontWeight={700} color="text.primary">
              {productToDelete?.color} — {productToDelete?.inkModel?.inkName}
            </Typography>
            ? This action cannot be undone.
          </Typography>
          {(productToDelete?._count?.lots ?? 0) > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This product has {productToDelete._count.lots}{' '}
              {productToDelete._count.lots === 1 ? 'lot' : 'lots'} and cannot be deleted until those lots are removed.
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
            disabled={deleting || (productToDelete?._count?.lots ?? 0) > 0}
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

export default InkProducts
