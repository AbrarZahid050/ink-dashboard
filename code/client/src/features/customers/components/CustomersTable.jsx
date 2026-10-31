import { useState } from 'react'
import { CloseRounded, EditOutlined, GroupsOutlined } from '@mui/icons-material'
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
  useDeleteCustomerMutation,
  useUpdateCustomerMutation,
} from '../../../services/api.js'
import { getApiErrorMessage } from '../../machine-models/utils/getApiErrorMessage.js'

function CustomersTable({ customers, loading }) {
  const [customerToEdit, setCustomerToEdit] = useState(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')
  const [customerToDelete, setCustomerToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [updateCustomer, { isLoading: updating }] = useUpdateCustomerMutation()
  const [deleteCustomer, { isLoading: deleting }] = useDeleteCustomerMutation()

  const handleOpenEdit = (customer) => {
    setEditError('')
    setCustomerToEdit(customer)
    setEditName(customer.name)
  }

  const handleCloseEdit = () => {
    if (!updating) {
      setCustomerToEdit(null)
      setEditError('')
    }
  }

  const handleSaveEdit = async () => {
    const name = editName.trim()

    if (!name) {
      setEditError('Customer name is required.')
      return
    }

    const duplicate = customers.some(
      (customer) =>
        customer.id !== customerToEdit.id &&
        customer.name?.trim().toLowerCase() === name.toLowerCase(),
    )

    if (duplicate) {
      setEditError('Another customer already has this name.')
      return
    }

    setEditError('')

    try {
      await updateCustomer({
        id: customerToEdit.id,
        version: customerToEdit.version,
        name,
      }).unwrap()
      setCustomerToEdit(null)
    } catch (error) {
      setEditError(getApiErrorMessage(error, 'Unable to update this customer.'))
    }
  }

  const handleOpenDelete = (customer) => {
    setDeleteError('')
    setCustomerToDelete(customer)
  }

  const handleCloseDelete = () => {
    if (!deleting) {
      setCustomerToDelete(null)
      setDeleteError('')
    }
  }

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return

    setDeleteError('')

    try {
      await deleteCustomer(customerToDelete.id).unwrap()
      setCustomerToDelete(null)
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, 'Unable to delete this customer.'))
    }
  }

  return (
    <>
      <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4">Customers</Typography>
              <Typography variant="body2" color="text.secondary">
                {customers.length} {customers.length === 1 ? 'customer' : 'customers'} registered
              </Typography>
            </Box>
            <GroupsOutlined color="action" />
          </Box>
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 150 }}>
            <CircularProgress size={28} />
          </Box>
        ) : customers.length === 0 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: 150, px: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No customers have been added yet.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer / Company</TableCell>
                  <TableCell align="center" sx={{ width: 120 }}>Sites</TableCell>
                  <TableCell align="right" sx={{ width: 112 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((customer) => {
                  const siteCount = customer._count?.sites ?? 0

                  return (
                    <TableRow key={customer.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{customer.name}</TableCell>
                      <TableCell align="center">{siteCount}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title={`Edit ${customer.name}`}>
                            <IconButton
                              aria-label={`Edit ${customer.name}`}
                              size="small"
                              onClick={() => handleOpenEdit(customer)}
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={siteCount > 0 ? 'Remove customer sites first' : `Delete ${customer.name}`}>
                            <span>
                              <IconButton
                                aria-label={`Delete ${customer.name}`}
                                color="error"
                                size="small"
                                disabled={siteCount > 0}
                                onClick={() => handleOpenDelete(customer)}
                              >
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

      <Dialog open={Boolean(customerToEdit)} onClose={handleCloseEdit} fullWidth maxWidth="xs">
        <DialogTitle>Edit customer</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            fullWidth
            label="Customer / company name"
            value={editName}
            onChange={(event) => {
              setEditName(event.target.value)
              setEditError('')
            }}
            error={Boolean(editError)}
            helperText={editError || ' '}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEdit} color="inherit" disabled={updating}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={updating || !editName.trim()}
            startIcon={updating ? <CircularProgress size={17} color="inherit" /> : <EditOutlined />}
          >
            {updating ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(customerToDelete)} onClose={handleCloseDelete} fullWidth maxWidth="xs">
        <DialogTitle>Delete customer?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete{' '}
            <Typography component="span" fontWeight={700} color="text.primary">
              {customerToDelete?.name}
            </Typography>
            ? This action cannot be undone.
          </Typography>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDelete} color="inherit" disabled={deleting}>
            Cancel
          </Button>
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
    </>
  )
}

export default CustomersTable
