import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../schemas/commonSchema.js";
import {
  createManufacturerSchema,
  updateManufacturerSchema,
} from "../schemas/manufacturerSchema.js";
import {
  getAllManufacturers,
  getManufacturerById,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
} from "../controllers/manufacturerController.js";

const router = Router();

// GET / - Retrieve all manufacturers.
router.get("/", getAllManufacturers);
// GET /:id - Retrieve one manufacturer by ID.
router.get("/:id", validate(idParamSchema, "params"), getManufacturerById);
// POST / - Create a manufacturer.
router.post("/", validate(createManufacturerSchema), createManufacturer);
// PATCH /:id - Update an existing manufacturer by ID.
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateManufacturerSchema),
  updateManufacturer,
);
// DELETE /:id - Delete a manufacturer by ID.
router.delete("/:id", validate(idParamSchema, "params"), deleteManufacturer);

export default router;
