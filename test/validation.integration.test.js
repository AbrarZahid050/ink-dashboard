import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../code/server/app.js";
import { prisma } from "../code/server/config/database.js";
import { testPrisma } from "../code/server/config/testDatabase.js";

describe("API request validation integration tests", () => {
  afterAll(async () => {
    await Promise.all([prisma.$disconnect(), testPrisma.$disconnect()]);
  });

  function expectValidationError(response, expectedFields = []) {
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: "Validation failed",
    });
    expect(response.body.errors).toEqual(
      expect.arrayContaining(
        expectedFields.map((field) => expect.objectContaining({ field })),
      ),
    );
  }

  it("should reject a manufacturer with a blank name", async () => {
    const response = await request(app)
      .post("/api/v1/manufacturers")
      .send({ name: "   " });

    expectValidationError(response, ["name"]);
  });

  it("should reject unknown manufacturer fields", async () => {
    const response = await request(app)
      .post("/api/v1/manufacturers")
      .send({ name: `Validation Manufacturer ${randomUUID()}`, extra: true });

    expectValidationError(response, [""]);
  });

  it("should reject a customer with a blank name", async () => {
    const response = await request(app)
      .post("/api/v1/customers")
      .send({ name: "" });

    expectValidationError(response, ["name"]);
  });

  it("should reject a customer site with an invalid customer ID and blank name", async () => {
    const response = await request(app)
      .post("/api/v1/customer-sites")
      .send({ customerId: "not-a-uuid", name: " " });

    expectValidationError(response, ["customerId", "name"]);
  });

  it("should reject a machine model with an invalid manufacturer ID and technology", async () => {
    const response = await request(app)
      .post("/api/v1/machine-models")
      .send({
        manufacturerId: "not-a-uuid",
        modelName: "Validation Model",
        technology: "INK",
        configuration: "ROLL_TO_ROLL",
        maxRollWidthMm: 3200,
      });

    expectValidationError(response, ["manufacturerId", "technology"]);
  });

  it("should reject a machine model when its configuration-specific dimension is missing", async () => {
    const response = await request(app)
      .post("/api/v1/machine-models")
      .send({
        manufacturerId: randomUUID(),
        modelName: "Validation Model",
        technology: "UV",
        configuration: "ROLL_TO_ROLL",
      });

    expectValidationError(response, ["maxRollWidthMm"]);
  });

  it("should reject a machine with an invalid installation date and status", async () => {
    const response = await request(app)
      .post("/api/v1/machines")
      .send({
        serialNumber: `VALIDATION-${randomUUID()}`,
        machineModelId: randomUUID(),
        siteId: randomUUID(),
        installationDate: "2026-02-30",
        status: "BROKEN",
      });

    expectValidationError(response, ["installationDate", "status"]);
  });

  it("should reject a manufacturer update with a blank name", async () => {
    const response = await request(app)
      .patch(`/api/v1/manufacturers/${randomUUID()}`)
      .send({ name: " " });

    expectValidationError(response, ["name"]);
  });

  it("should reject a customer update with a blank name", async () => {
    const response = await request(app)
      .patch(`/api/v1/customers/${randomUUID()}`)
      .send({ name: " " });

    expectValidationError(response, ["name"]);
  });

  it("should reject an empty customer site update", async () => {
    const response = await request(app)
      .patch(`/api/v1/customer-sites/${randomUUID()}`)
      .send({});

    expectValidationError(response);
  });

  it("should reject an empty machine model update", async () => {
    const response = await request(app)
      .patch(`/api/v1/machine-models/${randomUUID()}`)
      .send({});

    expectValidationError(response);
  });

  it("should reject an empty machine update", async () => {
    const response = await request(app)
      .patch(`/api/v1/machines/${randomUUID()}`)
      .send({});

    expectValidationError(response);
  });

  it("should reject a malformed resource ID before reaching the controller", async () => {
    const response = await request(app).get(
      "/api/v1/machines/not-a-valid-uuid",
    );

    expectValidationError(response, ["id"]);
  });
});
