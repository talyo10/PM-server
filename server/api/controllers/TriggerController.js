/**
 * TriggerController
 *
 * @description :: Server-side logic for managing Triggers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var gitrepo = require('../../repos/git-cli');
var _ = require("lodash");

var triggersParser = {
	github: function(userId, trigger, res) {
		sails.log.info("Got github registeration");
		Trigger.update({ id: trigger.id }, { on: false }).exec(function (err, updatedTrigger) {
            if (err) {
				return res.json({stat: "bad"});
			}
			return res.json({stat: "ok"});
        });
	},
	git: function(userId, trigger, res) {
		sails.log("starting git");
		var repoPath = trigger.params.serverUrl.text;
		var branch = trigger.params.branch.text;
		sails.log.info("Success cloning git !!!!!! " + repoPath + "  " + branch);
		User.findOne({id: userId}).then(function (user, err){
			if(!err) {
				sails.log.debug("check repo!!!");
				gitrepo.checkRepo(user.username, repoPath, branch, function(obj){
					if(obj.err){
						return res.json({stat: "bad"});
					}
					else{
						trigger.folder = obj.res;
						trigger.on = true;
						Trigger.update({id: trigger.id}, trigger).then(function(triggerRes, err){
							if(err){
								sails.log.error(err);
							}
							else{
								sails.log.debug("Success updating trigger");
							}
							return res.json({stat: "ok"});
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

	githubPush: function(req, res) {
		var githubPush = req.body;
		var url = githubPush.repository.clone_url;

		Trigger.find({type: 'github'}).then(function (triggers, err) {
							if (err) {
								sails.log.error(err);
								return res.badRequest();
							}

							var trigger = _.find(triggers, function(t) {
								return t.params.serverUrl.text === url;
							});

							if (trigger != null) {
								MapService.executeMap("-1", trigger.map, 0, 0).then((result) => {
									return res.ok();
								});
							} else {
								return res.badRequest();
							}

						});


	},

	addTrigger: function (req, res) {
        var trigger = req.body;
        var user = req.session.passport.user;
        Trigger.create(trigger, function(err, triggerModel){
        	if(err) {
        		sails.log.error(err);
        	}
        	trigger.id = triggerModel.id;
        	triggersParser[trigger.type](user, trigger, res);
        });
    }
};
