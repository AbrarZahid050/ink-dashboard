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
    customerId: z.string().uuid().optional(),
    name: z.string().trim().min(1, "Site name is required").optional(),
    address: optionalText,
    city: optionalText,
    country: optionalText,
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided.",
  );
