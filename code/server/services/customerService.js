import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";

export async function findAllCustomers() {
  return prisma.customer.findMany({
    include: {
      _count: {
        select: { sites: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function findCustomerById(id) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      sites: {
        include: {
          _count: {
            select: { machines: true },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });
}

export async function createCustomer(name) {
  return prisma.customer.create({
    data: { name },
  });
}

export async function updateCustomer(id, name, version) {
  const result = await prisma.customer.updateMany({
    where: { id, version },
    data: {
      name,
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!customer) {
      throw new ApiError(404, "Customer not found.");
    }

    throw new ApiError(
      409,
      "Customer was modified by another user. Please retrieve the latest version and try again.",
    );
  }

  return prisma.customer.findUnique({
    where: { id },
  });
}

export async function removeCustomer(id) {
  return prisma.customer.delete({
    where: { id },
  });
}
