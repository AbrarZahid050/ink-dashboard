import * as machineModelService from "../services/machineModelService.js";

// Retrieve all machine models.
export async function getAllMachineModels(req, res) {
  const models = await machineModelService.findAllMachineModels();

  return res.status(200).json({
    success: true,
    count: models.length,
    data: models,
  });
}

// Retrieve one machine model by its ID.
export async function getMachineModelById(req, res) {
  const model = await machineModelService.findMachineModelById(req.params.id);

  if (!model) {
    return res.status(404).json({
      success: false,
      message: "Machine model not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: model,
  });
}

// Create a new machine model.
export async function createMachineModel(req, res) {
  const model = await machineModelService.createMachineModel(req.body);

  return res.status(201).json({
    success: true,
    message: "Machine model created successfully",
    data: model,
  });
}

// Update an existing machine model by its ID.
export async function updateMachineModel(req, res) {
  const model = await machineModelService.updateMachineModelValidated(
    req.params.id,
    req.body,
  );

  return res.status(200).json({
    success: true,
    message: "Machine model updated successfully",
    data: model,
  });
}

// Delete a machine model by its ID.
export async function deleteMachineModel(req, res) {
  await machineModelService.removeMachineModel(req.params.id);

  return res.status(204).end();
}
