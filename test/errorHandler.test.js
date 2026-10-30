import { describe, it, expect, vi } from "vitest";
import { errorHandler } from "../code/server/middleware/errorHandler.js";

describe("Error handler middleware", () => {
  it("should delegate errors when response headers have already been sent", () => {
    const error = new Error("Response already started");
    const req = {
      method: "GET",
      originalUrl: "/api/v1/machine-models",
    };
    const res = {
      headersSent: true,
      status: vi.fn(),
      json: vi.fn(),
    };
    const next = vi.fn();

    errorHandler(error, req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
