import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../code/server/app.js";
import { prisma } from "../code/server/config/database.js";

describe("Ink Lot API - PostgreSQL integration", () => {
  beforeAll(async () => {
    // Guard against accidentally writing to the development database.
    const database = await prisma.$queryRaw`
      SELECT current_database() AS name
    `;

    expect(database[0].name).toBe("ink_dashboard_test");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createManufacturerAndInkProduct() {
    const manufacturer = await prisma.manufacturer.create({
      data: { name: `Integration Lot Manufacturer ${randomUUID()}` },
    });

    const inkModel = await prisma.inkModel.create({
      data: {
        manufacturerId: manufacturer.id,
        inkName: `Integration Lot Ink ${randomUUID()}`,
        inkType: "UV",
      },
    });

    const inkProduct = await prisma.inkProduct.create({
      data: {
        inkModelId: inkModel.id,
        color: "Cyan",
        packagingType: "BOTTLE",
        capacityMl: 1000,
      },
    });

    return { manufacturer, inkModel, inkProduct };
  }

  async function createInkLot(inkProductId, overrides = {}) {
    return prisma.inkLot.create({
      data: {
        inkProductId,
        lotNumber: `LOT-${randomUUID()}`,
        expiryDate: new Date("2028-12-31T00:00:00.000Z"),
        quantity: 12,
        ...overrides,
      },
    });
  }

  async function cleanupManufacturer(manufacturerId) {
    const inkModels = await prisma.inkModel.findMany({
      where: { manufacturerId },
      select: { id: true },
    });
    const inkModelIds = inkModels.map((inkModel) => inkModel.id);

    if (inkModelIds.length > 0) {
      await prisma.inkLot.deleteMany({
        where: { inkProduct: { inkModelId: { in: inkModelIds } } },
      });
      await prisma.inkProduct.deleteMany({
        where: { inkModelId: { in: inkModelIds } },
      });
      await prisma.inkModel.deleteMany({
        where: { id: { in: inkModelIds } },
      });
    }

    await prisma.manufacturer.deleteMany({
      where: { id: manufacturerId },
    });
  }

  it("creates an Ink Lot through the API and persists it in PostgreSQL", async () => {
    const { manufacturer, inkProduct } =
      await createManufacturerAndInkProduct();
    const lotNumber = `CREATE-${randomUUID()}`;

    try {
      const response = await request(app)
        .post("/api/v1/ink-lots")
        .send({
          inkProductId: inkProduct.id,
          lotNumber,
          expiryDate: "2028-12-31",
          quantity: 12,
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        message: "Ink lot created successfully",
        data: {
          inkProductId: inkProduct.id,
          lotNumber,
          expiryDate: "2028-12-31T00:00:00.000Z",
          quantity: 12,
          version: 0,
          inkProduct: {
            id: inkProduct.id,
            inkModel: {
              manufacturer: {
                id: manufacturer.id,
                name: manufacturer.name,
              },
            },
          },
        },
      });

      const persisted = await prisma.inkLot.findUnique({
        where: { id: response.body.data.id },
      });

      expect(persisted).toMatchObject({
        id: response.body.data.id,
        inkProductId: inkProduct.id,
        lotNumber,
        quantity: 12,
        version: 0,
      });
      expect(persisted.expiryDate.toISOString()).toBe(
        "2028-12-31T00:00:00.000Z",
      );
    } finally {
      await cleanupManufacturer(manufacturer.id);
    }
  });

  it("retrieves one Ink Lot with its Ink Product, Ink Model and Manufacturer", async () => {
    const { manufacturer, inkModel, inkProduct } =
      await createManufacturerAndInkProduct();

    try {
      const inkLot = await createInkLot(inkProduct.id);
      const response = await request(app).get(
        `/api/v1/ink-lots/${inkLot.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: inkLot.id,
          lotNumber: inkLot.lotNumber,
          inkProduct: {
            id: inkProduct.id,
            inkModel: {
              id: inkModel.id,
              manufacturer: {
                id: manufacturer.id,
                name: manufacturer.name,
              },
            },
          },
        },
      });
    } finally {
      await cleanupManufacturer(manufacturer.id);
    }
  });

  it("lists Ink Lots with their related Ink Product details", async () => {
    const { manufacturer, inkProduct } =
      await createManufacturerAndInkProduct();

    try {
      const inkLot = await createInkLot(inkProduct.id);
      const response = await request(app).get("/api/v1/ink-lots");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(response.body.data.length);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: inkLot.id,
            lotNumber: inkLot.lotNumber,
            inkProduct: expect.objectContaining({
              id: inkProduct.id,
              inkModel: expect.objectContaining({
                manufacturer: expect.objectContaining({
                  id: manufacturer.id,
                  name: manufacturer.name,
                }),
              }),
            }),
          }),
        ]),
      );
    } finally {
      await cleanupManufacturer(manufacturer.id);
    }
  });

  it("updates an Ink Lot and increments its version", async () => {
    const { manufacturer, inkProduct } =
      await createManufacturerAndInkProduct();

    try {
      const inkLot = await createInkLot(inkProduct.id);
      const response = await request(app)
        .patch(`/api/v1/ink-lots/${inkLot.id}`)
        .send({ version: 0, quantity: 18, expiryDate: "2029-06-30" });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: "Ink lot updated successfully",
        data: {
          id: inkLot.id,
          quantity: 18,
          expiryDate: "2029-06-30T00:00:00.000Z",
          version: 1,
        },
      });

      const persisted = await prisma.inkLot.findUnique({
        where: { id: inkLot.id },
      });
      expect(persisted).toMatchObject({ quantity: 18, version: 1 });
      expect(persisted.expiryDate.toISOString()).toBe(
        "2029-06-30T00:00:00.000Z",
      );
    } finally {
      await cleanupManufacturer(manufacturer.id);
    }
  });

  it("rejects a stale OCC update and preserves the latest data", async () => {
    const { manufacturer, inkProduct } =
      await createManufacturerAndInkProduct();

    try {
      const inkLot = await createInkLot(inkProduct.id);
      const firstUpdate = await request(app)
        .patch(`/api/v1/ink-lots/${inkLot.id}`)
        .send({ version: 0, quantity: 20 });

      expect(firstUpdate.status).toBe(200);
      expect(firstUpdate.body.data.version).toBe(1);

      const staleUpdate = await request(app)
        .patch(`/api/v1/ink-lots/${inkLot.id}`)
        .send({ version: 0, quantity: 4 });

      expect(staleUpdate.status).toBe(409);
      expect(staleUpdate.body.message).toBe(
        "Ink lot was modified by another user. Please retrieve the latest version and try again.",
      );

      const persisted = await prisma.inkLot.findUnique({
        where: { id: inkLot.id },
      });
      expect(persisted).toMatchObject({ quantity: 20, version: 1 });
    } finally {
      await cleanupManufacturer(manufacturer.id);
    }
  });

  it("rejects duplicate lot numbers for the same Ink Product", async () => {
    const { manufacturer, inkProduct } =
      await createManufacturerAndInkProduct();
    const lotNumber = `DUPLICATE-${randomUUID()}`;

    try {
      await createInkLot(inkProduct.id, { lotNumber });

      const response = await request(app)
        .post("/api/v1/ink-lots")
        .send({
          inkProductId: inkProduct.id,
          lotNumber,
          expiryDate: "2028-12-31",
          quantity: 3,
        });

      expect(response.status).toBe(409);
    } finally {
      await cleanupManufacturer(manufacturer.id);
    }
  });

  it("rejects invalid Ink Lot input", async () => {
    const response = await request(app)
      .post("/api/v1/ink-lots")
      .send({
        inkProductId: "not-a-uuid",
        lotNumber: " ",
        expiryDate: "not-a-date",
        quantity: -1,
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: "Validation failed",
    });
  });

  it("deletes an Ink Lot", async () => {
    const { manufacturer, inkProduct } =
      await createManufacturerAndInkProduct();

    try {
      const inkLot = await createInkLot(inkProduct.id);
      const response = await request(app).delete(
        `/api/v1/ink-lots/${inkLot.id}`,
      );

      expect(response.status).toBe(204);

      const deleted = await prisma.inkLot.findUnique({
        where: { id: inkLot.id },
      });
      expect(deleted).toBeNull();
    } finally {
      await cleanupManufacturer(manufacturer.id);
    }
  });

  it("returns 404 when retrieving an Ink Lot that does not exist", async () => {
    const response = await request(app).get(
      `/api/v1/ink-lots/${randomUUID()}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      message: "Ink lot not found",
    });
  });
});
