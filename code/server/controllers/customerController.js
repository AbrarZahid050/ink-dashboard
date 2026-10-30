import * as customerService from "../services/customerService.js";

// Retrieve all customers.
export async function getAllCustomers(req, res) {
  const customers = await customerService.findAllCustomers();

  return res.status(200).json({
    success: true,
    count: customers.length,
    data: customers,
  });
}

// Retrieve one customer by its ID.
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

// Create a new customer.
export async function createCustomer(req, res) {
  const customer = await customerService.createCustomer(req.body.name);

  return res.status(201).json({
    success: true,
    message: "Customer created successfully",
    data: customer,
  });
}

// Update an existing customer by its ID.
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

// Delete a customer by its ID.
export async function deleteCustomer(req, res) {
  await customerService.removeCustomer(req.params.id);

  return res.status(204).end();
}
