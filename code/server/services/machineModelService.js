import { prisma } from "../config/database.js";
import { completeMachineModelSchema } from "../schemas/machineModelSchema.js";
import { ApiError } from "../utils/ApiError.js";

const modelDetails = {
  manufacturer: true,
  _count: {
    select: { machines: true },
  },
};

// GET all machine models
export async function findAllMachineModels() {
  return prisma.machineModel.findMany({
    include: modelDetails,
    orderBy: [{ manufacturer: { name: "asc" } }, { modelName: "asc" }],
  });
}

// GET machine model by ID
export async function findMachineModelById(id) {
  return prisma.machineModel.findUnique({
    where: { id },
    include: modelDetails,
  });
}

// CREATE machine model
export async function createMachineModel(data) {
  return prisma.machineModel.create({
    data,
    include: modelDetails,
  });
}

// GET existing machine model without additional relations
export async function findMachineModelForUpdate(id) {
  return prisma.machineModel.findUnique({
    where: { id },
  });
}

// UPDATE machine model
export async function updateMachineModel(id, data) {
  return prisma.machineModel.update({
    where: { id },
    data,
    include: modelDetails,
  });
}

// DELETE machine model
export async function removeMachineModel(id) {
  return prisma.machineModel.delete({
    where: { id },
  });
}

export async function updateMachineModelValidated(id, data) {
  const existingModel = await findMachineModelForUpdate(id);

  if (!existingModel) {
    throw new ApiError(404, "Machine model not found");
  }

  const candidate = {
    manufacturerId: data.manufacturerId ?? existingModel.manufacturerId,
    modelName: data.modelName ?? existingModel.modelName,
    technology: data.technology ?? existingModel.technology,
    configuration: data.configuration ?? existingModel.configuration,

    maxRollWidthMm: Object.hasOwn(data, "maxRollWidthMm")
      ? data.maxRollWidthMm
      : existingModel.maxRollWidthMm,

    flatbedWidthMm: Object.hasOwn(data, "flatbedWidthMm")
      ? data.flatbedWidthMm
      : existingModel.flatbedWidthMm,

    flatbedLengthMm: Object.hasOwn(data, "flatbedLengthMm")
      ? data.flatbedLengthMm
      : existingModel.flatbedLengthMm,

    notes: Object.hasOwn(data, "notes") ? data.notes : existingModel.notes,
  };

  const validation = completeMachineModelSchema.safeParse(candidate);

  if (!validation.success) {
    const errors = validation.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    throw new ApiError(400, "Updated machine model is invalid", errors);
  }

  const updatedFields = Object.fromEntries(
    Object.keys(data).map((key) => [key, validation.data[key]]),
  );

  return updateMachineModel(id, updatedFields);
}
