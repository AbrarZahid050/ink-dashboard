import { useState } from 'react'
import { Alert, Box, Button, Snackbar } from '@mui/material'
import MachineModelForm from '../features/machine-models/components/MachineModelForm.jsx'
import MachineModelsHeader from '../features/machine-models/components/MachineModelsHeader.jsx'
import MachineModelsTable from '../features/machine-models/components/MachineModelsTable.jsx'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'
import {
  useGetMachineModelsQuery,
  useGetManufacturersQuery,
} from '../services/api.js'

function MachineModels() {
  const [notice, setNotice] = useState('')

  const {
    data: manufacturers = [],
    isLoading: manufacturersLoading,
    isFetching: manufacturersFetching,
    error: manufacturersError,
    refetch: refetchManufacturers,
  } = useGetManufacturersQuery()

  const {
    data: models = [],
    isLoading: modelsLoading,
    isFetching: modelsFetching,
    error: modelsError,
    refetch: refetchModels,
  } = useGetMachineModelsQuery()

  const loading = manufacturersLoading || modelsLoading
  const refreshing = manufacturersFetching || modelsFetching
  const loadError = manufacturersError || modelsError

  const handleRefresh = () => {
    refetchManufacturers()
    refetchModels()
  }

  return (
    <Box sx={{ maxWidth: 1500, mx: 'auto', pt: { xs: 3, sm: 4 } }}>
      <MachineModelsHeader onRefresh={handleRefresh} refreshing={refreshing} />

      {loadError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {getApiErrorMessage(loadError, 'Unable to load machine model data.')}. Check that
          the backend API is running and try again.
        </Alert>
      )}

      <MachineModelForm
        manufacturers={manufacturers}
        manufacturersLoading={manufacturersLoading}
        onCreated={() => setNotice('Machine model added successfully.')}
      />

      <MachineModelsTable
        models={models}
        manufacturers={manufacturers}
        loading={loading}
      />

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotice('')}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default MachineModels
