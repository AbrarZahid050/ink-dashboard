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

router.get("/", getAllCustomerSites);
router.get("/:id", validate(idParamSchema, "params"), getCustomerSiteById);
router.post("/", validate(createCustomerSiteSchema), createCustomerSite);
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateCustomerSiteSchema),
  updateCustomerSite,
);
router.delete("/:id", validate(idParamSchema, "params"), deleteCustomerSite);

export default router;
