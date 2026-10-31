import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../code/server/app.js";
import { prisma } from "../code/server/config/database.js";
import { testPrisma } from "../code/server/config/testDatabase.js";

describe("Machine PostgreSQL integration tests", () => {
  afterAll(async () => {
    await Promise.all([prisma.$disconnect(), testPrisma.$disconnect()]);
  });

  async function createMachineDependencies() {
    const manufacturer = await testPrisma.manufacturer.create({
      data: { name: `Integration Machine Manufacturer ${randomUUID()}` },
    });

    const machineModel = await testPrisma.machineModel.create({
      data: {
        manufacturerId: manufacturer.id,
        modelName: `Integration Machine Model ${randomUUID()}`,
        technology: "UV",
        configuration: "ROLL_TO_ROLL",
        maxRollWidthMm: 3200,
      },
    });

    const customer = await testPrisma.customer.create({
      data: { name: `Integration Machine Customer ${randomUUID()}` },
    });

    const site = await testPrisma.customerSite.create({
      data: {
        customerId: customer.id,
        name: `Integration Machine Site ${randomUUID()}`,
        city: "Abu Dhabi",
        country: "UAE",
      },
    });

    return { manufacturer, machineModel, customer, site };
  }

  async function cleanupMachineDependencies(dependencies) {
    const { manufacturer, machineModel, customer, site, machine } = dependencies;

    // Remove any machine created by the API as well as records created directly
    // by the test. This also keeps cleanup safe when an assertion fails.
    await testPrisma.machine.deleteMany({
      where: {
        OR: [
          ...(machine ? [{ id: machine.id }] : []),
          ...(site ? [{ siteId: site.id }] : []),
          ...(machineModel ? [{ machineModelId: machineModel.id }] : []),
        ],
      },
    });

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

  it("should create a machine through the API and persist it in PostgreSQL", async () => {
    const dependencies = await createMachineDependencies();
    const input = {
      serialNumber: `INTEGRATION-${randomUUID()}`,
      machineModelId: dependencies.machineModel.id,
      siteId: dependencies.site.id,
      installationDate: "2025-06-15",
      status: "ACTIVE",
      notes: "Created by PostgreSQL integration test",
    };

    try {
      const response = await request(app)
        .post("/api/v1/machines")
        .send(input);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          ...input,
          installationDate: "2025-06-15T00:00:00.000Z",
          machineModel: {
            id: dependencies.machineModel.id,
            modelName: dependencies.machineModel.modelName,
            manufacturer: {
              id: dependencies.manufacturer.id,
              name: dependencies.manufacturer.name,
            },
          },
          site: {
            id: dependencies.site.id,
            name: dependencies.site.name,
            customer: {
              id: dependencies.customer.id,
              name: dependencies.customer.name,
            },
          },
        },
      });

      const persisted = await testPrisma.machine.findUnique({
        where: { id: response.body.data.id },
      });

      expect(persisted).toMatchObject({
        serialNumber: input.serialNumber,
        machineModelId: input.machineModelId,
        siteId: input.siteId,
        installationDate: new Date("2025-06-15T00:00:00.000Z"),
        status: "ACTIVE",
        notes: input.notes,
      });
    } finally {
      await cleanupMachineDependencies(dependencies);
    }
  });

  it("should retrieve a machine by ID with its model, manufacturer, site, and customer", async () => {
    const dependencies = await createMachineDependencies();
    dependencies.machine = await testPrisma.machine.create({
      data: {
        serialNumber: `INTEGRATION-GET-${randomUUID()}`,
        machineModelId: dependencies.machineModel.id,
        siteId: dependencies.site.id,
        installationDate: new Date("2024-03-20T00:00:00.000Z"),
        status: "INACTIVE",
      },
    });

    try {
      const response = await request(app).get(
        `/api/v1/machines/${dependencies.machine.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: dependencies.machine.id,
          serialNumber: dependencies.machine.serialNumber,
          machineModel: {
            id: dependencies.machineModel.id,
            modelName: dependencies.machineModel.modelName,
            manufacturer: {
              id: dependencies.manufacturer.id,
              name: dependencies.manufacturer.name,
            },
          },
          site: {
            id: dependencies.site.id,
            name: dependencies.site.name,
            customer: {
              id: dependencies.customer.id,
              name: dependencies.customer.name,
            },
          },
        },
      });
    } finally {
      await cleanupMachineDependencies(dependencies);
    }
  });

  it("should retrieve all machines with their model and site relationships", async () => {
    const dependencies = await createMachineDependencies();
    dependencies.machine = await testPrisma.machine.create({
      data: {
        serialNumber: `INTEGRATION-LIST-${randomUUID()}`,
        machineModelId: dependencies.machineModel.id,
        siteId: dependencies.site.id,
        installationDate: new Date("2023-11-05T00:00:00.000Z"),
      },
    });

    try {
      const response = await request(app).get("/api/v1/machines");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(response.body.data.length);

      const returnedMachine = response.body.data.find(
        (item) => item.id === dependencies.machine.id,
      );

      expect(returnedMachine).toMatchObject({
        id: dependencies.machine.id,
        serialNumber: dependencies.machine.serialNumber,
        machineModel: {
          id: dependencies.machineModel.id,
          manufacturer: {
            id: dependencies.manufacturer.id,
            name: dependencies.manufacturer.name,
          },
        },
        site: {
          id: dependencies.site.id,
          customer: {
            id: dependencies.customer.id,
            name: dependencies.customer.name,
          },
        },
      });
    } finally {
      await cleanupMachineDependencies(dependencies);
    }
  });

  it("should update a machine through the API and persist the changes in PostgreSQL", async () => {
    const dependencies = await createMachineDependencies();
    dependencies.machine = await testPrisma.machine.create({
      data: {
        serialNumber: `INTEGRATION-UPDATE-${randomUUID()}`,
        machineModelId: dependencies.machineModel.id,
        siteId: dependencies.site.id,
        installationDate: new Date("2022-01-10T00:00:00.000Z"),
        status: "ACTIVE",
        notes: "Original notes",
      },
    });

    const updateInput = {
      serialNumber: `INTEGRATION-UPDATED-${randomUUID()}`,
      installationDate: "2024-09-25",
      status: "INACTIVE",
      notes: "Updated by PostgreSQL integration test",
    };

    try {
      const response = await request(app)
        .patch(`/api/v1/machines/${dependencies.machine.id}`)
        .send(updateInput);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: dependencies.machine.id,
          ...updateInput,
          installationDate: "2024-09-25T00:00:00.000Z",
          machineModel: {
            id: dependencies.machineModel.id,
            manufacturer: { id: dependencies.manufacturer.id },
          },
          site: {
            id: dependencies.site.id,
            customer: { id: dependencies.customer.id },
          },
        },
      });

      const persisted = await testPrisma.machine.findUnique({
        where: { id: dependencies.machine.id },
      });

      expect(persisted).toMatchObject({
        serialNumber: updateInput.serialNumber,
        installationDate: new Date("2024-09-25T00:00:00.000Z"),
        status: "INACTIVE",
        notes: updateInput.notes,
      });
    } finally {
      await cleanupMachineDependencies(dependencies);
    }
  });

  it("should delete a machine through the API and remove it from PostgreSQL", async () => {
    const dependencies = await createMachineDependencies();
    dependencies.machine = await testPrisma.machine.create({
      data: {
        serialNumber: `INTEGRATION-DELETE-${randomUUID()}`,
        machineModelId: dependencies.machineModel.id,
        siteId: dependencies.site.id,
        installationDate: new Date("2021-07-01T00:00:00.000Z"),
      },
    });

    try {
      const response = await request(app).delete(
        `/api/v1/machines/${dependencies.machine.id}`,
      );

      expect(response.status).toBe(204);
      expect(response.text).toBe("");

      const deleted = await testPrisma.machine.findUnique({
        where: { id: dependencies.machine.id },
      });
      expect(deleted).toBeNull();
    } finally {
      await cleanupMachineDependencies(dependencies);
    }
  });

  it("should return 404 when retrieving a nonexistent machine", async () => {
    const response = await request(app).get(
      `/api/v1/machines/${randomUUID()}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      message: "Machine not found.",
    });
  });

  it("should return 404 when updating a nonexistent machine", async () => {
    const response = await request(app)
      .patch(`/api/v1/machines/${randomUUID()}`)
      .send({ status: "INACTIVE" });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      message: "Requested record not found.",
    });
  });
});
