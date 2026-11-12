import { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Box, CircularProgress } from '@mui/material'
import MainLayout from './components/layout/MainLayout.jsx'
import { appRoutes } from './app/routes.js'

function PageLoader() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
      <CircularProgress size={30} />
    </Box>
  )
}

function App() {
  return (
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {appRoutes.map(({ path, Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </MainLayout>
  )
}

export default App
