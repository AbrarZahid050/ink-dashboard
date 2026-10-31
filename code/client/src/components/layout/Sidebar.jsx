import {
  BusinessOutlined,
  SettingsOutlined,
  ViewInArOutlined,
} from '@mui/icons-material'
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'

const drawerWidth = 256

function Sidebar({ mobileOpen, onClose, isMobile, activePage, onNavigate }) {
  const navigationItems = [
    { label: 'Machine Models', icon: <ViewInArOutlined fontSize="small" /> },
    { label: 'Manufacturers', icon: <BusinessOutlined fontSize="small" /> },
  ]

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 3, py: 3 }}>
        <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 800, letterSpacing: '-0.04em' }}>
          ink<span style={{ color: '#45C7B8' }}>.</span>
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(232,238,248,0.58)' }}>
          Equipment management
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(232,238,248,0.10)' }} />

      <Box sx={{ px: 2, pt: 3, pb: 1 }}>
        <Typography
          variant="overline"
          sx={{ px: 1.5, color: 'rgba(232,238,248,0.48)', fontWeight: 700, letterSpacing: '0.1em' }}
        >
          WORKSPACE
        </Typography>
      </Box>

      <List sx={{ px: 1.5, pt: 0 }}>
        {navigationItems.map((item) => (
          <ListItemButton
            key={item.label}
            selected={activePage === item.label}
            onClick={() => {
              onNavigate(item.label)
              if (isMobile) onClose()
            }}
            sx={{
              minHeight: 46,
              mb: 0.5,
              px: 1.5,
              borderRadius: 2,
              color: 'rgba(232,238,248,0.72)',
              '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 38 },
              '&.Mui-selected': {
                color: '#FFFFFF',
                backgroundColor: 'rgba(69,199,184,0.15)',
                '& .MuiListItemIcon-root': { color: '#45C7B8' },
              },
              '&.Mui-selected:hover': { backgroundColor: 'rgba(69,199,184,0.22)' },
              '&:hover': { backgroundColor: 'rgba(232,238,248,0.07)' },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
            />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ mt: 'auto' }}>
        <Divider sx={{ borderColor: 'rgba(232,238,248,0.10)' }} />
        <List sx={{ px: 1.5, py: 2 }}>
          <ListItemButton
            onClick={isMobile ? onClose : undefined}
            sx={{
              minHeight: 46,
              px: 1.5,
              borderRadius: 2,
              color: 'rgba(232,238,248,0.72)',
              '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 38 },
              '&:hover': { backgroundColor: 'rgba(232,238,248,0.07)' },
            }}
          >
            <ListItemIcon><SettingsOutlined fontSize="small" /></ListItemIcon>
            <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </List>
      </Box>
    </Box>
  )

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: isMobile ? undefined : drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          border: 0,
          backgroundColor: '#0D192B',
          color: '#FFFFFF',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export default Sidebar
