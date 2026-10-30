import * as manufacturerService from "../services/manufacturerService.js";

// Retrieve all manufacturers.
export async function getAllManufacturers(req, res) {
  const manufacturers = await manufacturerService.findAllManufacturers();

  return res.status(200).json({
    success: true,
    count: manufacturers.length,
    data: manufacturers,
  });
}

// Retrieve one manufacturer by its ID.
export async function getManufacturerById(req, res) {
  const manufacturer = await manufacturerService.findManufacturerById(
    req.params.id,
  );

  if (!manufacturer) {
    return res.status(404).json({
      success: false,
      message: "Manufacturer not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: manufacturer,
  });
}

// Create a new manufacturer.
export async function createManufacturer(req, res) {
  const manufacturer = await manufacturerService.createManufacturer(
    req.body.name,
  );

  return res.status(201).json({
    success: true,
    message: "Manufacturer created successfully",
    data: manufacturer,
  });
}

// Update an existing manufacturer by its ID.
export async function updateManufacturer(req, res) {
  const manufacturer = await manufacturerService.updateManufacturer(
    req.params.id,
    req.body.name,
  );

  return res.status(200).json({
    success: true,
    message: "Manufacturer updated successfully",
    data: manufacturer,
  });
}

// Delete a manufacturer by its ID.
export async function deleteManufacturer(req, res) {
  await manufacturerService.removeManufacturer(req.params.id);

  return res.status(204).end();
}
