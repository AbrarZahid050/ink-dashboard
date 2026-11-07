import { useMemo, useState } from 'react'
import {
  ExpandLessRounded,
  ExpandMoreRounded,
  Inventory2Outlined,
  RefreshRounded,
  SearchRounded,
  WarehouseOutlined,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useGetInkLotsQuery, useGetInkProductsQuery } from '../services/api.js'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'

const formatDate = (value) => {
  if (!value) return '—'
  const datePart = String(value).slice(0, 10)
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) return '—'
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString()
}

const getDaysToExpiry = (value) => {
  if (!value) return null
  const datePart = String(value).slice(0, 10)
  const expiry = Date.parse(`${datePart}T00:00:00Z`)
  if (Number.isNaN(expiry)) return null
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((expiry - today) / 86400000)
}

const getLotStatus = (lot) => {
  const days = getDaysToExpiry(lot.expiryDate)
  if (days === null) return { label: 'No expiry date', color: 'default' }
  if (days < 0) return { label: 'Expired', color: 'error' }
  if (days <= 30) return { label: 'Expiring soon', color: 'warning' }
  return { label: 'Valid', color: 'success' }
}

const productName = (product) => [
  product.inkModel?.manufacturer?.name,
  product.inkModel?.inkName,
  product.color,
].filter(Boolean).join(' · ') || 'Unnamed ink product'

const packagingLabel = (value) => ({
  BOTTLE: 'Bottle',
  POUCH: 'Pouch',
  CARTRIDGE: 'Cartridge',
  BULK: 'Bulk',
  OTHER: 'Other',
}[value] ?? value ?? '—')

function StatCard({ label, value, helper, icon }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3, borderColor: 'divider', height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center', color: 'primary.main', bgcolor: 'rgba(85,214,194,0.10)' }}>
          {icon}
        </Box>
      </Stack>
      <Typography variant="h4" sx={{ mt: 1, fontSize: '1.65rem' }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{helper}</Typography>
    </Paper>
  )
}

