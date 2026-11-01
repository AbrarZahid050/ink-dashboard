import * as inkLotService from "../services/inkLotService.js";

// Retrieve all ink lots.
export async function getAllInkLots(req, res) {
  const inkLots = await inkLotService.findAllInkLots();

  return res.status(200).json({
    success: true,
    count: inkLots.length,
    data: inkLots,
  });
}

// Retrieve one ink lot by its ID.
export async function getInkLotById(req, res) {
  const inkLot = await inkLotService.findInkLotById(req.params.id);

  if (!inkLot) {
    return res.status(404).json({
      success: false,
      message: "Ink lot not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: inkLot,
  });
}

// Create a new ink lot.
export async function createInkLot(req, res) {
  const inkLot = await inkLotService.createInkLot(req.body);

  return res.status(201).json({
    success: true,
    message: "Ink lot created successfully",
    data: inkLot,
  });
}

// Update an existing ink lot by its ID.
export async function updateInkLot(req, res) {
  const { version, ...data } = req.body;
  const inkLot = await inkLotService.updateInkLot(
    req.params.id,
    data,
    version,
  );

  return res.status(200).json({
    success: true,
    message: "Ink lot updated successfully",
    data: inkLot,
  });
}

// Delete an ink lot by its ID.
export async function deleteInkLot(req, res) {
  await inkLotService.removeInkLot(req.params.id);

  return res.status(204).end();
}
