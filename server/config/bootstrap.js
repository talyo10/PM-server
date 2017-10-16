/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */

module.exports.bootstrap = function(cb) {

  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
    //loadBaseAgent
    sails.services.passport.loadStrategies();
    sails.services.baseagentsservice.loadBaseAgent(function(err){
        if (err)
            sails.log.error('Could not get baseAgent, will not create scheduled jobs');
        else if (!sails.services.baseagentsservice.baseAgent.id)
            sails.log.error('No baseAgents yet, create a base agent to schedule the jobs');
        else{
            sails.log.info('Starting with baseAgent : ' + sails.services.baseagentsservice.baseAgent.name);
            sails.services.schedultjobsservice.loadJobs();
        }
    });
    sails.services.dedicatedagentservice.loadAgents();
    sails.services.hooksservice.loadHooks();
    sails.on('lifted', function() {
        //setInterval(function() {
        //  MapService.listenMapTrigger();
        //}, 5000);
        BaseAgentsService.listenOnAgents();
    });
    cb();
};
