import {
  GroupsOutlined,
  Inventory2Outlined,
  PrecisionManufacturingOutlined,
  ReceiptLongOutlined,
  RefreshRounded,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import {
  useGetCustomersQuery,
  useGetInkPurchasesQuery,
  useGetMachinesQuery,
} from '../services/api.js'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'

const numberFormat = new Intl.NumberFormat('en-AE')
const dateFormat = new Intl.DateTimeFormat('en-AE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function formatDate(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : dateFormat.format(date)
}

function SummaryCard({ label, value, helper, icon: Icon, loading }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderColor: 'divider', borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1.5 }}>
            {label}
          </Typography>
          {loading ? (
            <CircularProgress size={25} sx={{ my: 0.5 }} />
          ) : (
            <Typography variant="h2" sx={{ fontSize: 30, mb: 0.75 }}>
              {numberFormat.format(value)}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">{helper}</Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 42,
            height: 42,
            borderRadius: 2,
            color: 'primary.main',
            bgcolor: 'action.hover',
          }}
        >
          <Icon fontSize="small" />
        </Box>
      </Stack>
    </Paper>
  )
}

function Dashboard() {
  const machinesQuery = useGetMachinesQuery()
  const customersQuery = useGetCustomersQuery()
  const purchasesQuery = useGetInkPurchasesQuery()

  const machines = machinesQuery.data ?? []
  const customers = customersQuery.data ?? []
  const purchases = purchasesQuery.data ?? []
  const isLoading = machinesQuery.isLoading || customersQuery.isLoading || purchasesQuery.isLoading
  const errors = [machinesQuery.error, customersQuery.error, purchasesQuery.error].filter(Boolean)
  const totalMachines = machines.length
  const activeMachines = machines.filter((machine) => machine.status === 'ACTIVE').length
  const inactiveMachines = machines.filter((machine) => machine.status === 'INACTIVE').length
  const decommissionedMachines = machines.filter((machine) => machine.status === 'DECOMMISSIONED').length

  const machineStatuses = [
    { label: 'Active', count: activeMachines, color: 'success.main' },
    { label: 'Inactive', count: inactiveMachines, color: 'warning.main' },
    { label: 'Decommissioned', count: decommissionedMachines, color: 'text.disabled' },
  ]

  const recentPurchases = purchases.slice(0, 5)
  const refreshDashboard = () => {
    machinesQuery.refetch()
    customersQuery.refetch()
    purchasesQuery.refetch()
  }

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', pt: { xs: 3, sm: 4 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3.5 }}
      >
        <Box>
          <Typography variant="h1" sx={{ fontSize: { xs: 25, sm: 28 }, mb: 0.75 }}>
            Overview
          </Typography>
          <Typography color="text.secondary" variant="body2">
            A live snapshot of your registered equipment, customers, and ink sales.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshRounded />}
          onClick={refreshDashboard}
          disabled={machinesQuery.isFetching || customersQuery.isFetching || purchasesQuery.isFetching}
        >
          Refresh
        </Button>
      </Stack>

      {errors.length > 0 && (
        <Alert
          severity="error"
          sx={{ mb: 2.5 }}
          action={<Button color="inherit" size="small" onClick={refreshDashboard}>Retry</Button>}
        >
          {getApiErrorMessage(errors[0], 'Some dashboard data could not be loaded.')}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
          mb: 3,
        }}
      >
        <SummaryCard label="Registered machines" value={totalMachines} helper="All registered printers" icon={PrecisionManufacturingOutlined} loading={isLoading} />
        <SummaryCard label="Active machines" value={activeMachines} helper="Currently marked active" icon={PrecisionManufacturingOutlined} loading={isLoading} />
        <SummaryCard label="Customers" value={customers.length} helper="Registered customer accounts" icon={GroupsOutlined} loading={isLoading} />
        <SummaryCard label="Ink invoices" value={purchases.length} helper="Recorded purchase transactions" icon={ReceiptLongOutlined} loading={isLoading} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.15fr) minmax(0, 1fr)' }, gap: 2 }}>
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, minHeight: 300, borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="h4" sx={{ mb: 0.75 }}>Machine overview</Typography>
          <Typography variant="body2" color="text.secondary">
            Current status of all registered machines.
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 190 }}>
              <CircularProgress size={28} />
            </Box>
          ) : totalMachines === 0 ? (
            <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 190, textAlign: 'center' }}>
              <PrecisionManufacturingOutlined sx={{ fontSize: 34, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">No machines have been registered yet.</Typography>
            </Box>
          ) : (
            <Stack spacing={2.5} sx={{ mt: 3 }}>
              {machineStatuses.map((status) => (
                <Box key={status.label}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                    <Typography variant="body2" color="text.secondary">{status.label}</Typography>
                    <Typography variant="body2" fontWeight={700}>{numberFormat.format(status.count)}</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(status.count / totalMachines) * 100}
                    sx={{
                      height: 9,
                      borderRadius: 10,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': { bgcolor: status.color, borderRadius: 10 },
                    }}
                  />
                </Box>
              ))}
              <Typography variant="caption" color="text.secondary">
                {numberFormat.format(totalMachines)} machines in total
              </Typography>
            </Stack>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, minHeight: 300, borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="h4" sx={{ mb: 0.75 }}>Recent ink purchases</Typography>
          <Typography variant="body2" color="text.secondary">
            Latest customer purchase transactions.
          </Typography>

          {purchasesQuery.isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 190 }}>
              <CircularProgress size={28} />
            </Box>
          ) : recentPurchases.length === 0 ? (
            <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 190, textAlign: 'center' }}>
              <Inventory2Outlined sx={{ fontSize: 34, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">No ink purchases have been recorded yet.</Typography>
            </Box>
          ) : (
            <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />} spacing={0}>
              {recentPurchases.map((purchase) => (
                <Stack key={purchase.id} direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ py: 1.65 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={650} noWrap>
                      {purchase.customer?.name ?? 'Unknown customer'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {purchase.reference || 'No reference'} · {(purchase.items ?? []).length} {(purchase.items ?? []).length === 1 ? 'item' : 'items'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {formatDate(purchase.purchasedAt)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  )
}

export default Dashboard
