import './catalogApi.js'
import './operationsApi.js'
import './salesApi.js'
import './forecastingApi.js'

export { api } from './baseApi.js'
export {
  useGetManufacturersQuery,
  useCreateManufacturerMutation,
  useUpdateManufacturerMutation,
  useDeleteManufacturerMutation,
  useGetMachineModelsQuery,
  useCreateMachineModelMutation,
  useUpdateMachineModelMutation,
  useDeleteMachineModelMutation,
  useGetInkModelsQuery,
  useCreateInkModelMutation,
  useUpdateInkModelMutation,
  useDeleteInkModelMutation,
  useGetInkProductsQuery,
  useCreateInkProductMutation,
  useUpdateInkProductMutation,
  useDeleteInkProductMutation,
  useGetInkLotsQuery,
  useCreateInkLotMutation,
  useUpdateInkLotMutation,
  useDeleteInkLotMutation,
} from './catalogApi.js'
export {
  useGetMachinesQuery,
  useCreateMachineMutation,
  useUpdateMachineMutation,
  useDeleteMachineMutation,
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomerSitesQuery,
  useCreateCustomerSiteMutation,
  useUpdateCustomerSiteMutation,
  useDeleteCustomerSiteMutation,
} from './operationsApi.js'
export {
  useGetInkPurchasesQuery,
  useCreateInkPurchaseMutation,
} from './salesApi.js'
export { useLazyGetInkForecastQuery } from './forecastingApi.js'
