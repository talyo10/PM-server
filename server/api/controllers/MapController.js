/**
 * ProjectController
 *
 * @description :: Server-side logic for managing Projects
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    deleteMap: function (req, res) {
        MapService.deleteMap(req.param('id')).then(res.ok()).catch((error) => {
            sails.log.error("Error deleting map", error);
            res.badRequest();
        });
    },
    getRenderedMapById: function (req, res) {
        MapService.getRenderedMapById(req.param('id')).then((map) => {
            res.json(map);
        }).catch((error) => {
            sails.log.error("Failed loading map", error);
            res.badRequest();
        })
    },
    addMapVersion: function (req, res) {
        MapService.addMapVersion(req.body, function (err, version, map) {
            if (err)
                res.badRequest();
            else
                res.json(version);
        });
    },
    addNewMap: function (req, res) {
        MapService.addNewMap(req.body.parentId, req.body.map).then((node) => {
            res.json(node);
        }).catch((error) => {
            sails.log.error("Error creating new map", error);
            res.badRequest()
        });
    },
    updateVersionStatus:function(req,res){
        var mapId = req.body.map.id,
            versionIndex = req.body.map.versionIndex;
        MapService.updateVersionStatus(mapId, versionIndex, req.body.status, function (err) {
            if (err)
                res.badRequest();
            else
                res.ok();
        });
    },
    updateMapProject : function (req,res) {
      MapService.updateMapProject(req.param('mapId'), req.param('projectId')).then((map) => res.ok()).catch((error) => {
          sails.log.error("Error updating map", error)
          res.badRequest();
      })
    },
    updateMap : function (req,res) {
        MapService.updateMap(req.body.map).then((map) => {
            res.json(map);
        }).catch((error) => {
            sails.log.error("Error updating map", map);
        })
    },
    duplicateMap: function (req, res) {
        var mapId = req.param('mapId');


        MapService.duplicateMap(req.body, mapId).then((map) => {
            res.json(map);
        }).catch((error) => {
            sails.log.error("Error duplicating map", error);
            res.badRequest();
        })

    },
    getVersions: function (req, res) {
        MapService.getVersions(req.param('mapId')).then((versions) => {
            res.json(version);
        }).catch((error) => {
            sails.log.error("Error getting versions");
            res.badRequest();
        })
    },
    getVersion: function (req, res) {
        MapService.getVersion(req.param('mapId', req.param('versionId'))).then((version) => {
            res.json(version);
        }).catch((error) => {
            sails.log.error("Error getting version", error);
            res.badRequest();
        });
    }
};

