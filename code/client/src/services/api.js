import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
  }),
  tagTypes: ['Manufacturer', 'MachineModel', 'Customer', 'CustomerSite', 'Machine'],
  endpoints: (builder) => ({
    getManufacturers: builder.query({
      query: () => '/manufacturers',
      transformResponse: (response) => response.data ?? [],
      providesTags: ['Manufacturer'],
    }),
    createManufacturer: builder.mutation({
      query: (manufacturer) => ({
        url: '/manufacturers',
        method: 'POST',
        body: manufacturer,
      }),
      invalidatesTags: ['Manufacturer'],
    }),
    updateManufacturer: builder.mutation({
      query: ({ id, ...manufacturer }) => ({
        url: `/manufacturers/${id}`,
        method: 'PATCH',
        body: manufacturer,
      }),
      invalidatesTags: ['Manufacturer'],
    }),
    deleteManufacturer: builder.mutation({
      query: (id) => ({
        url: `/manufacturers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Manufacturer'],
    }),
    getMachineModels: builder.query({
      query: () => '/machine-models',
      transformResponse: (response) => response.data ?? [],
      providesTags: ['MachineModel'],
    }),
    createMachineModel: builder.mutation({
      query: (machineModel) => ({
        url: '/machine-models',
        method: 'POST',
        body: machineModel,
      }),
      invalidatesTags: ['MachineModel'],
    }),
    updateMachineModel: builder.mutation({
      query: ({ id, ...machineModel }) => ({
        url: `/machine-models/${id}`,
        method: 'PATCH',
        body: machineModel,
      }),
      invalidatesTags: ['MachineModel'],
    }),
    deleteMachineModel: builder.mutation({
      query: (id) => ({
        url: `/machine-models/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MachineModel'],
    }),
    getMachines: builder.query({
      query: () => '/machines',
      transformResponse: (response) => response.data ?? [],
      providesTags: ['Machine'],
    }),
    createMachine: builder.mutation({
      query: (machine) => ({
        url: '/machines',
        method: 'POST',
        body: machine,
      }),
      invalidatesTags: ['Machine', 'CustomerSite', 'MachineModel'],
    }),
    updateMachine: builder.mutation({
      query: ({ id, ...machine }) => ({
        url: `/machines/${id}`,
        method: 'PATCH',
        body: machine,
      }),
      invalidatesTags: ['Machine', 'CustomerSite', 'MachineModel'],
    }),
    deleteMachine: builder.mutation({
      query: (id) => ({
        url: `/machines/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Machine', 'CustomerSite', 'MachineModel'],
    }),
    getCustomers: builder.query({
      query: () => '/customers',
      transformResponse: (response) => response.data ?? [],
      providesTags: ['Customer'],
    }),
    getCustomerSites: builder.query({
      query: () => '/customer-sites',
      transformResponse: (response) => response.data ?? [],
      providesTags: ['CustomerSite'],
    }),
    createCustomerSite: builder.mutation({
      query: (site) => ({
        url: '/customer-sites',
        method: 'POST',
        body: site,
      }),
      invalidatesTags: ['CustomerSite', 'Customer'],
    }),
    updateCustomerSite: builder.mutation({
      query: ({ id, ...site }) => ({
        url: `/customer-sites/${id}`,
        method: 'PATCH',
        body: site,
      }),
      invalidatesTags: ['CustomerSite', 'Customer'],
    }),
    deleteCustomerSite: builder.mutation({
      query: (id) => ({
        url: `/customer-sites/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CustomerSite', 'Customer'],
    }),
    createCustomer: builder.mutation({
      query: (customer) => ({
        url: '/customers',
        method: 'POST',
        body: customer,
      }),
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...customer }) => ({
        url: `/customers/${id}`,
        method: 'PATCH',
        body: customer,
      }),
      invalidatesTags: ['Customer'],
    }),
    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `/customers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customer'],
    }),
  }),
})

export const {
  useGetManufacturersQuery,
  useCreateManufacturerMutation,
  useDeleteManufacturerMutation,
  useUpdateManufacturerMutation,
  useGetMachineModelsQuery,
  useCreateMachineModelMutation,
  useDeleteMachineModelMutation,
  useUpdateMachineModelMutation,
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
} = api
