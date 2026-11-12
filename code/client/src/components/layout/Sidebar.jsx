import { SettingsOutlined } from '@mui/icons-material'
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
import { appRoutes } from '../../app/routes.js'

const drawerWidth = 256

function Sidebar({ mobileOpen, onClose, isMobile, activePath, onNavigate }) {
  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 3, py: 3.1 }}>
        <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 800, letterSpacing: '-0.05em' }}>
          ink<span style={{ color: '#55D6C2' }}>.</span>
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(226,232,240,0.52)', letterSpacing: '0.015em' }}>
          Equipment management
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(226,232,240,0.09)' }} />

      <Box sx={{ px: 2, pt: 3, pb: 1 }}>
        <Typography
          variant="overline"
          sx={{ px: 1.5, color: 'rgba(226,232,240,0.38)', fontWeight: 750, letterSpacing: '0.13em', fontSize: 10 }}
        >
          WORKSPACE
        </Typography>
      </Box>

      <List sx={{ px: 1.5, pt: 0 }}>
        {appRoutes.map(({ path, label, Icon }) => (
          <ListItemButton
            key={path}
            selected={activePath === path}
            onClick={() => onNavigate(path)}
            sx={{
              minHeight: 46,
              mb: 0.55,
              px: 1.5,
              borderRadius: 2.5,
              color: 'rgba(226,232,240,0.62)',
              transition: 'background-color 150ms ease, color 150ms ease',
              '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 38 },
              '&.Mui-selected': {
                color: '#F5F7FF',
                backgroundColor: 'rgba(85,214,194,0.12)',
                boxShadow: 'inset 3px 0 0 #55D6C2',
                '& .MuiListItemIcon-root': { color: '#55D6C2' },
              },
              '&.Mui-selected:hover': { backgroundColor: 'rgba(85,214,194,0.17)' },
              '&:hover': { backgroundColor: 'rgba(226,232,240,0.065)', color: '#FFFFFF' },
            }}
          >
            <ListItemIcon><Icon fontSize="small" /></ListItemIcon>
            <ListItemText
              primary={label}
              primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }}
            />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ mt: 'auto' }}>
        <Divider sx={{ borderColor: 'rgba(226,232,240,0.09)' }} />
        <List sx={{ px: 1.5, py: 2 }}>
          <ListItemButton
            onClick={isMobile ? onClose : undefined}
            sx={{
              minHeight: 46,
              px: 1.5,
              borderRadius: 2.5,
              color: 'rgba(226,232,240,0.62)',
              '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 38 },
              '&:hover': { backgroundColor: 'rgba(226,232,240,0.065)', color: '#FFFFFF' },
            }}
          >
            <ListItemIcon><SettingsOutlined fontSize="small" /></ListItemIcon>
            <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 550 }} />
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
          background: 'linear-gradient(180deg, #0D1425 0%, #090F1D 100%)',
          color: '#FFFFFF',
          boxShadow: '4px 0 28px rgba(0, 0, 0, 0.22)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export default Sidebar
