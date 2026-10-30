import { describe, it, expect, vi, beforeEach } from "vitest";
import * as machineService from "../code/server/services/machineService.js";
import {
  getMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
} from "../code/server/controllers/machineController.js";

vi.mock("../code/server/services/machineService.js", () => ({
  findAllMachines: vi.fn(),
  findMachineById: vi.fn(),
  createMachine: vi.fn(),
  updateMachine: vi.fn(),
  removeMachine: vi.fn(),
}));

const makeResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
  end: vi.fn().mockReturnThis(),
});

describe("Machine controller", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return all machines with a count", async () => {
    const machines = [{ id: "machine-1" }, { id: "machine-2" }];
    machineService.findAllMachines.mockResolvedValue(machines);
    const res = makeResponse();

    await getMachines({}, res);

    expect(machineService.findAllMachines).toHaveBeenCalledOnce();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 2,
      data: machines,
    });
  });

  it("should return a machine when it exists", async () => {
    const machine = { id: "machine-1", serialNumber: "SN-001" };
    machineService.findMachineById.mockResolvedValue(machine);
    const res = makeResponse();

    await getMachineById({ params: { id: machine.id } }, res);

    expect(machineService.findMachineById).toHaveBeenCalledWith(machine.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: machine });
  });

  it("should return 404 when a machine does not exist", async () => {
    machineService.findMachineById.mockResolvedValue(null);
    const res = makeResponse();

    await getMachineById({ params: { id: "missing-id" } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Machine not found.",
    });
  });

  it("should convert installationDate to a Date when creating a machine", async () => {
    const body = {
      serialNumber: "SN-001",
      machineModelId: "550e8400-e29b-41d4-a716-446655440000",
      siteId: "550e8400-e29b-41d4-a716-446655440001",
      installationDate: "2026-10-30",
      status: "ACTIVE",
    };
    const createdMachine = { id: "machine-1", ...body };
    machineService.createMachine.mockResolvedValue(createdMachine);
    const res = makeResponse();

    await createMachine({ body }, res);

    expect(machineService.createMachine).toHaveBeenCalledWith({
      ...body,
      installationDate: new Date("2026-10-30T00:00:00.000Z"),
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: createdMachine,
    });
  });

  it("should convert installationDate to a Date when updating a machine", async () => {
    const body = { installationDate: "2026-10-29", notes: "Updated" };
    const updatedMachine = { id: "machine-1", ...body };
    machineService.updateMachine.mockResolvedValue(updatedMachine);
    const res = makeResponse();

    await updateMachine(
      { params: { id: "machine-1" }, body },
      res,
    );

    expect(machineService.updateMachine).toHaveBeenCalledWith("machine-1", {
      installationDate: new Date("2026-10-29T00:00:00.000Z"),
      notes: "Updated",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: updatedMachine,
    });
  });

  it("should preserve other fields when updating without installationDate", async () => {
    const body = { status: "INACTIVE", notes: null };
    machineService.updateMachine.mockResolvedValue({ id: "machine-1", ...body });
    const res = makeResponse();

    await updateMachine({ params: { id: "machine-1" }, body }, res);

    expect(machineService.updateMachine).toHaveBeenCalledWith("machine-1", body);
  });

  it("should delete a machine and return 204", async () => {
    machineService.removeMachine.mockResolvedValue({ id: "machine-1" });
    const res = makeResponse();

    await deleteMachine({ params: { id: "machine-1" } }, res);

    expect(machineService.removeMachine).toHaveBeenCalledWith("machine-1");
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalledOnce();
  });
});
