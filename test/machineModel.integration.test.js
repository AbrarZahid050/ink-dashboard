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
          version: 0,
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
        version: 0,
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
          version: 0,
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

  it("lists machine models and includes their manufacturer relationships", async () => {
    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: `Integration List Manufacturer ${randomUUID()}`,
      },
    });

    try {
      const modelsToCreate = [
        {
          modelName: `Integration List Printer A ${randomUUID()}`,
          technology: "UV",
          configuration: "ROLL_TO_ROLL",
          maxRollWidthMm: 3200,
        },
        {
          modelName: `Integration List Printer B ${randomUUID()}`,
          technology: "LATEX",
          configuration: "HYBRID",
          maxRollWidthMm: 2500,
          flatbedWidthMm: 2000,
          flatbedLengthMm: 3000,
        },
      ];

      const createdModels = await Promise.all(
        modelsToCreate.map((model) =>
          prisma.machineModel.create({
            data: {
              ...model,
              manufacturerId: manufacturer.id,
            },
          }),
        ),
      );

      const response = await request(app).get("/api/v1/machine-models");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(response.body.data.length);

      const returnedModels = response.body.data.filter((model) =>
        createdModels.some((created) => created.id === model.id),
      );

      expect(returnedModels).toHaveLength(2);

      for (const createdModel of createdModels) {
        const returnedModel = returnedModels.find(
          (model) => model.id === createdModel.id,
        );

        expect(returnedModel).toMatchObject({
          id: createdModel.id,
          manufacturerId: manufacturer.id,
          modelName: createdModel.modelName,
          technology: createdModel.technology,
          configuration: createdModel.configuration,
          version: 0,
          manufacturer: {
            id: manufacturer.id,
            name: manufacturer.name,
          },
          _count: {
            machines: 0,
          },
        });
      }
    } finally {
      await prisma.machineModel.deleteMany({
        where: { manufacturerId: manufacturer.id },
      });

      await prisma.manufacturer.delete({
        where: { id: manufacturer.id },
      });
    }
  });
  it("updates an existing machine model through the API and persists the changes in PostgreSQL", async () => {
    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: `Integration Update Manufacturer ${randomUUID()}`,
      },
    });

    let machineModel;

    try {
      machineModel = await prisma.machineModel.create({
        data: {
          manufacturerId: manufacturer.id,
          modelName: `Integration Update Printer ${randomUUID()}`,
          technology: "UV",
          configuration: "ROLL_TO_ROLL",
          maxRollWidthMm: 2500,
          notes: "Original integration test notes",
        },
      });

      const updateInput = {
        version: 0,
        modelName: `Updated Integration Printer ${randomUUID()}`,
        maxRollWidthMm: 3200,
        notes: "Updated integration test notes",
      };

      const response = await request(app)
        .patch(`/api/v1/machine-models/${machineModel.id}`)
        .send(updateInput);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: "Machine model updated successfully",
        data: {
          id: machineModel.id,
          manufacturerId: manufacturer.id,
          modelName: updateInput.modelName,
          technology: "UV",
          configuration: "ROLL_TO_ROLL",
          maxRollWidthMm: updateInput.maxRollWidthMm,
          notes: updateInput.notes,
          version: 1,
          manufacturer: {
            id: manufacturer.id,
            name: manufacturer.name,
          },
          _count: {
            machines: 0,
          },
        },
      });

      // Verify the update independently by reading the record from PostgreSQL.
      const persistedModel = await prisma.machineModel.findUnique({
        where: { id: machineModel.id },
      });

      expect(persistedModel).toMatchObject({
        id: machineModel.id,
        manufacturerId: manufacturer.id,
        modelName: updateInput.modelName,
        technology: "UV",
        configuration: "ROLL_TO_ROLL",
        maxRollWidthMm: updateInput.maxRollWidthMm,
        notes: updateInput.notes,
        version: 1,
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

  it("deletes an existing machine model through the API and removes it from PostgreSQL", async () => {
    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: `Integration Delete Manufacturer ${randomUUID()}`,
      },
    });

    let machineModel;

    try {
      machineModel = await prisma.machineModel.create({
        data: {
          manufacturerId: manufacturer.id,
          modelName: `Integration Delete Printer ${randomUUID()}`,
          technology: "UV",
          configuration: "ROLL_TO_ROLL",
          maxRollWidthMm: 3200,
        },
      });

      const response = await request(app).delete(
        `/api/v1/machine-models/${machineModel.id}`,
      );

      expect(response.status).toBe(204);
      expect(response.text).toBe("");

      // Verify directly in PostgreSQL that the record was deleted.
      const deletedModel = await prisma.machineModel.findUnique({
        where: { id: machineModel.id },
      });

      expect(deletedModel).toBeNull();
    } finally {
      // deleteMany is safe whether the API already deleted the model or not.
      if (machineModel) {
        await prisma.machineModel.deleteMany({
          where: { id: machineModel.id },
        });
      }

      await prisma.manufacturer.delete({
        where: { id: manufacturer.id },
      });
    }
  });

  it("returns 400 when an update omits the version", async () => {
    const response = await request(app)
      .patch(`/api/v1/machine-models/${randomUUID()}`)
      .send({ notes: "Updated notes" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "version" }),
      ]),
    );
  });

  it("rejects a stale version and preserves the latest machine model data", async () => {
    const manufacturer = await prisma.manufacturer.create({
      data: { name: `Integration OCC Manufacturer ${randomUUID()}` },
    });

    let machineModel;

    try {
      machineModel = await prisma.machineModel.create({
        data: {
          manufacturerId: manufacturer.id,
          modelName: `Integration OCC Printer ${randomUUID()}`,
          technology: "UV",
          configuration: "ROLL_TO_ROLL",
          maxRollWidthMm: 2500,
          notes: "Original notes",
        },
      });

      const firstUpdate = await request(app)
        .patch(`/api/v1/machine-models/${machineModel.id}`)
        .send({ version: 0, notes: "Latest notes" });

      expect(firstUpdate.status).toBe(200);
      expect(firstUpdate.body.data.version).toBe(1);

      const staleUpdate = await request(app)
        .patch(`/api/v1/machine-models/${machineModel.id}`)
        .send({ version: 0, notes: "Stale overwrite attempt" });

      expect(staleUpdate.status).toBe(409);
      expect(staleUpdate.body).toMatchObject({
        success: false,
        message: "Machine model was modified by another user. Please retrieve the latest version and try again.",
      });

      const persistedModel = await prisma.machineModel.findUnique({
        where: { id: machineModel.id },
      });

      expect(persistedModel).toMatchObject({
        notes: "Latest notes",
        version: 1,
      });
    } finally {
      if (machineModel) {
        await prisma.machineModel.deleteMany({
          where: { id: machineModel.id },
        });
      }
      await prisma.manufacturer.delete({
        where: { id: manufacturer.id },
      });
    }
  });

  it("returns 404 when retrieving a machine model that does not exist", async () => {
    const nonExistentId = randomUUID();

    const response = await request(app).get(
      `/api/v1/machine-models/${nonExistentId}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      message: "Machine model not found",
    });
  });

  it("returns 404 when updating a machine model that does not exist", async () => {
    const nonExistentId = randomUUID();

    const response = await request(app)
      .patch(`/api/v1/machine-models/${nonExistentId}`)
      .send({
        version: 0,
        modelName: "Updated Non-existent Integration Printer",
      });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      message: "Machine model not found",
    });
  });

});
