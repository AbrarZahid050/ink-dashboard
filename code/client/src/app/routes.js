import { lazy } from 'react'
import {
  BusinessOutlined,
  ColorLensOutlined,
  DashboardOutlined,
  GroupsOutlined,
  Inventory2Outlined,
  LocationOnOutlined,
  PrecisionManufacturingOutlined,
  QueryStatsOutlined,
  ReceiptLongRounded,
  ViewInArOutlined,
  WarehouseOutlined,
} from '@mui/icons-material'

export const appRoutes = [
  { path: '/', label: 'Dashboard', Icon: DashboardOutlined, Component: lazy(() => import('../pages/Dashboard.jsx')) },
  { path: '/machine-models', label: 'Machine Models', Icon: ViewInArOutlined, Component: lazy(() => import('../pages/MachineModels.jsx')) },
  { path: '/ink-models', label: 'Ink Models', Icon: ColorLensOutlined, Component: lazy(() => import('../pages/InkModels.jsx')) },
  { path: '/ink-products', label: 'Ink Products', Icon: Inventory2Outlined, Component: lazy(() => import('../pages/InkProducts.jsx')) },
  { path: '/ink-lots', label: 'Ink Lots', Icon: Inventory2Outlined, Component: lazy(() => import('../pages/InkLots.jsx')) },
  { path: '/ink-inventory', label: 'Ink Inventory', Icon: WarehouseOutlined, Component: lazy(() => import('../pages/InkInventory.jsx')) },
  { path: '/manufacturers', label: 'Manufacturers', Icon: BusinessOutlined, Component: lazy(() => import('../pages/Manufacturers.jsx')) },
  { path: '/customers', label: 'Customers', Icon: GroupsOutlined, Component: lazy(() => import('../pages/Customers.jsx')) },
  { path: '/customer-sites', label: 'Customer Sites', Icon: LocationOnOutlined, Component: lazy(() => import('../pages/CustomerSites.jsx')) },
  { path: '/machines', label: 'Machines', Icon: PrecisionManufacturingOutlined, Component: lazy(() => import('../pages/Machines.jsx')) },
  { path: '/sales', label: 'Sales', Icon: ReceiptLongRounded, Component: lazy(() => import('../pages/Sales.jsx')) },
  { path: '/ink-forecasts', label: 'Ink Forecasts', Icon: QueryStatsOutlined, Component: lazy(() => import('../pages/InkForecasts.jsx')) },
]
