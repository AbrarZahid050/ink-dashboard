import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../code/server/app.js";
import { prisma } from "../code/server/config/database.js";

describe("Ink Product API - PostgreSQL integration", () => {
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

  async function createManufacturerAndInkModel() {
    const manufacturer = await prisma.manufacturer.create({
      data: { name: `Integration Product Manufacturer ${randomUUID()}` },
    });

    const inkModel = await prisma.inkModel.create({
      data: {
        manufacturerId: manufacturer.id,
        inkName: `Integration Product Ink ${randomUUID()}`,
        inkType: "UV",
      },
    });

    return { manufacturer, inkModel };
  }

  async function createInkProduct(inkModelId, overrides = {}) {
    return prisma.inkProduct.create({
      data: {
        inkModelId,
        color: "Cyan",
        packagingType: "BOTTLE",
        capacityMl: 1000,
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

  it("creates an Ink Product through the API and persists it in PostgreSQL", async () => {
    const { manufacturer, inkModel } = await createManufacturerAndInkModel();
    const productCode = `PRODUCT-${randomUUID()}`;

    try {
      const response = await request(app)
        .post("/api/v1/ink-products")
        .send({
          inkModelId: inkModel.id,
          productCode,
          color: " Cyan ",
          packagingType: "BOTTLE",
          capacityMl: 1000,
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        message: "Ink product created successfully",
        data: {
          inkModelId: inkModel.id,
          productCode,
          color: "Cyan",
          packagingType: "BOTTLE",
          capacityMl: 1000,
          version: 0,
          inkModel: {
            id: inkModel.id,
            manufacturer: {
              id: manufacturer.id,
              name: manufacturer.name,
            },
          },
          _count: { lots: 0 },
        },
      });

      const persisted = await prisma.inkProduct.findUnique({
        where: { id: response.body.data.id },
      });

      expect(persisted).toMatchObject({
        id: response.body.data.id,
        inkModelId: inkModel.id,
        productCode,
        color: "Cyan",
        packagingType: "BOTTLE",
        capacityMl: 1000,
        version: 0,
      });
    } finally {
      await cleanupManufacturer(manufacturer.id);
    }
  });

  it("retrieves one Ink Product with its Ink Model and associated lots", async () => {
    const { manufacturer, inkModel } = await createManufacturerAndInkModel();

    try {
      const inkProduct = await createInkProduct(inkModel.id);
      const lot = await prisma.inkLot.create({
        data: {
          inkProductId: inkProduct.id,
          lotNumber: `LOT-${randomUUID()}`,
          expiryDate: new Date("2027-12-31T00:00:00.000Z"),
          quantity: 12,
        },
      });

      const response = await request(app).get(
        `/api/v1/ink-products/${inkProduct.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: inkProduct.id,
          inkModel: {
            id: inkModel.id,
            manufacturer: {
              id: manufacturer.id,
              name: manufacturer.name,
            },
          },
          lots: [
            expect.objectContaining({
              id: lot.id,
              lotNumber: lot.lotNumber,
              quantity: 12,
            }),
          ],
        },
      });
    } finally {
      await cleanupManufacturer(manufacturer.id);
    }
  });

  it("lists Ink Products with their Ink Model and lot counts", async () => {
    const { manufacturer, inkModel } = await createManufacturerAndInkModel();

    try {
      const inkProduct = await createInkProduct(inkModel.id);
      await prisma.inkLot.create({
        data: {
          inkProductId: inkProduct.id,
          lotNumber: `LIST-${randomUUID()}`,
          expiryDate: new Date("2028-06-30T00:00:00.000Z"),
        },
      });

      const response = await request(app).get("/api/v1/ink-products");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(response.body.data.length);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: inkProduct.id,
            inkModel: expect.objectContaining({
              id: inkModel.id,
              manufacturer: expect.objectContaining({
                id: manufacturer.id,
                name: manufacturer.name,
              }),
            }),
            _count: { lots: 1 },
          }),
        ]),
      );
    } finally {
      await cleanupManufacturer(manufacturer.id);
    }
  });

  it("updates an Ink Product and increments its version", async () => {
    const { manufacturer, inkModel } = await createManufacturerAndInkModel();

    try {
      const inkProduct = await createInkProduct(inkModel.id);
      const response = await request(app)
        .patch(`/api/v1/ink-products/${inkProduct.id}`)
        .send({ version: 0, color: "Magenta", capacityMl: 2000 });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: "Ink product updated successfully",
        data: {
          id: inkProduct.id,
          color: "Magenta",
          capacityMl: 2000,
          version: 1,
        },
      });

      const persisted = await prisma.inkProduct.findUnique({
        where: { id: inkProduct.id },
      });
      expect(persisted).toMatchObject({
        color: "Magenta",
        capacityMl: 2000,
        version: 1,
      });
    } finally {
      await cleanupManufacturer(manufacturer.id);
    }
  });

  it("rejects a stale OCC update and preserves the latest data", async () => {
    const { manufacturer, inkModel } = await createManufacturerAndInkModel();

    try {
      const inkProduct = await createInkProduct(inkModel.id);
      const firstUpdate = await request(app)
        .patch(`/api/v1/ink-products/${inkProduct.id}`)
        .send({ version: 0, color: "Yellow" });

      expect(firstUpdate.status).toBe(200);
      expect(firstUpdate.body.data.version).toBe(1);

      const staleUpdate = await request(app)
        .patch(`/api/v1/ink-products/${inkProduct.id}`)
        .send({ version: 0, color: "Black" });

      expect(staleUpdate.status).toBe(409);
      expect(staleUpdate.body.message).toBe(
        "Ink product was modified by another user. Please retrieve the latest version and try again.",
      );

      const persisted = await prisma.inkProduct.findUnique({
        where: { id: inkProduct.id },
      });
      expect(persisted).toMatchObject({ color: "Yellow", version: 1 });
    } finally {
      await cleanupManufacturer(manufacturer.id);
    }
  });

  it("rejects duplicate product codes", async () => {
    const { manufacturer, inkModel } = await createManufacturerAndInkModel();
    const productCode = `DUPLICATE-${randomUUID()}`;

    try {
      await createInkProduct(inkModel.id, { productCode });

      const response = await request(app)
        .post("/api/v1/ink-products")
        .send({
          inkModelId: inkModel.id,
          productCode,
          color: "Black",
          packagingType: "POUCH",
          capacityMl: 1000,
        });

      expect(response.status).toBe(409);
    } finally {
      await cleanupManufacturer(manufacturer.id);
    }
  });

  it("rejects invalid Ink Product input", async () => {
    const response = await request(app)
      .post("/api/v1/ink-products")
      .send({
        inkModelId: "not-a-uuid",
        color: " ",
        packagingType: "INVALID",
        capacityMl: 0,
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: "Validation failed",
    });
  });

  it("deletes an Ink Product without lots", async () => {
    const { manufacturer, inkModel } = await createManufacturerAndInkModel();

    try {
      const inkProduct = await createInkProduct(inkModel.id);
      const response = await request(app).delete(
        `/api/v1/ink-products/${inkProduct.id}`,
      );

      expect(response.status).toBe(204);

      const deleted = await prisma.inkProduct.findUnique({
        where: { id: inkProduct.id },
      });
      expect(deleted).toBeNull();
    } finally {
      await cleanupManufacturer(manufacturer.id);
    }
  });

  it("prevents deleting an Ink Product that has associated lots", async () => {
    const { manufacturer, inkModel } = await createManufacturerAndInkModel();

    try {
      const inkProduct = await createInkProduct(inkModel.id);
      await prisma.inkLot.create({
        data: {
          inkProductId: inkProduct.id,
          lotNumber: `PROTECTED-${randomUUID()}`,
          expiryDate: new Date("2028-12-31T00:00:00.000Z"),
        },
      });

      const response = await request(app).delete(
        `/api/v1/ink-products/${inkProduct.id}`,
      );

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "Ink product cannot be deleted while it has associated lots.",
      );

      const persisted = await prisma.inkProduct.findUnique({
        where: { id: inkProduct.id },
      });
      expect(persisted).not.toBeNull();
    } finally {
      await cleanupManufacturer(manufacturer.id);
    }
  });

  it("returns 404 when retrieving an Ink Product that does not exist", async () => {
    const response = await request(app).get(
      `/api/v1/ink-products/${randomUUID()}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      message: "Ink product not found",
    });
  });
});
