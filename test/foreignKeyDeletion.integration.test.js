import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../code/server/app.js";
import { prisma } from "../code/server/config/database.js";
import { testPrisma } from "../code/server/config/testDatabase.js";

describe("Foreign-key deletion PostgreSQL integration tests", () => {
  afterAll(async () => {
    await Promise.all([prisma.$disconnect(), testPrisma.$disconnect()]);
  });

  async function createMachineDependencies() {
    const manufacturer = await testPrisma.manufacturer.create({
      data: { name: `Deletion Manufacturer ${randomUUID()}` },
    });

    const machineModel = await testPrisma.machineModel.create({
      data: {
        manufacturerId: manufacturer.id,
        modelName: `Deletion Model ${randomUUID()}`,
        technology: "UV",
        configuration: "ROLL_TO_ROLL",
        maxRollWidthMm: 3200,
      },
    });

    const customer = await testPrisma.customer.create({
      data: { name: `Deletion Customer ${randomUUID()}` },
    });

    const site = await testPrisma.customerSite.create({
      data: {
        customerId: customer.id,
        name: `Deletion Site ${randomUUID()}`,
      },
    });

    const machine = await testPrisma.machine.create({
      data: {
        serialNumber: `DELETION-${randomUUID()}`,
        machineModelId: machineModel.id,
        siteId: site.id,
        installationDate: new Date("2025-01-15T00:00:00.000Z"),
      },
    });

    return { manufacturer, machineModel, customer, site, machine };
  }

  async function cleanup(dependencies) {
    const { manufacturer, machineModel, customer, site, machine } = dependencies;

    if (machine) {
      await testPrisma.machine.deleteMany({ where: { id: machine.id } });
    }
    if (site) {
      await testPrisma.customerSite.deleteMany({ where: { id: site.id } });
    }
    if (customer) {
      await testPrisma.customer.deleteMany({ where: { id: customer.id } });
    }
    if (machineModel) {
      await testPrisma.machineModel.deleteMany({
        where: { id: machineModel.id },
      });
    }
    if (manufacturer) {
      await testPrisma.manufacturer.deleteMany({
        where: { id: manufacturer.id },
      });
    }
  }

  it("prevents deleting a manufacturer that still has machine models", async () => {
    const dependencies = await createMachineDependencies();

    try {
      const response = await request(app).delete(
        `/api/v1/manufacturers/${dependencies.manufacturer.id}`,
      );

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        success: false,
        message: "The operation violates a relationship constraint.",
      });

      const manufacturer = await testPrisma.manufacturer.findUnique({
        where: { id: dependencies.manufacturer.id },
      });
      const model = await testPrisma.machineModel.findUnique({
        where: { id: dependencies.machineModel.id },
      });

      expect(manufacturer).not.toBeNull();
      expect(model).not.toBeNull();
    } finally {
      await cleanup(dependencies);
    }
  });

  it("prevents deleting a customer that still has customer sites", async () => {
    const dependencies = await createMachineDependencies();

    try {
      const response = await request(app).delete(
        `/api/v1/customers/${dependencies.customer.id}`,
      );

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        success: false,
        message: "The operation violates a relationship constraint.",
      });

      const customer = await testPrisma.customer.findUnique({
        where: { id: dependencies.customer.id },
      });
      const site = await testPrisma.customerSite.findUnique({
        where: { id: dependencies.site.id },
      });

      expect(customer).not.toBeNull();
      expect(site).not.toBeNull();
    } finally {
      await cleanup(dependencies);
    }
  });

  it("prevents deleting a machine model that is still used by a machine", async () => {
    const dependencies = await createMachineDependencies();

    try {
      const response = await request(app).delete(
        `/api/v1/machine-models/${dependencies.machineModel.id}`,
      );

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        success: false,
        message: "The operation violates a relationship constraint.",
      });

      const model = await testPrisma.machineModel.findUnique({
        where: { id: dependencies.machineModel.id },
      });
      const machine = await testPrisma.machine.findUnique({
        where: { id: dependencies.machine.id },
      });

      expect(model).not.toBeNull();
      expect(machine).not.toBeNull();
    } finally {
      await cleanup(dependencies);
    }
  });

  it("prevents deleting a customer site that still has machines", async () => {
    const dependencies = await createMachineDependencies();

    try {
      const response = await request(app).delete(
        `/api/v1/customer-sites/${dependencies.site.id}`,
      );

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        success: false,
        message: "The operation violates a relationship constraint.",
      });

      const site = await testPrisma.customerSite.findUnique({
        where: { id: dependencies.site.id },
      });
      const machine = await testPrisma.machine.findUnique({
        where: { id: dependencies.machine.id },
      });

      expect(site).not.toBeNull();
      expect(machine).not.toBeNull();
    } finally {
      await cleanup(dependencies);
    }
  });
});
