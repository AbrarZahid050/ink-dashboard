import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";

const inkProductListDetails = {
  inkModel: {
    include: { manufacturer: true },
  },
  _count: {
    select: { lots: true },
  },
};

const inkProductDetails = {
  inkModel: {
    include: { manufacturer: true },
  },
  lots: {
    orderBy: [{ expiryDate: "asc" }, { lotNumber: "asc" }],
  },
};

// GET all ink products.
export async function findAllInkProducts() {
  return prisma.inkProduct.findMany({
    include: inkProductListDetails,
    orderBy: [
      { inkModel: { manufacturer: { name: "asc" } } },
      { inkModel: { inkName: "asc" } },
      { color: "asc" },
      { capacityMl: "asc" },
    ],
  });
}

// GET one ink product by ID.
export async function findInkProductById(id) {
  return prisma.inkProduct.findUnique({
    where: { id },
    include: inkProductDetails,
  });
}

// CREATE an ink product.
export async function createInkProduct(data) {
  return prisma.inkProduct.create({
    data,
    include: inkProductListDetails,
  });
}

// UPDATE an ink product using optimistic concurrency control.
export async function updateInkProduct(id, data, version) {
  const result = await prisma.inkProduct.updateMany({
    where: { id, version },
    data: {
      ...data,
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    const inkProduct = await prisma.inkProduct.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!inkProduct) {
      throw new ApiError(404, "Ink product not found.");
    }

    throw new ApiError(
      409,
      "Ink product was modified by another user. Please retrieve the latest version and try again.",
    );
  }

  return prisma.inkProduct.findUnique({
    where: { id },
    include: inkProductDetails,
  });
}

// DELETE an ink product only when it has no associated lots.
export async function removeInkProduct(id) {
  const inkProduct = await prisma.inkProduct.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: { lots: true },
      },
    },
  });

  if (!inkProduct) {
    throw new ApiError(404, "Ink product not found.");
  }

  if (inkProduct._count.lots > 0) {
    throw new ApiError(
      409,
      "Ink product cannot be deleted while it has associated lots.",
    );
  }

  return prisma.inkProduct.delete({
    where: { id },
  });
}
