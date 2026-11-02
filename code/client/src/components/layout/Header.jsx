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
        backgroundColor: 'rgba(15, 22, 39, 0.88)',
        backdropFilter: 'blur(16px)',
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
            width: 300,
            px: 1.5,
            py: 0.9,
            border: 1,
            borderColor: '#303B54',
            borderRadius: 2.5,
            color: 'text.secondary',
            backgroundColor: '#111A2C',
            transition: 'border-color 160ms ease, background-color 160ms ease',
            '&:focus-within': {
              borderColor: 'primary.main',
              backgroundColor: '#151F34',
            },
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
          <Typography variant="caption" sx={{ color: '#77849D', border: '1px solid #35415B', borderRadius: 1, px: 0.7, py: 0.15 }}>
            /
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton
          aria-label="Notifications"
          sx={{
            mr: 1.25,
            color: 'text.secondary',
            border: '1px solid #303B54',
            borderRadius: 2.5,
            width: 38,
            height: 38,
            '&:hover': { backgroundColor: '#1A263D' },
          }}
        >
          <NotificationsNoneRounded fontSize="small" />
        </IconButton>
        <Avatar sx={{ width: 36, height: 36, bgcolor: '#29345D', color: '#B8C2FF', fontSize: 13, fontWeight: 750 }}>
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
