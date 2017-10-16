/**
 * Base-agentController
 *
 * @description :: Server-side logic for managing base-agents
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var hooks = require('../services/HooksService').hooks;

module.exports = {
    deleteAgent: function (req, res) {
        BaseAgentsService.deleteBaseAgent(req.param('id'), function (err) {
            if (err)
                res.badRequest(err);
            else {
                hooks.deleteServer(req.user, {name: req.param('id')});   
                res.ok();
            }
        });
    },
    deleteGroup: function (req, res) {
        BaseAgentsService.deleteGroup(req.param('id'), function (err) {
            if (err)
                res.badRequest(err);
            else {
                hooks.deleteServerGroup(req.user, {name: req.param('id')});
                res.ok();
            }
        });
    },
    addGroup: function (req, res) {
        BaseAgentsService.addGroup(req.body.parentId, req.body.name, function (err, node) {
            if (err)
                res.badRequest(err);
            else {
                hooks.addServerGroup(req.user, node);   
                res.send(node);
            }
        });
    },
    getAgentsState: function(req, res) {
        sails.log.debug("get agent state");
        BaseAgentsService.getAgentsState(function (agents) {
            var resAgents = {};
            for(var prop in agents){
                var agent = agents[prop];
                resAgents[prop] = {alive: agent.alive, hostname: agent.hostname, freeSpace: agent.freeSpace, arch: agent.arch, respTime: agent.respTime};
            }
            res.status(200);
            res.send(resAgents);
        });
    },
    addAgent: function (req, res) {
        BaseAgentsService.addBaseAgent(req.body, function (err, agent) {
            sails.log.error(err);
            if (err)
                res.badRequest(err);
            else {
                hooks.addServer(req.user, agent);
                res.send(agent);
            }
        });
    },
    updateAgent:function(req,res){
        BaseAgentsService.updateBaseAgent(req.body.parentId, req.body.agent, function (err, agent) {
            if (err)
                res.badRequest();
            else
                res.ok();
        });
    },
    updateGroup:function(req,res){
        BaseAgentsService.updateGroup(req.body, function (err, snode) {
            if (err)
                res.badRequest();
            else
                res.send(snode);
        });
    },
    getNode: function (req, res) {
        BaseAgentsService.getNode(req.param('id'), function (err, node) {
            if (err)
                res.badRequest();
            else
                res.json(node);
        });
    },
    getAgents:function(req,res){
        BaseAgentsService.getAgents(function (err, agents) {
            if (err)
                res.badRequest();
            else
                res.send(agents);
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

