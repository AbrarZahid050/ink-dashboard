import { useState } from 'react'
import { Alert, Box, Button, Snackbar, Typography } from '@mui/material'
import MachineForm from '../features/machines/components/MachineForm.jsx'
import MachinesTable from '../features/machines/components/MachinesTable.jsx'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'
import { useGetMachinesQuery } from '../services/api.js'

function Machines() {
  const [notice, setNotice] = useState('')
  const {
    data: machines = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetMachinesQuery()

  return (
    <Box sx={{ maxWidth: 1500, mx: 'auto', pt: { xs: 3, sm: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ mb: 0.5 }}>Machines</Typography>
        <Typography variant="body1" color="text.secondary">
          Register and manage individual printers installed at customer locations.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={refetch}>Retry</Button>}>
          {getApiErrorMessage(error, 'Unable to load machines.')} Check that the backend API is running and try again.
        </Alert>
      )}

      <MachineForm onCreated={() => setNotice('Machine registered successfully.')} />
      <MachinesTable machines={machines} loading={isLoading || (isFetching && machines.length === 0)} />

      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setNotice('')} severity="success" variant="filled" sx={{ width: '100%' }}>{notice}</Alert>
      </Snackbar>
    </Box>
  )
}

export default Machines
