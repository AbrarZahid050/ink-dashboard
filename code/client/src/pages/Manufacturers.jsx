import { useState } from 'react'
import { Alert, Box, Button, Snackbar } from '@mui/material'
import ManufacturerForm from '../features/manufacturers/components/ManufacturerForm.jsx'
import ManufacturersTable from '../features/manufacturers/components/ManufacturersTable.jsx'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'
import { useGetManufacturersQuery } from '../services/api.js'

function Manufacturers() {
  const [notice, setNotice] = useState('')
  const {
    data: manufacturers = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetManufacturersQuery()

  return (
    <Box sx={{ maxWidth: 1500, mx: 'auto', pt: { xs: 3, sm: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <TypographyHeader />
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={refetch}>
              Retry
            </Button>
          }
        >
          {getApiErrorMessage(error, 'Unable to load manufacturers.')} Check that the backend API is running and try again.
        </Alert>
      )}

      <ManufacturerForm onCreated={() => setNotice('Manufacturer added successfully.')} />
      <ManufacturersTable manufacturers={manufacturers} loading={isLoading || (isFetching && manufacturers.length === 0)} />

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setNotice('')} severity="success" variant="filled" sx={{ width: '100%' }}>
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  )
}

function TypographyHeader() {
  return (
    <>
      <Typography variant="h3" sx={{ mb: 0.5 }}>Manufacturers</Typography>
      <Typography variant="body1" color="text.secondary">
        Manage the manufacturers available across your equipment catalogue.
      </Typography>
    </>
  )
}

export default Manufacturers
