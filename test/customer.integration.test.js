import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../code/server/app.js";
import { prisma } from "../code/server/config/database.js";
import { testPrisma } from "../code/server/config/testDatabase.js";

describe("Customer PostgreSQL integration tests", () => {
  afterAll(async () => {
    await Promise.all([prisma.$disconnect(), testPrisma.$disconnect()]);
  });

  it("should create a customer through the API and persist it in PostgreSQL", async () => {
    const name = `Integration Customer ${randomUUID()}`;

    const response = await request(app)
      .post("/api/v1/customers")
      .send({ name });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "Customer created successfully",
      data: { name },
    });

    const persisted = await testPrisma.customer.findUnique({
      where: { id: response.body.data.id },
    });

    expect(persisted).not.toBeNull();
    expect(persisted.name).toBe(name);

    await testPrisma.customer.delete({
      where: { id: persisted.id },
    });
  });

  it("should retrieve a customer by ID with its sites through the API", async () => {
    const customer = await testPrisma.customer.create({
      data: { name: `Integration Customer Details ${randomUUID()}` },
    });
    const site = await testPrisma.customerSite.create({
      data: {
        customerId: customer.id,
        name: `Integration Site ${randomUUID()}`,
      },
    });

    try {
      const response = await request(app).get(
        `/api/v1/customers/${customer.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: customer.id,
          name: customer.name,
          sites: [
            {
              id: site.id,
              name: site.name,
              _count: { machines: 0 },
            },
          ],
        },
      });
    } finally {
      await testPrisma.customerSite.deleteMany({
        where: { id: site.id },
      });
      await testPrisma.customer.delete({
        where: { id: customer.id },
      });
    }
  });

  it("should retrieve all customers with site counts through the API", async () => {
    const customer = await testPrisma.customer.create({
      data: { name: `Integration Customer List ${randomUUID()}` },
    });
    const site = await testPrisma.customerSite.create({
      data: {
        customerId: customer.id,
        name: `Integration List Site ${randomUUID()}`,
      },
    });

    try {
      const response = await request(app).get("/api/v1/customers");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(response.body.data.length);

      const returnedCustomer = response.body.data.find(
        (item) => item.id === customer.id,
      );

      expect(returnedCustomer).toBeDefined();
      expect(returnedCustomer._count.sites).toBe(1);
    } finally {
      await testPrisma.customerSite.deleteMany({
        where: { id: site.id },
      });
      await testPrisma.customer.delete({
        where: { id: customer.id },
      });
    }
  });

  it("should update a customer through the API and persist the change", async () => {
    const customer = await testPrisma.customer.create({
      data: { name: `Integration Customer Update ${randomUUID()}` },
    });
    const updatedName = `Updated Customer ${randomUUID()}`;

    try {
      const response = await request(app)
        .patch(`/api/v1/customers/${customer.id}`)
        .send({ name: updatedName });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: "Customer updated successfully",
        data: {
          id: customer.id,
          name: updatedName,
        },
      });

      const persisted = await testPrisma.customer.findUnique({
        where: { id: customer.id },
      });
      expect(persisted.name).toBe(updatedName);
    } finally {
      await testPrisma.customer.deleteMany({
        where: { id: customer.id },
      });
    }
  });

  it("should delete a customer through the API and remove it from PostgreSQL", async () => {
    const customer = await testPrisma.customer.create({
      data: { name: `Integration Customer Delete ${randomUUID()}` },
    });

    const response = await request(app).delete(
      `/api/v1/customers/${customer.id}`,
    );

    expect(response.status).toBe(204);

    const deleted = await testPrisma.customer.findUnique({
      where: { id: customer.id },
    });
    expect(deleted).toBeNull();
  });

  it("should return 404 when retrieving a nonexistent customer", async () => {
    const nonexistentId = randomUUID();

    const response = await request(app).get(
      `/api/v1/customers/${nonexistentId}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      message: "Customer not found",
    });
  });

  it("should return 404 when updating a nonexistent customer", async () => {
    const nonexistentId = randomUUID();

    const response = await request(app)
      .patch(`/api/v1/customers/${nonexistentId}`)
      .send({ name: `Missing Customer ${randomUUID()}` });

    expect(response.status).toBe(404);
  });
});
