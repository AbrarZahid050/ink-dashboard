import { lazy, Suspense } from 'react'
import { Box, CircularProgress } from '@mui/material'
import MainLayout from './components/layout/MainLayout.jsx'

const MachineModels = lazy(() => import('./pages/MachineModels.jsx'))

function PageLoader() {
  return (
    <Box
      sx={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 280,
      }}
    >
      <CircularProgress size={30} />
    </Box>
  )
}

function App() {
  return (
    <MainLayout activePage="Machine Models" onNavigate={() => {}}>
      <Suspense fallback={<PageLoader />}>
        <MachineModels />
      </Suspense>
    </MainLayout>
  )
}

export default App
