import { Box } from '@mui/material'

function PageContainer({ children }) {
  return (
    <Box sx={{ width: '100%', maxWidth: 1500, mx: 'auto', pt: { xs: 3, sm: 4 } }}>
      {children}
    </Box>
  )
}

export default PageContainer
