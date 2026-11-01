import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../code/server/app.js";
import { prisma } from "../code/server/config/database.js";

describe("Ink Model API - PostgreSQL integration", () => {
  beforeAll(async () => {
    // Guard against accidentally writing to the development database.
    const database = await prisma.$queryRaw`
      SELECT current_database() AS name
    `;

    expect(database[0].name).toBe("ink_dashboard_test");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createManufacturer() {
    return prisma.manufacturer.create({
      data: { name: `Integration Ink Manufacturer ${randomUUID()}` },
    });
  }

  async function createInkModel(manufacturerId, inkName) {
    return prisma.inkModel.create({
      data: {
        manufacturerId,
        inkName: inkName ?? `Integration UV Ink ${randomUUID()}`,
        inkType: "UV",
        notes: "Integration test record",
      },
    });
  }

  it("creates an Ink Model through the API and persists it in PostgreSQL", async () => {
    const manufacturer = await createManufacturer();
    const inkName = `Integration Create Ink ${randomUUID()}`;

    try {
      const response = await request(app)
        .post("/api/v1/ink-models")
        .send({
          manufacturerId: manufacturer.id,
          inkName,
          inkType: "UV",
          notes: "Created through integration test",
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        message: "Ink model created successfully",
        data: {
          manufacturerId: manufacturer.id,
          inkName,
          inkType: "UV",
          version: 0,
          manufacturer: {
            id: manufacturer.id,
            name: manufacturer.name,
          },
          _count: { products: 0 },
        },
      });

      const persisted = await prisma.inkModel.findUnique({
        where: { id: response.body.data.id },
      });

      expect(persisted).toMatchObject({
        id: response.body.data.id,
        manufacturerId: manufacturer.id,
        inkName,
        inkType: "UV",
        version: 0,
      });
    } finally {
      await prisma.inkModel.deleteMany({
        where: { manufacturerId: manufacturer.id },
      });
      await prisma.manufacturer.delete({ where: { id: manufacturer.id } });
    }
  });

  it("retrieves one Ink Model with its manufacturer and products", async () => {
    const manufacturer = await createManufacturer();
    let inkModel;

    try {
      inkModel = await createInkModel(manufacturer.id);

      const response = await request(app).get(
        `/api/v1/ink-models/${inkModel.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: inkModel.id,
          inkName: inkModel.inkName,
          manufacturer: {
            id: manufacturer.id,
            name: manufacturer.name,
          },
          products: [],
        },
      });
    } finally {
      await prisma.inkModel.deleteMany({
        where: { manufacturerId: manufacturer.id },
      });
      await prisma.manufacturer.delete({ where: { id: manufacturer.id } });
    }
  });

  it("lists Ink Models and includes their manufacturer relationship", async () => {
    const manufacturer = await createManufacturer();

    try {
      const inkModel = await createInkModel(manufacturer.id);
      const response = await request(app).get("/api/v1/ink-models");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(response.body.data.length);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: inkModel.id,
            manufacturer: expect.objectContaining({
              id: manufacturer.id,
              name: manufacturer.name,
            }),
          }),
        ]),
      );
    } finally {
      await prisma.inkModel.deleteMany({
        where: { manufacturerId: manufacturer.id },
      });
      await prisma.manufacturer.delete({ where: { id: manufacturer.id } });
    }
  });

  it("updates an Ink Model and increments its version", async () => {
    const manufacturer = await createManufacturer();

    try {
      const inkModel = await createInkModel(manufacturer.id);
      const notes = "Updated by integration test";

      const response = await request(app)
        .patch(`/api/v1/ink-models/${inkModel.id}`)
        .send({ version: 0, notes });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: "Ink model updated successfully",
        data: { id: inkModel.id, notes, version: 1 },
      });

      const persisted = await prisma.inkModel.findUnique({
        where: { id: inkModel.id },
      });
      expect(persisted).toMatchObject({ notes, version: 1 });
    } finally {
      await prisma.inkModel.deleteMany({
        where: { manufacturerId: manufacturer.id },
      });
      await prisma.manufacturer.delete({ where: { id: manufacturer.id } });
    }
  });

  it("rejects a stale OCC update and preserves the latest data", async () => {
    const manufacturer = await createManufacturer();

    try {
      const inkModel = await createInkModel(manufacturer.id);
      const firstNotes = "Latest saved notes";

      const firstUpdate = await request(app)
        .patch(`/api/v1/ink-models/${inkModel.id}`)
        .send({ version: 0, notes: firstNotes });

      expect(firstUpdate.status).toBe(200);
      expect(firstUpdate.body.data.version).toBe(1);

      const staleUpdate = await request(app)
        .patch(`/api/v1/ink-models/${inkModel.id}`)
        .send({ version: 0, notes: "Stale overwrite attempt" });

      expect(staleUpdate.status).toBe(409);
      expect(staleUpdate.body.message).toBe(
        "Ink model was modified by another user. Please retrieve the latest version and try again.",
      );

      const persisted = await prisma.inkModel.findUnique({
        where: { id: inkModel.id },
      });

      expect(persisted).toMatchObject({
        notes: firstNotes,
        version: 1,
      });
    } finally {
      await prisma.inkModel.deleteMany({
        where: { manufacturerId: manufacturer.id },
      });
      await prisma.manufacturer.delete({ where: { id: manufacturer.id } });
    }
  });

  it("rejects duplicate Ink Model names for the same manufacturer", async () => {
    const manufacturer = await createManufacturer();
    const inkName = `Duplicate Ink ${randomUUID()}`;

    try {
      await createInkModel(manufacturer.id, inkName);

      const response = await request(app)
        .post("/api/v1/ink-models")
        .send({
          manufacturerId: manufacturer.id,
          inkName,
          inkType: "UV",
        });

      expect(response.status).toBe(409);
    } finally {
      await prisma.inkModel.deleteMany({
        where: { manufacturerId: manufacturer.id },
      });
      await prisma.manufacturer.delete({ where: { id: manufacturer.id } });
    }
  });

  it("rejects invalid Ink Model input", async () => {
    const response = await request(app)
      .post("/api/v1/ink-models")
      .send({
        manufacturerId: "not-a-uuid",
        inkName: "",
        inkType: "INVALID",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: "Validation failed",
    });
  });

  it("deletes an Ink Model through the API and removes it from PostgreSQL", async () => {
    const manufacturer = await createManufacturer();

    try {
      const inkModel = await createInkModel(manufacturer.id);

      const response = await request(app).delete(
        `/api/v1/ink-models/${inkModel.id}`,
      );

      expect(response.status).toBe(204);

      const deleted = await prisma.inkModel.findUnique({
        where: { id: inkModel.id },
      });
      expect(deleted).toBeNull();
    } finally {
      await prisma.inkModel.deleteMany({
        where: { manufacturerId: manufacturer.id },
      });
      await prisma.manufacturer.delete({ where: { id: manufacturer.id } });
    }
  });

  it("returns 404 when retrieving an Ink Model that does not exist", async () => {
    const nonexistentId = randomUUID();

    const response = await request(app).get(
      `/api/v1/ink-models/${nonexistentId}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      message: "Ink model not found",
    });
  });
});
