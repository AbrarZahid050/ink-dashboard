import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../code/server/app.js";

import * as machineModelController from "../code/server/controllers/machineModelController.js";

vi.mock("../code/server/controllers/machineModelController.js", () => ({
  getAllMachineModels: vi.fn(),
  getMachineModelById: vi.fn(),
  createMachineModel: vi.fn(),
  updateMachineModel: vi.fn(),
  deleteMachineModel: vi.fn(),
}));

describe("Machine model route validation", () => {
  it("should reject an invalid UUID before reaching the controller", async () => {
    const response = await request(app).get(
      "/api/v1/machine-models/invalid-id",
    );

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "id",
        }),
      ]),
    );

    expect(machineModelController.getMachineModelById).not.toHaveBeenCalled();
  });

  it("should reject an invalid request body before reaching the controller", async () => {
    const response = await request(app).post("/api/v1/machine-models").send({});

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");

    expect(response.body.errors.length).toBeGreaterThan(0);

    expect(machineModelController.createMachineModel).not.toHaveBeenCalled();
  });

  it("should reject a ROLL_TO_ROLL model without maxRollWidthMm", async () => {
    const response = await request(app).post("/api/v1/machine-models").send({
      manufacturerId: "550e8400-e29b-41d4-a716-446655440000",
      modelName: "Test Printer",
      technology: "UV",
      configuration: "ROLL_TO_ROLL",
    });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe("Validation failed");

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "maxRollWidthMm",
          message: "maxRollWidthMm is required for ROLL_TO_ROLL",
        }),
      ]),
    );

    expect(machineModelController.createMachineModel).not.toHaveBeenCalled();
  });

  it("should reject an empty PATCH body before reaching the controller", async () => {
    const response = await request(app)
      .patch("/api/v1/machine-models/550e8400-e29b-41d4-a716-446655440000")
      .send({});

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "",
          message: "At least one field must be provided.",
        }),
      ]),
    );

    expect(machineModelController.updateMachineModel).not.toHaveBeenCalled();
  });
});
