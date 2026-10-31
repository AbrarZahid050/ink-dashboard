import { describe, it, expect } from "vitest";
import {
  createMachineSchema,
  updateMachineSchema,
} from "../code/server/schemas/machineSchema.js";

const validMachine = {
  serialNumber: "SN-001",
  machineModelId: "550e8400-e29b-41d4-a716-446655440000",
  siteId: "550e8400-e29b-41d4-a716-446655440001",
  installationDate: "2026-10-30",
};

describe("Machine schemas", () => {
  describe("createMachineSchema installationDate", () => {
    it("should accept a valid ISO calendar date", () => {
      const result = createMachineSchema.safeParse(validMachine);

      expect(result.success).toBe(true);
    });

    it("should accept February 29 in a leap year", () => {
      const result = createMachineSchema.safeParse({
        ...validMachine,
        installationDate: "2024-02-29",
      });

      expect(result.success).toBe(true);
    });

    it("should reject a date with an incorrect format", () => {
      const result = createMachineSchema.safeParse({
        ...validMachine,
        installationDate: "30-10-2026",
      });

      expect(result.success).toBe(false);
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["installationDate"],
            message: "Invalid date. Expected YYYY-MM-DD.",
          }),
        ]),
      );
    });

    it("should reject an impossible calendar date", () => {
      const result = createMachineSchema.safeParse({
        ...validMachine,
        installationDate: "2026-02-30",
      });

      expect(result.success).toBe(false);
    });

    it("should reject a date that cannot be parsed", () => {
      const result = createMachineSchema.safeParse({
        ...validMachine,
        installationDate: "2026-13-01",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateMachineSchema installationDate", () => {
    it("should accept a valid date in a partial update", () => {
      const result = updateMachineSchema.safeParse({
        version: 0,
        installationDate: "2024-02-29",
      });

      expect(result.success).toBe(true);
    });

    it("should reject an invalid date in a partial update", () => {
      const result = updateMachineSchema.safeParse({
        version: 0,
        installationDate: "2026-02-30",
      });

      expect(result.success).toBe(false);
    });
  });
});
