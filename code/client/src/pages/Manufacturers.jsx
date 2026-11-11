import { useState } from 'react'
import ManufacturerForm from '../features/manufacturers/components/ManufacturerForm.jsx'
import ManufacturersTable from '../features/manufacturers/components/ManufacturersTable.jsx'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'
import { useGetManufacturersQuery } from '../services/api.js'
import FeedbackSnackbar from '../components/common/FeedbackSnackbar.jsx'
import PageContainer from '../components/common/PageContainer.jsx'
import PageHeader from '../components/common/PageHeader.jsx'
import QueryErrorAlert from '../components/common/QueryErrorAlert.jsx'

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
    <PageContainer>
      <PageHeader
        title="Manufacturers"
        description="Manage the manufacturers available across your equipment catalogue."
      />

      <QueryErrorAlert
        message={error && `${getApiErrorMessage(error, 'Unable to load manufacturers.')} Check that the backend API is running and try again.`}
        onRetry={refetch}
      />

      <ManufacturerForm onCreated={() => setNotice('Manufacturer added successfully.')} />
      <ManufacturersTable
        manufacturers={manufacturers}
        loading={isLoading || (isFetching && manufacturers.length === 0)}
      />

      <FeedbackSnackbar message={notice} onClose={() => setNotice('')} />
    </PageContainer>
  )
}

export default Manufacturers
