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

// GET / - Retrieve all customers.
router.get("/", getAllCustomers);
// GET /:id - Retrieve one customer by ID.
router.get("/:id", validate(idParamSchema, "params"), getCustomerById);
// POST / - Create a new customer.
router.post("/", validate(createCustomerSchema), createCustomer);
// PATCH /:id - Update an existing customer by ID.
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateCustomerSchema),
  updateCustomer,
);
// DELETE /:id - Delete a customer by ID.
router.delete("/:id", validate(idParamSchema, "params"), deleteCustomer);

export default router;
