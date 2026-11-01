import { useMemo, useState } from 'react'
import {
  Alert, Box, Button, CircularProgress, Divider, FormControl, Grid,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material'
import { QueryStatsOutlined } from '@mui/icons-material'
import {
  useGetCustomersQuery,
  useGetInkModelsQuery,
  useGetMachineModelsQuery,
  useGetMachinesQuery,
  useLazyGetInkForecastQuery,
} from '../services/api.js'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'

const initialFilters = { customerId: '', machineModelId: '', inkModelId: '', horizonMonths: 3 }
const palette = ['#35C8E8', '#E85B9B', '#F2C94C', '#AAB4C4', '#8B7CF6', '#45C7B8', '#F08A4B']
const colourMap = {
  cyan: '#35C8E8', magenta: '#E85B9B', yellow: '#F2C94C', black: '#AAB4C4',
  'light cyan': '#70D9ED', 'light magenta': '#F29AC1', white: '#E8EEF8',
  clear: '#9AAAC0', orange: '#F08A4B', green: '#45C7B8', red: '#EF6B73', blue: '#6D9EFF',
}

const number = (value, digits = 1) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value ?? 0)

function monthLabel(value) {
  return new Date(value + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

function colourValue(name, index) {
  return colourMap[name.trim().toLowerCase()] ?? palette[index % palette.length]
}

function ForecastChart({ colours }) {
  const months = colours[0]?.forecast.map((item) => item.month) ?? []
  const values = colours.flatMap((item) => item.forecast.map((entry) => entry.predicted_bottles))
  const max = Math.max(1, Math.ceil(Math.max(...values) / 5) * 5)
  const left = 62
  const right = 870
  const bottom = 260
  const x = (index) => months.length === 1 ? (left + right) / 2 : left + index * (right - left) / (months.length - 1)
  const y = (value) => bottom - (value / max) * 220

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ minWidth: 520 }}>
        <svg viewBox="0 0 900 315" role="img" aria-label="Monthly ink bottle forecast by colour" style={{ width: '100%', display: 'block' }}>
          {Array.from({ length: 5 }, (_, i) => {
            const value = max * i / 4
            return (
              <g key={i}>
                <line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke="#34445D" strokeDasharray="4 5" />
                <text x="50" y={y(value) + 4} fill="#9AAAC0" fontSize="12" textAnchor="end">{number(value)}</text>
              </g>
            )
          })}
          <line x1={left} x2={right} y1={bottom} y2={bottom} stroke="#52647D" />
          {months.map((item, i) => (
            <text key={item} x={x(i)} y="288" fill="#9AAAC0" fontSize="12" textAnchor="middle">{monthLabel(item)}</text>
          ))}
          {colours.map((series, seriesIndex) => {
            const points = series.forecast.map((item, i) => ({ x: x(i), y: y(item.predicted_bottles) }))
            const path = points.map((point, i) => (i ? 'L ' : 'M ') + point.x + ' ' + point.y).join(' ')
            const stroke = colourValue(series.color, seriesIndex)
            return (
              <g key={series.color}>
                <path d={path} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((point, i) => (
                  <circle key={i} cx={point.x} cy={point.y} r="4.5" fill={stroke} stroke="#111C2E" strokeWidth="2">
                    <title>{series.color}: {number(series.forecast[i].predicted_bottles, 2)} bottles — {monthLabel(series.forecast[i].month)}</title>
                  </circle>
                ))}
              </g>
            )
          })}
        </svg>
      </Box>
      <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mt: 1 }}>
        {colours.map((series, i) => (
          <Stack key={series.color} direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: colourValue(series.color, i) }} />
            <Typography variant="caption" color="text.secondary">{series.color}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

function SummaryCard({ label, value, helper }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.25, height: '100%', borderColor: 'divider', borderRadius: 3 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h4" sx={{ mt: 0.75, fontSize: '1.55rem' }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{helper}</Typography>
    </Paper>
  )
}

