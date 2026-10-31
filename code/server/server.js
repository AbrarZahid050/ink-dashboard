import app from "./app.js";
import { prisma } from "./config/database.js";
import { logger } from "./config/logger.js";

const PORT = process.env.PORT || 3000;

// Start the HTTP server.
const server = app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
});

server.on("error", (error) => {
  logger.error({ err: error }, "HTTP server error");
});

// Gracefully shut down the HTTP server and database connection.
async function shutdown(signal) {
  logger.info(`${signal} received. Shutting down...`);

  server.close(async (error) => {
    if (error) {
      logger.error({ err: error }, "Error closing HTTP server");
      process.exitCode = 1;
    }

    try {
      await prisma.$disconnect();
      logger.info("Database connections closed.");
    } catch (disconnectError) {
      logger.error({ err: disconnectError }, "Error disconnecting Prisma");
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
