import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";

const purchaseDetails = {
  customer: true,
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      machine: {
        include: {
          machineModel: {
            include: { manufacturer: true },
          },
          site: {
            include: { customer: true },
          },
        },
      },
      inkProduct: {
        include: {
          inkModel: {
            include: { manufacturer: true },
          },
        },
      },
    },
  },
};

// Convert a validated YYYY-MM-DD value to a UTC date for PostgreSQL DATE.
function toDatabaseDate(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

// Retrieve purchases with their customer, machine and ink-product details.
export async function findAllInkPurchases() {
  return prisma.inkPurchase.findMany({
    include: purchaseDetails,
    orderBy: [{ purchasedAt: "desc" }, { createdAt: "desc" }],
  });
}

// Retrieve one purchase by ID.
export async function findInkPurchaseById(id) {
  return prisma.inkPurchase.findUnique({
    where: { id },
    include: purchaseDetails,
  });
}

// Create a purchase and all its line items atomically.
export async function createInkPurchase(data) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { id: data.customerId },
      select: { id: true },
    });

    if (!customer) {
      throw new ApiError(404, "Customer not found.");
    }

    const machineIds = [...new Set(data.items.map((item) => item.machineId))];
    const machines = await tx.machine.findMany({
      where: { id: { in: machineIds } },
      select: {
        id: true,
        site: {
          select: { customerId: true },
        },
      },
    });

    if (machines.length !== machineIds.length) {
      throw new ApiError(404, "One or more machines were not found.");
    }

    const machinesOutsideCustomer = machines.filter(
      (machine) => machine.site.customerId !== data.customerId,
    );

    if (machinesOutsideCustomer.length > 0) {
      throw new ApiError(
        400,
        "Every machine must belong to the purchase customer.",
      );
    }

    const inkProductIds = [
      ...new Set(data.items.map((item) => item.inkProductId)),
    ];
    const inkProducts = await tx.inkProduct.findMany({
      where: { id: { in: inkProductIds } },
      select: { id: true },
    });

    if (inkProducts.length !== inkProductIds.length) {
      throw new ApiError(404, "One or more ink products were not found.");
    }

    return tx.inkPurchase.create({
      data: {
        customerId: data.customerId,
        purchasedAt: toDatabaseDate(data.purchasedAt),
        reference: data.reference,
        currencyCode: data.currencyCode,
        items: {
          create: data.items.map((item) => ({
            machineId: item.machineId,
            inkProductId: item.inkProductId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: purchaseDetails,
    });
  });
}
