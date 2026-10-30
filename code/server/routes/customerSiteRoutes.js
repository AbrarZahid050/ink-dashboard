import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../schemas/commonSchema.js";
import {
  createCustomerSiteSchema,
  updateCustomerSiteSchema,
} from "../schemas/customerSiteSchema.js";
import {
  getAllCustomerSites,
  getCustomerSiteById,
  createCustomerSite,
  updateCustomerSite,
  deleteCustomerSite,
} from "../controllers/customerSiteController.js";

const router = Router();

// GET / - Retrieve all customer sites.
router.get("/", getAllCustomerSites);
// GET /:id - Retrieve one customer site by ID.
router.get("/:id", validate(idParamSchema, "params"), getCustomerSiteById);
// POST / - Create a customer site.
router.post("/", validate(createCustomerSiteSchema), createCustomerSite);
// PATCH /:id - Update an existing customer site by ID.
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateCustomerSiteSchema),
  updateCustomerSite,
);
// DELETE /:id - Delete a customer site by ID.
router.delete("/:id", validate(idParamSchema, "params"), deleteCustomerSite);

export default router;
