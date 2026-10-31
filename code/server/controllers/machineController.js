import * as machineService from "../services/machineService.js";

// Retrieve all machines.
export async function getMachines(req, res) {
  const machines = await machineService.findAllMachines();

  return res.status(200).json({
    success: true,
    count: machines.length,
    data: machines,
  });
}

// Retrieve one machine by its ID.
export async function getMachineById(req, res) {
  const { id } = req.params;

  const machine = await machineService.findMachineById(id);

  if (!machine) {
    return res.status(404).json({
      success: false,
      message: "Machine not found.",
    });
  }

  return res.status(200).json({
    success: true,
    data: machine,
  });
}

// Create a new machine.
export async function createMachine(req, res) {
  const data = {
    ...req.body,
    installationDate: new Date(`${req.body.installationDate}T00:00:00.000Z`),
  };

  const machine = await machineService.createMachine(data);

  return res.status(201).json({
    success: true,
    data: machine,
  });
}

// Update an existing machine by its ID.
export async function updateMachine(req, res) {
  const { id } = req.params;

  // Separate the OCC version from the fields being updated.
  const { version, ...data } = req.body;

  if (data.installationDate !== undefined) {
    data.installationDate = new Date(`${data.installationDate}T00:00:00.000Z`);
  }

  // Pass the expected version separately to the service.
  const machine = await machineService.updateMachine(id, data, version);

  return res.status(200).json({
    success: true,
    data: machine,
  });
}

// Delete a machine by its ID.
export async function deleteMachine(req, res) {
  const { id } = req.params;

  await machineService.removeMachine(id);

  return res.status(204).end();
}
