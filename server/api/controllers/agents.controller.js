const fs = require("fs");
const path = require('path');
const async = require("async");

const env = require("../../env/enviroment");

let agentsService = require("../services/agents.service");
let snodeService = require("../services/snode.service");


module.exports = {
    /* The function will be called every time an agent is registering to the server (agent startup) */
    add: (req, res) => {
        agentsService.add(req.body).then(agent => {
            // add agent to follow list
            agentsService.followAgent(agent);
            // deploy all plugins on agents
            fs.readdir(path.join(env.static_cdn, env.upload_path), (err, files) => {
                if (err) {
                    console.log(err);
                }
                async.each(files,
                    function (plugin, callback) {
                        let filePath = path.join(env.static_cdn, env.upload_path, plugin);
                        agentsService.installPluginOnAgent(filePath, agent).then(() => {
                        }).catch((e) => {
                            console.log("Error installing on agent", e);
                        });
                        callback();
                    },
                    function (error) {
                        console.log(">", error);
                    });
                res.send('');
            })
        });
    },
    /* Delete an agent */
    delete: (req, res) => {
        agentsService.delete(req.params.id).then(() => {
            res.status(200).send('OK');
            req.io.emit('notification', { title: 'Agent deleted', message: ``, type: 'success' });
        }).catch(error => {
            req.io.emit('notification', { title: 'Whoops...', message: `Error deleting agent`, type: 'error' });
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
            req.io.emit('notification', { title: 'Whoops...', message: `Error finding agents`, type: 'error' });
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
    },
    /* update an agent */
    update: (req, res) => {
        let agent = req.body;
        delete agent._id;
        agentsService.update(req.params.id, agent).then((agent) => {
            req.io.emit('notification', { title: 'Update success', message: `${agent.name} updated successfully`, type: 'success' });
            return res.json(agent);
        }).catch(error => {
            req.io.emit('notification', { title: 'Whoops...', message: `Error updating agent`, type: 'error' });
            console.log("Error updating agent", error);
            res.status(500).send(error);
        });
    }


};
