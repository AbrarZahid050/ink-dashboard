import { Router } from "express";
import {
  getMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
} from "../controllers/machineController.js";
import { validate } from "../middleware/validate.js";
import {
  createMachineSchema,
  updateMachineSchema,
} from "../schemas/machineSchema.js";
import { idParamSchema } from "../schemas/commonSchema.js";

const router = Router();

router.get("/", getMachines);
router.get("/:id", validate(idParamSchema, "params"), getMachineById);
router.post("/", validate(createMachineSchema), createMachine);
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateMachineSchema),
  updateMachine,
);
router.delete("/:id", validate(idParamSchema, "params"), deleteMachine);

export default router;
