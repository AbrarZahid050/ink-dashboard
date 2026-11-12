import { api } from './baseApi.js'

export const salesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getInkPurchases: builder.query({
      query: (filters = {}) => ({ url: '/ink-purchases', params: filters }),
      transformResponse: (response) => response.data ?? [],
      providesTags: ['InkPurchase'],
    }),
    createInkPurchase: builder.mutation({
      query: (purchase) => ({ url: '/ink-purchases', method: 'POST', body: purchase }),
      invalidatesTags: ['InkPurchase', 'InkLot', 'InkProduct'],
    }),
  }),
})

export const {
  useGetInkPurchasesQuery,
  useCreateInkPurchaseMutation,
} = salesApi
