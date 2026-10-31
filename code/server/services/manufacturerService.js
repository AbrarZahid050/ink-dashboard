import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";

// GET all manufacturers
export async function findAllManufacturers() {
  return prisma.manufacturer.findMany({
    orderBy: { name: "asc" },
  });
}

// GET one manufacturer by ID
export async function findManufacturerById(id) {
  return prisma.manufacturer.findUnique({
    where: { id },
  });
}

// CREATE manufacturer
export async function createManufacturer(name) {
  return prisma.manufacturer.create({
    data: {
      name: name.trim(),
    },
  });
}

// UPDATE manufacturer using optimistic concurrency control.
export async function updateManufacturer(id, name, version) {
  const result = await prisma.manufacturer.updateMany({
    where: { id, version },
    data: {
      name: name.trim(),
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    const manufacturer = await prisma.manufacturer.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!manufacturer) {
      throw new ApiError(404, "Manufacturer not found.");
    }

    throw new ApiError(
      409,
      "Manufacturer was modified by another user. Please retrieve the latest version and try again.",
    );
  }

  return prisma.manufacturer.findUnique({
    where: { id },
  });
}

// DELETE manufacturer
export async function removeManufacturer(id) {
  return prisma.manufacturer.delete({
    where: { id },
  });
}
