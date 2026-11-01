import * as inkProductService from "../services/inkProductService.js";

// Retrieve all ink products.
export async function getAllInkProducts(req, res) {
  const inkProducts = await inkProductService.findAllInkProducts();

  return res.status(200).json({
    success: true,
    count: inkProducts.length,
    data: inkProducts,
  });
}

// Retrieve one ink product by its ID.
export async function getInkProductById(req, res) {
  const inkProduct = await inkProductService.findInkProductById(req.params.id);

  if (!inkProduct) {
    return res.status(404).json({
      success: false,
      message: "Ink product not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: inkProduct,
  });
}

// Create a new ink product.
export async function createInkProduct(req, res) {
  const inkProduct = await inkProductService.createInkProduct(req.body);

  return res.status(201).json({
    success: true,
    message: "Ink product created successfully",
    data: inkProduct,
  });
}

// Update an existing ink product by its ID.
export async function updateInkProduct(req, res) {
  const { version, ...data } = req.body;
  const inkProduct = await inkProductService.updateInkProduct(
    req.params.id,
    data,
    version,
  );

  return res.status(200).json({
    success: true,
    message: "Ink product updated successfully",
    data: inkProduct,
  });
}

// Delete an ink product by its ID.
export async function deleteInkProduct(req, res) {
  await inkProductService.removeInkProduct(req.params.id);

  return res.status(204).end();
}
