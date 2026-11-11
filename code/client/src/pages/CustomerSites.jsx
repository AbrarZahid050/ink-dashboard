import { useState } from 'react'
import CustomerSiteForm from '../features/customer-sites/components/CustomerSiteForm.jsx'
import CustomerSitesTable from '../features/customer-sites/components/CustomerSitesTable.jsx'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'
import { useGetCustomerSitesQuery } from '../services/api.js'
import FeedbackSnackbar from '../components/common/FeedbackSnackbar.jsx'
import PageContainer from '../components/common/PageContainer.jsx'
import PageHeader from '../components/common/PageHeader.jsx'
import QueryErrorAlert from '../components/common/QueryErrorAlert.jsx'

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
    <PageContainer>
      <PageHeader
        title="Customer Sites"
        description="Manage customer branches and the locations where machines are installed."
      />

      <QueryErrorAlert
        message={error && `${getApiErrorMessage(error, 'Unable to load customer sites.')} Check that the backend API is running and try again.`}
        onRetry={refetch}
      />

      <CustomerSiteForm onCreated={() => setNotice('Customer site added successfully.')} />
      <CustomerSitesTable
        sites={sites}
        loading={isLoading || (isFetching && sites.length === 0)}
      />

      <FeedbackSnackbar message={notice} onClose={() => setNotice('')} />
    </PageContainer>
  )
}

export default CustomerSites
