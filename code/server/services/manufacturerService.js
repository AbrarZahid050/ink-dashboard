import { prisma } from "../config/database.js";

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

// UPDATE manufacturer
export async function updateManufacturer(id, name) {
  return prisma.manufacturer.update({
    where: { id },
    data: {
      name: name.trim(),
    },
  });
}

// DELETE manufacturer
export async function removeManufacturer(id) {
  return prisma.manufacturer.delete({
    where: { id },
  });
}
