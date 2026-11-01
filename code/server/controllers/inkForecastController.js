import { generateInkForecast } from "../services/inkForecastService.js";

export async function getInkForecast(req, res) {
  const forecast = await generateInkForecast(req.inkForecastFilters);

  return res.status(200).json({
    success: true,
    data: forecast,
  });
}
