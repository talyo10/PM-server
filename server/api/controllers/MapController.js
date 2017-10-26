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
        MapService.addNewMap(req.body.parentId, req.body.map, function (err, map) {
            if (err)
                res.badRequest();
            else {
                JstreeService.MapToItem(map);
                res.json(map);
            }
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
      var mapId = req.param('mapId'),
          projectId = req.param('projectId');

      MapService.updateMapProject(req.param('mapId'), req.param('projectId')).then((map) => res.ok()).catch((error) => {
          sails.log.error("Error updating map", error)
          res.badRequest();
      })
    },
    updateMap : function (req,res) {
      var map = req.body.map;
      MapService.updateMap(map, function(err, resMap){
        if (err)
          res.badRequest();
        else
          res.json(resMap);
      });
    },
    duplicateMap: function (req, res) {
        var mapId = req.param('mapId');
        MapService.duplicateMap(req.body, mapId, function (err, map) {
            if (err) {
                res.badRequest();
            }
            else {
                JstreeService.MapToItem(map);
                res.json(map);
            }
        });
    },
    getVersions: function (req, res) {
        var mapId = req.param('mapId');
        MapService.getVersions(mapId, function (err, versions) {
            if (err)
                res.badRequest();
            else {
                res.json(versions);
            }

        });
    },
    getVersion: function (req, res) {
        var mapId = req.param('mapId');
        var versionId = req.param('versionId');
        MapService.getVersion(mapId, versionId, function (err, version) {
            if (err)
                res.badRequest();
            else
                res.json(version);
        });
    }
};

