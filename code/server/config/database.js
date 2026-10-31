import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const isTestEnvironment = process.env.NODE_ENV === "test";

// Select the database explicitly. Tests must never fall back to DATABASE_URL.
const connectionString = isTestEnvironment
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    isTestEnvironment
      ? "TEST_DATABASE_URL is not configured."
      : "DATABASE_URL is not configured.",
  );
}

// Guard the test environment against accidental writes to another database.
if (isTestEnvironment) {
  const databaseName = decodeURIComponent(
    new URL(connectionString).pathname.slice(1),
  );

  if (databaseName !== "ink_dashboard_test") {
    throw new Error(
      `Refusing to run tests against unexpected database: ${databaseName}`,
    );
  }
}

const adapter = new PrismaPg({ connectionString });

// One shared Prisma Client for application services.
export const prisma = new PrismaClient({ adapter });