function InventoryProductRow({ product, lots, expanded, onToggle }) {
  const quantity = lots.reduce((sum, lot) => sum + Number(lot.quantity || 0), 0)
  const sortedLots = [...lots].sort((a, b) => {
    if (!a.expiryDate) return 1
    if (!b.expiryDate) return -1
    return String(a.expiryDate).localeCompare(String(b.expiryDate))
  })
  const expiredQuantity = lots.reduce((sum, lot) => getDaysToExpiry(lot.expiryDate) < 0 ? sum + Number(lot.quantity || 0) : sum, 0)
  const expiringQuantity = lots.reduce((sum, lot) => {
    const days = getDaysToExpiry(lot.expiryDate)
    return days !== null && days >= 0 && days <= 30 ? sum + Number(lot.quantity || 0) : sum
  }, 0)

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: expanded ? 'none' : undefined } }}>
        <TableCell sx={{ width: 48 }}>
          <Button
            aria-label={expanded ? 'Hide lot details' : 'Show lot details'}
            onClick={onToggle}
            size="small"
            color="inherit"
            sx={{ minWidth: 32, px: 0.5 }}
          >
            {expanded ? <ExpandLessRounded /> : <ExpandMoreRounded />}
          </Button>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={700}>{productName(product)}</Typography>
          <Typography variant="caption" color="text.secondary">
            {product.productCode || 'No product code'} · {Number(product.capacityMl || 0).toLocaleString()} ml
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{packagingLabel(product.packagingType)}</Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" fontWeight={750} sx={{ fontVariantNumeric: 'tabular-nums' }}>{quantity.toLocaleString()}</Typography>
          <Typography variant="caption" color="text.secondary">packages</Typography>
        </TableCell>
        <TableCell align="right">{lots.length}</TableCell>
        <TableCell>
          {quantity === 0 ? (
            <Chip size="small" label="Out of stock" color="default" variant="outlined" />
          ) : expiredQuantity > 0 ? (
            <Chip size="small" label={`${expiredQuantity} expired`} color="error" variant="outlined" />
          ) : expiringQuantity > 0 ? (
            <Chip size="small" label={`${expiringQuantity} expiring soon`} color="warning" variant="outlined" />
          ) : (
            <Chip size="small" label="In stock" color="success" variant="outlined" />
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ p: 0, borderBottom: expanded ? undefined : 0 }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ px: { xs: 2, sm: 4 }, py: 2, bgcolor: 'rgba(255,255,255,0.018)' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                <Typography variant="subtitle2">Lot breakdown</Typography>
                <Typography variant="caption" color="text.secondary">{lots.length} {lots.length === 1 ? 'lot' : 'lots'}</Typography>
              </Stack>
              {sortedLots.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No lots have been registered for this product yet.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Lot number</TableCell>
                      <TableCell>Expiry date</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedLots.map((lot) => {
                      const status = getLotStatus(lot)
                      return (
                        <TableRow key={lot.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{lot.lotNumber}</Typography>
                          </TableCell>
                          <TableCell>{formatDate(lot.expiryDate)}</TableCell>
                          <TableCell align="right">{Number(lot.quantity || 0).toLocaleString()}</TableCell>
                          <TableCell><Chip size="small" label={status.label} color={status.color} variant="outlined" /></TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

function InkInventory() {
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('ALL')
  const [expandedProducts, setExpandedProducts] = useState({})
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useGetInkProductsQuery()
  const {
    data: lots = [],
    isLoading: lotsLoading,
    isFetching: lotsFetching,
    error: lotsError,
    refetch: refetchLots,
  } = useGetInkLotsQuery()

  const loading = productsLoading || lotsLoading
  const loadError = productsError || lotsError

  const inventory = useMemo(() => {
    const lotsByProduct = new Map()
    lots.forEach((lot) => {
      const current = lotsByProduct.get(lot.inkProductId) ?? []
      current.push(lot)
      lotsByProduct.set(lot.inkProductId, current)
    })
    return products.map((product) => ({
      product,
      lots: lotsByProduct.get(product.id) ?? [],
    }))
  }, [products, lots])

  const totalPackages = lots.reduce((sum, lot) => sum + Number(lot.quantity || 0), 0)
  const productsInStock = inventory.filter(({ lots: productLots }) =>
    productLots.some((lot) => Number(lot.quantity || 0) > 0),
  ).length
  const expiringLots = lots.filter((lot) => {
    const days = getDaysToExpiry(lot.expiryDate)
    return Number(lot.quantity || 0) > 0 && days !== null && days >= 0 && days <= 30
  }).length
  const expiredLots = lots.filter((lot) =>
    Number(lot.quantity || 0) > 0 && getDaysToExpiry(lot.expiryDate) < 0,
  ).length

  const filteredInventory = inventory.filter(({ product, lots: productLots }) => {
    const searchable = [
      productName(product),
      product.productCode,
      product.packagingType,
      ...productLots.map((lot) => lot.lotNumber),
    ].filter(Boolean).join(' ').toLowerCase()
    if (!searchable.includes(search.trim().toLowerCase())) return false

    const quantity = productLots.reduce((sum, lot) => sum + Number(lot.quantity || 0), 0)
    const hasExpiring = productLots.some((lot) => {
      const days = getDaysToExpiry(lot.expiryDate)
      return Number(lot.quantity || 0) > 0 && days !== null && days >= 0 && days <= 30
    })
    const hasExpired = productLots.some((lot) =>
      Number(lot.quantity || 0) > 0 && getDaysToExpiry(lot.expiryDate) < 0,
    )

    if (stockFilter === 'IN_STOCK') return quantity > 0
    if (stockFilter === 'OUT_OF_STOCK') return quantity <= 0
    if (stockFilter === 'EXPIRING') return hasExpiring
    if (stockFilter === 'EXPIRED') return hasExpired
    return true
  })

  const refresh = () => {
    refetchProducts()
    refetchLots()
  }

  const toggleExpanded = (productId) => {
    setExpandedProducts((current) => ({ ...current, [productId]: !current[productId] }))
  }

  return (
    <Box sx={{ maxWidth: 1550, mx: 'auto', pt: { xs: 3, sm: 4 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 0.65 }}>
            <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: 'primary.main', bgcolor: 'rgba(85,214,194,0.11)' }}>
              <WarehouseOutlined />
            </Box>
            <Typography variant="h3">Ink inventory</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            View available packages by ink product and inspect individual batch quantities and expiry dates.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshRounded />} onClick={refresh} disabled={lotsFetching}>
          Refresh inventory
        </Button>
      </Stack>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={refresh}>Retry</Button>}>
          {getApiErrorMessage(loadError, 'Unable to load inventory data.')} Check that the backend API is running and try again.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatCard label="Total packages" value={totalPackages.toLocaleString()} helper="Sum of quantities across all lots" icon={<Inventory2Outlined fontSize="small" />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatCard label="Products in stock" value={productsInStock} helper={`Of ${products.length} registered products`} icon={<WarehouseOutlined fontSize="small" />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatCard label="Lots expiring soon" value={expiringLots} helper="Expiry within the next 30 days" icon={<Inventory2Outlined fontSize="small" />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatCard label="Expired lots" value={expiredLots} helper="Lots with remaining quantity" icon={<Inventory2Outlined fontSize="small" />} />
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
            <Box>
              <Typography variant="h4">Stock by product</Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredInventory.length} of {inventory.length} products · Select a row to view its lots
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ minWidth: { md: 430 } }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search ink, colour, product code or lot…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> } }}
              />
              <TextField select size="small" label="Stock status" value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} sx={{ minWidth: 165 }}>
                <MenuItem value="ALL">All products</MenuItem>
                <MenuItem value="IN_STOCK">In stock</MenuItem>
                <MenuItem value="OUT_OF_STOCK">Out of stock</MenuItem>
                <MenuItem value="EXPIRING">Expiring soon</MenuItem>
                <MenuItem value="EXPIRED">Expired stock</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        </Box>
        <Divider />
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 220 }}>
            <CircularProgress size={28} />
          </Box>
        ) : filteredInventory.length === 0 ? (
          <Box sx={{ py: 7, px: 2, textAlign: 'center' }}>
            <Inventory2Outlined sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6">No inventory found</Typography>
            <Typography variant="body2" color="text.secondary">
              {inventory.length === 0 ? 'Add ink products and register their lots to see stock here.' : 'Try changing your search or stock-status filter.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 48 }} />
                  <TableCell>Ink product</TableCell>
                  <TableCell>Packaging</TableCell>
                  <TableCell align="right">Available</TableCell>
                  <TableCell align="right">Lots</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInventory.map(({ product, lots: productLots }) => (
                  <InventoryProductRow
                    key={product.id}
                    product={product}
                    lots={productLots}
                    expanded={Boolean(expandedProducts[product.id])}
                    onToggle={() => toggleExpanded(product.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Snackbar open={false} autoHideDuration={3000} message="Inventory refreshed" />
    </Box>
  )
}

export default InkInventory
