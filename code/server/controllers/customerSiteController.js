import * as customerSiteService from "../services/customerSiteService.js";

// Retrieve all customer sites.
export async function getAllCustomerSites(req, res) {
  const sites = await customerSiteService.findAllCustomerSites();

  return res.status(200).json({
    success: true,
    count: sites.length,
    data: sites,
  });
}

// Retrieve one customer site by its ID.
export async function getCustomerSiteById(req, res) {
  const site = await customerSiteService.findCustomerSiteById(req.params.id);

  if (!site) {
    return res.status(404).json({
      success: false,
      message: "Customer site not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: site,
  });
}

// Create a new customer site.
export async function createCustomerSite(req, res) {
  const site = await customerSiteService.createCustomerSite(req.body);

  return res.status(201).json({
    success: true,
    message: "Customer site created successfully",
    data: site,
  });
}

// Update an existing customer site by its ID.
export async function updateCustomerSite(req, res) {
  const { version, ...data } = req.body;

  const site = await customerSiteService.updateCustomerSite(
    req.params.id,
    data,
    version,
  );

  return res.status(200).json({
    success: true,
    message: "Customer site updated successfully",
    data: site,
  });
}

// Delete a customer site by its ID.
export async function deleteCustomerSite(req, res) {
  await customerSiteService.removeCustomerSite(req.params.id);

  return res.status(204).end();
}
