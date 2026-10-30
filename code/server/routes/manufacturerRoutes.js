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

router.get("/", getAllManufacturers);
router.get("/:id", validate(idParamSchema, "params"), getManufacturerById);
router.post("/", validate(createManufacturerSchema), createManufacturer);
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateManufacturerSchema),
  updateManufacturer,
);
router.delete("/:id", validate(idParamSchema, "params"), deleteManufacturer);

export default router;
