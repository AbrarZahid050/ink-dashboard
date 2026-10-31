import { useState } from 'react'
import { Alert, Box, Button, Snackbar, Typography } from '@mui/material'
import CustomerForm from '../features/customers/components/CustomerForm.jsx'
import CustomersTable from '../features/customers/components/CustomersTable.jsx'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'
import { useGetCustomersQuery } from '../services/api.js'

function Customers() {
  const [notice, setNotice] = useState('')
  const {
    data: customers = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetCustomersQuery()

  return (
    <Box sx={{ maxWidth: 1500, mx: 'auto', pt: { xs: 3, sm: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ mb: 0.5 }}>Customers</Typography>
        <Typography variant="body1" color="text.secondary">
          Manage customer companies and keep their locations organised.
        </Typography>
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
          {getApiErrorMessage(error, 'Unable to load customers.')} Check that the backend API is running and try again.
        </Alert>
      )}

      <CustomerForm onCreated={() => setNotice('Customer added successfully.')} />
      <CustomersTable
        customers={customers}
        loading={isLoading || (isFetching && customers.length === 0)}
      />

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

export default Customers
