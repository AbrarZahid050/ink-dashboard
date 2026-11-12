import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

function MainLayout({ children }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleMenuOpen = () => setMobileOpen(true)
  const handleMenuClose = () => setMobileOpen(false)

  const handleNavigate = (path) => {
    navigate(path)
    if (isMobile) handleMenuClose()
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Header onMenuClick={handleMenuOpen} isMobile={isMobile} />
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={handleMenuClose}
        isMobile={isMobile}
        activePath={location.pathname}
        onNavigate={handleNavigate}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, sm: 3, lg: 4 },
          pb: 4,
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important' }} />
        {children}
      </Box>
    </Box>
  )
}

export default MainLayout
