import { Box, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

function DataTable({
  rows = [],
  columns = [],
  loading = false,
  emptyMessage = 'No records found.',
  getRowId = (row) => row.id,
  minWidth,
  size = 'medium',
}) {
  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 150 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (rows.length === 0) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: 150, px: 2 }}>
        <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper} elevation={0} square sx={{ overflowX: 'auto' }}>
      <Table size={size} sx={{ minWidth }}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.field ?? column.headerName}
                align={column.align ?? 'left'}
                sx={{ width: column.width, ...column.headerSx }}
              >
                {column.headerName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={getRowId(row)} hover>
              {columns.map((column) => (
                <TableCell
                  key={column.field ?? column.headerName}
                  align={column.align ?? 'left'}
                  sx={column.cellSx}
                >
                  {column.renderCell ? column.renderCell(row) : row[column.field] ?? '—'}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default DataTable
