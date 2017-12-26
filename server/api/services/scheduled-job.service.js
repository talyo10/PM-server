const scheduler = require('node-schedule');
const mapsService = require("../services/maps.service");
const mapsExecutionService = require("../services/map-execution.service");
const ScheduledJob = require("../models/scheduled-job.model");

let jobs = {};


module.exports = {
    addJob: (job) => {
        return ScheduledJob.create(job).then((job) => {
            return ScheduledJob.findOne({ id: job.id }).populate('Map')
        }).then((populatedJob) => {
            module.exports.addScheduledJob(populatedJob);
            return populatedJob
        });
    },
    getFutureJobs: () => {
        return ScheduledJob.find().where({
            or: [
                {
                    startAt: { $gt: new Date() },
                    cron: { $exists: false }
                },
                { cron: { $exists: true } }
            ]
        }).populate('map');
    },
    deleteJob: (jobId) => {
        module.exports.removeJob(jobId);

        return ScheduledJob.destroy({ id: jobId });

    },
    updateJob: (job) => {
        return ScheduledJob.update({ id: job.id }, job).then((job) => {
            module.exports.removeJob(job.id);
            return ScheduledJob.findOne({ id: job.id }).populate('Map')
        }).then((populatedJob) => {
            module.exports.addScheduledJob(populatedJob);
            return populatedJob
        });

    },
    removeJob: (jobId) => {
        if (!jobs[jobId])
            return;

        jobs[jobId].cancel();
        delete jobs[jobId];
    },
    addScheduledJob: (job) => {
        let startAt = (job.cron) ? job.cron : job.startAt;

        jobs[job.id] = scheduler.scheduleJob(startAt, function () {
            mapsExecutionService.execute(job.map, job.version); // TODO: it should pass the socket
        });
        let dateString = (job.cron) ? "Cron : " + job.cron : "cron : " + job.startAt.toString();
        console.log('Adding scheduled job for map : ' + job.map.name + ' - ' + dateString);
    },
    loadJobs: () => {
        module.exports.getFutureJobs().then((jobs) => {
            jobs.forEach(function (job) {
                module.exports.addScheduledJob(job);
            });
        }).catch((error) => {
        });
    }
};