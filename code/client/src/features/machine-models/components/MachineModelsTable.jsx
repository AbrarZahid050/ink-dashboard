import { useState } from 'react'
import { CloseRounded, EditOutlined, PrecisionManufacturingOutlined } from '@mui/icons-material'
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
import { useDeleteMachineModelMutation } from '../../../services/api.js'
import { configurationOptions, technologyOptions } from '../constants/machineModelOptions.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import MachineModelEditDialog from './MachineModelEditDialog.jsx'

function MachineModelsTable({ models, manufacturers, loading }) {
  const [modelToEdit, setModelToEdit] = useState(null)
  const [modelToDelete, setModelToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleteMachineModel, { isLoading: deleting }] = useDeleteMachineModelMutation()

  const getManufacturerName = (model) =>
    model.manufacturer?.name ??
    manufacturers.find((manufacturer) => manufacturer.id === model.manufacturerId)?.name ??
    '—'

  const getOptionLabel = (options, value) =>
    options.find((option) => option.value === value)?.label ?? value

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
      await deleteMachineModel(modelToDelete.id).unwrap()
      setModelToDelete(null)
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, 'Unable to delete this machine model.'))
    }
  }

  return (
    <>
      <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4">Registered models</Typography>
              <Typography variant="body2" color="text.secondary">
                {models.length} {models.length === 1 ? 'model' : 'models'} in your catalogue
              </Typography>
            </Box>
            <PrecisionManufacturingOutlined color="action" />
          </Box>
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 150 }}>
            <CircularProgress size={28} />
          </Box>
        ) : models.length === 0 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: 150, px: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No machine models have been registered yet.
            </Typography>
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
                  <TableCell align="right" sx={{ width: 112 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id} hover>
                    <TableCell>{getManufacturerName(model)}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{model.modelName}</TableCell>
                    <TableCell>{getOptionLabel(technologyOptions, model.technology)}</TableCell>
                    <TableCell>{getOptionLabel(configurationOptions, model.configuration)}</TableCell>
                    <TableCell align="right">{model._count?.machines ?? 0}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={`Edit ${model.modelName}`}>
                        <IconButton
                          aria-label={`Edit ${model.modelName}`}
                          size="small"
                          onClick={() => setModelToEdit(model)}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={`Delete ${model.modelName}`}>
                        <IconButton
                          aria-label={`Delete ${model.modelName}`}
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

      {modelToEdit && (
        <MachineModelEditDialog
          model={modelToEdit}
          manufacturers={manufacturers}
          onClose={() => setModelToEdit(null)}
        />
      )}

      <Dialog open={Boolean(modelToDelete)} onClose={handleCloseDelete} fullWidth maxWidth="xs">
        <DialogTitle>Delete machine model?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete{' '}
            <Typography component="span" fontWeight={700} color="text.primary">
              {modelToDelete?.modelName}
            </Typography>
            ? This action cannot be undone.
          </Typography>
          {modelToDelete?._count?.machines > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This model is currently assigned to {modelToDelete._count.machines}{' '}
              {modelToDelete._count.machines === 1 ? 'machine' : 'machines'}. The database may prevent deletion while those records exist.
            </Alert>
          )}
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

export default MachineModelsTable
