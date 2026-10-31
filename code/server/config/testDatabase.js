import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Never fall back to the development database.
const connectionString = process.env.TEST_DATABASE_URL;

if (!connectionString) {
  throw new Error("TEST_DATABASE_URL is not configured.");
}

// Safety check: only allow the dedicated test database.
const databaseUrl = new URL(connectionString);
const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));

if (databaseName !== "ink_dashboard_test") {
  throw new Error(
    `Refusing to connect to unexpected database: ${databaseName}`,
  );
}

// Create a dedicated PostgreSQL adapter.
const adapter = new PrismaPg({
  connectionString,
});

// Create a separate Prisma Client for integration tests.
export const testPrisma = new PrismaClient({ adapter });
