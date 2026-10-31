import { useState } from 'react'
import { CloseRounded, EditOutlined, PrecisionManufacturingOutlined } from '@mui/icons-material'
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
  useDeleteMachineMutation,
  useGetCustomerSitesQuery,
  useGetMachineModelsQuery,
  useUpdateMachineMutation,
} from '../../../services/api.js'
import { getApiErrorMessage } from '../../machine-models/utils/getApiErrorMessage.js'

const statusOptions = [
  { value: 'ACTIVE', label: 'Active', color: 'success' },
  { value: 'INACTIVE', label: 'Inactive', color: 'default' },
  { value: 'DECOMMISSIONED', label: 'Decommissioned', color: 'warning' },
]

function MachinesTable({ machines, loading }) {
  const { data: models = [] } = useGetMachineModelsQuery()
  const { data: sites = [] } = useGetCustomerSitesQuery()
  const [machineToEdit, setMachineToEdit] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [editError, setEditError] = useState('')
  const [machineToDelete, setMachineToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [updateMachine, { isLoading: updating }] = useUpdateMachineMutation()
  const [deleteMachine, { isLoading: deleting }] = useDeleteMachineMutation()

  const handleOpenEdit = (machine) => {
    setMachineToEdit(machine)
    setEditValues({
      serialNumber: machine.serialNumber,
      machineModelId: machine.machineModelId,
      siteId: machine.siteId,
      installationDate: machine.installationDate?.slice(0, 10) ?? '',
      status: machine.status,
      notes: machine.notes ?? '',
    })
    setEditError('')
  }

  const handleSaveEdit = async () => {
    const serialNumber = editValues.serialNumber?.trim()
    if (!serialNumber || !editValues.machineModelId || !editValues.siteId || !editValues.installationDate) {
      setEditError('Serial number, model, site and installation date are required.')
      return
    }
    const duplicate = machines.some((machine) =>
      machine.id !== machineToEdit.id &&
      machine.serialNumber?.trim().toLowerCase() === serialNumber.toLowerCase(),
    )
    if (duplicate) {
      setEditError('A machine with this serial number already exists.')
      return
    }

    setEditError('')
    try {
      await updateMachine({
        id: machineToEdit.id,
        version: machineToEdit.version,
        serialNumber,
        machineModelId: editValues.machineModelId,
        siteId: editValues.siteId,
        installationDate: editValues.installationDate,
        status: editValues.status,
        notes: editValues.notes.trim() || null,
      }).unwrap()
      setMachineToEdit(null)
    } catch (error) {
      setEditError(getApiErrorMessage(error, 'Unable to update this machine.'))
    }
  }

  const handleConfirmDelete = async () => {
    if (!machineToDelete) return
    setDeleteError('')
    try {
      await deleteMachine(machineToDelete.id).unwrap()
      setMachineToDelete(null)
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, 'Unable to delete this machine.'))
    }
  }

  return (
    <>
      <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4">Registered machines</Typography>
              <Typography variant="body2" color="text.secondary">
                {machines.length} {machines.length === 1 ? 'machine' : 'machines'} registered
              </Typography>
            </Box>
            <PrecisionManufacturingOutlined color="action" />
          </Box>
        </Box>
        <Divider />
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 150 }}><CircularProgress size={28} /></Box>
        ) : machines.length === 0 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: 150, px: 2 }}>
            <Typography variant="body2" color="text.secondary">No machines have been registered yet.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 850 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Serial number</TableCell>
                  <TableCell>Machine model</TableCell>
                  <TableCell>Customer / site</TableCell>
                  <TableCell>Installation date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right" sx={{ width: 112 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {machines.map((machine) => {
                  const status = statusOptions.find((item) => item.value === machine.status) ?? statusOptions[1]
                  const modelName = machine.machineModel
                    ? `${machine.machineModel.manufacturer?.name ?? ''} ${machine.machineModel.modelName}`.trim()
                    : '—'
                  const siteName = machine.site
                    ? `${machine.site.customer?.name ?? ''} — ${machine.site.name}`
                    : '—'
                  return (
                    <TableRow key={machine.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{machine.serialNumber}</TableCell>
                      <TableCell>{modelName}</TableCell>
                      <TableCell>{siteName}</TableCell>
                      <TableCell>{machine.installationDate?.slice(0, 10) ?? '—'}</TableCell>
                      <TableCell><Chip size="small" label={status.label} color={status.color} /></TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title={`Edit ${machine.serialNumber}`}>
                            <IconButton aria-label={`Edit ${machine.serialNumber}`} size="small" onClick={() => handleOpenEdit(machine)}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={`Delete ${machine.serialNumber}`}>
                            <IconButton aria-label={`Delete ${machine.serialNumber}`} color="error" size="small" onClick={() => { setDeleteError(''); setMachineToDelete(machine) }}>
                              <CloseRounded fontSize="small" />
                            </IconButton>
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

      <Dialog open={Boolean(machineToEdit)} onClose={() => !updating && setMachineToEdit(null)} fullWidth maxWidth="md">
        <DialogTitle>Edit machine</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField fullWidth required label="Serial number" value={editValues.serialNumber ?? ''} onChange={(e) => { setEditValues((v) => ({ ...v, serialNumber: e.target.value })); setEditError('') }} />
              <TextField fullWidth required type="date" label="Installation date" InputLabelProps={{ shrink: true }} value={editValues.installationDate ?? ''} onChange={(e) => setEditValues((v) => ({ ...v, installationDate: e.target.value }))} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select fullWidth required label="Machine model" value={editValues.machineModelId ?? ''} onChange={(e) => setEditValues((v) => ({ ...v, machineModelId: e.target.value }))}>
                {models.map((model) => <MenuItem key={model.id} value={model.id}>{model.manufacturer?.name} {model.modelName}</MenuItem>)}
              </TextField>
              <TextField select fullWidth required label="Customer site" value={editValues.siteId ?? ''} onChange={(e) => setEditValues((v) => ({ ...v, siteId: e.target.value }))}>
                {sites.map((site) => <MenuItem key={site.id} value={site.id}>{site.customer?.name} — {site.name}</MenuItem>)}
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select fullWidth label="Status" value={editValues.status ?? 'ACTIVE'} onChange={(e) => setEditValues((v) => ({ ...v, status: e.target.value }))}>
                {statusOptions.map((status) => <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Notes" value={editValues.notes ?? ''} onChange={(e) => setEditValues((v) => ({ ...v, notes: e.target.value }))} />
            </Stack>
            {editError && <Alert severity="error">{editError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setMachineToEdit(null)} color="inherit" disabled={updating}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={updating || !editValues.serialNumber?.trim()} startIcon={updating ? <CircularProgress size={17} color="inherit" /> : <EditOutlined />}>
            {updating ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(machineToDelete)} onClose={() => !deleting && setMachineToDelete(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete machine?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <Typography component="span" fontWeight={700} color="text.primary">{machineToDelete?.serialNumber}</Typography>? This action cannot be undone.
          </Typography>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setMachineToDelete(null)} color="inherit" disabled={deleting}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting} startIcon={deleting ? <CircularProgress size={17} color="inherit" /> : <CloseRounded />}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default MachinesTable
