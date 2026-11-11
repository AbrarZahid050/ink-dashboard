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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  useDeleteCustomerMutation,
  useUpdateCustomerMutation,
} from '../../../services/api.js'
import DataTable from '../../../components/common/DataTable.jsx'
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

        <DataTable
          rows={customers}
          columns={[
            { field: 'name', headerName: 'Customer / Company', cellSx: { fontWeight: 600 } },
            {
              field: 'sites',
              headerName: 'Sites',
              align: 'center',
              width: 120,
              renderCell: (customer) => customer._count?.sites ?? 0,
            },
            {
              field: 'actions',
              headerName: 'Actions',
              align: 'right',
              width: 112,
              renderCell: (customer) => {
                const siteCount = customer._count?.sites ?? 0
                return (
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title={`Edit ${customer.name}`}>
                      <IconButton aria-label={`Edit ${customer.name}`} size="small" onClick={() => handleOpenEdit(customer)}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={siteCount > 0 ? 'Remove customer sites first' : `Delete ${customer.name}`}>
                      <span>
                        <IconButton aria-label={`Delete ${customer.name}`} color="error" size="small" disabled={siteCount > 0} onClick={() => handleOpenDelete(customer)}>
                          <CloseRounded fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                )
              },
            },
          ]}
          loading={loading}
          emptyMessage="No customers have been added yet."
        />
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
