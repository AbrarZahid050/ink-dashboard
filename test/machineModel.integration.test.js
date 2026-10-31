import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../code/server/app.js";
import { prisma } from "../code/server/config/database.js";

describe("Machine Model API - PostgreSQL integration", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a machine model through the API and persists it in PostgreSQL", async () => {
    // Guard against accidentally writing to the development database.
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
      const modelInput = {
        manufacturerId: manufacturer.id,
        modelName: `Integration Test Printer ${randomUUID()}`,
        technology: "UV",
        configuration: "ROLL_TO_ROLL",
        maxRollWidthMm: 3200,
      };

      const response = await request(app)
        .post("/api/v1/machine-models")
        .send(modelInput);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        message: "Machine model created successfully",
        data: {
          manufacturerId: manufacturer.id,
          modelName: modelInput.modelName,
          technology: modelInput.technology,
          configuration: modelInput.configuration,
          maxRollWidthMm: modelInput.maxRollWidthMm,
          manufacturer: {
            id: manufacturer.id,
            name: manufacturer.name,
          },
        },
      });

      const createdModelId = response.body.data.id;
      expect(createdModelId).toBeDefined();

      // Read directly from PostgreSQL to verify persistence independently
      // of the API response.
      const persistedModel = await prisma.machineModel.findUnique({
        where: { id: createdModelId },
      });

      expect(persistedModel).toMatchObject({
        id: createdModelId,
        ...modelInput,
      });
    } finally {
      await prisma.machineModel.deleteMany({
        where: { manufacturerId: manufacturer.id },
      });

      await prisma.manufacturer.delete({
        where: { id: manufacturer.id },
      });
    }
  });
});
