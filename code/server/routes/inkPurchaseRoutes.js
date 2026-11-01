import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { ApiError } from "../utils/ApiError.js";
import { idParamSchema } from "../schemas/commonSchema.js";
import {
  createInkPurchaseSchema,
  listInkPurchasesQuerySchema,
} from "../schemas/inkPurchaseSchema.js";
import {
  getAllInkPurchases,
  getInkPurchaseById,
  createInkPurchase,
} from "../controllers/inkPurchaseController.js";

const router = Router();

// Express 5 exposes req.query through a getter, so store validated filters
// separately instead of assigning back to req.query.
function validateInkPurchaseQuery(req, res, next) {
  const result = listInkPurchasesQuerySchema.safeParse(req.query);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return next(new ApiError(400, "Validation failed", errors));
  }

  req.inkPurchaseFilters = result.data;
  next();
}

// GET / - Retrieve purchase transactions with optional filters.
router.get("/", validateInkPurchaseQuery, getAllInkPurchases);
// GET /:id - Retrieve one purchase transaction.
router.get("/:id", validate(idParamSchema, "params"), getInkPurchaseById);
// POST / - Create a purchase transaction.
router.post("/", validate(createInkPurchaseSchema), createInkPurchase);

export default router;
