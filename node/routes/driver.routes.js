// node/routes/driver.routes.js
// UPDATED: Added contact us route

const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");

// Import controllers
const UserController = require("../controllers/user.controller");
const RideController = require("../controllers/ride.controller");
const VehicleController = require("../controllers/vehicle.controller");
const DocumentController = require("../controllers/document.controller");
const ContactController = require("../controllers/contact.controller");

// Apply middleware
router.use(verifyToken);
router.use(requireRole("driver"));

// USER ROUTES
router.get("/profile", UserController.getProfile);
router.put("/profile", UserController.updateProfile);
router.get("/stats", UserController.getStats);

// DOCUMENT ROUTES
router.get("/documents", DocumentController.getDocuments);
router.post("/update-license", DocumentController.updateLicense);
router.post("/update-orcr", DocumentController.updateOrcr);

// RIDE ROUTES
router.post("/rides", RideController.create);
router.get("/rides", RideController.getByUser);
router.get("/rides/history", RideController.getHistory);
router.get("/rides/active", RideController.getActive);
router.get("/rides/:rideId", RideController.getById);
router.put("/rides/:rideId", RideController.update);
router.post("/rides/:rideId/cancel", RideController.cancel);

// VEHICLE ROUTES
router.get("/vehicles", VehicleController.getByDriver);
router.get("/vehicles/:vehicleId", VehicleController.getById);
router.post("/vehicles", VehicleController.register);
router.put("/vehicles/:vehicleId", VehicleController.update);
router.delete("/vehicles/:vehicleId", VehicleController.delete);

// CONTACT US ROUTE
router.post("/contact", ContactController.submitMessage);

module.exports = router;