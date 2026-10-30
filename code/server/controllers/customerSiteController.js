import * as customerSiteService from "../services/customerSiteService.js";

export async function getAllCustomerSites(req, res) {
  const sites = await customerSiteService.findAllCustomerSites();

  return res.status(200).json({
    success: true,
    count: sites.length,
    data: sites,
  });
}

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

export async function createCustomerSite(req, res) {
  const site = await customerSiteService.createCustomerSite(req.body);

  return res.status(201).json({
    success: true,
    message: "Customer site created successfully",
    data: site,
  });
}

export async function updateCustomerSite(req, res) {
  const site = await customerSiteService.updateCustomerSite(
    req.params.id,
    req.body,
  );

  return res.status(200).json({
    success: true,
    message: "Customer site updated successfully",
    data: site,
  });
}

export async function deleteCustomerSite(req, res) {
  await customerSiteService.removeCustomerSite(req.params.id);

  return res.status(204).end();
}
