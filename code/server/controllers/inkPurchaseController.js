import * as inkPurchaseService from "../services/inkPurchaseService.js";

// Retrieve purchase transactions matching query filters.
export async function getAllInkPurchases(req, res) {
  const purchases = await inkPurchaseService.findAllInkPurchases(req.query);

  return res.status(200).json({
    success: true,
    count: purchases.length,
    data: purchases,
  });
}

// Retrieve one purchase transaction by ID.
export async function getInkPurchaseById(req, res) {
  const purchase = await inkPurchaseService.findInkPurchaseById(req.params.id);

  if (!purchase) {
    return res.status(404).json({
      success: false,
      message: "Ink purchase not found.",
    });
  }

  return res.status(200).json({
    success: true,
    data: purchase,
  });
}

// Create a purchase transaction with its line items.
export async function createInkPurchase(req, res) {
  const purchase = await inkPurchaseService.createInkPurchase(req.body);

  return res.status(201).json({
    success: true,
    message: "Ink purchase created successfully.",
    data: purchase,
  });
}
