import { describe, it, expect, vi, beforeEach } from "vitest";
import * as manufacturerService from "../code/server/services/manufacturerService.js";
import * as customerService from "../code/server/services/customerService.js";
import * as customerSiteService from "../code/server/services/customerSiteService.js";
import {
  getAllManufacturers,
  getManufacturerById,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
} from "../code/server/controllers/manufacturerController.js";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../code/server/controllers/customerController.js";
import {
  getAllCustomerSites,
  getCustomerSiteById,
  createCustomerSite,
  updateCustomerSite,
  deleteCustomerSite,
} from "../code/server/controllers/customerSiteController.js";

vi.mock("../code/server/services/manufacturerService.js", () => ({
  findAllManufacturers: vi.fn(),
  findManufacturerById: vi.fn(),
  createManufacturer: vi.fn(),
  updateManufacturer: vi.fn(),
  removeManufacturer: vi.fn(),
}));

vi.mock("../code/server/services/customerService.js", () => ({
  findAllCustomers: vi.fn(),
  findCustomerById: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  removeCustomer: vi.fn(),
}));

vi.mock("../code/server/services/customerSiteService.js", () => ({
  findAllCustomerSites: vi.fn(),
  findCustomerSiteById: vi.fn(),
  createCustomerSite: vi.fn(),
  updateCustomerSite: vi.fn(),
  removeCustomerSite: vi.fn(),
}));

const makeResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
  end: vi.fn().mockReturnThis(),
});

function defineCrudControllerTests({
  resource,
  service,
  handlers,
  entity,
  plural,
  notFoundMessage,
  createMessage,
  updateMessage,
  createInput,
  createServiceArgs,
  updateInput,
  updateServiceArgs,
}) {
  describe(`${resource} controller`, () => {
    beforeEach(() => vi.clearAllMocks());

    it(`should return all ${plural}`, async () => {
      const records = [{ id: "record-1" }, { id: "record-2" }];
      service.findAll.mockResolvedValue(records);
      const res = makeResponse();

      await handlers.list({}, res);

      expect(service.findAll).toHaveBeenCalledOnce();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: records.length,
        data: records,
      });
    });

    it(`should return one ${resource.toLowerCase()} when found`, async () => {
      const record = { id: "record-1", name: "Example" };
      service.findById.mockResolvedValue(record);
      const res = makeResponse();

      await handlers.get({ params: { id: record.id } }, res);

      expect(service.findById).toHaveBeenCalledWith(record.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: record });
    });

    it(`should return 404 when the ${resource.toLowerCase()} does not exist`, async () => {
      service.findById.mockResolvedValue(null);
      const res = makeResponse();

      await handlers.get({ params: { id: "missing-id" } }, res);

      expect(service.findById).toHaveBeenCalledWith("missing-id");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: notFoundMessage,
      });
    });

    it(`should create a ${resource.toLowerCase()}`, async () => {
      const record = { id: "record-1", ...(
        typeof createInput === "string" ? { name: createInput } : createInput
      ) };
      service.create.mockResolvedValue(record);
      const res = makeResponse();

      await handlers.create({ body: createInput }, res);

      expect(service.create).toHaveBeenCalledWith(...createServiceArgs);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: createMessage,
        data: record,
      });
    });

    it(`should update a ${resource.toLowerCase()}`, async () => {
      const record = { id: "record-1", name: "Updated" };
      service.update.mockResolvedValue(record);
      const res = makeResponse();

      await handlers.update(
        { params: { id: "record-1" }, body: updateInput },
        res,
      );

      expect(service.update).toHaveBeenCalledWith(...updateServiceArgs);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: updateMessage,
        data: record,
      });
    });

    it(`should delete a ${resource.toLowerCase()}`, async () => {
      service.remove.mockResolvedValue({ id: "record-1" });
      const res = makeResponse();

      await handlers.delete({ params: { id: "record-1" } }, res);

      expect(service.remove).toHaveBeenCalledWith("record-1");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalledOnce();
    });
  });
}

defineCrudControllerTests({
  resource: "Manufacturer",
  plural: "manufacturers",
  service: {
    findAll: manufacturerService.findAllManufacturers,
    findById: manufacturerService.findManufacturerById,
    create: manufacturerService.createManufacturer,
    update: manufacturerService.updateManufacturer,
    remove: manufacturerService.removeManufacturer,
  },
  handlers: {
    list: getAllManufacturers,
    get: getManufacturerById,
    create: createManufacturer,
    update: updateManufacturer,
    delete: deleteManufacturer,
  },
  notFoundMessage: "Manufacturer not found",
  createMessage: "Manufacturer created successfully",
  updateMessage: "Manufacturer updated successfully",
  createInput: { name: " Mimaki " },
  createServiceArgs: [" Mimaki "],
  updateInput: { name: "Epson", version: 0 },
  updateServiceArgs: ["record-1", "Epson", 0],
});

defineCrudControllerTests({
  resource: "Customer",
  plural: "customers",
  service: {
    findAll: customerService.findAllCustomers,
    findById: customerService.findCustomerById,
    create: customerService.createCustomer,
    update: customerService.updateCustomer,
    remove: customerService.removeCustomer,
  },
  handlers: {
    list: getAllCustomers,
    get: getCustomerById,
    create: createCustomer,
    update: updateCustomer,
    delete: deleteCustomer,
  },
  notFoundMessage: "Customer not found",
  createMessage: "Customer created successfully",
  updateMessage: "Customer updated successfully",
  createInput: { name: " Example Customer " },
  createServiceArgs: [" Example Customer "],
  updateInput: { name: "Updated Customer" },
  updateServiceArgs: ["record-1", "Updated Customer"],
});

defineCrudControllerTests({
  resource: "Customer site",
  plural: "customer sites",
  service: {
    findAll: customerSiteService.findAllCustomerSites,
    findById: customerSiteService.findCustomerSiteById,
    create: customerSiteService.createCustomerSite,
    update: customerSiteService.updateCustomerSite,
    remove: customerSiteService.removeCustomerSite,
  },
  handlers: {
    list: getAllCustomerSites,
    get: getCustomerSiteById,
    create: createCustomerSite,
    update: updateCustomerSite,
    delete: deleteCustomerSite,
  },
  notFoundMessage: "Customer site not found",
  createMessage: "Customer site created successfully",
  updateMessage: "Customer site updated successfully",
  createInput: {
    customerId: "550e8400-e29b-41d4-a716-446655440000",
    name: "Dubai Branch",
  },
  createServiceArgs: [{
    customerId: "550e8400-e29b-41d4-a716-446655440000",
    name: "Dubai Branch",
  }],
  updateInput: { name: "Abu Dhabi Branch" },
  updateServiceArgs: ["record-1", { name: "Abu Dhabi Branch" }],
});
