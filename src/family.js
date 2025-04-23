// import { findFamilyNameByfamily_id } from "./lib/storage/mongo.js";

// Get all devices belonging to the family
// async function getFamilyNameByfamily_id(req, res, next) {
//   try {
//     const { family_id } = req.params;
//     if (!family_id) {
//       return res.status(401).json({ message: "family_id is required" });
//     }
//     const familyName = await findFamilyNameByfamily_id(family_id);
//     //console.log(devices);
//     if (familyName == null) {
//       return res.status(404).json({ message: "family name not found" });
//     }
//     return res.json({ message: "familyName fetched successfully", familyName });
//   } catch (error) {
//     next(error);
//   }
// }
// export { getFamilyNameByfamily_id };