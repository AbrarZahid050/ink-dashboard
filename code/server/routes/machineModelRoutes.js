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

router.get("/", getAllMachineModels);
router.get("/:id", validate(idParamSchema, "params"), getMachineModelById);
router.post("/", validate(createMachineModelSchema), createMachineModel);
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateMachineModelSchema),
  updateMachineModel,
);
router.delete("/:id", validate(idParamSchema, "params"), deleteMachineModel);

export default router;
