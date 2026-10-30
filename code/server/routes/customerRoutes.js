import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../schemas/commonSchema.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../schemas/customerSchema.js";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";

const router = Router();

router.get("/", getAllCustomers);
router.get("/:id", validate(idParamSchema, "params"), getCustomerById);
router.post("/", validate(createCustomerSchema), createCustomer);
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateCustomerSchema),
  updateCustomer,
);
router.delete("/:id", validate(idParamSchema, "params"), deleteCustomer);

export default router;
