/**
 * Base-agentController
 *
 * @description :: Server-side logic for managing base-agents
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var hooks = require('../services/HooksService').hooks;

module.exports = {
    deleteAgent: function (req, res) {
        BaseAgentsService.deleteBaseAgent(req.param('id')).then(() => {
                hooks.deleteServer(req.user, {name: req.param('id')});   
                res.ok();
            }).catch((error) => {
                sails.log.error("Error deleting agent", error);
                res.badRequest();
            });
    },
    deleteGroup: function (req, res) {
        BaseAgentsService.deleteGroup(req.param('id')).then(() => {
                hooks.deleteServerGroup(req.user, {name: req.param('id')});
                res.ok();
            }).catch((error) => {
                sails.log.error("Error deleting group", error);
                res.badRequest();
            })
    },
    addGroup: function (req, res) {
        BaseAgentsService.addGroup(req.body.parentId, req.body.name).then((node) => {
                hooks.addServerGroup(req.user, node);   
                res.send(node);
            }).catch((error) => {
                sails.log.error("Error creating group", error);
                res.badRequest(error);
                
            });
    },
    getAgentsState: function(req, res) {
        sails.log.debug("get agent state");
        var agents = BaseAgentsService.getAgentsState()
        res.status(200);
        res.send(agents);
    },
    addAgent: function (req, res) {
        BaseAgentsService.addBaseAgent(req.body).then((agent) => {
            hooks.addServer(req.user, agent);
            res.send(agent);
        }).catch((error) => {
            sails.log.error(error);
            res.badRequest();
        })
       
    },
    updateAgent:function(req,res){
        BaseAgentsService.updateBaseAgent(req.body.parentId, req.body.agent).then((agent) => {
                res.ok();
            }).catch((error) => {
                sails.log.error("Error updating agent", error);
                res.badRequest();
                
            });
    },
    updateGroup:function(req,res){
        BaseAgentsService.updateGroup(req.body).then((node) => {
                res.send(node);
            }).catch((error) => {
                sails.log.error("Error updating agent", error);
                res.badRequest();
            })
    },
    getNode: function (req, res) {
        BaseAgentsService.getNode(req.param('id')).then((node) => {
                res.json(node);
                
            }).catch((error) => {
                sails.log.error("Error getting node data", error);
                res.badRequest();
            });

    },
    getAgents:function(req,res){
        BaseAgentsService.getAgents().then((nodes) => {
                res.send(nodes);
            }).catch((error) => {
                sails.log.error("Error getting nodes", error);
                res.badRequest();
            });
    },
    installAgent:function(req,res){
        BaseAgentsService.installAgent(req, req.body, function (err) {
            if (err)
                res.badRequest();
            else
                res.ok();
        });
    },
    registerDedicated: function(req, res){
        var baseAgentName = req.body.base;
        var dedicatedAgentType = req.body.dedicated;
        var dedicatedUrl = req.body.url;

        if(!baseAgentName || ! dedicatedAgentType || !dedicatedUrl){
            return res.badRequest('"Error": not enough parameters');
        }

        BaseAgent.findOne({name: baseAgentName}).then(function (baseAgent, error){
            if(error){
                sails.log.error(error);
                return res.badRequest('"Error": no agent ' + error);
            }
            for (var i = baseAgent.dedicatedAgents.length - 1; i >= 0; i--) {
                var dedicated = baseAgent.dedicatedAgents[i];
                if(dedicated.type === dedicatedAgentType){
                    dedicated.url = dedicatedUrl;
                    break;
                }
            };
            if(i < 0){
                var newDedicated = {
                    type: dedicatedAgentType,
                    url: dedicatedUrl
                };
                baseAgent.dedicatedAgents.push(newDedicated);
            }
            BaseAgentsService.updateBaseAgent(baseAgent, function (err, agent) {
                if (err)
                    res.badRequest();
                else
                    res.ok();
            });
        });
    }
};

