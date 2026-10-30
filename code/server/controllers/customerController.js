import * as customerService from "../services/customerService.js";

export async function getAllCustomers(req, res) {
  const customers = await customerService.findAllCustomers();

  return res.status(200).json({
    success: true,
    count: customers.length,
    data: customers,
  });
}

export async function getCustomerById(req, res) {
  const customer = await customerService.findCustomerById(req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: "Customer not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: customer,
  });
}

export async function createCustomer(req, res) {
  const customer = await customerService.createCustomer(req.body.name);

  return res.status(201).json({
    success: true,
    message: "Customer created successfully",
    data: customer,
  });
}

export async function updateCustomer(req, res) {
  const customer = await customerService.updateCustomer(
    req.params.id,
    req.body.name,
  );

  return res.status(200).json({
    success: true,
    message: "Customer updated successfully",
    data: customer,
  });
}

export async function deleteCustomer(req, res) {
  await customerService.removeCustomer(req.params.id);

  return res.status(204).end();
}
