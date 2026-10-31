import { z } from "zod";

const optionalText = z.string().trim().nullable().optional();

export const createCustomerSiteSchema = z
  .object({
    customerId: z.string().uuid(),
    name: z.string().trim().min(1, "Site name is required"),
    address: optionalText,
    city: optionalText,
    country: optionalText,
  })
  .strict();

export const updateCustomerSiteSchema = z
  .object({
    version: z.number().int().nonnegative(),
    customerId: z.string().uuid().optional(),
    name: z.string().trim().min(1, "Site name is required").optional(),
    address: optionalText,
    city: optionalText,
    country: optionalText,
  })
  .strict()
  .refine(
    (data) => Object.keys(data).some((key) => key !== "version"),
    "At least one field besides version must be provided.",
  );
