import { Alert, Button } from '@mui/material'

function QueryErrorAlert({ message, onRetry }) {
  if (!message) return null

  return (
    <Alert
      severity="error"
      sx={{ mb: 2 }}
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  )
}

export default QueryErrorAlert
