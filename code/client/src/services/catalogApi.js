import { api } from './baseApi.js'

export const catalogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getManufacturers: builder.query({
      query: () => '/manufacturers',
      transformResponse: (response) => response.data ?? [],
      providesTags: ['Manufacturer'],
    }),
    createManufacturer: builder.mutation({
      query: (manufacturer) => ({ url: '/manufacturers', method: 'POST', body: manufacturer }),
      invalidatesTags: ['Manufacturer'],
    }),
    updateManufacturer: builder.mutation({
      query: ({ id, ...manufacturer }) => ({ url: `/manufacturers/${id}`, method: 'PATCH', body: manufacturer }),
      invalidatesTags: ['Manufacturer'],
    }),
    deleteManufacturer: builder.mutation({
      query: (id) => ({ url: `/manufacturers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Manufacturer'],
    }),
    getMachineModels: builder.query({
      query: () => '/machine-models',
      transformResponse: (response) => response.data ?? [],
      providesTags: ['MachineModel'],
    }),
    createMachineModel: builder.mutation({
      query: (machineModel) => ({ url: '/machine-models', method: 'POST', body: machineModel }),
      invalidatesTags: ['MachineModel'],
    }),
    updateMachineModel: builder.mutation({
      query: ({ id, ...machineModel }) => ({ url: `/machine-models/${id}`, method: 'PATCH', body: machineModel }),
      invalidatesTags: ['MachineModel'],
    }),
    deleteMachineModel: builder.mutation({
      query: (id) => ({ url: `/machine-models/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MachineModel'],
    }),
    getInkModels: builder.query({
      query: () => '/ink-models',
      transformResponse: (response) => response.data ?? [],
      providesTags: ['InkModel'],
    }),
    createInkModel: builder.mutation({
      query: (inkModel) => ({ url: '/ink-models', method: 'POST', body: inkModel }),
      invalidatesTags: ['InkModel'],
    }),
    updateInkModel: builder.mutation({
      query: ({ id, ...inkModel }) => ({ url: `/ink-models/${id}`, method: 'PATCH', body: inkModel }),
      invalidatesTags: ['InkModel'],
    }),
    deleteInkModel: builder.mutation({
      query: (id) => ({ url: `/ink-models/${id}`, method: 'DELETE' }),
      invalidatesTags: ['InkModel'],
    }),
    getInkProducts: builder.query({
      query: () => '/ink-products',
      transformResponse: (response) => response.data ?? [],
      providesTags: ['InkProduct'],
    }),
    createInkProduct: builder.mutation({
      query: (inkProduct) => ({ url: '/ink-products', method: 'POST', body: inkProduct }),
      invalidatesTags: ['InkProduct', 'InkModel'],
    }),
    updateInkProduct: builder.mutation({
      query: ({ id, ...inkProduct }) => ({ url: `/ink-products/${id}`, method: 'PATCH', body: inkProduct }),
      invalidatesTags: ['InkProduct', 'InkModel'],
    }),
    deleteInkProduct: builder.mutation({
      query: (id) => ({ url: `/ink-products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['InkProduct', 'InkModel'],
    }),
    getInkLots: builder.query({
      query: () => '/ink-lots',
      transformResponse: (response) => response.data ?? [],
      providesTags: ['InkLot'],
    }),
    createInkLot: builder.mutation({
      query: (inkLot) => ({ url: '/ink-lots', method: 'POST', body: inkLot }),
      invalidatesTags: ['InkLot', 'InkProduct'],
    }),
    updateInkLot: builder.mutation({
      query: ({ id, ...inkLot }) => ({ url: `/ink-lots/${id}`, method: 'PATCH', body: inkLot }),
      invalidatesTags: ['InkLot', 'InkProduct'],
    }),
    deleteInkLot: builder.mutation({
      query: (id) => ({ url: `/ink-lots/${id}`, method: 'DELETE' }),
      invalidatesTags: ['InkLot', 'InkProduct'],
    }),
  }),
})

export const {
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
} = catalogApi
