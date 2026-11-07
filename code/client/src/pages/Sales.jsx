import { useMemo, useState } from 'react'
import {
  AddRounded, ArrowUpwardRounded, ReceiptLongRounded,
  RefreshRounded, RemoveCircleOutlineRounded, SearchRounded, ShoppingCartCheckoutRounded,
} from '@mui/icons-material'
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, Grid,
  IconButton, InputAdornment, MenuItem, Paper, Snackbar, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
  Typography,
} from '@mui/material'
import {
  useCreateInkPurchaseMutation, useGetCustomersQuery, useGetInkProductsQuery,
  useGetInkPurchasesQuery, useGetMachinesQuery, useGetInkLotsQuery,
} from '../services/api.js'
import { getApiErrorMessage } from '../features/machine-models/utils/getApiErrorMessage.js'

const today = new Date().toISOString().slice(0, 10)
const emptyLine = () => ({ key: crypto.randomUUID(), inkProductId: '', inkLotId: '', machineId: '', quantity: '1', unitPrice: '' })
const money = (value, currency = 'AED') => new Intl.NumberFormat('en-AE', {
  style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(Number(value) || 0)
const dateLabel = (value) => value ? new Date(String(value).slice(0, 10) + 'T00:00:00').toLocaleDateString() : '—'
const productName = (product) => [
  product?.inkModel?.manufacturer?.name,
  product?.inkModel?.inkName,
  product?.color,
  product?.capacityMl ? `${product.capacityMl.toLocaleString()} ml` : '',
].filter(Boolean).join(' · ')

function StatCard({ label, value, helper, icon }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3, borderColor: 'divider', height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Box sx={{ width: 34, height: 34, borderRadius: 2, display: 'grid', placeItems: 'center', color: 'primary.main', bgcolor: 'rgba(85,214,194,0.10)' }}>{icon}</Box>
      </Stack>
      <Typography variant="h4" sx={{ mt: 1, fontSize: '1.55rem' }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{helper}</Typography>
    </Paper>
  )
}

function Sales() {
  const [customerId, setCustomerId] = useState('')
  const [purchasedAt, setPurchasedAt] = useState(today)
  const [reference, setReference] = useState('')
  const [currencyCode, setCurrencyCode] = useState('AED')
  const [items, setItems] = useState([emptyLine()])
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [formError, setFormError] = useState('')
  const { data: customers = [], isLoading: customersLoading } = useGetCustomersQuery()
  const { data: products = [], isLoading: productsLoading } = useGetInkProductsQuery()
  const { data: lots = [], isLoading: lotsLoading } = useGetInkLotsQuery()
  const { data: machines = [], isLoading: machinesLoading } = useGetMachinesQuery()
  const { data: purchases = [], isLoading: purchasesLoading, isFetching, refetch } = useGetInkPurchasesQuery()
  const [createPurchase, { isLoading: saving }] = useCreateInkPurchaseMutation()

  const customerMachines = useMemo(() => machines.filter((machine) =>
    machine.site?.customerId === customerId || machine.site?.customer?.id === customerId
  ), [machines, customerId])

  const lineTotal = (item) => Number(item.quantity) * Number(item.unitPrice || 0)
  const total = items.reduce((sum, item) => sum + lineTotal(item), 0)
  const filteredPurchases = purchases.filter((purchase) => {
    const customer = purchase.customer?.name ?? ''
    const ref = purchase.reference ?? ''
    return `${customer} ${ref}`.toLowerCase().includes(search.toLowerCase())
  })
  const monthPurchases = purchases.filter((purchase) => String(purchase.purchasedAt).slice(0, 7) === today.slice(0, 7))
  const monthValue = monthPurchases.reduce((sum, purchase) =>
    sum + (purchase.items ?? []).reduce((lineSum, item) => lineSum + Number(item.quantity) * Number(item.unitPrice ?? 0), 0), 0)
  const totalPackages = purchases.reduce((sum, purchase) =>
    sum + (purchase.items ?? []).reduce((lineSum, item) => lineSum + Number(item.quantity), 0), 0)

  const updateLine = (key, field, value) => setItems((current) =>
    current.map((item) => item.key === key ? { ...item, [field]: value } : item))
  const addLine = () => setItems((current) => [...current, emptyLine()])
  const removeLine = (key) => setItems((current) => current.length > 1 ? current.filter((item) => item.key !== key) : current)

  const handleCustomerChange = (value) => {
    setCustomerId(value)
    setItems((current) => current.map((item) => ({ ...item, machineId: '' })))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    if (!customerId) return setFormError('Select a customer before creating the invoice.')
    if (!purchasedAt) return setFormError('Select the invoice date.')
    if (items.some((item) => !item.inkProductId || !item.inkLotId || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
      return setFormError('Choose an ink product, an available lot number, and a whole-number quantity for every line.')
    }
    const requestedByLot = items.reduce((totals, item) => {
      totals.set(item.inkLotId, (totals.get(item.inkLotId) ?? 0) + Number(item.quantity))
      return totals
    }, new Map())
    const overdrawnLot = lots.find((lot) => (requestedByLot.get(lot.id) ?? 0) > Number(lot.quantity))
    if (overdrawnLot) {
      return setFormError(`Lot ${overdrawnLot.lotNumber} has only ${overdrawnLot.quantity} package(s) available.`)
    }
    if (items.some((item) => item.unitPrice !== '' && (!Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) < 0))) {
      return setFormError('Unit prices must be zero or greater.')
    }
    try {
      await createPurchase({
        customerId, purchasedAt, reference: reference.trim() || null, currencyCode,
        items: items.map(({ inkProductId, inkLotId, machineId, quantity, unitPrice }) => ({
          inkProductId, inkLotId, machineId: machineId || null, quantity: Number(quantity),
          unitPrice: unitPrice === '' ? null : Number(Number(unitPrice).toFixed(2)),
        })),
      }).unwrap()
      setNotice('Invoice recorded successfully.')
      setCustomerId('')
      setPurchasedAt(today)
      setReference('')
      setItems([emptyLine()])
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Unable to save this invoice.'))
    }
  }

  return (
    <Box sx={{ maxWidth: 1550, mx: 'auto', pt: { xs: 3, sm: 4 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 0.65 }}>
            <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: 'primary.main', bgcolor: 'rgba(85,214,194,0.11)' }}>
              <ReceiptLongRounded />
            </Box>
            <Typography variant="h3">Sales & Invoicing</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">Create customer ink invoices and keep a searchable record of every purchase.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshRounded />} onClick={refetch} disabled={isFetching}>Refresh sales</Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 4 }}><StatCard label="Invoices this month" value={monthPurchases.length} helper="Recorded customer purchases" icon={<ReceiptLongRounded fontSize="small" />} /></Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 4 }}><StatCard label="Packages sold" value={totalPackages.toLocaleString()} helper="Across all recorded invoices" icon={<ShoppingCartCheckoutRounded fontSize="small" />} /></Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 4 }}><StatCard label="Recorded sales value this month" value={money(monthValue)} helper="Calculated from entered unit prices" icon={<ArrowUpwardRounded fontSize="small" />} /></Grid>
      </Grid>

      <Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4">Create invoice</Typography>
            <Typography variant="body2" color="text.secondary">One invoice can include multiple ink colours and machine assignments.</Typography>
          </Box>
          <Chip label="New sale" color="success" variant="outlined" size="small" />
        </Stack>
        <Divider sx={{ mb: 2.5 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField select fullWidth required label="Customer" value={customerId} onChange={(event) => handleCustomerChange(event.target.value)} disabled={customersLoading}>
              {customers.map((customer) => <MenuItem key={customer.id} value={customer.id}>{customer.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField fullWidth required type="date" label="Invoice date" value={purchasedAt} onChange={(event) => setPurchasedAt(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField fullWidth label="Invoice / reference no." placeholder="e.g. INV-2026-014" value={reference} onChange={(event) => setReference(event.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField select fullWidth label="Currency" value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value)}>
              <MenuItem value="AED">AED — UAE Dirham</MenuItem>
              <MenuItem value="USD">USD — US Dollar</MenuItem>
              <MenuItem value="EUR">EUR — Euro</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 3, mb: 1.5 }}>
          <Box>
            <Typography variant="h5">Invoice items</Typography>
            <Typography variant="caption" color="text.secondary">Add every ink product included in this customer purchase.</Typography>
          </Box>
          <Button size="small" variant="outlined" startIcon={<AddRounded />} onClick={addLine} type="button">Add item</Button>
        </Stack>
        <Stack spacing={1.5}>
          {items.map((item, index) => (
            <Paper key={item.key} variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: 'divider', bgcolor: 'rgba(255,255,255,0.012)' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="body2" fontWeight={700}>Item {index + 1}</Typography>
                <IconButton size="small" color="error" aria-label={`Remove item ${index + 1}`} onClick={() => removeLine(item.key)} disabled={items.length === 1}><RemoveCircleOutlineRounded fontSize="small" /></IconButton>
              </Stack>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField select fullWidth required label="Ink product" value={item.inkProductId} onChange={(event) => setItems((current) => current.map((line) => line.key === item.key ? { ...line, inkProductId: event.target.value, inkLotId: '' } : line))} disabled={productsLoading}>
                    {products.filter((product) => lots.some((lot) => lot.inkProductId === product.id && Number(lot.quantity) > 0)).map((product) => <MenuItem key={product.id} value={product.id}>{productName(product)} · {product.packagingType}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField select fullWidth required label="Ink lot number" value={item.inkLotId} onChange={(event) => updateLine(item.key, 'inkLotId', event.target.value)} disabled={!item.inkProductId || lotsLoading}>
                    {lots.filter((lot) => lot.inkProductId === item.inkProductId && Number(lot.quantity) > 0).map((lot) => <MenuItem key={lot.id} value={lot.id}>{lot.lotNumber}</MenuItem>)}
                    {item.inkProductId && !lots.some((lot) => lot.inkProductId === item.inkProductId && Number(lot.quantity) > 0) && <MenuItem disabled value="">No available stock for this product</MenuItem>}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField select fullWidth label="Machine" value={item.machineId} onChange={(event) => updateLine(item.key, 'machineId', event.target.value)} disabled={!customerId || machinesLoading}>
                    <MenuItem value="">Not assigned / no machine</MenuItem>
                    {customerMachines.map((machine) => <MenuItem key={machine.id} value={machine.id}>{machine.serialNumber} · {machine.machineModel?.manufacturer?.name} {machine.machineModel?.modelName}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, md: 1.2 }}>
                  <TextField fullWidth required type="number" label="Qty" value={item.quantity} onChange={(event) => updateLine(item.key, 'quantity', event.target.value)} slotProps={{ htmlInput: { min: 1, step: 1 } }} />
                </Grid>
                <Grid size={{ xs: 6, md: 1.8 }}>
                  <TextField fullWidth type="number" label={`Unit price (${currencyCode})`} value={item.unitPrice} onChange={(event) => updateLine(item.key, 'unitPrice', event.target.value)} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
                </Grid>
              </Grid>
              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">Line total: <strong>{money(lineTotal(item), currencyCode)}</strong></Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mt: 2.5 }}>
          <Typography variant="body2" color="text.secondary">Select the exact lot number for each item. Available package quantities are shown in the lot list.</Typography>
          <Paper variant="outlined" sx={{ p: 2, minWidth: 230, borderRadius: 2.5, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">Invoice total</Typography>
            <Typography variant="h4">{money(total, currencyCode)}</Typography>
          </Paper>
        </Stack>
        {formError && <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>}
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2.5 }}>
          <Button type="submit" variant="contained" disabled={saving || customersLoading || productsLoading || lotsLoading || !products.length} startIcon={saving ? <CircularProgress size={17} color="inherit" /> : <ShoppingCartCheckoutRounded />}>
            {saving ? 'Saving invoice…' : 'Save invoice'}
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h4">Sales history</Typography>
              <Typography variant="body2" color="text.secondary">{purchases.length} recorded {purchases.length === 1 ? 'invoice' : 'invoices'}</Typography>
            </Box>
            <TextField size="small" placeholder="Search customer or reference" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ width: { xs: '100%', sm: 300 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }} />
          </Stack>
        </Box>
        <Divider />
        {purchasesLoading ? <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 160 }}><CircularProgress size={28} /></Box> :
          filteredPurchases.length === 0 ? <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: 160, px: 2 }}><ReceiptLongRounded sx={{ color: 'text.secondary', fontSize: 34, mb: 1 }} /><Typography variant="body2" color="text.secondary">{purchases.length ? 'No invoices match your search.' : 'No sales have been recorded yet. Create your first invoice above.'}</Typography></Box> :
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Reference</TableCell><TableCell>Customer</TableCell><TableCell>Items</TableCell><TableCell align="right">Packages</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
              <TableBody>
                {filteredPurchases.map((purchase) => {
                  const quantity = (purchase.items ?? []).reduce((sum, item) => sum + Number(item.quantity), 0)
                  const amount = (purchase.items ?? []).reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice ?? 0), 0)
                  const currency = purchase.currencyCode ?? 'AED'
                  return <TableRow key={purchase.id} hover>
                    <TableCell>{dateLabel(purchase.purchasedAt)}</TableCell>
                    <TableCell><Typography variant="body2" fontWeight={650}>{purchase.reference || '—'}</Typography></TableCell>
                    <TableCell>{purchase.customer?.name ?? '—'}</TableCell>
                    <TableCell sx={{ minWidth: 240 }}>
                      <Stack spacing={0.35}>{(purchase.items ?? []).slice(0, 2).map((line) => <Typography key={line.id} variant="body2">{line.inkProduct?.color} · {line.inkProduct?.inkModel?.inkName} · Lot {line.inkLot?.lotNumber ?? '—'}</Typography>)}
                        {purchase.items?.length > 2 && <Typography variant="caption" color="text.secondary">+{purchase.items.length - 2} more</Typography>}</Stack>
                    </TableCell>
                    <TableCell align="right">{quantity.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{money(amount, currency)}</TableCell>
                  </TableRow>
                })}
              </TableBody>
            </Table>
          </TableContainer>}
      </Paper>
      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setNotice('')}>{notice}</Alert>
      </Snackbar>
    </Box>
  )
}

export default Sales
