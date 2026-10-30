import { z } from "zod";

const uuidSchema = z.string().uuid();

const dateSchema = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}, "Invalid date. Expected YYYY-MM-DD.");

const statusSchema = z.enum(["ACTIVE", "INACTIVE", "DECOMMISSIONED"]);

export const createMachineSchema = z
  .object({
    serialNumber: z.string().trim().min(1),
    machineModelId: uuidSchema,
    siteId: uuidSchema,
    installationDate: dateSchema,
    status: statusSchema.optional(),
    notes: z.string().nullable().optional(),
  })
  .strict();

export const updateMachineSchema = z
  .object({
    serialNumber: z.string().trim().min(1).optional(),
    machineModelId: uuidSchema.optional(),
    siteId: uuidSchema.optional(),
    installationDate: dateSchema.optional(),
    status: statusSchema.optional(),
    notes: z.string().nullable().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided.",
  );