function InkForecasts() {
  const [filters, setFilters] = useState(initialFilters)
  const [fetchForecast, { data: forecast, isFetching, error, reset }] = useLazyGetInkForecastQuery()
  const { data: customers = [], isLoading: customersLoading } = useGetCustomersQuery()
  const { data: models = [], isLoading: modelsLoading } = useGetMachineModelsQuery()
  const { data: inks = [], isLoading: inksLoading } = useGetInkModelsQuery()
  const { data: machines = [], isLoading: machinesLoading } = useGetMachinesQuery()

  const customerModelIds = useMemo(() => new Set(
    machines
      .filter((machine) => machine.site?.customer?.id === filters.customerId)
      .map((machine) => machine.machineModelId),
  ), [machines, filters.customerId])
  const availableModels = models.filter((model) => customerModelIds.has(model.id))
  const customer = customers.find((item) => item.id === filters.customerId)
  const machineModel = models.find((item) => item.id === filters.machineModelId)
  const inkModel = inks.find((item) => item.id === filters.inkModelId)
  const hasForecast = Boolean(forecast?.colours?.length)
  const noHistory = error?.status === 404

  const totals = useMemo(() => (forecast?.colours ?? []).reduce((sum, item) => ({
    predicted: sum.predicted + item.total_predicted_bottles,
    recommended: sum.recommended + item.total_recommended_bottles,
  }), { predicted: 0, recommended: 0 }), [forecast])

  const handleChange = (field) => (event) => {
    setFilters((current) => ({
      ...current,
      [field]: event.target.value,
      ...(field === 'customerId' ? { machineModelId: '' } : {}),
    }))
    reset()
  }

  const canGenerate = Boolean(
    filters.customerId && filters.machineModelId && filters.inkModelId
    && !customersLoading && !modelsLoading && !inksLoading && !machinesLoading,
  )

  return (
    <Box sx={{ maxWidth: 1500, mx: 'auto', pt: { xs: 3, sm: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.75 }}>
          <Box sx={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 2, color: 'primary.main', bgcolor: 'rgba(120,169,255,0.12)' }}>
            <QueryStatsOutlined />
          </Box>
          <Typography variant="h3">Ink Forecast</Typography>
        </Stack>
        <Typography color="text.secondary">Estimate future ink purchases using historical purchase patterns.</Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderColor: 'divider', borderRadius: 3 }}>
        <Typography variant="h4" sx={{ mb: 0.5 }}>Forecast configuration</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Select a customer, one of their installed machine models, an ink model and the forecast period.
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="forecast-customer-label">Customer</InputLabel>
              <Select labelId="forecast-customer-label" value={filters.customerId} label="Customer" onChange={handleChange('customerId')} disabled={customersLoading}>
                {customers.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="forecast-machine-label">Machine model</InputLabel>
              <Select labelId="forecast-machine-label" value={filters.machineModelId} label="Machine model" onChange={handleChange('machineModelId')} disabled={!filters.customerId || machinesLoading || modelsLoading || !availableModels.length}>
                {availableModels.map((item) => <MenuItem key={item.id} value={item.id}>{item.manufacturer?.name} {item.modelName}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="forecast-ink-label">Ink model</InputLabel>
              <Select labelId="forecast-ink-label" value={filters.inkModelId} label="Ink model" onChange={handleChange('inkModelId')} disabled={inksLoading}>
                {inks.map((item) => <MenuItem key={item.id} value={item.id}>{item.manufacturer?.name} {item.inkName}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="forecast-horizon-label">Forecast period</InputLabel>
              <Select labelId="forecast-horizon-label" value={filters.horizonMonths} label="Forecast period" onChange={handleChange('horizonMonths')}>
                {[1, 2, 3, 4, 5, 6, 9, 12].map((months) => (
                  <MenuItem key={months} value={months}>{months} {months === 1 ? 'month' : 'months'}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        {filters.customerId && !machinesLoading && !availableModels.length && (
          <Alert severity="info" sx={{ mt: 2 }}>This customer has no registered machines. Register a machine before generating a forecast.</Alert>
        )}
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2.5 }}>
          <Button variant="contained" onClick={() => fetchForecast(filters)} disabled={!canGenerate || isFetching} startIcon={isFetching ? <CircularProgress size={17} color="inherit" /> : <QueryStatsOutlined />}>
            {isFetching ? 'Generating forecast...' : 'Generate forecast'}
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert severity={noHistory ? 'info' : 'error'} sx={{ mb: 3 }}>
          {noHistory
            ? 'No purchase history was found for this customer, machine model and ink model. Record ink purchases before generating a forecast.'
            : getApiErrorMessage(error, 'Unable to generate the forecast. Check that the backend API and forecasting service are running.')}
        </Alert>
      )}

      {hasForecast && (
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Forecast results</Typography>
            <Typography variant="body2" color="text.secondary">
              {customer?.name} · {machineModel?.manufacturer?.name} {machineModel?.modelName} · {inkModel?.manufacturer?.name} {inkModel?.inkName}
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}><SummaryCard label="Predicted bottles" value={number(totals.predicted, 2)} helper="Estimated purchases across all colours" /></Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}><SummaryCard label="Recommended bottles" value={number(totals.recommended, 0)} helper="Rounded-up quantity to plan" /></Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}><SummaryCard label="Historical coverage" value={forecast.history_months + (forecast.history_months === 1 ? ' month' : ' months')} helper="Months between first and latest purchase" /></Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}><SummaryCard label="Confidence" value={forecast.confidence.charAt(0).toUpperCase() + forecast.confidence.slice(1)} helper="Based on historical coverage" /></Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderColor: 'divider', borderRadius: 3 }}>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Monthly forecast by colour</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Predicted bottle purchases per month. Each line represents one ink colour.</Typography>
            <ForecastChart colours={forecast.colours} />
          </Paper>

          <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h4">Monthly breakdown</Typography>
              <Typography variant="body2" color="text.secondary">Predicted and recommended quantities for each colour.</Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ink colour</TableCell>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Seasonal factor</TableCell>
                    <TableCell align="right">Predicted bottles</TableCell>
                    <TableCell align="right">Recommended bottles</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {forecast.colours.flatMap((colour) => colour.forecast.map((item) => (
                    <TableRow key={[colour.color, item.month].join('-')} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{colour.color}</TableCell>
                      <TableCell>{monthLabel(item.month)}</TableCell>
                      <TableCell align="right">{number(item.seasonal_factor, 2)}×</TableCell>
                      <TableCell align="right">{number(item.predicted_bottles, 2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{number(item.recommended_bottles, 0)}</TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Alert severity="info">
            <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>How to interpret this forecast</Typography>
            <Typography variant="body2">
              This estimates future bottle purchases from historical purchase quantities, adjusted using seasonal planning factors. It does not measure actual ink consumption. {forecast.seasonality_note}
            </Typography>
          </Alert>
        </Stack>
      )}

      {!hasForecast && !isFetching && !error && (
        <Paper variant="outlined" sx={{ minHeight: 210, display: 'grid', placeItems: 'center', textAlign: 'center', p: 3, borderColor: 'divider', borderRadius: 3 }}>
          <Stack alignItems="center" spacing={1}>
            <QueryStatsOutlined sx={{ fontSize: 38, color: 'text.secondary' }} />
            <Typography variant="h4">Ready to forecast</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440 }}>
              Select the customer, machine model, ink model and forecast period, then generate a forecast to see the results here.
            </Typography>
          </Stack>
        </Paper>
      )}
    </Box>
  )
}

export default InkForecasts
