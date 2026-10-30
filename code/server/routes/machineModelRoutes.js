import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../schemas/commonSchema.js";
import {
  createMachineModelSchema,
  updateMachineModelSchema,
} from "../schemas/machineModelSchema.js";
import {
  getAllMachineModels,
  getMachineModelById,
  createMachineModel,
  updateMachineModel,
  deleteMachineModel,
} from "../controllers/machineModelController.js";

const router = Router();

// GET / - Retrieve all machine models.
router.get("/", getAllMachineModels);
// GET /:id - Retrieve one machine model by ID.
router.get("/:id", validate(idParamSchema, "params"), getMachineModelById);
// POST / - Create a machine model.
router.post("/", validate(createMachineModelSchema), createMachineModel);
// PATCH /:id - Update an existing machine model by ID.
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateMachineModelSchema),
  updateMachineModel,
);
// DELETE /:id - Delete a machine model by ID.
router.delete("/:id", validate(idParamSchema, "params"), deleteMachineModel);

export default router;
