import { lazy, Suspense, useState } from 'react'
import { Box, CircularProgress } from '@mui/material'
import MainLayout from './components/layout/MainLayout.jsx'

const MachineModels = lazy(() => import('./pages/MachineModels.jsx'))
const InkModels = lazy(() => import('./pages/InkModels.jsx'))
const InkProducts = lazy(() => import('./pages/InkProducts.jsx'))
const Manufacturers = lazy(() => import('./pages/Manufacturers.jsx'))
const Customers = lazy(() => import('./pages/Customers.jsx'))
const CustomerSites = lazy(() => import('./pages/CustomerSites.jsx'))
const Machines = lazy(() => import('./pages/Machines.jsx'))

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
        {activePage === 'Ink Models' ? (
          <InkModels />
        ) : activePage === 'Ink Products' ? (
          <InkProducts />
        ) : activePage === 'Manufacturers' ? (
          <Manufacturers />
        ) : activePage === 'Customers' ? (
          <Customers />
        ) : activePage === 'Customer Sites' ? (
          <CustomerSites />
        ) : activePage === 'Machines' ? (
          <Machines />
        ) : (
          <MachineModels />
        )}
      </Suspense>
    </MainLayout>
  )
}

export default App
