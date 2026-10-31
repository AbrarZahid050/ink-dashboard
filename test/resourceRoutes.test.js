import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../code/server/app.js";
import * as manufacturerController from "../code/server/controllers/manufacturerController.js";
import * as customerController from "../code/server/controllers/customerController.js";
import * as customerSiteController from "../code/server/controllers/customerSiteController.js";
import * as machineController from "../code/server/controllers/machineController.js";

vi.mock("../code/server/controllers/manufacturerController.js", () => ({
  getAllManufacturers: vi.fn(),
  getManufacturerById: vi.fn(),
  createManufacturer: vi.fn(),
  updateManufacturer: vi.fn(),
  deleteManufacturer: vi.fn(),
}));

vi.mock("../code/server/controllers/customerController.js", () => ({
  getAllCustomers: vi.fn(),
  getCustomerById: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
}));

vi.mock("../code/server/controllers/customerSiteController.js", () => ({
  getAllCustomerSites: vi.fn(),
  getCustomerSiteById: vi.fn(),
  createCustomerSite: vi.fn(),
  updateCustomerSite: vi.fn(),
  deleteCustomerSite: vi.fn(),
}));

vi.mock("../code/server/controllers/machineController.js", () => ({
  getMachines: vi.fn(),
  getMachineById: vi.fn(),
  createMachine: vi.fn(),
  updateMachine: vi.fn(),
  deleteMachine: vi.fn(),
}));

const validId = "550e8400-e29b-41d4-a716-446655440000";

const resources = [
  {
    name: "manufacturer",
    basePath: "/api/v1/manufacturers",
    controller: manufacturerController,
    idHandlers: [
      ["GET", "getManufacturerById"],
      ["PATCH", "updateManufacturer"],
      ["DELETE", "deleteManufacturer"],
    ],
    createHandler: "createManufacturer",
    updateHandler: "updateManufacturer",
    invalidCreateBody: { name: "   " },
    validCreateBody: { name: "  Mimaki  " },
    validUpdateBody: { name: "  Epson  ", version: 0 },
    normalizedCreateBody: { name: "Mimaki" },
    normalizedUpdateBody: { name: "Epson", version: 0 },
  },
  {
    name: "customer",
    basePath: "/api/v1/customers",
    controller: customerController,
    idHandlers: [
      ["GET", "getCustomerById"],
      ["PATCH", "updateCustomer"],
      ["DELETE", "deleteCustomer"],
    ],
    createHandler: "createCustomer",
    updateHandler: "updateCustomer",
    invalidCreateBody: { name: "" },
    validCreateBody: { name: "  Example Customer  " },
    validUpdateBody: { name: "  Updated Customer  " },
    normalizedCreateBody: { name: "Example Customer" },
    normalizedUpdateBody: { name: "Updated Customer" },
  },
  {
    name: "customer site",
    basePath: "/api/v1/customer-sites",
    controller: customerSiteController,
    idHandlers: [
      ["GET", "getCustomerSiteById"],
      ["PATCH", "updateCustomerSite"],
      ["DELETE", "deleteCustomerSite"],
    ],
    createHandler: "createCustomerSite",
    updateHandler: "updateCustomerSite",
    invalidCreateBody: { name: "Dubai Branch" },
    validCreateBody: {
      customerId: validId,
      name: "  Dubai Branch  ",
      address: "  Main Road  ",
    },
    validUpdateBody: { name: "  Abu Dhabi Branch  " },
    normalizedCreateBody: {
      customerId: validId,
      name: "Dubai Branch",
      address: "Main Road",
    },
    normalizedUpdateBody: { name: "Abu Dhabi Branch" },
  },
  {
    name: "machine",
    basePath: "/api/v1/machines",
    controller: machineController,
    idHandlers: [
      ["GET", "getMachineById"],
      ["PATCH", "updateMachine"],
      ["DELETE", "deleteMachine"],
    ],
    createHandler: "createMachine",
    updateHandler: "updateMachine",
    invalidCreateBody: {
      serialNumber: "SN-001",
      machineModelId: validId,
      siteId: validId,
      installationDate: "2026-02-30",
    },
    validCreateBody: {
      serialNumber: " SN-001 ",
      machineModelId: validId,
      siteId: validId,
      installationDate: "2026-10-30",
      status: "ACTIVE",
    },
    validUpdateBody: { version: 0, status: "INACTIVE" },
    normalizedCreateBody: {
      serialNumber: "SN-001",
      machineModelId: validId,
      siteId: validId,
      installationDate: "2026-10-30",
      status: "ACTIVE",
    },
    normalizedUpdateBody: { version: 0, status: "INACTIVE" },
  },
];

describe("Resource route validation and request parsing", () => {
  beforeEach(() => vi.clearAllMocks());

  for (const resource of resources) {
    describe(`${resource.name} routes`, () => {
      for (const [method, handlerName] of resource.idHandlers) {
        it(`should reject an invalid UUID on ${method} before reaching the controller`, async () => {
          const handler = resource.controller[handlerName];
          const url = `${resource.basePath}/invalid-id`;

          handler.mockClear();

          let requestBuilder = request(app)[method.toLowerCase()](url);

          if (method === "PATCH") {
            requestBuilder = requestBuilder.send(resource.validUpdateBody);
          }

          const response = await requestBuilder;

          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.message).toBe("Validation failed");
          expect(response.body.errors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ field: "id" }),
            ]),
          );
          expect(handler).not.toHaveBeenCalled();
        });
      }

      it("should reject an invalid create body before reaching the controller", async () => {
        const handler = resource.controller[resource.createHandler];

        const response = await request(app)
          .post(resource.basePath)
          .send(resource.invalidCreateBody);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Validation failed");
        expect(handler).not.toHaveBeenCalled();
      });

      it("should reject an empty PATCH body before reaching the controller", async () => {
        const handler = resource.controller[resource.updateHandler];

        const response = await request(app)
          .patch(`${resource.basePath}/${validId}`)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Validation failed");
        expect(handler).not.toHaveBeenCalled();
      });

      it("should pass a valid create body through schema normalization", async () => {
        const handler = resource.controller[resource.createHandler];
        handler.mockImplementationOnce((req, res) =>
          res.status(201).json({ success: true, data: req.body }),
        );

        const response = await request(app)
          .post(resource.basePath)
          .send(resource.validCreateBody);

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
          success: true,
          data: resource.normalizedCreateBody,
        });
        expect(handler).toHaveBeenCalledOnce();
      });

      it("should pass a valid partial update through schema normalization", async () => {
        const handler = resource.controller[resource.updateHandler];
        handler.mockImplementationOnce((req, res) =>
          res.status(200).json({
            success: true,
            id: req.params.id,
            data: req.body,
          }),
        );

        const response = await request(app)
          .patch(`${resource.basePath}/${validId}`)
          .send(resource.validUpdateBody);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          id: validId,
          data: resource.normalizedUpdateBody,
        });
        expect(handler).toHaveBeenCalledOnce();
      });
    });
  }
});
