let mapsService = require("../services/maps.service");
let projectsService = require("../services/projects.service");
let mapsExecutionService = require("../services/map-execution.service");
let triggersService = require("../services/triggers.service");
let scheduledJobs = require("../services/scheduled-job.service");


module.exports = {
    create: (req, res) => {
        // create the map object.
        if (!req.body || Object.keys(req.body).length === 0 || !req.body.name) {
            return res.status(400).send("Bad request: No map was sent.");
        }
        mapsService.create(req.body).then((map) => {
            projectsService.addMap(req.body.project, map._id).then(() => {
                res.json(map);
            });
        }).catch((error) => {
            console.log("Error creating map: ", error);
            res.status(500).send(error);
        })
    },

    detail: (req, res) => {
        mapsService.get(req.params.id).then((map) => {
            return res.status(200).json(map);
        }).catch((error) => {
            console.log("Error finding map: ", error);
            return res.status(500).json(error);
        });
    },
    filter: (req, res) => {
        let query = req.query;
        mapsService.filter(query).then((maps) => {
            return res.status(200).json(maps);
        }).catch((error) => {
            console.log("Error filtering maps: ", error);
            return res.status(500).json(error);
        });
    },
    getMapStructure: (req, res) => {
        mapsService.getMapStructure(req.params.id, req.params.structureId).then((structure) => {
            if (structure)
                return res.json(structure);
            else
                return res.send('');
        }).catch((error) => {
            console.log("Error finding map version: ", error);
            return res.status(500).json(error);
        });
    },
    update: (req, res) => {
        mapsService.update(req.body).then(map => {
            return res.send('');
        }).catch((error) => {
            console.log("Error updating map: ", error);
            return res.status(500).json(error);
        });
    },

    /* structure */
    /* create new structure */
    createStructure: (req, res) => {
        let mapId = req.params.id;
        req.body.map = mapId;
        mapsService.createStructure(req.body).then(structure => {
            res.json(structure)
        }).catch((error) => {
            console.log("Error creating map structure: ", error);
            res.status(500).send(error);
        })
    },
    getStructureList: (req, res) => {
        mapsService.structureList(req.params.id).then(structures => {
            res.json(structures)
        }).catch((error) => {
            console.log("Error finding map structures: ", error);
            res.status(500).send(error);
        })
    },

    /* execution */
    /* execute a map */
    execute: (req, res) => {
        mapsExecutionService.execute(req.params.id, null, null, req.io).then((r) => {
            res.json(r);
        }).catch(error => {
            console.log("Error executing map: ", error);
            return res.status(500).json(error);
        });
    },

    logs: (req, res) => {
        mapsExecutionService.logs(req.params.id).then((results) => {
            res.json(results);
        }).catch(error => {
            console.log("Error getting execution results: ", error);
            return res.status(500).json(error);
        });
    },

    results: (req, res) => {
        mapsExecutionService.results(req.params.id).then((results) => {
            res.json(results);
        }).catch(error => {
            console.log("Error getting execution results: ", error);
            return res.status(500).json(error);
        });
    },

    /* triggers */
    /* create trigger */
    triggerCreate: (req, res) => {
        triggersService.create(req.params.id, req.body).then(trigger => {
            return res.json(trigger);
        }).catch((error) => {
            console.log("Error getting map's triggers: ", error);
            return res.status(500).json(error);
        });
    },
    /* delete a trigger */
    triggerDelete: (req, res) => {
        triggersService.delete(req.params.triggerId).then(() => {
            return res.send("OK");
        }).catch((error) => {
            console.log("Error getting map's triggers: ", error);
            return res.status(500).json(error);
        });
    },
    /* get triggers list for given map */
    triggersList: (req, res) => {
        triggersService.list(req.params.id).then(triggers => {
            return res.json(triggers);
        }).catch((error) => {
            console.log("Error getting map's triggers: ", error);
            return res.status(500).json(error);
        });
    },
    /* update a trigger */
    triggerUpdate: (req, res) => {
        triggersService.update(req.params.triggerId, req.body).then(trigger => {
            return res.json(trigger);
        }).catch((error) => {
            console.log("Error updating triggers: ", error);
            return res.status(500).json(error);
        });
    },

    /* scheduled jobs
     * TODO: change to standalone plugin (that is old implantation)
     * */
    addJob: (req, res) => {
        scheduledJobs.addJob(req.body).then((job) => {
            return res.json(job);
        }).catch((error) => {
            return res.status(500).send(error);
        });
    },
    getFutureJobs: (req, res) => {
        scheduledJobs.getFutureJobs().then((jobs) => {
            res.send(jobs);
        }).catch((error) => {
            return res.status(500).send(error);
        });
    },
    deleteJob: (req, res) => {
        scheduledJobs.deleteJob(req.param('id')).then(() => {
            return res.status(200).send('OK');
        }).catch((error) => {
            return res.status(500).send(error);
        });
    },
    updateJob: function (req, res) {
        scheduledJobs.updateJob(req.body).then((job) => {
            return res.json(job[0]);
        }).catch((error) => {
            return res.status(500).send(error);
        });
    }
};