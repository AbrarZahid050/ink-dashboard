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

// GET / - Retrieve all machines.
router.get("/", getMachines);
// GET /:id - Retrieve one machine by ID.
router.get("/:id", validate(idParamSchema, "params"), getMachineById);
// POST / - Create a machine.
router.post("/", validate(createMachineSchema), createMachine);
// PATCH /:id - Update an existing machine by ID.
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateMachineSchema),
  updateMachine,
);
// DELETE /:id - Delete a machine by ID.
router.delete("/:id", validate(idParamSchema, "params"), deleteMachine);

export default router;
