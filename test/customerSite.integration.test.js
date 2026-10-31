import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../code/server/app.js";
import { prisma } from "../code/server/config/database.js";
import { testPrisma } from "../code/server/config/testDatabase.js";

describe("Customer Site PostgreSQL integration tests", () => {
  afterAll(async () => {
    await Promise.all([prisma.$disconnect(), testPrisma.$disconnect()]);
  });

  it("should create a customer site through the API and persist it in PostgreSQL", async () => {
    const customer = await testPrisma.customer.create({
      data: { name: `Integration Site Customer ${randomUUID()}` },
    });
    const siteInput = {
      customerId: customer.id,
      name: `Integration Created Site ${randomUUID()}`,
      address: "Building 1, Test Street",
      city: "Abu Dhabi",
      country: "UAE",
    };

    try {
      const response = await request(app)
        .post("/api/v1/customer-sites")
        .send(siteInput);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        message: "Customer site created successfully",
        data: {
          ...siteInput,
          version: 0,
          customer: { id: customer.id, name: customer.name },
          _count: { machines: 0 },
        },
      });

      const persisted = await testPrisma.customerSite.findUnique({
        where: { id: response.body.data.id },
      });

      expect(persisted).toMatchObject({ ...siteInput, version: 0 });
    } finally {
      await testPrisma.customerSite.deleteMany({
        where: { customerId: customer.id },
      });
      await testPrisma.customer.delete({ where: { id: customer.id } });
    }
  });

  it("should retrieve a customer site by ID with its customer and machines through the API", async () => {
    const customer = await testPrisma.customer.create({
      data: { name: `Integration Site Details Customer ${randomUUID()}` },
    });
    const site = await testPrisma.customerSite.create({
      data: {
        customerId: customer.id,
        name: `Integration Site Details ${randomUUID()}`,
        city: "Dubai",
      },
    });

    try {
      const response = await request(app).get(
        `/api/v1/customer-sites/${site.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: site.id,
          customerId: customer.id,
          name: site.name,
          version: 0,
          customer: { id: customer.id, name: customer.name },
          _count: { machines: 0 },
          machines: [],
        },
      });
    } finally {
      await testPrisma.customerSite.delete({ where: { id: site.id } });
      await testPrisma.customer.delete({ where: { id: customer.id } });
    }
  });

  it("should retrieve all customer sites with customer details and machine counts through the API", async () => {
    const customer = await testPrisma.customer.create({
      data: { name: `Integration Site List Customer ${randomUUID()}` },
    });
    const site = await testPrisma.customerSite.create({
      data: {
        customerId: customer.id,
        name: `Integration Listed Site ${randomUUID()}`,
      },
    });

    try {
      const response = await request(app).get("/api/v1/customer-sites");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(response.body.data.length);

      const returnedSite = response.body.data.find(
        (item) => item.id === site.id,
      );

      expect(returnedSite).toMatchObject({
        id: site.id,
        customerId: customer.id,
        name: site.name,
        version: 0,
        customer: { id: customer.id, name: customer.name },
        _count: { machines: 0 },
      });
    } finally {
      await testPrisma.customerSite.delete({ where: { id: site.id } });
      await testPrisma.customer.delete({ where: { id: customer.id } });
    }
  });

  it("should update a customer site through the API and persist the changes in PostgreSQL", async () => {
    const customer = await testPrisma.customer.create({
      data: { name: `Integration Site Update Customer ${randomUUID()}` },
    });
    const site = await testPrisma.customerSite.create({
      data: {
        customerId: customer.id,
        name: `Integration Site Before Update ${randomUUID()}`,
        city: "Abu Dhabi",
      },
    });
    const updateInput = {
      name: `Integration Site After Update ${randomUUID()}`,
      address: "Updated Test Address",
      city: "Dubai",
      country: "UAE",
    };

    try {
      const response = await request(app)
        .patch(`/api/v1/customer-sites/${site.id}`)
        .send({ ...updateInput, version: site.version });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: "Customer site updated successfully",
        data: {
          id: site.id,
          customerId: customer.id,
          ...updateInput,
          version: 1,
          customer: { id: customer.id, name: customer.name },
          _count: { machines: 0 },
        },
      });

      const persisted = await testPrisma.customerSite.findUnique({
        where: { id: site.id },
      });
      expect(persisted).toMatchObject({ ...updateInput, version: 1 });
    } finally {
      await testPrisma.customerSite.deleteMany({ where: { id: site.id } });
      await testPrisma.customer.delete({ where: { id: customer.id } });
    }
  });

  it("should reject a customer site update when the version is missing", async () => {
    const customer = await testPrisma.customer.create({
      data: { name: `Integration Site Missing Version Customer ${randomUUID()}` },
    });
    const site = await testPrisma.customerSite.create({
      data: {
        customerId: customer.id,
        name: `Integration Site Missing Version ${randomUUID()}`,
      },
    });

    try {
      const response = await request(app)
        .patch(`/api/v1/customer-sites/${site.id}`)
        .send({ name: "Updated without version" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "version" }),
        ]),
      );
    } finally {
      await testPrisma.customerSite.delete({ where: { id: site.id } });
      await testPrisma.customer.delete({ where: { id: customer.id } });
    }
  });

  it("should return 409 when updating a customer site with a stale version", async () => {
    const customer = await testPrisma.customer.create({
      data: { name: `Integration Site Stale Version Customer ${randomUUID()}` },
    });
    const site = await testPrisma.customerSite.create({
      data: {
        customerId: customer.id,
        name: `Integration Site Stale Version ${randomUUID()}`,
      },
    });

    try {
      const firstUpdate = await request(app)
        .patch(`/api/v1/customer-sites/${site.id}`)
        .send({ name: "First update", version: site.version });

      expect(firstUpdate.status).toBe(200);
      expect(firstUpdate.body.data.version).toBe(1);

      const staleUpdate = await request(app)
        .patch(`/api/v1/customer-sites/${site.id}`)
        .send({ name: "Stale update", version: site.version });

      expect(staleUpdate.status).toBe(409);
      expect(staleUpdate.body.message).toContain("modified by another user");

      const persisted = await testPrisma.customerSite.findUnique({
        where: { id: site.id },
      });
      expect(persisted).toMatchObject({
        name: "First update",
        version: 1,
      });
    } finally {
      await testPrisma.customerSite.delete({ where: { id: site.id } });
      await testPrisma.customer.delete({ where: { id: customer.id } });
    }
  });

  it("should delete a customer site through the API and remove it from PostgreSQL", async () => {
    const customer = await testPrisma.customer.create({
      data: { name: `Integration Site Delete Customer ${randomUUID()}` },
    });
    const site = await testPrisma.customerSite.create({
      data: {
        customerId: customer.id,
        name: `Integration Site Delete ${randomUUID()}`,
      },
    });

    try {
      const response = await request(app).delete(
        `/api/v1/customer-sites/${site.id}`,
      );

      expect(response.status).toBe(204);
      expect(response.text).toBe("");

      const deleted = await testPrisma.customerSite.findUnique({
        where: { id: site.id },
      });
      expect(deleted).toBeNull();
    } finally {
      await testPrisma.customerSite.deleteMany({ where: { id: site.id } });
      await testPrisma.customer.delete({ where: { id: customer.id } });
    }
  });

  it("should return 404 when retrieving a nonexistent customer site", async () => {
    const response = await request(app).get(
      `/api/v1/customer-sites/${randomUUID()}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      message: "Customer site not found",
    });
  });

  it("should return 404 when updating a nonexistent customer site", async () => {
    const response = await request(app)
      .patch(`/api/v1/customer-sites/${randomUUID()}`)
      .send({ name: `Missing Customer Site ${randomUUID()}`, version: 0 });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      message: "Customer site not found.",
    });
  });
});
