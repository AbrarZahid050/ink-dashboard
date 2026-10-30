import { prisma } from "./database.js";

try {
  const manufacturers = await prisma.manufacturer.findMany();

  console.log("Database connection successful!");
  console.log("Manufacturers:", manufacturers);
} catch (error) {
  console.error("Database test failed:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
