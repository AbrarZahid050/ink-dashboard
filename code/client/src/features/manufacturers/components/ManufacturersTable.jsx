import { useState } from 'react'
import { BusinessOutlined, CloseRounded } from '@mui/icons-material'
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { useDeleteManufacturerMutation } from '../../../services/api.js'
import { getApiErrorMessage } from '../../machine-models/utils/getApiErrorMessage.js'

function ManufacturersTable({ manufacturers, loading }) {
  const [manufacturerToDelete, setManufacturerToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleteManufacturer, { isLoading: deleting }] = useDeleteManufacturerMutation()

  const handleOpenDelete = (manufacturer) => {
    setDeleteError('')
    setManufacturerToDelete(manufacturer)
  }

  const handleCloseDelete = () => {
    if (!deleting) {
      setManufacturerToDelete(null)
      setDeleteError('')
    }
  }

  const handleConfirmDelete = async () => {
    if (!manufacturerToDelete) return

    setDeleteError('')

    try {
      await deleteManufacturer(manufacturerToDelete.id).unwrap()
      setManufacturerToDelete(null)
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, 'Unable to delete this manufacturer.'))
    }
  }

  return (
    <>
      <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.25 }}>
          <StackHeader count={manufacturers.length} />
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 150 }}>
            <CircularProgress size={28} />
          </Box>
        ) : manufacturers.length === 0 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: 150, px: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No manufacturers have been added yet.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Manufacturer</TableCell>
                  <TableCell align="right" sx={{ width: 72 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {manufacturers.map((manufacturer) => (
                  <TableRow key={manufacturer.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{manufacturer.name}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={`Delete ${manufacturer.name}`}>
                        <IconButton
                          aria-label={`Delete ${manufacturer.name}`}
                          color="error"
                          size="small"
                          onClick={() => handleOpenDelete(manufacturer)}
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
        open={Boolean(manufacturerToDelete)}
        onClose={handleCloseDelete}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete manufacturer?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete{' '}
            <Typography component="span" fontWeight={700} color="text.primary">
              {manufacturerToDelete?.name}
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

function StackHeader({ count }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="h4">Manufacturers</Typography>
        <Typography variant="body2" color="text.secondary">
          {count} {count === 1 ? 'manufacturer' : 'manufacturers'} in your catalogue
        </Typography>
      </Box>
      <BusinessOutlined color="action" />
    </Box>
  )
}

export default ManufacturersTable
