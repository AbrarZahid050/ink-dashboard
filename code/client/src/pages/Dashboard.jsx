import {
  BuildOutlined,
  Inventory2Outlined,
  PrecisionManufacturingOutlined,
  TaskAltOutlined,
} from '@mui/icons-material'
import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material'

const summaryItems = [
  { label: 'Total machines', value: '—', note: 'Registered equipment', icon: PrecisionManufacturingOutlined },
  { label: 'Operational', value: '—', note: 'Machines in service', icon: TaskAltOutlined },
  { label: 'Under maintenance', value: '—', note: 'Currently being serviced', icon: BuildOutlined },
  { label: 'Open requests', value: '—', note: 'Awaiting action', icon: Inventory2Outlined },
]

function Dashboard() {
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
            Monitor your equipment and service operations.
          </Typography>
        </Box>
        <Chip
          label="Dashboard"
          size="small"
          sx={{ bgcolor: 'secondary.light', color: 'secondary.main', fontWeight: 700, borderRadius: 1.5 }}
        />
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
          mb: 3,
        }}
      >
        {summaryItems.map(({ label, value, note, icon: Icon }) => (
          <Paper key={label} variant="outlined" sx={{ p: 2.5, borderColor: 'divider', borderRadius: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1.5 }}>
                  {label}
                </Typography>
                <Typography variant="h2" sx={{ fontSize: 30, mb: 0.75 }}>{value}</Typography>
                <Typography variant="caption" color="text.secondary">{note}</Typography>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  color: 'primary.main',
                  bgcolor: 'primary.light',
                }}
              >
                <Icon fontSize="small" />
              </Box>
            </Stack>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.6fr) minmax(280px, 1fr)' }, gap: 2 }}>
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, minHeight: 300, borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="h4" sx={{ mb: 0.75 }}>Machine overview</Typography>
          <Typography variant="body2" color="text.secondary">
            Equipment status and activity will appear here once connected to the API.
          </Typography>
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              minHeight: 190,
              mt: 2.5,
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: '#FAFBFD',
              textAlign: 'center',
              px: 2,
            }}
          >
            <Box>
              <PrecisionManufacturingOutlined sx={{ fontSize: 34, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No machine data to display yet
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, minHeight: 300, borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="h4" sx={{ mb: 0.75 }}>Recent activity</Typography>
          <Typography variant="body2" color="text.secondary">
            The latest service and inventory updates will appear here.
          </Typography>
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              minHeight: 190,
              mt: 2.5,
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: '#FAFBFD',
              textAlign: 'center',
              px: 2,
            }}
          >
            <Box>
              <BuildOutlined sx={{ fontSize: 34, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No recent activity
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default Dashboard
