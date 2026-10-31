import { BusinessOutlined } from '@mui/icons-material'
import {
  Box,
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

function ManufacturersTable({ manufacturers, loading }) {
  return (
    <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.25 }}>
        <StackHeader count={manufacturers.length} />
      </Box>
      <Divider />

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 150 }}>
          <CircularProgress size={28} />
        </Box>
      ) : manufacturers.length === 0 ? (
        <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: 150, px: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No manufacturers have been added yet.
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Manufacturer</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {manufacturers.map((manufacturer) => (
                <TableRow key={manufacturer.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{manufacturer.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}

function StackHeader({ count }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="h4">Manufacturers</Typography>
        <Typography variant="body2" color="text.secondary">
          {count} {count === 1 ? 'manufacturer' : 'manufacturers'} in your catalogue
        </Typography>
      </Box>
      <BusinessOutlined color="action" />
    </Box>
  )
}

export default ManufacturersTable
