import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pinoMock } = vi.hoisted(() => ({
  pinoMock: vi.fn(() => ({ logger: true })),
}));

vi.mock("pino", () => ({
  default: pinoMock,
}));

describe("logger configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    pinoMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses JSON logging in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("LOG_LEVEL", "warn");

    await import("../code/server/config/logger.js");

    expect(pinoMock).toHaveBeenCalledWith({
      level: "warn",
    });
  });

  it("uses pretty logging in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("LOG_LEVEL", "debug");

    await import("../code/server/config/logger.js");

    expect(pinoMock).toHaveBeenCalledWith({
      level: "debug",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    });
  });
});
