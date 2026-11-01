import * as inkModelService from "../services/inkModelService.js";

// Retrieve all ink models.
export async function getAllInkModels(req, res) {
  const inkModels = await inkModelService.findAllInkModels();

  return res.status(200).json({
    success: true,
    count: inkModels.length,
    data: inkModels,
  });
}

// Retrieve one ink model by its ID.
export async function getInkModelById(req, res) {
  const inkModel = await inkModelService.findInkModelById(req.params.id);

  if (!inkModel) {
    return res.status(404).json({
      success: false,
      message: "Ink model not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: inkModel,
  });
}

// Create a new ink model.
export async function createInkModel(req, res) {
  const inkModel = await inkModelService.createInkModel(req.body);

  return res.status(201).json({
    success: true,
    message: "Ink model created successfully",
    data: inkModel,
  });
}

// Update an existing ink model by its ID.
export async function updateInkModel(req, res) {
  const { version, ...data } = req.body;
  const inkModel = await inkModelService.updateInkModel(
    req.params.id,
    data,
    version,
  );

  return res.status(200).json({
    success: true,
    message: "Ink model updated successfully",
    data: inkModel,
  });
}

// Delete an ink model by its ID.
export async function deleteInkModel(req, res) {
  await inkModelService.removeInkModel(req.params.id);

  return res.status(204).end();
}
