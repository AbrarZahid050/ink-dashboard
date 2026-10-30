import express from "express";
import apiRoutes from "./routes/index.js";
import { prisma } from "./config/database.js";
import pinoHttp from "pino-http";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// Log incoming HTTP requests and their responses.
app.use(pinoHttp({ logger }));

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Ink Dashboard API is running!",
  });
});

// API entry point
app.use("/api/v1", apiRoutes);

// Error-handling middleware must be last.
app.use(errorHandler);

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
