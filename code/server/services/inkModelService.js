import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";

const inkModelListDetails = {
  manufacturer: true,
  _count: {
    select: { products: true },
  },
};

const inkModelDetails = {
  manufacturer: true,
  products: {
    orderBy: [{ color: "asc" }, { capacityMl: "asc" }],
  },
};

// GET all ink models.
export async function findAllInkModels() {
  return prisma.inkModel.findMany({
    include: inkModelListDetails,
    orderBy: [{ manufacturer: { name: "asc" } }, { inkName: "asc" }],
  });
}

// GET one ink model by ID.
export async function findInkModelById(id) {
  return prisma.inkModel.findUnique({
    where: { id },
    include: inkModelDetails,
  });
}

// CREATE ink model.
export async function createInkModel(data) {
  return prisma.inkModel.create({
    data,
    include: inkModelListDetails,
  });
}

// UPDATE ink model using optimistic concurrency control.
export async function updateInkModel(id, data, version) {
  const result = await prisma.inkModel.updateMany({
    where: { id, version },
    data: {
      ...data,
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    const inkModel = await prisma.inkModel.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!inkModel) {
      throw new ApiError(404, "Ink model not found.");
    }

    throw new ApiError(
      409,
      "Ink model was modified by another user. Please retrieve the latest version and try again.",
    );
  }

  return prisma.inkModel.findUnique({
    where: { id },
    include: inkModelDetails,
  });
}

// DELETE ink model.
export async function removeInkModel(id) {
  return prisma.inkModel.delete({
    where: { id },
  });
}
