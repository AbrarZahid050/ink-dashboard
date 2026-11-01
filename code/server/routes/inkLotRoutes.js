import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../schemas/commonSchema.js";
import {
  createInkLotSchema,
  updateInkLotSchema,
} from "../schemas/inkLotSchema.js";
import {
  getAllInkLots,
  getInkLotById,
  createInkLot,
  updateInkLot,
  deleteInkLot,
} from "../controllers/inkLotController.js";

const router = Router();

// GET / - Retrieve all ink lots.
router.get("/", getAllInkLots);
// GET /:id - Retrieve one ink lot by ID.
router.get("/:id", validate(idParamSchema, "params"), getInkLotById);
// POST / - Create an ink lot.
router.post("/", validate(createInkLotSchema), createInkLot);
// PATCH /:id - Update an ink lot using OCC.
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateInkLotSchema),
  updateInkLot,
);
// DELETE /:id - Delete an ink lot by ID.
router.delete("/:id", validate(idParamSchema, "params"), deleteInkLot);

export default router;
