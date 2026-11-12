import { api } from './baseApi.js'

export const operationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMachines: builder.query({
      query: () => '/machines',
      transformResponse: (response) => response.data ?? [],
      providesTags: ['Machine'],
    }),
    createMachine: builder.mutation({
      query: (machine) => ({ url: '/machines', method: 'POST', body: machine }),
      invalidatesTags: ['Machine', 'CustomerSite', 'MachineModel'],
    }),
    updateMachine: builder.mutation({
      query: ({ id, ...machine }) => ({ url: `/machines/${id}`, method: 'PATCH', body: machine }),
      invalidatesTags: ['Machine', 'CustomerSite', 'MachineModel'],
    }),
    deleteMachine: builder.mutation({
      query: (id) => ({ url: `/machines/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Machine', 'CustomerSite', 'MachineModel'],
    }),
    getCustomers: builder.query({
      query: () => '/customers',
      transformResponse: (response) => response.data ?? [],
      providesTags: ['Customer'],
    }),
    createCustomer: builder.mutation({
      query: (customer) => ({ url: '/customers', method: 'POST', body: customer }),
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...customer }) => ({ url: `/customers/${id}`, method: 'PATCH', body: customer }),
      invalidatesTags: ['Customer'],
    }),
    deleteCustomer: builder.mutation({
      query: (id) => ({ url: `/customers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Customer'],
    }),
    getCustomerSites: builder.query({
      query: () => '/customer-sites',
      transformResponse: (response) => response.data ?? [],
      providesTags: ['CustomerSite'],
    }),
    createCustomerSite: builder.mutation({
      query: (site) => ({ url: '/customer-sites', method: 'POST', body: site }),
      invalidatesTags: ['CustomerSite', 'Customer'],
    }),
    updateCustomerSite: builder.mutation({
      query: ({ id, ...site }) => ({ url: `/customer-sites/${id}`, method: 'PATCH', body: site }),
      invalidatesTags: ['CustomerSite', 'Customer'],
    }),
    deleteCustomerSite: builder.mutation({
      query: (id) => ({ url: `/customer-sites/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CustomerSite', 'Customer'],
    }),
  }),
})

export const {
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
} = operationsApi
