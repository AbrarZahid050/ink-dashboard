import { lazy, Suspense, useState } from 'react'
import { Box, CircularProgress } from '@mui/material'
import MainLayout from './components/layout/MainLayout.jsx'

const MachineModels = lazy(() => import('./pages/MachineModels.jsx'))
const Manufacturers = lazy(() => import('./pages/Manufacturers.jsx'))

function PageLoader() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
      <CircularProgress size={30} />
    </Box>
  )
}

function App() {
  const [activePage, setActivePage] = useState('Machine Models')

  return (
    <MainLayout activePage={activePage} onNavigate={setActivePage}>
      <Suspense fallback={<PageLoader />}>
        {activePage === 'Manufacturers' ? <Manufacturers /> : <MachineModels />}
      </Suspense>
    </MainLayout>
  )
}

export default App
