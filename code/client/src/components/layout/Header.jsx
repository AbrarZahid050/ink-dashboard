import {
  MenuRounded,
  NotificationsNoneRounded,
  SearchRounded,
} from '@mui/icons-material'
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  InputBase,
  Toolbar,
  Typography,
} from '@mui/material'

function Header({ onMenuClick, isMobile }) {
  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: { md: 'calc(100% - 256px)' },
        ml: { md: '256px' },
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: 'rgba(17,28,46,0.92)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Toolbar sx={{ minHeight: '72px !important', px: { xs: 2, sm: 3 } }}>
        {isMobile && (
          <IconButton edge="start" onClick={onMenuClick} aria-label="Open navigation" sx={{ mr: 1.5 }}>
            <MenuRounded />
          </IconButton>
        )}

        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            gap: 1,
            width: 280,
            px: 1.5,
            py: 0.75,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            color: 'text.secondary',
            backgroundColor: 'background.default',
          }}
        >
          <SearchRounded fontSize="small" />
          <InputBase
            placeholder="Search anything..."
            inputProps={{ 'aria-label': 'Search' }}
            sx={{
              fontSize: 13,
              flex: 1,
              color: 'text.primary',
              '& input::placeholder': { color: 'text.secondary', opacity: 1 },
            }}
          />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton aria-label="Notifications" sx={{ mr: 1, color: 'text.secondary' }}>
          <NotificationsNoneRounded />
        </IconButton>
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.light', color: 'primary.main', fontSize: 13, fontWeight: 700 }}>
          A
        </Avatar>
        <Box sx={{ display: { xs: 'none', sm: 'block' }, ml: 1.25 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>Administrator</Typography>
          <Typography variant="caption" color="text.secondary">Workspace</Typography>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
