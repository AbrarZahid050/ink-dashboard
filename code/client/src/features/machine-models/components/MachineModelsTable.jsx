import { PrecisionManufacturingOutlined } from '@mui/icons-material'
import {
  Box,
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { configurationOptions, technologyOptions } from '../constants/machineModelOptions.js'

function MachineModelsTable({ models, manufacturers, loading }) {
  const getManufacturerName = (model) =>
    model.manufacturer?.name ??
    manufacturers.find((manufacturer) => manufacturer.id === model.manufacturerId)?.name ??
    '—'

  const getOptionLabel = (options, value) =>
    options.find((option) => option.value === value)?.label ?? value

  return (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}

export default MachineModelsTable
