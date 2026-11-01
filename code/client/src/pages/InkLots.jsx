import { useMemo, useState } from 'react'
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
  Chip,
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
  useCreateInkLotMutation,
  useDeleteInkLotMutation,
  useGetInkLotsQuery,
  useGetInkProductsQuery,
  useUpdateInkLotMutation,
} from '../services/api.js'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'

const initialValues = {
  inkProductId: '',
  lotNumber: '',
  expiryDate: '',
  quantity: '0',
}

const getProductLabel = (product) => {
  const manufacturer = product.inkModel?.manufacturer?.name ?? 'Unknown manufacturer'
  const model = product.inkModel?.inkName ?? 'Unknown ink'
  return `${manufacturer} — ${model} — ${product.color} — ${product.capacityMl.toLocaleString()} ml`
}

const formatDate = (value) => {
  if (!value) return '—'
  const datePart = String(value).slice(0, 10)
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) return '—'
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString()
}

const getExpiryStatus = (value) => {
  if (!value) return { label: 'Unknown', color: 'default' }
  const expiry = Date.parse(`${String(value).slice(0, 10)}T00:00:00Z`)
  const today = new Date()
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const daysRemaining = Math.ceil((expiry - todayUtc) / 86400000)

  if (daysRemaining < 0) return { label: 'Expired', color: 'error' }
  if (daysRemaining <= 30) return { label: 'Expiring soon', color: 'warning' }
  return { label: 'Valid', color: 'success' }
}

