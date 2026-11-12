import { Stack, Typography } from '@mui/material'

function ConfirmationDetail({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography color="text.secondary" variant="body2">{label}</Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">{value || '—'}</Typography>
    </Stack>
  )
}

export default ConfirmationDetail
