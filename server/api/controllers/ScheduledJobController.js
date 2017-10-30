/**
 * ProjectController
 *
 * @description :: Server-side logic for managing Projects
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    addJob: function (req, res) {
        SchedultJobsService.addJob(req.body).then((job) => {
                res.send(job);
            }).catch((error) => {
                sails.log.error("Error adding job");
                res.badRequest();
            });
    },
    getFutureJobs: function (req, res) {
        SchedultJobsService.getFutureJobs().then((jobs) => {
                res.send(jobs);
            }).catch((error) => {
                sails.log.error("Error getting future jobs");
                res.badRequest();
            });
    },
    deleteJob: function (req, res) {
        SchedultJobsService.deleteJob(req.param('id'), function(err){
            if(err)
                res.badRequest();
            else
                res.ok();
        })
    },
    updateJob: function (req, res) {
        SchedultJobsService.updateJob(req.body,function(err,updatedJob){
            if(err)
                res.badRequest();
            else
                res.send(updatedJob[0]);
        });
    }
};

