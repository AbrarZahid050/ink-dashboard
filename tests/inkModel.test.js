import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../code/server/app.js";
import { prisma } from "../code/server/config/database.js";

describe("Ink Model API integration", () => {
  let manufacturer;

  beforeAll(async () => {
    manufacturer = await prisma.manufacturer.create({
      data: {
        name: `Vitest Ink Model Manufacturer ${randomUUID()}`,
      },
    });
  });

  afterAll(async () => {
    try {
      if (manufacturer) {
        // Remove only records owned by this test's unique manufacturer.
        await prisma.inkModel.deleteMany({
          where: { manufacturerId: manufacturer.id },
        });

        await prisma.manufacturer.delete({
          where: { id: manufacturer.id },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  async function createInkModel(inkName = `TEST-UV-${randomUUID()}`) {
    const response = await request(app)
      .post("/api/v1/ink-models")
      .send({
        manufacturerId: manufacturer.id,
        inkName,
        inkType: "UV",
        notes: "Created by automated integration test",
      });

    expect(response.status).toBe(201);
    return response.body.data;
  }

  it("creates an ink model with version zero", async () => {
    const inkModel = await createInkModel();

    expect(inkModel).toMatchObject({
      manufacturerId: manufacturer.id,
      inkType: "UV",
      version: 0,
      manufacturer: {
        id: manufacturer.id,
      },
      _count: {
        products: 0,
      },
    });
  });

  it("lists ink models and returns manufacturer and products on detail", async () => {
    const created = await createInkModel();

    const listResponse = await request(app).get("/api/v1/ink-models");

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: created.id }),
      ]),
    );

    const detailResponse = await request(app).get(
      `/api/v1/ink-models/${created.id}`,
    );

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data).toMatchObject({
      id: created.id,
      manufacturer: {
        id: manufacturer.id,
      },
      products: [],
    });
  });

  it("increments the version after a successful update", async () => {
    const created = await createInkModel();

    const response = await request(app)
      .patch(`/api/v1/ink-models/${created.id}`)
      .send({
        version: 0,
        notes: "Updated by automated integration test",
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: created.id,
      version: 1,
      notes: "Updated by automated integration test",
    });
  });

  it("rejects an update that uses a stale version", async () => {
    const created = await createInkModel();

    const firstUpdate = await request(app)
      .patch(`/api/v1/ink-models/${created.id}`)
      .send({
        version: 0,
        notes: "The current saved value",
      });

    expect(firstUpdate.status).toBe(200);
    expect(firstUpdate.body.data.version).toBe(1);

    const staleUpdate = await request(app)
      .patch(`/api/v1/ink-models/${created.id}`)
      .send({
        version: 0,
        notes: "This stale value must not be saved",
      });

    expect(staleUpdate.status).toBe(409);

    const detailResponse = await request(app).get(
      `/api/v1/ink-models/${created.id}`,
    );

    expect(detailResponse.body.data).toMatchObject({
      version: 1,
      notes: "The current saved value",
    });
  });

  it("rejects a duplicate ink name for the same manufacturer", async () => {
    const inkName = `DUPLICATE-UV-${randomUUID()}`;
    await createInkModel(inkName);

    const duplicateResponse = await request(app)
      .post("/api/v1/ink-models")
      .send({
        manufacturerId: manufacturer.id,
        inkName,
        inkType: "UV",
      });

    expect(duplicateResponse.status).toBe(409);
  });

  it("rejects invalid input", async () => {
    const response = await request(app)
      .post("/api/v1/ink-models")
      .send({
        manufacturerId: "not-a-uuid",
        inkName: "",
        inkType: "INVALID",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
  });

  it("deletes an ink model and returns 404 when it is requested again", async () => {
    const created = await createInkModel();

    const deleteResponse = await request(app).delete(
      `/api/v1/ink-models/${created.id}`,
    );

    expect(deleteResponse.status).toBe(204);

    const detailResponse = await request(app).get(
      `/api/v1/ink-models/${created.id}`,
    );

    expect(detailResponse.status).toBe(404);
    expect(detailResponse.body.message).toBe("Ink model not found");
  });
});
