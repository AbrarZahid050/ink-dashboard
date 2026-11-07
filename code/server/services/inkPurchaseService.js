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
      lot: true,
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

// Retrieve purchases matching any supplied filters.
export async function findAllInkPurchases(filters = {}) {
  const {
    customerId,
    machineId,
    inkProductId,
    startDate,
    endDate,
  } = filters;

  const where = {};

  if (customerId) {
    where.customerId = customerId;
  }

  if (machineId || inkProductId) {
    where.items = {
      some: {
        ...(machineId && { machineId }),
        ...(inkProductId && { inkProductId }),
      },
    };
  }

  if (startDate || endDate) {
    where.purchasedAt = {
      ...(startDate && { gte: toDatabaseDate(startDate) }),
      ...(endDate && { lte: toDatabaseDate(endDate) }),
    };
  }

  return prisma.inkPurchase.findMany({
    where,
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

    const machineIds = [...new Set(data.items.map((item) => item.machineId).filter(Boolean))];
    const machines = machineIds.length === 0 ? [] : await tx.machine.findMany({
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

    // Deduct the selected lot inside the same transaction as invoice creation.
    // The conditional update prevents concurrent sales from overselling stock.
    for (const item of data.items) {
      const lot = await tx.inkLot.findUnique({
        where: { id: item.inkLotId },
        select: { id: true, inkProductId: true },
      });

      if (!lot) {
        throw new ApiError(404, "One or more selected ink lots were not found.");
      }

      if (lot.inkProductId !== item.inkProductId) {
        throw new ApiError(400, "The selected ink lot does not belong to the selected ink product.");
      }

      const stockUpdate = await tx.inkLot.updateMany({
        where: {
          id: item.inkLotId,
          inkProductId: item.inkProductId,
          quantity: { gte: item.quantity },
        },
        data: {
          quantity: { decrement: item.quantity },
          version: { increment: 1 },
        },
      });

      if (stockUpdate.count !== 1) {
        throw new ApiError(409, "Insufficient stock in the selected ink lot.");
      }
    }

    return tx.inkPurchase.create({
      data: {
        customerId: data.customerId,
        purchasedAt: toDatabaseDate(data.purchasedAt),
        reference: data.reference,
        currencyCode: data.currencyCode,
        items: {
          create: data.items.map((item) => ({
            machineId: item.machineId ?? null,
            inkProductId: item.inkProductId,
            inkLotId: item.inkLotId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: purchaseDetails,
    });
  });
}
