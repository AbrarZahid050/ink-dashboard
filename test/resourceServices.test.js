import { describe, it, expect, vi, beforeEach } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    manufacturer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    customerSite: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    machine: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("../code/server/config/database.js", () => ({ prisma }));

import * as manufacturerService from "../code/server/services/manufacturerService.js";
import * as customerService from "../code/server/services/customerService.js";
import * as customerSiteService from "../code/server/services/customerSiteService.js";
import * as machineService from "../code/server/services/machineService.js";

describe("Manufacturer service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should list manufacturers in ascending name order", async () => {
    const records = [{ id: "manufacturer-1", name: "Epson" }];
    prisma.manufacturer.findMany.mockResolvedValue(records);

    await expect(manufacturerService.findAllManufacturers()).resolves.toBe(records);
    expect(prisma.manufacturer.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
    });
  });

  it("should find a manufacturer by ID", async () => {
    const record = { id: "manufacturer-1", name: "Mimaki" };
    prisma.manufacturer.findUnique.mockResolvedValue(record);

    await expect(
      manufacturerService.findManufacturerById(record.id),
    ).resolves.toBe(record);
    expect(prisma.manufacturer.findUnique).toHaveBeenCalledWith({
      where: { id: record.id },
    });
  });

  it("should trim a manufacturer name before creating it", async () => {
    const record = { id: "manufacturer-1", name: "Mimaki" };
    prisma.manufacturer.create.mockResolvedValue(record);

    await expect(
      manufacturerService.createManufacturer("  Mimaki  "),
    ).resolves.toBe(record);
    expect(prisma.manufacturer.create).toHaveBeenCalledWith({
      data: { name: "Mimaki" },
    });
  });

  it("should trim a manufacturer name and increment its version when updating", async () => {
    const record = { id: "manufacturer-1", name: "Epson", version: 1 };
    prisma.manufacturer.updateMany.mockResolvedValue({ count: 1 });
    prisma.manufacturer.findUnique.mockResolvedValue(record);

    await expect(
      manufacturerService.updateManufacturer(record.id, "  Epson  ", 0),
    ).resolves.toBe(record);
    expect(prisma.manufacturer.updateMany).toHaveBeenCalledWith({
      where: { id: record.id, version: 0 },
      data: { name: "Epson", version: { increment: 1 } },
    });
    expect(prisma.manufacturer.findUnique).toHaveBeenLastCalledWith({
      where: { id: record.id },
    });
  });

  it("should return 404 when updating a nonexistent manufacturer", async () => {
    prisma.manufacturer.updateMany.mockResolvedValue({ count: 0 });
    prisma.manufacturer.findUnique.mockResolvedValue(null);

    await expect(
      manufacturerService.updateManufacturer("missing-id", "Epson", 0),
    ).rejects.toMatchObject({ statusCode: 404, message: "Manufacturer not found." });
  });

  it("should return 409 when the manufacturer version is stale", async () => {
    prisma.manufacturer.updateMany.mockResolvedValue({ count: 0 });
    prisma.manufacturer.findUnique.mockResolvedValue({ id: "manufacturer-1" });

    await expect(
      manufacturerService.updateManufacturer("manufacturer-1", "Epson", 0),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("should delete a manufacturer by ID", async () => {
    prisma.manufacturer.delete.mockResolvedValue({ id: "manufacturer-1" });

    await expect(
      manufacturerService.removeManufacturer("manufacturer-1"),
    ).resolves.toEqual({ id: "manufacturer-1" });
    expect(prisma.manufacturer.delete).toHaveBeenCalledWith({
      where: { id: "manufacturer-1" },
    });
  });
});

describe("Customer service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should list customers with site counts in ascending name order", async () => {
    const records = [{ id: "customer-1", name: "Example" }];
    prisma.customer.findMany.mockResolvedValue(records);

    await expect(customerService.findAllCustomers()).resolves.toBe(records);
    expect(prisma.customer.findMany).toHaveBeenCalledWith({
      include: { _count: { select: { sites: true } } },
      orderBy: { name: "asc" },
    });
  });

  it("should find a customer with its sites and machine counts", async () => {
    const record = { id: "customer-1", name: "Example", sites: [] };
    prisma.customer.findUnique.mockResolvedValue(record);

    await expect(customerService.findCustomerById(record.id)).resolves.toBe(record);
    expect(prisma.customer.findUnique).toHaveBeenCalledWith({
      where: { id: record.id },
      include: {
        sites: {
          include: { _count: { select: { machines: true } } },
          orderBy: { name: "asc" },
        },
      },
    });
  });

  it("should create a customer with the supplied name", async () => {
    const record = { id: "customer-1", name: "Example" };
    prisma.customer.create.mockResolvedValue(record);

    await expect(customerService.createCustomer("Example")).resolves.toBe(record);
    expect(prisma.customer.create).toHaveBeenCalledWith({
      data: { name: "Example" },
    });
  });

  it("should update a customer by ID and increment its version", async () => {
    const record = { id: "customer-1", name: "Updated", version: 1 };
    prisma.customer.updateMany.mockResolvedValue({ count: 1 });
    prisma.customer.findUnique.mockResolvedValue(record);

    await expect(
      customerService.updateCustomer(record.id, "Updated", 0),
    ).resolves.toBe(record);
    expect(prisma.customer.updateMany).toHaveBeenCalledWith({
      where: { id: record.id, version: 0 },
      data: { name: "Updated", version: { increment: 1 } },
    });
    expect(prisma.customer.findUnique).toHaveBeenLastCalledWith({
      where: { id: record.id },
    });
  });

  it("should return 404 when updating a nonexistent customer", async () => {
    prisma.customer.updateMany.mockResolvedValue({ count: 0 });
    prisma.customer.findUnique.mockResolvedValue(null);

    await expect(
      customerService.updateCustomer("missing-id", "Updated", 0),
    ).rejects.toMatchObject({ statusCode: 404, message: "Customer not found." });
  });

  it("should return 409 when the customer version is stale", async () => {
    prisma.customer.updateMany.mockResolvedValue({ count: 0 });
    prisma.customer.findUnique.mockResolvedValue({ id: "customer-1" });

    await expect(
      customerService.updateCustomer("customer-1", "Updated", 0),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("should delete a customer by ID", async () => {
    prisma.customer.delete.mockResolvedValue({ id: "customer-1" });

    await expect(
      customerService.removeCustomer("customer-1"),
    ).resolves.toEqual({ id: "customer-1" });
    expect(prisma.customer.delete).toHaveBeenCalledWith({
      where: { id: "customer-1" },
    });
  });
});

describe("Customer site service", () => {
  beforeEach(() => vi.clearAllMocks());

  const siteDetails = {
    customer: true,
    _count: { select: { machines: true } },
  };

  it("should list sites with customer and machine-count details", async () => {
    const records = [{ id: "site-1", name: "Dubai" }];
    prisma.customerSite.findMany.mockResolvedValue(records);

    await expect(customerSiteService.findAllCustomerSites()).resolves.toBe(records);
    expect(prisma.customerSite.findMany).toHaveBeenCalledWith({
      include: siteDetails,
      orderBy: { name: "asc" },
    });
  });

  it("should find a site with its customer, counts, and installed machines", async () => {
    const record = { id: "site-1", name: "Dubai", machines: [] };
    prisma.customerSite.findUnique.mockResolvedValue(record);

    await expect(customerSiteService.findCustomerSiteById(record.id)).resolves.toBe(record);
    expect(prisma.customerSite.findUnique).toHaveBeenCalledWith({
      where: { id: record.id },
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
  });

  it("should create a site with relation details", async () => {
    const data = {
      customerId: "550e8400-e29b-41d4-a716-446655440000",
      name: "Dubai",
    };
    const record = { id: "site-1", ...data };
    prisma.customerSite.create.mockResolvedValue(record);

    await expect(customerSiteService.createCustomerSite(data)).resolves.toBe(record);
    expect(prisma.customerSite.create).toHaveBeenCalledWith({
      data,
      include: siteDetails,
    });
  });

  it("should update a site with relation details and increment its version", async () => {
    const data = { name: "Abu Dhabi" };
    const record = { id: "site-1", ...data, version: 1 };
    prisma.customerSite.updateMany.mockResolvedValue({ count: 1 });
    prisma.customerSite.findUnique.mockResolvedValue(record);

    await expect(
      customerSiteService.updateCustomerSite("site-1", data, 0),
    ).resolves.toBe(record);
    expect(prisma.customerSite.updateMany).toHaveBeenCalledWith({
      where: { id: "site-1", version: 0 },
      data: { ...data, version: { increment: 1 } },
    });
    expect(prisma.customerSite.findUnique).toHaveBeenLastCalledWith({
      where: { id: "site-1" },
      include: siteDetails,
    });
  });

  it("should return 404 when updating a nonexistent customer site", async () => {
    prisma.customerSite.updateMany.mockResolvedValue({ count: 0 });
    prisma.customerSite.findUnique.mockResolvedValue(null);

    await expect(
      customerSiteService.updateCustomerSite("missing-site", { name: "Dubai" }, 0),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Customer site not found.",
    });
  });

  it("should return 409 when the customer site version is stale", async () => {
    prisma.customerSite.updateMany.mockResolvedValue({ count: 0 });
    prisma.customerSite.findUnique.mockResolvedValue({ id: "site-1" });

    await expect(
      customerSiteService.updateCustomerSite("site-1", { name: "Dubai" }, 0),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("should delete a site by ID", async () => {
    prisma.customerSite.delete.mockResolvedValue({ id: "site-1" });

    await expect(
      customerSiteService.removeCustomerSite("site-1"),
    ).resolves.toEqual({ id: "site-1" });
    expect(prisma.customerSite.delete).toHaveBeenCalledWith({
      where: { id: "site-1" },
    });
  });
});

describe("Machine service", () => {
  beforeEach(() => vi.clearAllMocks());

  const machineDetails = {
    machineModel: {
      include: { manufacturer: true },
    },
    site: {
      include: { customer: true },
    },
  };

  it("should list machines with model and site relations in serial-number order", async () => {
    const records = [{ id: "machine-1", serialNumber: "SN-001" }];
    prisma.machine.findMany.mockResolvedValue(records);

    await expect(machineService.findAllMachines()).resolves.toBe(records);
    expect(prisma.machine.findMany).toHaveBeenCalledWith({
      include: machineDetails,
      orderBy: { serialNumber: "asc" },
    });
  });

  it("should find a machine by ID with model and site relations", async () => {
    const record = { id: "machine-1", serialNumber: "SN-001" };
    prisma.machine.findUnique.mockResolvedValue(record);

    await expect(machineService.findMachineById(record.id)).resolves.toBe(record);
    expect(prisma.machine.findUnique).toHaveBeenCalledWith({
      where: { id: record.id },
      include: machineDetails,
    });
  });

  it("should create a machine with model and site relations", async () => {
    const data = { serialNumber: "SN-001" };
    const record = { id: "machine-1", ...data };
    prisma.machine.create.mockResolvedValue(record);

    await expect(machineService.createMachine(data)).resolves.toBe(record);
    expect(prisma.machine.create).toHaveBeenCalledWith({
      data,
      include: machineDetails,
    });
  });

  it("should update a machine with model and site relations", async () => {
    const data = { status: "INACTIVE" };
    const record = { id: "machine-1", ...data };
    prisma.machine.updateMany.mockResolvedValue({ count: 1 });
    prisma.machine.findUnique.mockResolvedValue(record);

    await expect(
      machineService.updateMachine("machine-1", data, 0),
    ).resolves.toBe(record);
    expect(prisma.machine.updateMany).toHaveBeenCalledWith({
      where: { id: "machine-1", version: 0 },
      data: { ...data, version: { increment: 1 } },
    });
    expect(prisma.machine.findUnique).toHaveBeenCalledWith({
      where: { id: "machine-1" },
      include: machineDetails,
    });
  });

  it("should delete a machine by ID", async () => {
    prisma.machine.delete.mockResolvedValue({ id: "machine-1" });

    await expect(
      machineService.removeMachine("machine-1"),
    ).resolves.toEqual({ id: "machine-1" });
    expect(prisma.machine.delete).toHaveBeenCalledWith({
      where: { id: "machine-1" },
    });
  });
});
