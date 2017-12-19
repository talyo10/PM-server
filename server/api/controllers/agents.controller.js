const fs = require("fs");
const path = require('path');
const async = require("async");

const env = require("../../env/enviroment");

let agentsService = require("../services/agents.service");


module.exports = {
    /* The function will be called every time an agent is registering to the server (agent startup) */
    add: (req, res) => {
        agentsService.add(req.body).then(agent => {
            // add agent to follow list
            agentsService.followAgent(agent);
            // deploy all plugins on agents
            fs.readdir(path.join(env.static_cdn, env.upload_path), (err, files) => {
                async.each(files,
                    function (plugin, callback) {
                        let filePath = path.join(env.static_cdn, env.upload_path, plugin);
                        agentsService.installPluginOnAgent(filePath, agent);
                        callback();
                    },
                    function (err) {
                    });
                res.send('');
            }).catch(error => {
                console.log("Error registering agent", error);
            });
        });
    },
    /* Delete an agent */
    delete: (req, res) => {
        agentsService.delete(req.params.id).then(() => {
            res.status(200).send('');
        }).catch(error => {
            console.log("Error deleting agent", error);
            res.status(500).send(error);
        });
        agentsService.unfollowAgent(req.params.id);
    },
    /* Get all agents list */
    list: (req, res) => {
        agentsService.filter({}).then(agents => {
            res.json(agents);
        }).catch(error => {
            console.log("Error filtering agents", error);
            res.status(500).send(error);
        });
    },
    /* Get agents status */
    status: (req, res) => {
        let status = agentsService.agentsStatus();
        if (status) {
            for (let i in status) {
                delete status[i].intervalId;
                return res.json(status);
            }
        }
        return res.send('');
    }

};
