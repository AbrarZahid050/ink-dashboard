import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../code/server/app.js";
import { prisma } from "../code/server/config/database.js";

describe("Machine Model API - PostgreSQL integration", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates and retrieves a machine model through the API", async () => {
    // Verify the exact database used by the same Prisma client imported by
    // the application service before performing any writes.
    const database = await prisma.$queryRaw`
      SELECT current_database() AS name
    `;

    expect(database[0].name).toBe("ink_dashboard_test");

    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: `Integration Manufacturer ${randomUUID()}`,
      },
    });

    try {
      const createResponse = await request(app)
        .post("/api/v1/machine-models")
        .send({
          manufacturerId: manufacturer.id,
          modelName: `Integration Test Printer ${randomUUID()}`,
          technology: "UV",
          configuration: "ROLL_TO_ROLL",
          maxRollWidthMm: 3200,
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);

      const createdModel = createResponse.body.data;

      expect(createdModel.id).toBeDefined();
      expect(createdModel.manufacturerId).toBe(manufacturer.id);
      expect(createdModel.manufacturer.name).toBe(manufacturer.name);

      const getResponse = await request(app).get(
        `/api/v1/machine-models/${createdModel.id}`,
      );

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.id).toBe(createdModel.id);
      expect(getResponse.body.data.modelName).toBe(
        createdModel.modelName,
      );
      expect(getResponse.body.data.manufacturer.id).toBe(manufacturer.id);
    } finally {
      // Delete dependent records before deleting their manufacturer.
      await prisma.machineModel.deleteMany({
        where: { manufacturerId: manufacturer.id },
      });

      await prisma.manufacturer.delete({
        where: { id: manufacturer.id },
      });
    }
  });
});
