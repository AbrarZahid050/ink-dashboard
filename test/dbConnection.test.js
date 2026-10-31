import { describe, it, expect, afterAll } from "vitest";
import { testPrisma } from "../code/server/config/testDatabase.js";

describe("PostgreSQL test database connection", () => {
  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("should connect to ink_dashboard_test", async () => {
    const result = await testPrisma.$queryRaw`
      SELECT current_database() AS database
    `;

    expect(result[0].database).toBe("ink_dashboard_test");
  });
});
