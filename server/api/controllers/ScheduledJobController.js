/**
 * ProjectController
 *
 * @description :: Server-side logic for managing Projects
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    addJob: function (req, res) {
        SchedultJobsService.addJob(req.body, function(err,job){
            if(err)
                res.badRequest();
            else
                res.send(job);
        })
    },
    getFutureJobs: function (req, res) {
        SchedultJobsService.getFutureJobs(function(err,jobs){
            if(err)
                res.badRequest();
            else
                res.send(jobs);
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

