import { describe, it, expect, vi, beforeEach } from "vitest";
import * as machineModelService from "../code/server/services/machineModelService.js";
import {
  getAllMachineModels,
  getMachineModelById,
  createMachineModel,
  updateMachineModel,
  deleteMachineModel,
} from "../code/server/controllers/machineModelController.js";

// Replace the actual service with mocked functions.
vi.mock("../code/server/services/machineModelService.js", () => ({
  findAllMachineModels: vi.fn(),
  findMachineModelById: vi.fn(),
  createMachineModel: vi.fn(),
  updateMachineModelValidated: vi.fn(),
  removeMachineModel: vi.fn(),
}));

describe("getAllMachineModels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all machine models", async () => {
    // Arrange: Prepare fake data.
    const mockModels = [
      {
        id: "model-1",
        modelName: "JV100-160",
      },
      {
        id: "model-2",
        modelName: "UJV100-160",
      },
    ];

    machineModelService.findAllMachineModels.mockResolvedValue(mockModels);

    // Mock Express request and response objects.
    const req = {};

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Act: Execute the controller.
    await getAllMachineModels(req, res);

    // Assert: Verify the result.
    expect(machineModelService.findAllMachineModels).toHaveBeenCalledOnce();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 2,
      data: mockModels,
    });
  });
});

describe("getMachineModelById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a machine model when it exists", async () => {
    // Arrange
    const mockModel = {
      id: "model-1",
      modelName: "JV100-160",
    };

    machineModelService.findMachineModelById.mockResolvedValue(mockModel);

    const req = {
      params: {
        id: "model-1",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Act
    await getMachineModelById(req, res);

    // Assert
    expect(machineModelService.findMachineModelById).toHaveBeenCalledWith(
      "model-1",
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockModel,
    });
  });

  it("should return 404 when the machine model does not exist", async () => {
    // Arrange
    machineModelService.findMachineModelById.mockResolvedValue(null);

    const req = {
      params: {
        id: "non-existent-id",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Act
    await getMachineModelById(req, res);

    // Assert
    expect(machineModelService.findMachineModelById).toHaveBeenCalledWith(
      "non-existent-id",
    );

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Machine model not found",
    });
  });
});

describe("createMachineModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a machine model and return 201", async () => {
    // Arrange: Prepare input and expected output.
    const mockInput = {
      manufacturerId: "manufacturer-1",
      modelName: "JV100-160",
      technology: "SOLVENT",
      configuration: "ROLL_TO_ROLL",
    };

    const mockCreatedModel = {
      id: "model-1",
      ...mockInput,
    };

    machineModelService.createMachineModel.mockResolvedValue(mockCreatedModel);

    const req = {
      body: mockInput,
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Act: Execute the controller.
    await createMachineModel(req, res);

    // Assert: Verify the service received the correct input.
    expect(machineModelService.createMachineModel).toHaveBeenCalledWith(
      mockInput,
    );

    // Verify the HTTP response.
    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Machine model created successfully",
      data: mockCreatedModel,
    });
  });
});

describe("updateMachineModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update a machine model and return 200", async () => {
    // Arrange: Prepare the ID and updated data.
    const modelId = "model-1";

    const mockInput = {
      version: 0,
      modelName: "JV100-160 Plus",
    };

    const mockUpdatedModel = {
      id: modelId,
      modelName: "JV100-160 Plus",
    };

    machineModelService.updateMachineModelValidated.mockResolvedValue(
      mockUpdatedModel,
    );

    const req = {
      params: {
        id: modelId,
      },
      body: mockInput,
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Act: Execute the controller.
    await updateMachineModel(req, res);

    // Assert: Verify the service received the correct arguments.
    expect(
      machineModelService.updateMachineModelValidated,
    ).toHaveBeenCalledWith(modelId, { modelName: "JV100-160 Plus" }, 0);

    // Verify the HTTP response.
    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Machine model updated successfully",
      data: mockUpdatedModel,
    });
  });
});

describe("deleteMachineModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a machine model and return 204", async () => {
    // Arrange
    const modelId = "model-1";

    machineModelService.removeMachineModel.mockResolvedValue({
      id: modelId,
    });

    const req = {
      params: {
        id: modelId,
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
    };

    // Act
    await deleteMachineModel(req, res);

    // Assert
    expect(machineModelService.removeMachineModel).toHaveBeenCalledWith(
      modelId,
    );

    expect(res.status).toHaveBeenCalledWith(204);

    expect(res.end).toHaveBeenCalledOnce();
  });
});
