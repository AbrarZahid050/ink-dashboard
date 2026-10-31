import { prisma } from "../config/database.js";

const machineDetails = {
  machineModel: {
    include: {
      manufacturer: true,
    },
  },
  site: {
    include: {
      customer: true,
    },
  },
};

// GET all machines
export async function findAllMachines() {
  return prisma.machine.findMany({
    include: machineDetails,
    orderBy: { serialNumber: "asc" },
  });
}

// GET machine by ID
export async function findMachineById(id) {
  return prisma.machine.findUnique({
    where: { id },
    include: machineDetails,
  });
}

// CREATE machine
export async function createMachine(data) {
  return prisma.machine.create({
    data,
    include: machineDetails,
  });
}

// UPDATE machine using Optimistic Concurrency Control
export async function updateMachine(id, data, version) {
  const result = await prisma.machine.updateMany({
    where: {
      id,
      version,
    },
    data: {
      ...data,
      version: {
        increment: 1,
      },
    },
  });

  // No record matched both the ID and expected version.
  if (result.count === 0) {
    const machine = await prisma.machine.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!machine) {
      throw new Error("Machine not found.");
    }

    throw new Error(
      "Machine was modified by another user. Please retrieve the latest version and try again.",
    );
  }

  // Return the updated machine with its related details.
  return prisma.machine.findUnique({
    where: { id },
    include: machineDetails,
  });
}

// DELETE machine
export async function removeMachine(id) {
  return prisma.machine.delete({
    where: { id },
  });
}
