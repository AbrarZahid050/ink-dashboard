import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Create the PostgreSQL adapter using the connection string
// configured in the project's .env file.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Export one shared Prisma Client instance for the application.
// Other modules can import this instead of creating new clients.
export const prisma = new PrismaClient({ adapter });
