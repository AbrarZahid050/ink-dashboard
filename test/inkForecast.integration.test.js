import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../code/server/app.js";
import { prisma } from "../code/server/config/database.js";
import { testPrisma } from "../code/server/config/testDatabase.js";

describe("Ink Forecast API - PostgreSQL integration", () => {
  const originalFetch = globalThis.fetch;
  const createdCustomerIds = [];

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await Promise.all([prisma.$disconnect(), testPrisma.$disconnect()]);
  });

  async function createDependencies() {
    const suffix = randomUUID();

    const manufacturer = await testPrisma.manufacturer.create({
      data: { name: `Forecast Manufacturer ${suffix}` },
    });
    const machineModel = await testPrisma.machineModel.create({
      data: {
        manufacturerId: manufacturer.id,
        modelName: `Forecast Model ${suffix}`,
        technology: "UV",
        configuration: "ROLL_TO_ROLL",
        maxRollWidthMm: 1600,
      },
    });
    const otherMachineModel = await testPrisma.machineModel.create({
      data: {
        manufacturerId: manufacturer.id,
        modelName: `Other Forecast Model ${suffix}`,
        technology: "UV",
        configuration: "ROLL_TO_ROLL",
        maxRollWidthMm: 1600,
      },
    });
    const customer = await testPrisma.customer.create({
      data: { name: `Forecast Customer ${suffix}` },
    });
    createdCustomerIds.push(customer.id);
    const site = await testPrisma.customerSite.create({
      data: { customerId: customer.id, name: `Forecast Site ${suffix}` },
    });
    const machineOne = await testPrisma.machine.create({
      data: {
        serialNumber: `FORECAST-ONE-${suffix}`,
        machineModelId: machineModel.id,
        siteId: site.id,
        installationDate: new Date("2024-01-01T00:00:00.000Z"),
      },
    });
    const machineTwo = await testPrisma.machine.create({
      data: {
        serialNumber: `FORECAST-TWO-${suffix}`,
        machineModelId: machineModel.id,
        siteId: site.id,
        installationDate: new Date("2024-02-01T00:00:00.000Z"),
      },
    });
    const otherMachine = await testPrisma.machine.create({
      data: {
        serialNumber: `FORECAST-OTHER-${suffix}`,
        machineModelId: otherMachineModel.id,
        siteId: site.id,
        installationDate: new Date("2024-03-01T00:00:00.000Z"),
      },
    });
    const inkModel = await testPrisma.inkModel.create({
      data: {
        manufacturerId: manufacturer.id,
        inkName: `Forecast Ink ${suffix}`,
        inkType: "UV",
      },
    });
    const otherInkModel = await testPrisma.inkModel.create({
      data: {
        manufacturerId: manufacturer.id,
        inkName: `Other Forecast Ink ${suffix}`,
        inkType: "UV",
      },
    });
    const cyan = await testPrisma.inkProduct.create({
      data: {
        inkModelId: inkModel.id,
        color: "Cyan",
        packagingType: "BOTTLE",
        capacityMl: 1000,
      },
    });
    const magenta = await testPrisma.inkProduct.create({
      data: {
        inkModelId: inkModel.id,
        color: "Magenta",
        packagingType: "BOTTLE",
        capacityMl: 1000,
      },
    });
    const otherInk = await testPrisma.inkProduct.create({
      data: {
        inkModelId: otherInkModel.id,
        color: "Cyan",
        packagingType: "BOTTLE",
        capacityMl: 1000,
      },
    });

    return {
      manufacturer, machineModel, otherMachineModel, customer, site,
      machineOne, machineTwo, otherMachine, inkModel, otherInkModel,
      cyan, magenta, otherInk,
    };
  }

  async function createPurchase(deps, purchasedAt, items) {
    return testPrisma.inkPurchase.create({
      data: {
        customerId: deps.customer.id,
        purchasedAt: new Date(`${purchasedAt}T00:00:00.000Z`),
        items: { create: items },
      },
    });
  }

  async function cleanup(deps) {
    await testPrisma.inkPurchaseItem.deleteMany({
      where: { inkPurchase: { customerId: deps.customer.id } },
    });
    await testPrisma.inkPurchase.deleteMany({
      where: { customerId: deps.customer.id },
    });
    await testPrisma.machine.deleteMany({
      where: { id: { in: [deps.machineOne.id, deps.machineTwo.id, deps.otherMachine.id] } },
    });
    await testPrisma.customerSite.deleteMany({ where: { id: deps.site.id } });
    await testPrisma.customer.deleteMany({ where: { id: deps.customer.id } });
    await testPrisma.inkProduct.deleteMany({
      where: { id: { in: [deps.cyan.id, deps.magenta.id, deps.otherInk.id] } },
    });
    await testPrisma.inkModel.deleteMany({
      where: { id: { in: [deps.inkModel.id, deps.otherInkModel.id] } },
    });
    await testPrisma.machineModel.deleteMany({
      where: { id: { in: [deps.machineModel.id, deps.otherMachineModel.id] } },
    });
    await testPrisma.manufacturer.deleteMany({ where: { id: deps.manufacturer.id } });
    const index = createdCustomerIds.indexOf(deps.customer.id);
    if (index !== -1) createdCustomerIds.splice(index, 1);
  }

  it("combines purchase lines from all customer machines of the selected model", async () => {
    const deps = await createDependencies();

    try {
      await createPurchase(deps, "2026-08-10", [
        { machineId: deps.machineOne.id, inkProductId: deps.cyan.id, quantity: 3 },
        { machineId: deps.machineTwo.id, inkProductId: deps.cyan.id, quantity: 2 },
        { machineId: deps.machineOne.id, inkProductId: deps.magenta.id, quantity: 1 },
        { machineId: deps.otherMachine.id, inkProductId: deps.cyan.id, quantity: 50 },
        { machineId: deps.machineOne.id, inkProductId: deps.otherInk.id, quantity: 60 },
      ]);

      const fetchMock = vi.fn(async (url, options) => {
        expect(url).toBe("http://127.0.0.1:8000/forecast");
        const payload = JSON.parse(options.body);
        expect(payload).toMatchObject({
          client_id: deps.customer.id,
          machine_model: `${deps.manufacturer.name} ${deps.machineModel.modelName}`,
          ink_model: deps.inkModel.inkName,
          horizon_months: 3,
        });
        expect(payload.history).toHaveLength(3);
        expect(payload.history).toEqual(
          expect.arrayContaining([
            { purchased_at: "2026-08-10", color: "Cyan", quantity: 3 },
            { purchased_at: "2026-08-10", color: "Cyan", quantity: 2 },
            { purchased_at: "2026-08-10", color: "Magenta", quantity: 1 },
          ]),
        );
        const cyanQuantity = payload.history
          .filter((record) => record.color === "Cyan")
          .reduce((total, record) => total + record.quantity, 0);
        expect(cyanQuantity).toBe(5);
        return new Response(JSON.stringify({ history_months: 1, forecast: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });
      globalThis.fetch = fetchMock;

      const response = await request(app)
        .get("/api/v1/ink-forecasts")
        .query({
          customerId: deps.customer.id,
          machineModelId: deps.machineModel.id,
          inkModelId: deps.inkModel.id,
          horizonMonths: 3,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { history_months: 1, forecast: [] },
      });
      expect(fetchMock).toHaveBeenCalledOnce();
    } finally {
      await cleanup(deps);
    }
  });

  it("returns 404 when the selected combination has no purchase history", async () => {
    const deps = await createDependencies();

    try {
      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      const response = await request(app)
        .get("/api/v1/ink-forecasts")
        .query({
          customerId: deps.customer.id,
          machineModelId: deps.machineModel.id,
          inkModelId: deps.inkModel.id,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/No purchase history found/);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      await cleanup(deps);
    }
  });

  it("rejects invalid query parameters", async () => {
    const response = await request(app)
      .get("/api/v1/ink-forecasts")
      .query({
        customerId: "invalid",
        machineModelId: randomUUID(),
        inkModelId: randomUUID(),
        horizonMonths: 13,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("returns 503 when the Python forecasting service cannot be reached", async () => {
    const deps = await createDependencies();

    try {
      await createPurchase(deps, "2026-08-10", [
        { machineId: deps.machineOne.id, inkProductId: deps.cyan.id, quantity: 1 },
      ]);
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("connection refused"));

      const response = await request(app)
        .get("/api/v1/ink-forecasts")
        .query({
          customerId: deps.customer.id,
          machineModelId: deps.machineModel.id,
          inkModelId: deps.inkModel.id,
        });

      expect(response.status).toBe(503);
      expect(response.body.message).toBe("Forecasting service is unavailable.");
    } finally {
      await cleanup(deps);
    }
  });
});
