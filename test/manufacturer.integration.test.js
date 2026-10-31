import { describe, it, expect, afterAll } from "vitest";
import { testPrisma } from "../code/server/config/testDatabase.js";
import { randomUUID } from "node:crypto";

describe("Manufacturer PostgreSQL integration tests", () => {
  afterAll(async () => {
    await testPrisma.$disconnect();
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
});
