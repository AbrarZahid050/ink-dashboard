import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../schemas/commonSchema.js";
import {
  createInkModelSchema,
  updateInkModelSchema,
} from "../schemas/inkModelSchema.js";
import {
  getAllInkModels,
  getInkModelById,
  createInkModel,
  updateInkModel,
  deleteInkModel,
} from "../controllers/inkModelController.js";

const router = Router();

// GET / - Retrieve all ink models.
router.get("/", getAllInkModels);
// GET /:id - Retrieve one ink model by ID.
router.get("/:id", validate(idParamSchema, "params"), getInkModelById);
// POST / - Create an ink model.
router.post("/", validate(createInkModelSchema), createInkModel);
// PATCH /:id - Update an ink model using OCC.
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateInkModelSchema),
  updateInkModel,
);
// DELETE /:id - Delete an ink model by ID.
router.delete("/:id", validate(idParamSchema, "params"), deleteInkModel);

export default router;
