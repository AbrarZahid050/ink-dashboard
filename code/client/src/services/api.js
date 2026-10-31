import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
  }),
  tagTypes: ['Manufacturer', 'MachineModel'],
  endpoints: (builder) => ({
    getManufacturers: builder.query({
      query: () => '/manufacturers',
      transformResponse: (response) => response.data ?? [],
      providesTags: ['Manufacturer'],
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
  }),
})

export const {
  useGetManufacturersQuery,
  useGetMachineModelsQuery,
  useCreateMachineModelMutation,
} = api
