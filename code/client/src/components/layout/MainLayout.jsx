import { useState } from 'react'
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

function MainLayout({ children, activePage, onNavigate }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleMenuOpen = () => setMobileOpen(true)
  const handleMenuClose = () => setMobileOpen(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Header onMenuClick={handleMenuOpen} isMobile={isMobile} />
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={handleMenuClose}
        isMobile={isMobile}
        activePage={activePage}
        onNavigate={onNavigate}
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
