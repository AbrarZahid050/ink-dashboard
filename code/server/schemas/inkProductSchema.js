import { z } from "zod";

const packagingTypeSchema = z.enum([
  "BOTTLE",
  "POUCH",
  "CARTRIDGE",
  "BULK",
  "OTHER",
]);

const inkProductFields = {
  inkModelId: z.string().uuid(),
  productCode: z.string().trim().min(1).nullable().optional(),
  color: z.string().trim().min(1),
  packagingType: packagingTypeSchema,
  capacityMl: z.number().int().positive(),
};

export const createInkProductSchema = z.object(inkProductFields).strict();

export const updateInkProductSchema = z
  .object({
    version: z.number().int().nonnegative(),
    inkModelId: inkProductFields.inkModelId.optional(),
    productCode: inkProductFields.productCode,
    color: inkProductFields.color.optional(),
    packagingType: packagingTypeSchema.optional(),
    capacityMl: inkProductFields.capacityMl.optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).some((key) => key !== "version"),
    "At least one field must be provided.",
  );
