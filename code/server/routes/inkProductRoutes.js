import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../schemas/commonSchema.js";
import {
  createInkProductSchema,
  updateInkProductSchema,
} from "../schemas/inkProductSchema.js";
import {
  getAllInkProducts,
  getInkProductById,
  createInkProduct,
  updateInkProduct,
  deleteInkProduct,
} from "../controllers/inkProductController.js";

const router = Router();

// GET / - Retrieve all ink products.
router.get("/", getAllInkProducts);
// GET /:id - Retrieve one ink product by ID.
router.get("/:id", validate(idParamSchema, "params"), getInkProductById);
// POST / - Create an ink product.
router.post("/", validate(createInkProductSchema), createInkProduct);
// PATCH /:id - Update an ink product using OCC.
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateInkProductSchema),
  updateInkProduct,
);
// DELETE /:id - Delete an ink product by ID.
router.delete("/:id", validate(idParamSchema, "params"), deleteInkProduct);

export default router;
