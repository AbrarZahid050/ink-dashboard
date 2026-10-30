import { prisma } from "../config/database.js";

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

export async function updateCustomer(id, name) {
  return prisma.customer.update({
    where: { id },
    data: { name },
  });
}

export async function removeCustomer(id) {
  return prisma.customer.delete({
    where: { id },
  });
}
