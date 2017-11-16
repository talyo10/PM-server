/**
 * TriggerController
 *
 * @description :: Server-side logic for managing Triggers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var gitrepo = require('../../repos/git-cli');
const crypto = require('crypto');
var _ = require("lodash");

var triggersParser = {
	github: function (userId, trigger, res) {
		sails.log.info("Got github registeration");
		Trigger.update({ id: trigger.id }, { on: false }).exec(function (err, updatedTrigger) {
			if (err) {
				return res.json({ stat: "bad" });
			}
			return res.json({ stat: "ok" });
		});
	},
	git: function (userId, trigger, res) {
		sails.log("starting git");
		var repoPath = trigger.params.serverUrl.text;
		var branch = trigger.params.branch.text;
		sails.log.info("Success cloning git !!!!!! " + repoPath + "  " + branch);
		User.findOne({ id: userId }).then(function (user, err) {
			if (!err) {
				sails.log.debug("check repo!!!");
				gitrepo.checkRepo(user.username, repoPath, branch, function (obj) {
					if (obj.err) {
						return res.json({ stat: "bad" });
					}
					else {
						trigger.folder = obj.res;
						trigger.on = true;
						Trigger.update({ id: trigger.id }, trigger).then(function (triggerRes, err) {
							if (err) {
								sails.log.error(err);
							}
							else {
								sails.log.debug("Success updating trigger");
							}
							return res.json({ stat: "ok" });
						});
					}
				});
			}
			else {
				sails.log.debug("failed!!!");
			}
		});
	}
};

module.exports = {

	githubPush: function (req, res) {
		SystemLogService.createGeneralLog("Github hook started", "trigger", "info");

		let githubPush = req.body;
		let url = githubPush.repository.clone_url;
		let branch = githubPush.ref.slice(11); // get only the branch name

		let signature = req.get("X-Hub-Signature") ? req.get("X-Hub-Signature").slice(5) : null;

		Trigger.find({ type: 'github', 'params.serverUrl.text': url }).then((triggers) => {
			console.log(triggers.length);
			// var triggers = _.filter(triggers, function (t) {
			// 	return t.params.serverUrl.text === url;
			// });

			if (!triggers)
				return res.ok();

			triggers.forEach((trigger) => new Promise((resolve, reject) => {
				if (signature && !trigger.params.secret.text) {
					reject("Secret was expected yet none provided");
				}
				else if (signature && trigger.params.secret.text) {

					const hmac = crypto.createHmac('SHA1', trigger.params.secret.text);
					hmac.on('readable', () => {
						const data = hmac.read();
						if (data) {
							let hash = data.toString('hex');
							if (!(hash === signature)) {
								reject("The signature doesn't match the trigger's secret");
							} else {
								resolve(trigger);
							}
						}
					});
					hmac.write(JSON.stringify(req.body));
					hmac.end();

				} else if (!signature && trigger.params.secret.text) {
					reject("Signature was expected, yet none provided");
				} else if (!signature && !trigger.params.secret.text) {
					resolve(trigger);
				} else {
					reject("Error with siganture");
				}

			}).then((trigger) => {
				if (trigger.params.branch.text) {
					if (trigger.params.branch.text === branch) {
						SystemLogService.info("Trigger found, executing", trigger, 'trigger');
						MapService.executeMap("-1", trigger.map, 0, 0).then((result) => {
							console.log("finish executing map from trigger");
						});
					}
				}
				else {
					SystemLogService.info("Trigger found, executing", trigger, 'trigger');
					MapService.executeMap("-1", trigger.map, 0, 0).then((result) => {
						console.log("finish executing map from trigger");
					});
				}
			}).catch((error) => {
				SystemLogService.error("Error executing trigger: " + error, trigger, 'trigger');
				console.log("Error with trigger", error);
			}))


			res.ok();

		}).catch((error) => {
			console.log("Error executing trigger", error);
			res.badRequest();
		})

	},

	addTrigger: function (req, res) {
		var trigger = req.body;
		var user = req.session.passport.user;
		Trigger.create(trigger).then((triggerModel) => {
			trigger.id = triggerModel.id;
			triggersParser[trigger.type](user, trigger, res);
		});
	},
	updateTrigger: function (req, res) {
		let trigger = req.body;
		let user = req.session.passport.user;
		Trigger.update(req.param('id'), trigger).populate('map').then((trigger) => {
			res.json(trigger);
		}).catch((error) => {
			console.log("Error updating trigger", error);
		})
	}
};
