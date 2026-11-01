import { z } from "zod";

const inkTypeSchema = z.enum([
  "UV",
  "SOLVENT",
  "ECO_SOLVENT",
  "SUBLIMATION",
  "LATEX",
  "OTHER",
]);

const inkModelFields = {
  manufacturerId: z.string().uuid(),
  inkName: z.string().trim().min(1),
  inkType: inkTypeSchema,
  notes: z.string().trim().nullable().optional(),
};

export const createInkModelSchema = z.object(inkModelFields).strict();

export const updateInkModelSchema = z
  .object({
    version: z.number().int().nonnegative(),
    manufacturerId: inkModelFields.manufacturerId.optional(),
    inkName: inkModelFields.inkName.optional(),
    inkType: inkTypeSchema.optional(),
    notes: inkModelFields.notes,
  })
  .strict()
  .refine(
    (data) => Object.keys(data).some((key) => key !== "version"),
    "At least one field must be provided.",
  );
