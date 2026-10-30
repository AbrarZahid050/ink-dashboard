import { z } from "zod";

const uuidSchema = z.string().uuid();

const technologySchema = z.enum([
  "SOLVENT",
  "LATEX",
  "UV",
  "SUBLIMATION",
  "OTHER",
]);

const configurationSchema = z.enum(["ROLL_TO_ROLL", "FLATBED", "HYBRID"]);

const dimensionSchema = z.number().int().positive().nullable();

const machineModelFields = {
  manufacturerId: uuidSchema,
  modelName: z.string().trim().min(1),
  technology: technologySchema,
  configuration: configurationSchema,
  maxRollWidthMm: dimensionSchema.optional(),
  flatbedWidthMm: dimensionSchema.optional(),
  flatbedLengthMm: dimensionSchema.optional(),
  notes: z.string().nullable().optional(),
};

function validateDimensions(data, ctx) {
  const requiredDimensions = {
    ROLL_TO_ROLL: ["maxRollWidthMm"],
    FLATBED: ["flatbedWidthMm", "flatbedLengthMm"],
    HYBRID: ["maxRollWidthMm", "flatbedWidthMm", "flatbedLengthMm"],
  };

  for (const field of requiredDimensions[data.configuration]) {
    if (data[field] == null) {
      ctx.addIssue({
        code: "custom",
        path: [field],
        message: `${field} is required for ${data.configuration}`,
      });
    }
  }
}

export const createMachineModelSchema = z
  .object(machineModelFields)
  .strict()
  .superRefine(validateDimensions);

//Fix for the wrong name being exported.
export const completeMachineModelSchema = createMachineModelSchema;

export const updateMachineModelSchema = z
  .object({
    ...machineModelFields,
    manufacturerId: uuidSchema.optional(),
    modelName: machineModelFields.modelName.optional(),
    technology: technologySchema.optional(),
    configuration: configurationSchema.optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided.",
  );
