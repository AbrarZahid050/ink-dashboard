import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";

const siteDetails = {
  customer: true,
  _count: {
    select: { machines: true },
  },
};

// GET all customer sites
export async function findAllCustomerSites() {
  return prisma.customerSite.findMany({
    include: siteDetails,
    orderBy: { name: "asc" },
  });
}

// GET customer site by ID
export async function findCustomerSiteById(id) {
  return prisma.customerSite.findUnique({
    where: { id },
    include: {
      ...siteDetails,
      machines: {
        include: {
          machineModel: {
            include: { manufacturer: true },
          },
        },
      },
    },
  });
}

// CREATE customer site
export async function createCustomerSite(data) {
  return prisma.customerSite.create({
    data,
    include: siteDetails,
  });
}

// UPDATE customer site using optimistic concurrency control.
export async function updateCustomerSite(id, data, version) {
  const result = await prisma.customerSite.updateMany({
    where: { id, version },
    data: {
      ...data,
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    const site = await prisma.customerSite.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!site) {
      throw new ApiError(404, "Customer site not found.");
    }

    throw new ApiError(
      409,
      "Customer site was modified by another user. Please retrieve the latest version and try again.",
    );
  }

  return prisma.customerSite.findUnique({
    where: { id },
    include: siteDetails,
  });
}

// DELETE customer site
export async function removeCustomerSite(id) {
  return prisma.customerSite.delete({
    where: { id },
  });
}
