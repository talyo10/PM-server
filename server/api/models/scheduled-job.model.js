const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let scheduledJobSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    map: { type: Schema.Types.ObjectId, ref: 'Map', required: true },
    type: { type: String, enum: ['once', 'repeated'], required: true, default: 'once' },
    cron: String,
    date: { type: Date, required: true},
    time: { type: Date, required: true}
}, { timestamps: true });

scheduledJobSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
    }
});

let ScheduledJob = mongoose.model('ScheduledJob', scheduledJobSchema, 'scheduledJobs');

module.exports = ScheduledJob;

