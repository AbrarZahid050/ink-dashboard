import { z } from "zod";

export const createCustomerSchema = z
  .object({
    name: z.string().trim().min(1, "Customer name is required"),
  })
  .strict();

export const updateCustomerSchema = z
  .object({
    name: z.string().trim().min(1, "Customer name is required"),
  })
  .strict();
