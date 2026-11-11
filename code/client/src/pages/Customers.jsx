import { useState } from 'react'
import CustomerForm from '../features/customers/components/CustomerForm.jsx'
import CustomersTable from '../features/customers/components/CustomersTable.jsx'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'
import { useGetCustomersQuery } from '../services/api.js'
import FeedbackSnackbar from '../components/common/FeedbackSnackbar.jsx'
import PageContainer from '../components/common/PageContainer.jsx'
import PageHeader from '../components/common/PageHeader.jsx'
import QueryErrorAlert from '../components/common/QueryErrorAlert.jsx'

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
    <PageContainer>
      <PageHeader
        title="Customers"
        description="Manage customer companies and keep their locations organised."
      />

      <QueryErrorAlert
        message={error && `${getApiErrorMessage(error, 'Unable to load customers.')} Check that the backend API is running and try again.`}
        onRetry={refetch}
      />

      <CustomerForm onCreated={() => setNotice('Customer added successfully.')} />
      <CustomersTable
        customers={customers}
        loading={isLoading || (isFetching && customers.length === 0)}
      />

      <FeedbackSnackbar message={notice} onClose={() => setNotice('')} />
    </PageContainer>
  )
}

export default Customers
