// **** Import necessary dependencies ****
import { findDevicesByfamily_id } from "./lib/storage/mongo.js";

// Get all devices belonging to the family
async function getDeviceListByfamily_id(req, res, next) {
  try {
    const { family_id } = req.params;
    if (!family_id) {
      return res.status(401).json({ message: "family_id is required" });
    }
    const devices = await findDevicesByfamily_id(family_id);
    //console.log(devices);
    if (devices == null) {
      return res.status(404).json({ message: "Family not found" });
    }
    return res.json({ message: "Devices fetched successfully", devices });
  } catch (error) {
    next(error);
  }
}
export { getDeviceListByfamily_id };
