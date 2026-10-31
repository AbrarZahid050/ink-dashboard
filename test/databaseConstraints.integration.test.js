import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../code/server/app.js";
import { prisma } from "../code/server/config/database.js";
import { testPrisma } from "../code/server/config/testDatabase.js";

describe("Database constraint PostgreSQL integration tests", () => {
  afterAll(async () => {
    await Promise.all([prisma.$disconnect(), testPrisma.$disconnect()]);
  });

  async function createMachineDependencies() {
    const manufacturer = await testPrisma.manufacturer.create({
      data: { name: `Constraint Manufacturer ${randomUUID()}` },
    });

    const machineModel = await testPrisma.machineModel.create({
      data: {
        manufacturerId: manufacturer.id,
        modelName: `Constraint Model ${randomUUID()}`,
        technology: "UV",
        configuration: "ROLL_TO_ROLL",
        maxRollWidthMm: 3200,
      },
    });

    const customer = await testPrisma.customer.create({
      data: { name: `Constraint Customer ${randomUUID()}` },
    });

    const site = await testPrisma.customerSite.create({
      data: {
        customerId: customer.id,
        name: `Constraint Site ${randomUUID()}`,
      },
    });

    return { manufacturer, machineModel, customer, site };
  }

  async function cleanupDependencies({ manufacturer, machineModel, customer, site }) {
    if (site) {
      await testPrisma.machine.deleteMany({ where: { siteId: site.id } });
      await testPrisma.customerSite.deleteMany({ where: { id: site.id } });
    }

    if (machineModel) {
      await testPrisma.machine.deleteMany({
        where: { machineModelId: machineModel.id },
      });
      await testPrisma.machineModel.deleteMany({
        where: { id: machineModel.id },
      });
    }

    if (customer) {
      await testPrisma.customer.deleteMany({ where: { id: customer.id } });
    }

    if (manufacturer) {
      await testPrisma.manufacturer.deleteMany({
        where: { id: manufacturer.id },
      });
    }
  }

  it("rejects a duplicate manufacturer name with HTTP 409", async () => {
    const name = `Duplicate Manufacturer ${randomUUID()}`;
    const manufacturer = await testPrisma.manufacturer.create({
      data: { name },
    });

    try {
      const response = await request(app)
        .post("/api/v1/manufacturers")
        .send({ name });

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        success: false,
        message: "A record with these values already exists.",
      });

      const records = await testPrisma.manufacturer.findMany({
        where: { name },
      });
      expect(records).toHaveLength(1);
    } finally {
      await testPrisma.manufacturer.deleteMany({ where: { id: manufacturer.id } });
    }
  });

  it("rejects a manufacturer update that would duplicate another name", async () => {
    const names = [
      `Manufacturer A ${randomUUID()}`,
      `Manufacturer B ${randomUUID()}`,
    ];
    const manufacturers = await testPrisma.manufacturer.createManyAndReturn({
      data: names.map((name) => ({ name })),
    });

    try {
      const response = await request(app)
        .patch(`/api/v1/manufacturers/${manufacturers[1].id}`)
        .send({ name: names[0] });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "A record with these values already exists.",
      );

      const unchanged = await testPrisma.manufacturer.findUnique({
        where: { id: manufacturers[1].id },
      });
      expect(unchanged.name).toBe(names[1]);
    } finally {
      await testPrisma.manufacturer.deleteMany({
        where: { id: { in: manufacturers.map(({ id }) => id) } },
      });
    }
  });

  it("rejects duplicate model names for the same manufacturer", async () => {
    const manufacturer = await testPrisma.manufacturer.create({
      data: { name: `Model Unique Manufacturer ${randomUUID()}` },
    });
    const modelName = `Duplicate Model ${randomUUID()}`;
    const model = await testPrisma.machineModel.create({
      data: {
        manufacturerId: manufacturer.id,
        modelName,
        technology: "UV",
        configuration: "ROLL_TO_ROLL",
        maxRollWidthMm: 3200,
      },
    });

    try {
      const response = await request(app)
        .post("/api/v1/machine-models")
        .send({
          manufacturerId: manufacturer.id,
          modelName,
          technology: "UV",
          configuration: "ROLL_TO_ROLL",
          maxRollWidthMm: 3200,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "A record with these values already exists.",
      );
    } finally {
      await testPrisma.machineModel.deleteMany({
        where: { manufacturerId: manufacturer.id },
      });
      await testPrisma.manufacturer.delete({ where: { id: manufacturer.id } });
    }
  });

  it("rejects duplicate site names for the same customer", async () => {
    const customer = await testPrisma.customer.create({
      data: { name: `Site Unique Customer ${randomUUID()}` },
    });
    const name = `Duplicate Site ${randomUUID()}`;
    await testPrisma.customerSite.create({
      data: { customerId: customer.id, name },
    });

    try {
      const response = await request(app)
        .post("/api/v1/customer-sites")
        .send({ customerId: customer.id, name });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "A record with these values already exists.",
      );
    } finally {
      await testPrisma.customerSite.deleteMany({
        where: { customerId: customer.id },
      });
      await testPrisma.customer.delete({ where: { id: customer.id } });
    }
  });

  it("rejects a duplicate machine serial number", async () => {
    const dependencies = await createMachineDependencies();
    const serialNumber = `DUPLICATE-${randomUUID()}`;
    await testPrisma.machine.create({
      data: {
        serialNumber,
        machineModelId: dependencies.machineModel.id,
        siteId: dependencies.site.id,
        installationDate: new Date("2025-01-15T00:00:00.000Z"),
      },
    });

    try {
      const response = await request(app)
        .post("/api/v1/machines")
        .send({
          serialNumber,
          machineModelId: dependencies.machineModel.id,
          siteId: dependencies.site.id,
          installationDate: "2025-01-15",
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "A record with these values already exists.",
      );

      const records = await testPrisma.machine.findMany({
        where: { serialNumber },
      });
      expect(records).toHaveLength(1);
    } finally {
      await cleanupDependencies(dependencies);
    }
  });

  it("rejects a machine model referencing a nonexistent manufacturer", async () => {
    const response = await request(app)
      .post("/api/v1/machine-models")
      .send({
        manufacturerId: randomUUID(),
        modelName: `Invalid FK Model ${randomUUID()}`,
        technology: "UV",
        configuration: "ROLL_TO_ROLL",
        maxRollWidthMm: 3200,
      });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      success: false,
      message: "The operation violates a relationship constraint.",
    });
  });

  it("rejects a customer site referencing a nonexistent customer", async () => {
    const response = await request(app)
      .post("/api/v1/customer-sites")
      .send({
        customerId: randomUUID(),
        name: `Invalid FK Site ${randomUUID()}`,
      });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      success: false,
      message: "The operation violates a relationship constraint.",
    });
  });

  it("rejects a machine referencing a nonexistent machine model", async () => {
    const dependencies = await createMachineDependencies();

    try {
      const response = await request(app)
        .post("/api/v1/machines")
        .send({
          serialNumber: `INVALID-MODEL-${randomUUID()}`,
          machineModelId: randomUUID(),
          siteId: dependencies.site.id,
          installationDate: "2025-01-15",
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "The operation violates a relationship constraint.",
      );
    } finally {
      await cleanupDependencies(dependencies);
    }
  });

  it("rejects a machine referencing a nonexistent customer site", async () => {
    const dependencies = await createMachineDependencies();

    try {
      const response = await request(app)
        .post("/api/v1/machines")
        .send({
          serialNumber: `INVALID-SITE-${randomUUID()}`,
          machineModelId: dependencies.machineModel.id,
          siteId: randomUUID(),
          installationDate: "2025-01-15",
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "The operation violates a relationship constraint.",
      );
    } finally {
      await cleanupDependencies(dependencies);
    }
  });
});
