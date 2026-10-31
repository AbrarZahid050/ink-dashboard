export function getApiErrorMessage(error, fallback) {
  const payload = error?.data

  if (Array.isArray(payload?.errors)) {
    const details = payload.errors
      .map((item) => item.message)
      .filter(Boolean)
      .join(', ')

    if (details) return details
  }

  return payload?.message || error?.error || fallback
}
