/**
 * Project.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    attributes: {
        startAt: {type: 'date'},
        version : {type:'integer'},
        Map: {
          model: 'Map',
          required: true
        },
        isCron : {type:'boolean'},
        Cron : {type:'string'}
    }
};

