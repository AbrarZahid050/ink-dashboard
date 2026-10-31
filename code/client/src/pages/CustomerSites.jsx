import { useState } from 'react'
import { Alert, Box, Button, Snackbar, Typography } from '@mui/material'
import CustomerSiteForm from '../features/customer-sites/components/CustomerSiteForm.jsx'
import CustomerSitesTable from '../features/customer-sites/components/CustomerSitesTable.jsx'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'
import { useGetCustomerSitesQuery } from '../services/api.js'

function CustomerSites() {
  const [notice, setNotice] = useState('')
  const {
    data: sites = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetCustomerSitesQuery()

  return (
    <Box sx={{ maxWidth: 1500, mx: 'auto', pt: { xs: 3, sm: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ mb: 0.5 }}>Customer Sites</Typography>
        <Typography variant="body1" color="text.secondary">
          Manage customer branches and the locations where machines are installed.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={refetch}>Retry</Button>}>
          {getApiErrorMessage(error, 'Unable to load customer sites.')} Check that the backend API is running and try again.
        </Alert>
      )}

      <CustomerSiteForm onCreated={() => setNotice('Customer site added successfully.')} />
      <CustomerSitesTable sites={sites} loading={isLoading || (isFetching && sites.length === 0)} />

      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setNotice('')} severity="success" variant="filled" sx={{ width: '100%' }}>{notice}</Alert>
      </Snackbar>
    </Box>
  )
}

export default CustomerSites
