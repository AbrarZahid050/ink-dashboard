import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
  }),
  tagTypes: ['Manufacturer', 'MachineModel', 'Customer', 'CustomerSite'],
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
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomerSitesQuery,
  useCreateCustomerSiteMutation,
  useUpdateCustomerSiteMutation,
  useDeleteCustomerSiteMutation,
} = api
