import { Router } from "express";
import manufacturerRoutes from "./manufacturerRoutes.js";
import machineRoutes from "./machineRoutes.js";
import machineModelRoutes from "./machineModelRoutes.js";
import customerRoutes from "./customerRoutes.js";
import customerSiteRoutes from "./customerSiteRoutes.js";
import inkModelRoutes from "./inkModelRoutes.js";
import inkProductRoutes from "./inkProductRoutes.js";
import inkLotRoutes from "./inkLotRoutes.js";

const router = Router();

// Resource routers
router.use("/manufacturers", manufacturerRoutes);
router.use("/machines", machineRoutes);
router.use("/machine-models", machineModelRoutes);
router.use("/customers", customerRoutes);
router.use("/customer-sites", customerSiteRoutes);
router.use("/ink-models", inkModelRoutes);
router.use("/ink-products", inkProductRoutes);
router.use("/ink-lots", inkLotRoutes);

export default router;
