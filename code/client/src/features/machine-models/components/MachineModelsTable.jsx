import { useMemo, useState } from 'react'
import { CloseRounded, EditOutlined, ExpandMoreRounded, PrecisionManufacturingOutlined } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
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
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { useDeleteMachineModelMutation } from '../../../services/api.js'
import { configurationOptions, technologyOptions } from '../constants/machineModelOptions.js'
import DataTable from '../../../components/common/DataTable.jsx'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import MachineModelEditDialog from './MachineModelEditDialog.jsx'

function MachineModelsTable({ models, manufacturers, loading }) {
  const [modelToEdit, setModelToEdit] = useState(null)
  const [modelToDelete, setModelToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [expandedManufacturers, setExpandedManufacturers] = useState({})
  const [deleteMachineModel, { isLoading: deleting }] = useDeleteMachineModelMutation()

  const getManufacturerName = (model) =>
    model.manufacturer?.name ??
    manufacturers.find((manufacturer) => manufacturer.id === model.manufacturerId)?.name ??
    'Unassigned manufacturer'

  const manufacturerGroups = useMemo(() => {
    const groups = new Map()

    models.forEach((model) => {
      const manufacturerName = getManufacturerName(model)
      const manufacturerId = model.manufacturerId ?? model.manufacturer?.id ?? manufacturerName
      const key = String(manufacturerId)

      if (!groups.has(key)) {
        groups.set(key, { id: key, name: manufacturerName, models: [] })
      }

      groups.get(key).models.push(model)
    })

    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [models, manufacturers])

  const getOptionLabel = (options, value) =>
    options.find((option) => option.value === value)?.label ?? value

  const isExpanded = (manufacturerId) => Boolean(expandedManufacturers[manufacturerId])

  const toggleManufacturer = (manufacturerId) => {
    setExpandedManufacturers((current) => ({
      ...current,
      [manufacturerId]: !current[manufacturerId],
    }))
  }

  const expandAll = () => {
    setExpandedManufacturers(
      Object.fromEntries(manufacturerGroups.map((group) => [group.id, true])),
    )
  }

  const collapseAll = () => setExpandedManufacturers({})

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

  const modelColumns = [
    { field: 'modelName', headerName: 'Model', cellSx: { fontWeight: 600 } },
    { field: 'technology', headerName: 'Technology', renderCell: (model) => getOptionLabel(technologyOptions, model.technology) },
    { field: 'configuration', headerName: 'Configuration', renderCell: (model) => getOptionLabel(configurationOptions, model.configuration) },
    { field: 'machines', headerName: 'Machines', align: 'right', renderCell: (model) => model._count?.machines ?? 0 },
    {
      field: 'actions',
      headerName: 'Actions',
      align: 'right',
      width: 112,
      renderCell: (model) => (
        <>
          <Tooltip title={`Edit ${model.modelName}`}>
            <IconButton aria-label={`Edit ${model.modelName}`} size="small" onClick={() => setModelToEdit(model)}>
              <EditOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Delete ${model.modelName}`}>
            <IconButton aria-label={`Delete ${model.modelName}`} color="error" size="small" onClick={() => handleOpenDelete(model)}>
              <CloseRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ]

  return (
    <>
      <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.25 }}>
          <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
            <Box>
              <Typography variant="h4">Registered models</Typography>
              <Typography variant="body2" color="text.secondary">
                {models.length} {models.length === 1 ? 'model' : 'models'} across {manufacturerGroups.length}{' '}
                {manufacturerGroups.length === 1 ? 'manufacturer' : 'manufacturers'}
              </Typography>
            </Box>
            <PrecisionManufacturingOutlined color="action" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
            <Button size="small" color="inherit" onClick={expandAll} disabled={loading || manufacturerGroups.length === 0}>
              Expand all
            </Button>
            <Button size="small" color="inherit" onClick={collapseAll} disabled={loading || manufacturerGroups.length === 0}>
              Collapse all
            </Button>
          </Box>
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 150 }}>
            <CircularProgress size={28} />
          </Box>
        ) : manufacturerGroups.length === 0 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: 150, px: 2 }}>
            <Typography variant="body2" color="text.secondary">No machine models have been registered yet.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableBody>
                {manufacturerGroups.map((group) => {
                  const expanded = isExpanded(group.id)

                  return (
                    <>
                      <TableRow
                        key={group.id}
                        hover
                        onClick={() => toggleManufacturer(group.id)}
                        sx={{
                          cursor: 'pointer',
                          '& td': {
                            bgcolor: expanded ? 'action.selected' : 'background.paper',
                            borderBottom: expanded ? 0 : undefined,
                          },
                        }}
                      >
                        <TableCell sx={{ width: 48, pl: 2 }}>
                          <IconButton
                            size="small"
                            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${group.name} models`}
                            aria-expanded={expanded}
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleManufacturer(group.id)
                            }}
                          >
                            <ExpandMoreRounded sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 180ms ease' }} />
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={700}>{group.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {group.models.length} {group.models.length === 1 ? 'model' : 'models'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            {expanded ? 'Hide models' : 'View models'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow key={`${group.id}-models`}>
                        <TableCell colSpan={3} sx={{ p: 0, borderBottom: expanded ? undefined : 0 }}>
                          <Collapse in={expanded} timeout="auto" unmountOnExit>
                            <Box sx={{ pl: { xs: 1, sm: 4 }, pr: { xs: 1, sm: 2 }, py: 1.5, bgcolor: 'action.hover' }}>
                              <DataTable
                                rows={group.models}
                                columns={modelColumns}
                                minWidth={650}
                                size="small"
                                emptyMessage="No models for this manufacturer."
                              />
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  )
                })}
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
