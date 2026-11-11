import { useState } from 'react'
import MachineForm from '../features/machines/components/MachineForm.jsx'
import MachinesTable from '../features/machines/components/MachinesTable.jsx'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'
import { useGetMachinesQuery } from '../services/api.js'
import FeedbackSnackbar from '../components/common/FeedbackSnackbar.jsx'
import PageContainer from '../components/common/PageContainer.jsx'
import PageHeader from '../components/common/PageHeader.jsx'
import QueryErrorAlert from '../components/common/QueryErrorAlert.jsx'

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
    <PageContainer>
      <PageHeader
        title="Machines"
        description="Register and manage individual printers installed at customer locations."
      />

      <QueryErrorAlert
        message={error && `${getApiErrorMessage(error, 'Unable to load machines.')} Check that the backend API is running and try again.`}
        onRetry={refetch}
      />

      <MachineForm onCreated={() => setNotice('Machine registered successfully.')} />
      <MachinesTable
        machines={machines}
        loading={isLoading || (isFetching && machines.length === 0)}
      />

      <FeedbackSnackbar message={notice} onClose={() => setNotice('')} />
    </PageContainer>
  )
}

export default Machines
