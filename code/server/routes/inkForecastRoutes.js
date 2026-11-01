import { Router } from "express";
import { ApiError } from "../utils/ApiError.js";
import { createInkForecastQuerySchema } from "../schemas/inkForecastSchema.js";
import { getInkForecast } from "../controllers/inkForecastController.js";

const router = Router();

// Express 5 exposes req.query through a getter; store validated values separately.
function validateInkForecastQuery(req, res, next) {
  const result = createInkForecastQuerySchema.safeParse(req.query);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return next(new ApiError(400, "Validation failed", errors));
  }

  req.inkForecastFilters = result.data;
  next();
}

router.get("/", validateInkForecastQuery, getInkForecast);

export default router;
