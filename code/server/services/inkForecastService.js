import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";

const forecastingServiceUrl = (
  process.env.FORECASTING_SERVICE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export async function generateInkForecast({
  customerId,
  machineModelId,
  inkModelId,
  horizonMonths,
}) {
  const [customer, machineModel, inkModel] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    }),
    prisma.machineModel.findUnique({
      where: { id: machineModelId },
      select: {
        id: true,
        modelName: true,
        manufacturer: { select: { name: true } },
      },
    }),
    prisma.inkModel.findUnique({
      where: { id: inkModelId },
      select: {
        id: true,
        inkName: true,
        manufacturer: { select: { name: true } },
      },
    }),
  ]);

  if (!customer) {
    throw new ApiError(404, "Customer not found.");
  }
  if (!machineModel) {
    throw new ApiError(404, "Machine model not found.");
  }
  if (!inkModel) {
    throw new ApiError(404, "Ink model not found.");
  }

  // Query purchase lines across every physical machine of this model
  // currently associated with the selected customer.
  const purchaseItems = await prisma.inkPurchaseItem.findMany({
    where: {
      inkPurchase: { customerId },
      machine: { machineModelId },
      inkProduct: { inkModelId },
    },
    select: {
      quantity: true,
      inkPurchase: { select: { purchasedAt: true } },
      inkProduct: { select: { color: true } },
    },
    orderBy: { inkPurchase: { purchasedAt: "asc" } },
  });

  if (purchaseItems.length === 0) {
    throw new ApiError(
      404,
      "No purchase history found for this customer, machine model and ink model.",
    );
  }

  // Keep each purchase line separate. The Python service aggregates
  // quantities by month and colour, including lines from multiple machines.
  const payload = {
    client_id: customerId,
    machine_model: machineModel.modelName,
    ink_model: inkModel.inkName,
    horizon_months: horizonMonths,
    history: purchaseItems.map((item) => ({
      purchased_at: item.inkPurchase.purchasedAt.toISOString().slice(0, 10),
      color: item.inkProduct.color,
      quantity: item.quantity,
    })),
  };

  let response;
  try {
    response = await fetch(`${forecastingServiceUrl}/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(503, "Forecasting service is unavailable.");
  }

  if (!response.ok) {
    throw new ApiError(502, "Forecasting service returned an error.");
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError(502, "Forecasting service returned an invalid response.");
  }
}
