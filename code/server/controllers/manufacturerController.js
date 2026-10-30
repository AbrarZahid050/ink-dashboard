import * as manufacturerService from "../services/manufacturerService.js";

export async function getAllManufacturers(req, res) {
  const manufacturers = await manufacturerService.findAllManufacturers();

  return res.status(200).json({
    success: true,
    count: manufacturers.length,
    data: manufacturers,
  });
}

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

export async function deleteManufacturer(req, res) {
  await manufacturerService.removeManufacturer(req.params.id);

  return res.status(204).end();
}