function InkLots() {
  const [createValues, setCreateValues] = useState(initialValues)
  const [confirmationValues, setConfirmationValues] = useState(null)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [createError, setCreateError] = useState('')
  const [notice, setNotice] = useState('')
  const [lotToEdit, setLotToEdit] = useState(null)
  const [editValues, setEditValues] = useState(initialValues)
  const [editError, setEditError] = useState('')
  const [lotToDelete, setLotToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  const {
    data: inkProducts = [],
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useGetInkProductsQuery()

  const {
    data: inkLots = [],
    isLoading: lotsLoading,
    isFetching: lotsFetching,
    error: lotsError,
    refetch: refetchLots,
  } = useGetInkLotsQuery()

  const [createInkLot, { isLoading: creating }] = useCreateInkLotMutation()
  const [updateInkLot, { isLoading: updating }] = useUpdateInkLotMutation()
  const [deleteInkLot, { isLoading: deleting }] = useDeleteInkLotMutation()

  const loading = productsLoading || lotsLoading
  const loadError = productsError || lotsError

  const productById = useMemo(
    () => new Map(inkProducts.map((product) => [product.id, product])),
    [inkProducts],
  )

  const refresh = () => {
    refetchProducts()
    refetchLots()
  }

  const hasDuplicateLot = (inkProductId, lotNumber, excludedId) => {
    const normalized = lotNumber.trim().toLowerCase()
    if (!normalized) return false
    return inkLots.some((lot) =>
      lot.id !== excludedId &&
      lot.inkProductId === inkProductId &&
      lot.lotNumber.trim().toLowerCase() === normalized,
    )
  }

  const handleCreateField = (field, value) => {
    setCreateValues((current) => ({ ...current, [field]: value }))
    setCreateError('')
  }

  const handleReview = (event) => {
    event.preventDefault()
    const quantity = Number(createValues.quantity)
    if (!createValues.inkProductId) {
      setCreateError('Select an ink product.')
      return
    }
    if (!createValues.lotNumber.trim()) {
      setCreateError('Lot number is required.')
      return
    }
    if (!createValues.expiryDate || !/^\\d{4}-\\d{2}-\\d{2}$/.test(createValues.expiryDate)) {
      setCreateError('Enter a valid expiry date.')
      return
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      setCreateError('Quantity must be a non-negative whole number.')
      return
    }
    if (hasDuplicateLot(createValues.inkProductId, createValues.lotNumber)) {
      setCreateError('This lot number is already registered for the selected ink product.')
      return
    }

    setCreateError('')
    setConfirmationValues({
      ...createValues,
      lotNumber: createValues.lotNumber.trim(),
      quantity,
    })
    setConfirmationOpen(true)
  }

  const handleCreate = async () => {
    if (!confirmationValues) return
    setCreateError('')
    try {
      await createInkLot(confirmationValues).unwrap()
      setConfirmationOpen(false)
      setConfirmationValues(null)
      setCreateValues(initialValues)
      setNotice('Ink lot added successfully.')
    } catch (error) {
      setCreateError(getApiErrorMessage(error, 'Unable to add this ink lot.'))
    }
  }

  const handleOpenEdit = (lot) => {
    setEditError('')
    setLotToEdit(lot)
    setEditValues({
      inkProductId: lot.inkProductId,
      lotNumber: lot.lotNumber,
      expiryDate: String(lot.expiryDate).slice(0, 10),
      quantity: String(lot.quantity),
    })
  }

  const handleCloseEdit = () => {
    if (!updating) {
      setLotToEdit(null)
      setEditError('')
    }
  }

  const handleSaveEdit = async () => {
    if (!lotToEdit) return
    const lotNumber = editValues.lotNumber.trim()
    const quantity = Number(editValues.quantity)

    if (!editValues.inkProductId) {
      setEditError('Select an ink product.')
      return
    }
    if (!lotNumber) {
      setEditError('Lot number is required.')
      return
    }
    if (!editValues.expiryDate || !/^\\d{4}-\\d{2}-\\d{2}$/.test(editValues.expiryDate)) {
      setEditError('Enter a valid expiry date.')
      return
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      setEditError('Quantity must be a non-negative whole number.')
      return
    }
    if (hasDuplicateLot(editValues.inkProductId, lotNumber, lotToEdit.id)) {
      setEditError('This lot number is already registered for the selected ink product.')
      return
    }

    setEditError('')
    try {
      await updateInkLot({
        id: lotToEdit.id,
        version: lotToEdit.version,
        inkProductId: editValues.inkProductId,
        lotNumber,
        expiryDate: editValues.expiryDate,
        quantity,
      }).unwrap()
      setLotToEdit(null)
      setNotice('Ink lot updated successfully.')
    } catch (error) {
      setEditError(getApiErrorMessage(error, 'Unable to update this ink lot.'))
    }
  }

  const handleConfirmDelete = async () => {
    if (!lotToDelete) return
    setDeleteError('')
    try {
      await deleteInkLot(lotToDelete.id).unwrap()
      setLotToDelete(null)
      setNotice('Ink lot deleted successfully.')
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, 'Unable to delete this ink lot.'))
    }
  }

  const confirmedProduct = productById.get(confirmationValues?.inkProductId)

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
            Ink lots
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track manufacturer batch numbers, expiry dates and package quantities.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshRounded />}
          onClick={refresh}
          disabled={lotsFetching}
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
          {getApiErrorMessage(loadError, 'Unable to load ink lot data.')} Check that the backend API is running and try again.
        </Alert>
      )}

      <Paper
        component="form"
        onSubmit={handleReview}
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
            <Typography variant="h4">Register an ink lot</Typography>
            <Typography variant="body2" color="text.secondary">
              Select the ink product and enter the details printed on its package.
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2.25}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              required
              label="Ink product"
              value={createValues.inkProductId}
              onChange={(event) => handleCreateField('inkProductId', event.target.value)}
              disabled={productsLoading || inkProducts.length === 0}
              helperText="Manufacturer, ink model, colour and package capacity are shown in the list."
            >
              <MenuItem value="">Select ink product</MenuItem>
              {inkProducts.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {getProductLabel(product)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              required
              label="Lot number"
              value={createValues.lotNumber}
              onChange={(event) => handleCreateField('lotNumber', event.target.value)}
              placeholder="Enter manufacturer lot number"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              required
              type="date"
              label="Expiry date"
              value={createValues.expiryDate}
              onChange={(event) => handleCreateField('expiryDate', event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              required
              type="number"
              label="Quantity (packages)"
              value={createValues.quantity}
              onChange={(event) => handleCreateField('quantity', event.target.value)}
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              helperText="Number of bottles, pouches or other packages."
            />
          </Grid>
        </Grid>

        {createError && <Alert severity="error" sx={{ mt: 2 }}>{createError}</Alert>}

        <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 3 }}>
          <Button
            type="button"
            color="inherit"
            onClick={() => {
              setCreateValues(initialValues)
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
            disabled={creating || productsLoading || inkProducts.length === 0}
          >
            Review details
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4">Registered ink lots</Typography>
              <Typography variant="body2" color="text.secondary">
                {inkLots.length} {inkLots.length === 1 ? 'lot' : 'lots'} in your inventory
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
        ) : inkLots.length === 0 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: 150, px: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No ink lots have been registered yet.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ink product</TableCell>
                  <TableCell>Lot number</TableCell>
                  <TableCell>Expiry date</TableCell>
                  <TableCell>Expiry status</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right" sx={{ width: 112 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inkLots.map((lot) => {
                  const product = lot.inkProduct ?? productById.get(lot.inkProductId)
                  const status = getExpiryStatus(lot.expiryDate)
                  return (
                    <TableRow key={lot.id} hover>
                      <TableCell sx={{ minWidth: 230 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {product?.inkModel?.manufacturer?.name ?? '—'} — {product?.inkModel?.inkName ?? '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product ? `${product.color} · ${product.packagingType} · ${product.capacityMl.toLocaleString()} ml` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{lot.lotNumber}</TableCell>
                      <TableCell>{formatDate(lot.expiryDate)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={status.label} color={status.color} variant="outlined" />
                      </TableCell>
                      <TableCell align="right">{lot.quantity.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Tooltip title={`Edit lot ${lot.lotNumber}`}>
                          <IconButton
                            aria-label={`Edit lot ${lot.lotNumber}`}
                            size="small"
                            onClick={() => handleOpenEdit(lot)}
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={`Delete lot ${lot.lotNumber}`}>
                          <IconButton
                            aria-label={`Delete lot ${lot.lotNumber}`}
                            color="error"
                            size="small"
                            onClick={() => {
                              setDeleteError('')
                              setLotToDelete(lot)
                            }}
                          >
                            <CloseRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })}
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
        <DialogTitle>Confirm ink lot details</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please review these details before saving the lot.
          </Typography>
          <Stack spacing={1.5}>
            <ConfirmationDetail label="Ink product" value={confirmedProduct ? getProductLabel(confirmedProduct) : '—'} />
            <ConfirmationDetail label="Lot number" value={confirmationValues?.lotNumber} />
            <ConfirmationDetail label="Expiry date" value={formatDate(confirmationValues?.expiryDate)} />
            <ConfirmationDetail label="Quantity" value={confirmationValues ? `${confirmationValues.quantity.toLocaleString()} packages` : '—'} />
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

      <Dialog open={Boolean(lotToEdit)} onClose={handleCloseEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit ink lot</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                required
                label="Ink product"
                value={editValues.inkProductId}
                onChange={(event) => setEditValues((current) => ({ ...current, inkProductId: event.target.value }))}
              >
                {inkProducts.map((product) => (
                  <MenuItem key={product.id} value={product.id}>{getProductLabel(product)}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                required
                label="Lot number"
                value={editValues.lotNumber}
                onChange={(event) => setEditValues((current) => ({ ...current, lotNumber: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                required
                type="date"
                label="Expiry date"
                value={editValues.expiryDate}
                onChange={(event) => setEditValues((current) => ({ ...current, expiryDate: event.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                required
                type="number"
                label="Quantity (packages)"
                value={editValues.quantity}
                onChange={(event) => setEditValues((current) => ({ ...current, quantity: event.target.value }))}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
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

      <Dialog open={Boolean(lotToDelete)} onClose={() => !deleting && setLotToDelete(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete ink lot?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete lot{' '}
            <Typography component="span" fontWeight={700} color="text.primary">
              {lotToDelete?.lotNumber}
            </Typography>
            ? This action cannot be undone.
          </Typography>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLotToDelete(null)} color="inherit" disabled={deleting}>Cancel</Button>
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

export default InkLots
