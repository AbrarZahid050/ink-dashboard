import { z } from "zod";

const purchaseItemSchema = z
  .object({
    machineId: z.uuid(),
    inkProductId: z.uuid(),
    quantity: z.number().int().positive(),
    unitPrice: z
      .number()
      .finite()
      .min(0)
      .max(9999999999.99)
      .refine(
        (value) => /^\d+(\.\d{1,2})?$/.test(String(value)),
        "Unit price must have no more than two decimal places.",
      )
      .nullable()
      .optional(),
  })
  .strict();

export const createInkPurchaseSchema = z
  .object({
    customerId: z.uuid(),
    purchasedAt: z.iso.date(),
    reference: z.string().trim().min(1).max(100).nullable().optional(),
    currencyCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Currency code must contain three letters.")
      .nullable()
      .optional(),
    items: z.array(purchaseItemSchema).min(1),
  })
  .strict();
