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

// UPDATE machine
export async function updateMachine(id, data) {
  return prisma.machine.update({
    where: { id },
    data,
    include: machineDetails,
  });
}

// DELETE machine
export async function removeMachine(id) {
  return prisma.machine.delete({
    where: { id },
  });
}
