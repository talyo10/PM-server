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
            });
    },
    addMapVersion: function (req, res) {
        MapService.addMapVersion(req.body).then((version) => {
                    res.json(version);
                }).catch((error) => {
                    sails.log.error("Error adding map version", error);
                    res.badRequest();
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
    getAgents: function (req, res) { 
        MapAgentService.getAgentsForMap(req.param('id')).then((agents) => {
                console.log("Sending agents");
                res.json(agents);
            }).catch((error) => {
                sails.log.error("Error getting agents", error);
                res.badRequest();
            })
    },
    updateVersionStatus:function(req,res){
        var mapId = req.body.map.id;
        var versionIndex = req.body.map.versionIndex;

        MapService.updateVersionStatus(mapId, versionIndex, req.body.status).then((result) => {
                if(result === true) {
                    res.ok();
                } else {
                    res.badRequest();
                }
            }).catch((error) => {
                sails.log.error("Error updating status", error);
                res.badRequest();
            });
    },
    updateMapProject : function (req,res) {
      MapService.updateMapProject(req.param('mapId'), req.param('projectId')).then((map) => res.ok()).catch((error) => {
          sails.log.error("Error updating map", error)
          res.badRequest();
      })
    },
    mapUpdate: function (req, res) {
        MapService.mapUpdate(req.param('id'), req.body.map).then((map) => {
            res.json(map);
        }).catch((error) => {
            sails.log.error("Error updating map", error);
        });

        TNode.update({ map: req.param('id')}, { name: req.body.map.name }).catch((error) => {
            sails.log.error("Error tnode map", error);
        });
    },
    updateMap : function (req, res) {
        MapService.updateMap(req.body.map).then((map) => {
            res.json(map);
        }).catch((error) => {
            sails.log.error("Error updating map", error);
        })
    },
    updateMapAgents: function(req, res) {
        console.log("** in update map agents **")
        if (req.body.agents) {
            MapAgentService.updateMapAgents(req.param('id'), req.body.agents)
            .then((agents) => res.json(agents))
            .catch((error) => {
                console.log("Error updating map agents", error);
                res.badRequest();
            })
        } else {
            MapAgent.destroy({ map: req.param('id')}).then(() => {
                res.json();
            }).catch((error) => {
                console.log("Error updating map agents", error);
                res.badRequest();
            })
        }
       
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
            res.json(versions);
        }).catch((error) => {
            sails.log.error("Error getting versions", error);
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
    },
    getMapExecutionsList: function(req, res) { 
        ExecutionService.getExecuitionsByMap(req.param('id')).then((executions) => {
                res.json(executions);
            }).catch((error) => {
                sails.log.error("Error getting execution". error);
                console.log(error);
                res.badRequest();
            })
    }
};

