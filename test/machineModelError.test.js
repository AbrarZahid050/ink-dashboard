import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../code/server/app.js";
import * as machineModelService from "../code/server/services/machineModelService.js";
import { ApiError } from "../code/server/utils/ApiError.js";

// Mock the service so no database query is executed.
vi.mock("../code/server/services/machineModelService.js", () => ({
  findAllMachineModels: vi.fn(),
  findMachineModelById: vi.fn(),
  createMachineModel: vi.fn(),
  updateMachineModelValidated: vi.fn(),
  removeMachineModel: vi.fn(),
}));

describe("Machine model error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 500 when the service throws an unexpected error", async () => {
    // Arrange: Simulate a service failure.
    machineModelService.findAllMachineModels.mockRejectedValue(
      new Error("Database connection failed"),
    );

    // Act: Send an actual HTTP request through Express.
    const response = await request(app).get("/api/v1/machine-models");

    // Assert: Verify centralized error handling.
    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      success: false,
      message: "Internal server error",
    });

    expect(machineModelService.findAllMachineModels).toHaveBeenCalledOnce();
  });

  it("should return 404 when the service throws an ApiError", async () => {
    machineModelService.findAllMachineModels.mockRejectedValue(
      new ApiError(404, "Machine model not found"),
    );

    const response = await request(app).get("/api/v1/machine-models");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Machine model not found",
    });
  });

  it("should return 400 with validation errors when the service throws an ApiError", async () => {
    const validationErrors = [{ field: "name", message: "Name is required" }];

    machineModelService.findAllMachineModels.mockRejectedValue(
      new ApiError(400, "Updated machine model is invalid", validationErrors),
    );

    const response = await request(app).get("/api/v1/machine-models");

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      success: false,
      message: "Updated machine model is invalid",
      errors: validationErrors,
    });
  });
});
