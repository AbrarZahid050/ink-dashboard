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

  it("retrieves an existing machine model by ID with its manufacturer", async () => {
    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: `Integration Retrieval Manufacturer ${randomUUID()}`,
      },
    });

    let machineModel;

    try {
      machineModel = await prisma.machineModel.create({
        data: {
          manufacturerId: manufacturer.id,
          modelName: `Integration Retrieval Printer ${randomUUID()}`,
          technology: "UV",
          configuration: "ROLL_TO_ROLL",
          maxRollWidthMm: 3200,
        },
      });

      const response = await request(app).get(
        `/api/v1/machine-models/${machineModel.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: machineModel.id,
          manufacturerId: manufacturer.id,
          modelName: machineModel.modelName,
          technology: "UV",
          configuration: "ROLL_TO_ROLL",
          maxRollWidthMm: 3200,
          manufacturer: {
            id: manufacturer.id,
            name: manufacturer.name,
          },
          _count: {
            machines: 0,
          },
        },
      });
    } finally {
      if (machineModel) {
        await prisma.machineModel.delete({
          where: { id: machineModel.id },
        });
      }

      await prisma.manufacturer.delete({
        where: { id: manufacturer.id },
      });
    }
  });
});
