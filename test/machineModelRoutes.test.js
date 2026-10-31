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

  it("should allow a valid partial PATCH request through validation", async () => {
    const updateData = {
      version: 0,
      notes: "Updated printer specifications",
    };

    machineModelController.updateMachineModel.mockImplementationOnce(
      (req, res) => res.status(200).json({ success: true, data: req.body }),
    );

    const response = await request(app)
      .patch("/api/v1/machine-models/550e8400-e29b-41d4-a716-446655440000")
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(updateData);

    expect(machineModelController.updateMachineModel).toHaveBeenCalledOnce();
  });

  it("should reject an invalid PATCH UUID before reaching the controller", async () => {
    machineModelController.updateMachineModel.mockClear();

    const response = await request(app)
      .patch("/api/v1/machine-models/invalid-id")
      .send({ notes: "Updated printer specifications" });

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

    expect(machineModelController.updateMachineModel).not.toHaveBeenCalled();
  });

  it("should reject an invalid DELETE UUID before reaching the controller", async () => {
    machineModelController.deleteMachineModel.mockClear();

    const response = await request(app).delete(
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

    expect(machineModelController.deleteMachineModel).not.toHaveBeenCalled();
  });

  it("should allow a valid DELETE request through to the controller", async () => {
    const machineModelId = "550e8400-e29b-41d4-a716-446655440000";

    machineModelController.deleteMachineModel.mockClear();
    machineModelController.deleteMachineModel.mockImplementationOnce(
      (req, res) =>
        res.status(200).json({
          success: true,
          message: "Machine model deleted successfully",
          id: req.params.id,
        }),
    );

    const response = await request(app).delete(
      `/api/v1/machine-models/${machineModelId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Machine model deleted successfully");
    expect(response.body.id).toBe(machineModelId);

    expect(machineModelController.deleteMachineModel).toHaveBeenCalledOnce();
  });
  
  it("should allow a valid GET by ID request through to the controller", async () => {
    const machineModelId = "550e8400-e29b-41d4-a716-446655440000";
    const machineModel = { id: machineModelId, modelName: "JV100-160" };

    machineModelController.getMachineModelById.mockClear();
    machineModelController.getMachineModelById.mockImplementationOnce(
      (req, res) => res.status(200).json({ success: true, data: machineModel }),
    );

    const response = await request(app).get(
      `/api/v1/machine-models/${machineModelId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: machineModel });
    expect(machineModelController.getMachineModelById).toHaveBeenCalledOnce();
  });

  it("should pass a valid machine model through POST validation", async () => {
    const input = {
      manufacturerId: "550e8400-e29b-41d4-a716-446655440000",
      modelName: "  JV100-160  ",
      technology: "SOLVENT",
      configuration: "ROLL_TO_ROLL",
      maxRollWidthMm: 1600,
    };

    machineModelController.createMachineModel.mockClear();
    machineModelController.createMachineModel.mockImplementationOnce(
      (req, res) => res.status(201).json({ success: true, data: req.body }),
    );

    const response = await request(app)
      .post("/api/v1/machine-models")
      .send(input);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      data: { ...input, modelName: "JV100-160" },
    });
    expect(machineModelController.createMachineModel).toHaveBeenCalledOnce();
  });
});
