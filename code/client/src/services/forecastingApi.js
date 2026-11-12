import { api } from './baseApi.js'

export const forecastingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getInkForecast: builder.query({
      query: ({ customerId, machineModelId, inkModelId, horizonMonths = 3 }) => ({
        url: '/ink-forecasts',
        params: { customerId, machineModelId, inkModelId, horizonMonths },
      }),
      transformResponse: (response) => response.data ?? null,
    }),
  }),
})

export const { useLazyGetInkForecastQuery } = forecastingApi
