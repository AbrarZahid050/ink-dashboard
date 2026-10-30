import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../code/server/app.js";

describe("GET /", () => {
  it("should return the API running message", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Ink Dashboard API is running!",
    });
  });
});

describe("GET /unknown-route", () => {
  it("should return 404 for a route that does not exist", async () => {
    const response = await request(app).get("/unknown-route");

    expect(response.status).toBe(404);
  });
});
