import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";

const inkLotDetails = {
  inkProduct: {
    include: {
      inkModel: {
        include: { manufacturer: true },
      },
    },
  },
};

// Convert the validated YYYY-MM-DD value to a UTC date for PostgreSQL DATE.
function toDatabaseDate(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

// GET all ink lots.
export async function findAllInkLots() {
  return prisma.inkLot.findMany({
    include: inkLotDetails,
    orderBy: [{ expiryDate: "asc" }, { lotNumber: "asc" }],
  });
}

// GET one ink lot by ID.
export async function findInkLotById(id) {
  return prisma.inkLot.findUnique({
    where: { id },
    include: inkLotDetails,
  });
}

// CREATE an ink lot.
export async function createInkLot(data) {
  return prisma.inkLot.create({
    data: {
      ...data,
      expiryDate: toDatabaseDate(data.expiryDate),
    },
    include: inkLotDetails,
  });
}

// UPDATE an ink lot using optimistic concurrency control.
export async function updateInkLot(id, data, version) {
  const updateData = { ...data };

  if (updateData.expiryDate !== undefined) {
    updateData.expiryDate = toDatabaseDate(updateData.expiryDate);
  }

  const result = await prisma.inkLot.updateMany({
    where: { id, version },
    data: {
      ...updateData,
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    const inkLot = await prisma.inkLot.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!inkLot) {
      throw new ApiError(404, "Ink lot not found.");
    }

    throw new ApiError(
      409,
      "Ink lot was modified by another user. Please retrieve the latest version and try again.",
    );
  }

  return findInkLotById(id);
}

// DELETE an ink lot.
export async function removeInkLot(id) {
  const inkLot = await prisma.inkLot.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!inkLot) {
    throw new ApiError(404, "Ink lot not found.");
  }

  return prisma.inkLot.delete({ where: { id } });
}
