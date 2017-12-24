const express = require("express");
const router = express.Router();

const mapController = require("../controllers/maps.controller");

router.get("/", mapController.filter);
router.post("/", mapController.filter);
router.post("/create", mapController.create);
router.get("/:id", mapController.detail);
router.get("/:id/execute", mapController.execute);
router.get("/:id/results", mapController.results);
router.get("/:id/results/logs", mapController.logs);
router.put("/:id/update", mapController.update);
router.get("/:id/structure", mapController.getMapStructure);
router.get("/:id/structures", mapController.getStructureList);
router.post("/:id/structure/create", mapController.createStructure);
router.get("/:id/structure/:structureId", mapController.getMapStructure);
router.get("/:id/triggers", mapController.triggersList);
router.post("/:id/triggers/create", mapController.triggerCreate);
router.delete("/:id/triggers/:triggerId/delete", mapController.triggerDelete);
router.put("/:id/triggers/:triggerId/update", mapController.triggerUpdate);



module.exports = router;