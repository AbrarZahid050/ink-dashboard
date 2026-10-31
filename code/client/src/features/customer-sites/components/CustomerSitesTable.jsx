import { useState } from 'react'
import { CloseRounded, EditOutlined, LocationOnOutlined } from '@mui/icons-material'
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
  IconButton,
  MenuItem,
  Paper,
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
  useDeleteCustomerSiteMutation,
  useGetCustomersQuery,
  useUpdateCustomerSiteMutation,
} from '../../../services/api.js'
import { getApiErrorMessage } from '../../machine-models/utils/getApiErrorMessage.js'

function CustomerSitesTable({ sites, loading }) {
  const { data: customers = [] } = useGetCustomersQuery()
  const [siteToEdit, setSiteToEdit] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [editError, setEditError] = useState('')
  const [siteToDelete, setSiteToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [updateCustomerSite, { isLoading: updating }] = useUpdateCustomerSiteMutation()
  const [deleteCustomerSite, { isLoading: deleting }] = useDeleteCustomerSiteMutation()

  const handleOpenEdit = (site) => {
    setSiteToEdit(site)
    setEditValues({
      customerId: site.customerId,
      name: site.name,
      address: site.address ?? '',
      city: site.city ?? '',
      country: site.country ?? '',
    })
    setEditError('')
  }

  const handleSaveEdit = async () => {
    const name = editValues.name?.trim()
    if (!name) {
      setEditError('Site name is required.')
      return
    }
    const duplicate = sites.some((site) =>
      site.id !== siteToEdit.id &&
      site.customerId === editValues.customerId &&
      site.name?.trim().toLowerCase() === name.toLowerCase(),
    )
    if (duplicate) {
      setEditError('This customer already has a site with this name.')
      return
    }

    setEditError('')
    try {
      await updateCustomerSite({
        id: siteToEdit.id,
        version: siteToEdit.version,
        customerId: editValues.customerId,
        name,
        address: editValues.address.trim() || null,
        city: editValues.city.trim() || null,
        country: editValues.country.trim() || null,
      }).unwrap()
      setSiteToEdit(null)
    } catch (error) {
      setEditError(getApiErrorMessage(error, 'Unable to update this customer site.'))
    }
  }

  const handleConfirmDelete = async () => {
    if (!siteToDelete) return
    setDeleteError('')
    try {
      await deleteCustomerSite(siteToDelete.id).unwrap()
      setSiteToDelete(null)
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, 'Unable to delete this customer site.'))
    }
  }

  return (
    <>
      <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4">Customer sites</Typography>
              <Typography variant="body2" color="text.secondary">
                {sites.length} {sites.length === 1 ? 'site' : 'sites'} registered
              </Typography>
            </Box>
            <LocationOnOutlined color="action" />
          </Box>
        </Box>
        <Divider />
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 150 }}><CircularProgress size={28} /></Box>
        ) : sites.length === 0 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: 150, px: 2 }}>
            <Typography variant="body2" color="text.secondary">No customer sites have been added yet.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Site / Branch</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="center" sx={{ width: 100 }}>Machines</TableCell>
                  <TableCell align="right" sx={{ width: 112 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sites.map((site) => {
                  const machineCount = site._count?.machines ?? 0
                  const location = [site.city, site.country].filter(Boolean).join(', ')
                  return (
                    <TableRow key={site.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{site.name}</TableCell>
                      <TableCell>{site.customer?.name ?? '—'}</TableCell>
                      <TableCell>{location || site.address || '—'}</TableCell>
                      <TableCell align="center">{machineCount}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title={`Edit ${site.name}`}>
                            <IconButton aria-label={`Edit ${site.name}`} size="small" onClick={() => handleOpenEdit(site)}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={machineCount > 0 ? 'Remove installed machines first' : `Delete ${site.name}`}>
                            <span>
                              <IconButton aria-label={`Delete ${site.name}`} color="error" size="small" disabled={machineCount > 0} onClick={() => { setDeleteError(''); setSiteToDelete(site) }}>
                                <CloseRounded fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={Boolean(siteToEdit)} onClose={() => !updating && setSiteToEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit customer site</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField select fullWidth label="Customer / company" value={editValues.customerId ?? ''} onChange={(e) => setEditValues((v) => ({ ...v, customerId: e.target.value }))}>
              {customers.map((customer) => <MenuItem key={customer.id} value={customer.id}>{customer.name}</MenuItem>)}
            </TextField>
            <TextField fullWidth required label="Site / branch name" value={editValues.name ?? ''} onChange={(e) => { setEditValues((v) => ({ ...v, name: e.target.value })); setEditError('') }} />
            <TextField fullWidth label="Address" value={editValues.address ?? ''} onChange={(e) => setEditValues((v) => ({ ...v, address: e.target.value }))} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField fullWidth label="City" value={editValues.city ?? ''} onChange={(e) => setEditValues((v) => ({ ...v, city: e.target.value }))} />
              <TextField fullWidth label="Country" value={editValues.country ?? ''} onChange={(e) => setEditValues((v) => ({ ...v, country: e.target.value }))} />
            </Stack>
            {editError && <Alert severity="error">{editError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSiteToEdit(null)} color="inherit" disabled={updating}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={updating || !editValues.name?.trim()} startIcon={updating ? <CircularProgress size={17} color="inherit" /> : <EditOutlined />}>
            {updating ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(siteToDelete)} onClose={() => !deleting && setSiteToDelete(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete customer site?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <Typography component="span" fontWeight={700} color="text.primary">{siteToDelete?.name}</Typography>? This action cannot be undone.
          </Typography>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSiteToDelete(null)} color="inherit" disabled={deleting}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting} startIcon={deleting ? <CircularProgress size={17} color="inherit" /> : <CloseRounded />}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default CustomerSitesTable
