import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "../code/server/utils/ApiError.js";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    machineModel: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("../code/server/config/database.js", () => ({ prisma }));

import {
  findAllMachineModels,
  findMachineModelById,
  createMachineModel,
  updateMachineModel,
  removeMachineModel,
  updateMachineModelValidated,
} from "../code/server/services/machineModelService.js";

const model = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  manufacturerId: "550e8400-e29b-41d4-a716-446655440000",
  modelName: "JV100-160",
  technology: "SOLVENT",
  configuration: "ROLL_TO_ROLL",
  maxRollWidthMm: 1600,
  flatbedWidthMm: null,
  flatbedLengthMm: null,
  notes: null,
};

const modelDetails = {
  manufacturer: true,
  _count: {
    select: { machines: true },
  },
};

describe("Machine model service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should query all machine models with relations and stable ordering", async () => {
    const records = [model];
    prisma.machineModel.findMany.mockResolvedValue(records);

    await expect(findAllMachineModels()).resolves.toBe(records);

    expect(prisma.machineModel.findMany).toHaveBeenCalledWith({
      include: modelDetails,
      orderBy: [{ manufacturer: { name: "asc" } }, { modelName: "asc" }],
    });
  });

  it("should query one machine model by ID with its relations", async () => {
    prisma.machineModel.findUnique.mockResolvedValue(model);

    await expect(findMachineModelById(model.id)).resolves.toBe(model);

    expect(prisma.machineModel.findUnique).toHaveBeenCalledWith({
      where: { id: model.id },
      include: modelDetails,
    });
  });

  it("should create a machine model with its relations", async () => {
    const input = {
      manufacturerId: model.manufacturerId,
      modelName: model.modelName,
      technology: model.technology,
      configuration: model.configuration,
      maxRollWidthMm: 1600,
    };
    prisma.machineModel.create.mockResolvedValue(model);

    await expect(createMachineModel(input)).resolves.toBe(model);

    expect(prisma.machineModel.create).toHaveBeenCalledWith({
      data: input,
      include: modelDetails,
    });
  });

  it("should update a machine model with its relations", async () => {
    const changes = { notes: "Updated specifications" };
    prisma.machineModel.update.mockResolvedValue({ ...model, ...changes });

    await expect(updateMachineModel(model.id, changes)).resolves.toEqual({
      ...model,
      ...changes,
    });

    expect(prisma.machineModel.update).toHaveBeenCalledWith({
      where: { id: model.id },
      data: changes,
      include: modelDetails,
    });
  });

  it("should delete a machine model by ID", async () => {
    prisma.machineModel.delete.mockResolvedValue({ id: model.id });

    await expect(removeMachineModel(model.id)).resolves.toEqual({
      id: model.id,
    });

    expect(prisma.machineModel.delete).toHaveBeenCalledWith({
      where: { id: model.id },
    });
  });

  it("should throw a 404 ApiError when updating a missing machine model", async () => {
    prisma.machineModel.findUnique.mockResolvedValue(null);

    await expect(
      updateMachineModelValidated(model.id, { notes: "Updated" }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Machine model not found",
    });

    expect(prisma.machineModel.update).not.toHaveBeenCalled();
  });

  it("should reject an update that makes the complete model invalid", async () => {
    prisma.machineModel.findUnique.mockResolvedValue(model);

    await expect(
      updateMachineModelValidated(model.id, {
        configuration: "FLATBED",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Updated machine model is invalid",
      errors: expect.arrayContaining([
        expect.objectContaining({ field: "flatbedWidthMm" }),
        expect.objectContaining({ field: "flatbedLengthMm" }),
      ]),
    });

    expect(prisma.machineModel.update).not.toHaveBeenCalled();
  });

  it("should validate the merged model but update only the supplied fields", async () => {
    const changes = { notes: "Updated printer specifications" };
    prisma.machineModel.findUnique.mockResolvedValue(model);
    prisma.machineModel.update.mockResolvedValue({ ...model, ...changes });

    await expect(
      updateMachineModelValidated(model.id, changes),
    ).resolves.toEqual({ ...model, ...changes });

    expect(prisma.machineModel.findUnique).toHaveBeenCalledWith({
      where: { id: model.id },
    });
    expect(prisma.machineModel.update).toHaveBeenCalledWith({
      where: { id: model.id },
      data: changes,
      include: modelDetails,
    });
  });
});
