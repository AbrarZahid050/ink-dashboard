import { z } from "zod";

export const createInkForecastQuerySchema = z
  .object({
    customerId: z.uuid(),
    machineModelId: z.uuid(),
    inkModelId: z.uuid(),
    horizonMonths: z.coerce.number().int().min(1).max(12).default(3),
  })
  .strict();
