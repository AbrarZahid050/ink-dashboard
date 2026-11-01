import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../schemas/commonSchema.js";
import { createInkPurchaseSchema } from "../schemas/inkPurchaseSchema.js";
import {
  getAllInkPurchases,
  getInkPurchaseById,
  createInkPurchase,
} from "../controllers/inkPurchaseController.js";

const router = Router();

// GET / - Retrieve all purchase transactions.
router.get("/", getAllInkPurchases);
// GET /:id - Retrieve one purchase transaction.
router.get("/:id", validate(idParamSchema, "params"), getInkPurchaseById);
// POST / - Create a purchase transaction.
router.post("/", validate(createInkPurchaseSchema), createInkPurchase);

export default router;
