import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../code/server/app.js";
import { prisma } from "../code/server/config/database.js";
import { testPrisma } from "../code/server/config/testDatabase.js";

describe("Manufacturer PostgreSQL integration tests", () => {
  afterAll(async () => {
    await Promise.all([prisma.$disconnect(), testPrisma.$disconnect()]);
  });

  it("should create and retrieve a manufacturer", async () => {
    const name = `Test Manufacturer ${randomUUID()}`;

    try {
      const created = await testPrisma.manufacturer.create({
        data: { name },
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe(name);

      const found = await testPrisma.manufacturer.findUnique({
        where: { name },
      });

      expect(found).not.toBeNull();
      expect(found.name).toBe(name);
    } finally {
      await testPrisma.manufacturer.deleteMany({
        where: { name },
      });
    }
  });

  it("should retrieve a manufacturer by ID through the API", async () => {
    const manufacturer = await testPrisma.manufacturer.create({
      data: {
        name: `Integration API Manufacturer ${randomUUID()}`,
      },
    });

    try {
      const response = await request(app).get(
        `/api/v1/manufacturers/${manufacturer.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: manufacturer.id,
          name: manufacturer.name,
        },
      });
    } finally {
      await testPrisma.manufacturer.delete({
        where: { id: manufacturer.id },
      });
    }
  });

  it("should retrieve all manufacturers through the API", async () => {
    const manufacturers = await testPrisma.manufacturer.createManyAndReturn({
      data: [
        { name: `Integration List Manufacturer A ${randomUUID()}` },
        { name: `Integration List Manufacturer B ${randomUUID()}` },
      ],
    });

    try {
      const response = await request(app).get("/api/v1/manufacturers");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(response.body.data.length);

      const returnedIds = response.body.data.map((item) => item.id);
      for (const manufacturer of manufacturers) {
        expect(returnedIds).toContain(manufacturer.id);
      }
    } finally {
      await testPrisma.manufacturer.deleteMany({
        where: {
          id: { in: manufacturers.map((item) => item.id) },
        },
      });
    }
  });

  it("should update a manufacturer through the API and persist the change", async () => {
    const manufacturer = await testPrisma.manufacturer.create({
      data: {
        name: `Integration Update Manufacturer ${randomUUID()}`,
      },
    });
    const updatedName = `Updated Manufacturer ${randomUUID()}`;

    try {
      const response = await request(app)
        .patch(`/api/v1/manufacturers/${manufacturer.id}`)
        .send({ name: updatedName, version: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: "Manufacturer updated successfully",
        data: {
          id: manufacturer.id,
          name: updatedName,
          version: 1,
        },
      });

      const persisted = await testPrisma.manufacturer.findUnique({
        where: { id: manufacturer.id },
      });
      expect(persisted.name).toBe(updatedName);
      expect(persisted.version).toBe(1);
    } finally {
      await testPrisma.manufacturer.deleteMany({
        where: { id: manufacturer.id },
      });
    }
  });


  it("should reject a manufacturer update when version is missing", async () => {
    const response = await request(app)
      .patch(`/api/v1/manufacturers/${randomUUID()}`)
      .send({ name: `Missing Version ${randomUUID()}` });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "version" })]),
    );
  });

  it("should return 409 when updating a manufacturer with a stale version", async () => {
    const manufacturer = await testPrisma.manufacturer.create({
      data: { name: `Integration OCC Manufacturer ${randomUUID()}` },
    });

    try {
      const firstUpdate = await request(app)
        .patch(`/api/v1/manufacturers/${manufacturer.id}`)
        .send({ name: `First Update ${randomUUID()}`, version: 0 });

      expect(firstUpdate.status).toBe(200);
      expect(firstUpdate.body.data.version).toBe(1);

      const staleUpdate = await request(app)
        .patch(`/api/v1/manufacturers/${manufacturer.id}`)
        .send({ name: `Stale Update ${randomUUID()}`, version: 0 });

      expect(staleUpdate.status).toBe(409);
      expect(staleUpdate.body.message).toBe(
        "Manufacturer was modified by another user. Please retrieve the latest version and try again.",
      );

      const persisted = await testPrisma.manufacturer.findUnique({
        where: { id: manufacturer.id },
      });
      expect(persisted.version).toBe(1);
      expect(persisted.name).toBe(firstUpdate.body.data.name);
    } finally {
      await testPrisma.manufacturer.deleteMany({
        where: { id: manufacturer.id },
      });
    }
  });

  it("should delete a manufacturer through the API and remove it from PostgreSQL", async () => {
    const manufacturer = await testPrisma.manufacturer.create({
      data: {
        name: `Integration Delete Manufacturer ${randomUUID()}`,
      },
    });

    const response = await request(app).delete(
      `/api/v1/manufacturers/${manufacturer.id}`,
    );

    expect(response.status).toBe(204);

    const deleted = await testPrisma.manufacturer.findUnique({
      where: { id: manufacturer.id },
    });
    expect(deleted).toBeNull();
  });

  it("should return 404 when retrieving a nonexistent manufacturer", async () => {
    const nonexistentId = randomUUID();

    const response = await request(app).get(
      `/api/v1/manufacturers/${nonexistentId}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      message: "Manufacturer not found",
    });
  });

  it("should return 404 when updating a nonexistent manufacturer", async () => {
    const nonexistentId = randomUUID();

    const response = await request(app)
      .patch(`/api/v1/manufacturers/${nonexistentId}`)
      .send({ name: `Missing Manufacturer ${randomUUID()}`, version: 0 });

    expect(response.status).toBe(404);
  });
});
