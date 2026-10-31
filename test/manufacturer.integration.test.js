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
      // 1. Create a manufacturer in PostgreSQL.
      const created = await testPrisma.manufacturer.create({
        data: { name },
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe(name);

      // 2. Retrieve the manufacturer from PostgreSQL.
      const found = await testPrisma.manufacturer.findUnique({
        where: { name },
      });

      expect(found).not.toBeNull();
      expect(found.name).toBe(name);
    } finally {
      // 3. Clean up test data.
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
});
