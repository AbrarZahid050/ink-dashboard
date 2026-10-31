import express from "express";
import apiRoutes from "./routes/index.js";
import pinoHttp from "pino-http";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

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

export default app;
