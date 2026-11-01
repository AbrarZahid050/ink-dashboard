import { z } from "zod";

const inkLotFields = {
  inkProductId: z.string().uuid(),
  lotNumber: z.string().trim().min(1),
  expiryDate: z.iso.date(),
  quantity: z.number().int().nonnegative(),
};

export const createInkLotSchema = z.object(inkLotFields).strict();

export const updateInkLotSchema = z
  .object({
    version: z.number().int().nonnegative(),
    inkProductId: inkLotFields.inkProductId.optional(),
    lotNumber: inkLotFields.lotNumber.optional(),
    expiryDate: inkLotFields.expiryDate.optional(),
    quantity: inkLotFields.quantity.optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).some((key) => key !== "version"),
    "At least one field must be provided.",
  );
