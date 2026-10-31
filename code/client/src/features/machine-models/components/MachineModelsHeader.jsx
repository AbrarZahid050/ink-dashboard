import { RefreshRounded } from '@mui/icons-material'
import { Box, Button, Stack, Typography } from '@mui/material'

function MachineModelsHeader({ onRefresh, refreshing }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h1" sx={{ fontSize: { xs: 25, sm: 28 }, mb: 0.75 }}>
          Machine models
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Register printer models and define their supported configurations.
        </Typography>
      </Box>

      <Button
        variant="outlined"
        startIcon={<RefreshRounded />}
        onClick={onRefresh}
        disabled={refreshing}
      >
        Refresh
      </Button>
    </Stack>
  )
}

export default MachineModelsHeader
