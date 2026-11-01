import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../code/server/app.js";
import { prisma } from "../code/server/config/database.js";
import { testPrisma } from "../code/server/config/testDatabase.js";

describe("Ink Purchase API - PostgreSQL integration", () => {
  afterAll(async () => {
    await Promise.all([prisma.$disconnect(), testPrisma.$disconnect()]);
  });

  async function createDependencies() {
    const suffix = randomUUID();

    const manufacturer = await testPrisma.manufacturer.create({
      data: { name: `Integration Purchase Manufacturer ${suffix}` },
    });

    const machineModel = await testPrisma.machineModel.create({
      data: {
        manufacturerId: manufacturer.id,
        modelName: `Integration Purchase Machine ${suffix}`,
        technology: "UV",
        configuration: "ROLL_TO_ROLL",
        maxRollWidthMm: 1600,
      },
    });

    const customer = await testPrisma.customer.create({
      data: { name: `Integration Purchase Customer ${suffix}` },
    });

    const otherCustomer = await testPrisma.customer.create({
      data: { name: `Integration Other Customer ${suffix}` },
    });

    const site = await testPrisma.customerSite.create({
      data: {
        customerId: customer.id,
        name: `Integration Purchase Site ${suffix}`,
      },
    });

    const otherSite = await testPrisma.customerSite.create({
      data: {
        customerId: otherCustomer.id,
        name: `Integration Other Site ${suffix}`,
      },
    });

    const machineOne = await testPrisma.machine.create({
      data: {
        serialNumber: `PURCHASE-ONE-${suffix}`,
        machineModelId: machineModel.id,
        siteId: site.id,
        installationDate: new Date("2024-01-01T00:00:00.000Z"),
      },
    });

    const machineTwo = await testPrisma.machine.create({
      data: {
        serialNumber: `PURCHASE-TWO-${suffix}`,
        machineModelId: machineModel.id,
        siteId: site.id,
        installationDate: new Date("2024-02-01T00:00:00.000Z"),
      },
    });

    const otherMachine = await testPrisma.machine.create({
      data: {
        serialNumber: `PURCHASE-OTHER-${suffix}`,
        machineModelId: machineModel.id,
        siteId: otherSite.id,
        installationDate: new Date("2024-03-01T00:00:00.000Z"),
      },
    });

    const inkModel = await testPrisma.inkModel.create({
      data: {
        manufacturerId: manufacturer.id,
        inkName: `Integration Purchase Ink ${suffix}`,
        inkType: "UV",
      },
    });

    const inkProduct = await testPrisma.inkProduct.create({
      data: {
        inkModelId: inkModel.id,
        color: "Cyan",
        packagingType: "BOTTLE",
        capacityMl: 1000,
      },
    });

    const inkProductTwo = await testPrisma.inkProduct.create({
      data: {
        inkModelId: inkModel.id,
        color: "Magenta",
        packagingType: "BOTTLE",
        capacityMl: 1000,
      },
    });

    return {
      manufacturer,
      machineModel,
      customer,
      otherCustomer,
      site,
      otherSite,
      machineOne,
      machineTwo,
      otherMachine,
      inkModel,
      inkProduct,
      inkProductTwo,
    };
  }

  async function cleanupDependencies(dependencies) {
    const {
      manufacturer,
      machineModel,
      customer,
      otherCustomer,
      site,
      otherSite,
      machineOne,
      machineTwo,
      otherMachine,
      inkModel,
      inkProduct,
      inkProductTwo,
    } = dependencies;

    const purchases = await testPrisma.inkPurchase.findMany({
      where: {
        customerId: { in: [customer.id, otherCustomer.id] },
      },
      select: { id: true },
    });
    const purchaseIds = purchases.map((purchase) => purchase.id);

    if (purchaseIds.length > 0) {
      await testPrisma.inkPurchaseItem.deleteMany({
        where: { inkPurchaseId: { in: purchaseIds } },
      });
      await testPrisma.inkPurchase.deleteMany({
        where: { id: { in: purchaseIds } },
      });
    }

    await testPrisma.machine.deleteMany({
      where: {
        id: {
          in: [machineOne.id, machineTwo.id, otherMachine.id],
        },
      },
    });
    await testPrisma.customerSite.deleteMany({
      where: { id: { in: [site.id, otherSite.id] } },
    });
    await testPrisma.customer.deleteMany({
      where: { id: { in: [customer.id, otherCustomer.id] } },
    });
    await testPrisma.inkProduct.deleteMany({
      where: { id: { in: [inkProduct.id, inkProductTwo.id] } },
    });
    await testPrisma.inkModel.deleteMany({
      where: { id: inkModel.id },
    });
    await testPrisma.machineModel.deleteMany({
      where: { id: machineModel.id },
    });
    await testPrisma.manufacturer.deleteMany({
      where: { id: manufacturer.id },
    });
  }

  function purchaseInput(dependencies, overrides = {}) {
    return {
      customerId: dependencies.customer.id,
      purchasedAt: "2026-10-15",
      reference: " INV-1001 ",
      currencyCode: "aed",
      items: [
        {
          machineId: dependencies.machineOne.id,
          inkProductId: dependencies.inkProduct.id,
          quantity: 3,
          unitPrice: 125.5,
        },
      ],
      ...overrides,
    };
  }

  it("creates one purchase containing ink for multiple machines", async () => {
    const dependencies = await createDependencies();

    try {
      const input = purchaseInput(dependencies, {
        items: [
          {
            machineId: dependencies.machineOne.id,
            inkProductId: dependencies.inkProduct.id,
            quantity: 3,
            unitPrice: 125.5,
          },
          {
            machineId: dependencies.machineTwo.id,
            inkProductId: dependencies.inkProduct.id,
            quantity: 2,
            unitPrice: 125.5,
          },
        ],
      });

      const response = await request(app)
        .post("/api/v1/ink-purchases")
        .send(input);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        message: "Ink purchase created successfully.",
        data: {
          customerId: dependencies.customer.id,
          purchasedAt: "2026-10-15T00:00:00.000Z",
          reference: "INV-1001",
          currencyCode: "AED",
          version: 0,
          items: expect.arrayContaining([
            expect.objectContaining({
              machineId: dependencies.machineOne.id,
              inkProductId: dependencies.inkProduct.id,
              quantity: 3,
            }),
            expect.objectContaining({
              machineId: dependencies.machineTwo.id,
              inkProductId: dependencies.inkProduct.id,
              quantity: 2,
            }),
          ]),
        },
      });
      expect(response.body.data.items).toHaveLength(2);

      const persisted = await testPrisma.inkPurchase.findUnique({
        where: { id: response.body.data.id },
        include: { items: true },
      });
      expect(persisted.items).toHaveLength(2);
      expect(persisted.items.reduce((total, item) => total + item.quantity, 0))
        .toBe(5);
    } finally {
      await cleanupDependencies(dependencies);
    }
  });

  it("rejects the entire purchase when one line references another customer's machine", async () => {
    const dependencies = await createDependencies();

    try {
      const response = await request(app)
        .post("/api/v1/ink-purchases")
        .send(
          purchaseInput(dependencies, {
            items: [
              {
                machineId: dependencies.machineOne.id,
                inkProductId: dependencies.inkProduct.id,
                quantity: 3,
              },
              {
                machineId: dependencies.otherMachine.id,
                inkProductId: dependencies.inkProduct.id,
                quantity: 2,
              },
            ],
          }),
        );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Every machine must belong to the purchase customer.",
      );

      const purchases = await testPrisma.inkPurchase.findMany({
        where: { customerId: dependencies.customer.id },
      });
      expect(purchases).toHaveLength(0);
    } finally {
      await cleanupDependencies(dependencies);
    }
  });

  it("returns 404 when the customer does not exist", async () => {
    const dependencies = await createDependencies();

    try {
      const response = await request(app)
        .post("/api/v1/ink-purchases")
        .send(
          purchaseInput(dependencies, {
            customerId: randomUUID(),
          }),
        );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Customer not found.");
    } finally {
      await cleanupDependencies(dependencies);
    }
  });

  it("returns 404 when an ink product does not exist", async () => {
    const dependencies = await createDependencies();

    try {
      const response = await request(app)
        .post("/api/v1/ink-purchases")
        .send(
          purchaseInput(dependencies, {
            items: [
              {
                machineId: dependencies.machineOne.id,
                inkProductId: randomUUID(),
                quantity: 1,
              },
            ],
          }),
        );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        "One or more ink products were not found.",
      );
    } finally {
      await cleanupDependencies(dependencies);
    }
  });

  it("rejects invalid purchase data before writing to PostgreSQL", async () => {
    const dependencies = await createDependencies();

    try {
      const response = await request(app)
        .post("/api/v1/ink-purchases")
        .send(
          purchaseInput(dependencies, {
            items: [
              {
                machineId: dependencies.machineOne.id,
                inkProductId: dependencies.inkProduct.id,
                quantity: 0,
                unitPrice: -1,
              },
            ],
          }),
        );

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        message: "Validation failed",
      });

      const purchases = await testPrisma.inkPurchase.findMany({
        where: { customerId: dependencies.customer.id },
      });
      expect(purchases).toHaveLength(0);
    } finally {
      await cleanupDependencies(dependencies);
    }
  });

  it("retrieves a purchase by ID with customer, machine and ink-product details", async () => {
    const dependencies = await createDependencies();

    try {
      const created = await request(app)
        .post("/api/v1/ink-purchases")
        .send(purchaseInput(dependencies));

      expect(created.status).toBe(201);

      const response = await request(app).get(
        `/api/v1/ink-purchases/${created.body.data.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: created.body.data.id,
          customer: expect.objectContaining({
            id: dependencies.customer.id,
          }),
          items: [
            expect.objectContaining({
              machine: expect.objectContaining({
                id: dependencies.machineOne.id,
                site: expect.objectContaining({
                  customer: expect.objectContaining({
                    id: dependencies.customer.id,
                  }),
                }),
              }),
              inkProduct: expect.objectContaining({
                id: dependencies.inkProduct.id,
                inkModel: expect.objectContaining({
                  id: dependencies.inkModel.id,
                }),
              }),
            }),
          ],
        },
      });
    } finally {
      await cleanupDependencies(dependencies);
    }
  });

  it("lists purchase transactions", async () => {
    const dependencies = await createDependencies();

    try {
      const created = await request(app)
        .post("/api/v1/ink-purchases")
        .send(purchaseInput(dependencies));

      expect(created.status).toBe(201);

      const response = await request(app).get("/api/v1/ink-purchases");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(response.body.data.length);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: created.body.data.id,
            customerId: dependencies.customer.id,
          }),
        ]),
      );
    } finally {
      await cleanupDependencies(dependencies);
    }
  });

  it("filters purchases by customer, machine, ink product and inclusive date range", async () => {
    const dependencies = await createDependencies();

    try {
      const createPurchase = (input) =>
        request(app).post("/api/v1/ink-purchases").send(input);

      const customerMachineOne = await createPurchase(
        purchaseInput(dependencies, {
          purchasedAt: "2026-10-15",
        }),
      );
      const customerMachineTwo = await createPurchase(
        purchaseInput(dependencies, {
          purchasedAt: "2026-10-31",
          items: [
            {
              machineId: dependencies.machineTwo.id,
              inkProductId: dependencies.inkProductTwo.id,
              quantity: 2,
            },
          ],
        }),
      );
      const otherCustomerPurchase = await createPurchase(
        purchaseInput(dependencies, {
          customerId: dependencies.otherCustomer.id,
          purchasedAt: "2026-09-20",
          items: [
            {
              machineId: dependencies.otherMachine.id,
              inkProductId: dependencies.inkProduct.id,
              quantity: 1,
            },
          ],
        }),
      );

      expect(customerMachineOne.status).toBe(201);
      expect(customerMachineTwo.status).toBe(201);
      expect(otherCustomerPurchase.status).toBe(201);

      const byCustomer = await request(app)
        .get("/api/v1/ink-purchases")
        .query({ customerId: dependencies.customer.id });
      expect(byCustomer.status).toBe(200);
      expect(byCustomer.body.data.map((purchase) => purchase.id)).toEqual(
        expect.arrayContaining([
          customerMachineOne.body.data.id,
          customerMachineTwo.body.data.id,
        ]),
      );
      expect(byCustomer.body.data).toHaveLength(2);

      const byMachine = await request(app)
        .get("/api/v1/ink-purchases")
        .query({ machineId: dependencies.machineTwo.id });
      expect(byMachine.status).toBe(200);
      expect(byMachine.body.data.map((purchase) => purchase.id)).toEqual([
        customerMachineTwo.body.data.id,
      ]);

      const byInkProduct = await request(app)
        .get("/api/v1/ink-purchases")
        .query({ inkProductId: dependencies.inkProductTwo.id });
      expect(byInkProduct.status).toBe(200);
      expect(byInkProduct.body.data.map((purchase) => purchase.id)).toEqual([
        customerMachineTwo.body.data.id,
      ]);

      const byDateRange = await request(app)
        .get("/api/v1/ink-purchases")
        .query({ startDate: "2026-10-15", endDate: "2026-10-31" });
      expect(byDateRange.status).toBe(200);
      expect(byDateRange.body.data.map((purchase) => purchase.id)).toEqual(
        expect.arrayContaining([
          customerMachineOne.body.data.id,
          customerMachineTwo.body.data.id,
        ]),
      );
      expect(byDateRange.body.data).toHaveLength(2);

      const combined = await request(app)
        .get("/api/v1/ink-purchases")
        .query({
          customerId: dependencies.customer.id,
          machineId: dependencies.machineTwo.id,
          inkProductId: dependencies.inkProductTwo.id,
          startDate: "2026-10-15",
          endDate: "2026-10-31",
        });
      expect(combined.status).toBe(200);
      expect(combined.body.data.map((purchase) => purchase.id)).toEqual([
        customerMachineTwo.body.data.id,
      ]);
    } finally {
      await cleanupDependencies(dependencies);
    }
  });

  it("rejects invalid purchase-list query parameters", async () => {
    const invalidId = await request(app)
      .get("/api/v1/ink-purchases")
      .query({ customerId: "not-a-uuid" });
    expect(invalidId.status).toBe(400);

    const invalidRange = await request(app)
      .get("/api/v1/ink-purchases")
      .query({
        startDate: "2026-11-01",
        endDate: "2026-10-01",
      });
    expect(invalidRange.status).toBe(400);
  });

  it("returns 404 when retrieving a purchase that does not exist", async () => {
    const response = await request(app).get(
      `/api/v1/ink-purchases/${randomUUID()}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      message: "Ink purchase not found.",
    });
  });
});
