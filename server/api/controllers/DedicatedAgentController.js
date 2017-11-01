/**
 * DedicatedAgentController
 *
 * @description :: Server-side logic for managing dedicatedagents
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async');
var fs = require('fs');
var unzip = require('unzip');
var streams = require('memory-streams');
var request = require('request');
var path = require('path');

module.exports = {

	deleteHook: function(req, res) {
		HooksService.deleteHook(req.param('id')).then(() => {
				res.ok()
			}).catch((error) => {
				sails.log.error("Error deleting hook", error);
				res.badRequest();
			});
	},

	addHooks: function(req, res) {
		systemHooks = {};
		var filename;
		try {
			filename = req.file('file')._files[0].stream.filename;

		} catch (error) {
			sails.log.error("can't read file " + error);
			return res.badRequest('No file was uploaded ' + error);
		}
		req.file('file').upload({
			dirname: path.join(sails.config.appPath, ".tmp", "uploads", filename),
			// don't allow the total upload size to exceed ~10MB
			maxBytes: 10000000
		}, function whenDone(err, uploadedFiles) {
			if (err) {
				return res.negotiate(err);
			}

			// If no files were uploaded, respond with an error.
			if (uploadedFiles.length === 0){
				return res.badRequest('No file was uploaded');
			}

			async.each(uploadedFiles, function(upFile, callback){
				HooksService.addSystemHook(req.user, upFile.fd, function(err, name) {
					if (err) {
						return callback(err);
					}
					systemHooks[name] = upFile;
					return callback();
				});
			},
			function(err) {
				if (err) {
					res.badRequest(err);
				}
				for (var name in systemHooks) {
					if (systemHooks.hasOwnProperty(name)) {
						var hookFile = systemHooks[name];
						fs.readdir(path.join(sails.config.appPath, ".tmp", "uploads", hookFile.filename), (err, files) => {
							var hookFileName = files[0];
							fs.rename(path.join(sails.config.appPath, ".tmp", "uploads", hookFile.filename, name), path.join(HooksService.modulesPath, name), function(err){
								if (err) {
									sails.log.error("Can't load plugin file: " + err);
								}
							});
						})
					}
				}
				res.ok();
			});
		});
	},

	getHooks: function(req, res) {
		SystemHook.find({}).then((hooks) => {
				res.json(hooks);
			}).catch((error) => {
				sails.log.error("Error loading system hooks", error);
				res.badRequest();
			});
	},

	installAgents: function (req, res) {
	  /* Installing agent on server and agents */
		let filename;
		try {
      // trying get filename
			filename = req.file('file')._files[0].stream.filename;
		} catch (error) {
			sails.log.error("can't read file " + error);
			return res.badRequest('No file was uploaded ' + error);
		}
		// configuring file upload
		req.file('file').upload({
			dirname: path.join(sails.config.appPath, ".tmp", "uploads", filename),
			// don't allow the total upload size to exceed ~10MB
			maxBytes: 10000000
		}, function whenDone(err, uploadedFiles) {
			if (err) {
				return res.negotiate(err);
			}

			// If no files were uploaded, respond with an error.
			if (uploadedFiles.length === 0){
				return res.badRequest('No file was uploaded');
			}

			let agentsNames = {};
			async.each(uploadedFiles, function(upFile, callback){
        // for earch file uploaded, send to add dedicated agent
				DedicatedAgentService.addDedicatedAgent(req.user, upFile.fd, function(err) {
					if (err) {
						return callback(err);
					}
					agentsNames[agent.type] = upFile;
				});
			},
			function(err) {
				if (err) {
					res.badRequest(err);
				}
				for (let agentName in agentsNames) {
					if (agentsNames.hasOwnProperty(agentName)) {
						let agentFile = agentsNames[agentName];
						fs.readdir(path.join(sails.config.appPath, ".tmp", "uploads", agentFile.filename), (err, files) => {
							let agentFileName = files[0];
							fs.rename(path.join(sails.config.appPath, ".tmp", "uploads", agentFile.filename, agentFileName), path.join(BaseAgentsService.modulesPath, agentName), function(err){
								if (err) {
									sails.log.error("Can't load plugin file: " + err);
								}
							});
						})
					}
				}
				BaseAgentsService.getAgentsState(function (agents) {
					async.each(
						agents,
						BaseAgentsService.installPluginsOnAgent,
						function (err) {
							res.ok();
						}
					);
				});
			});
		});
	},

	getAllAgents: function (req, res) {
		sails.log.info("Get all agents");
		DedicatedAgent.find().populate('methods').then((agents) => {
				async.map(agents, function(agent, agentsback) {
					async.map(agent.methods, function(method, methodback) {
						Method.findOne({id: method.id}).populate('params').exec(function(err, methodObj){
							methodback(err, methodObj);
						});
					}, function(err, results){
						if (err) {
							return res.badRequest(err);
						}
						var nAgent = JSON.parse(JSON.stringify(agent));
						nAgent.methods = results;
						agentsback(null, nAgent);
					});
				}, function(err, results){
					if (err) {
						return res.badRequest(err);
					}
					res.json(results);
				});
			}).catch((error) => {
				sails.log.error("Error getting agents", error);
				res.badRequest();
			});

    }
};

