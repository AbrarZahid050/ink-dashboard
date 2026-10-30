import { prisma } from "../config/database.js";

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

// UPDATE customer site
export async function updateCustomerSite(id, data) {
  return prisma.customerSite.update({
    where: { id },
    data,
    include: siteDetails,
  });
}

// DELETE customer site
export async function removeCustomerSite(id) {
  return prisma.customerSite.delete({
    where: { id },
  });
}
