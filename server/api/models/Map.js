/**
 * Project.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
    name: {
      type: 'string',
      required: true
    },
    activeServers: {
      type: 'json',
      defaultsTo: {}
    },
    structure: {
      type: 'json',
      defaultsTo: {
        content: '',
        nodes: {},
        links: [],
        attributes: [],
        code: ''
      }
    },
    versions: {
      type: 'json',
      defaultsTo: [{
        date: new Date(),
        structure: {},
        status: sails.config.constants.runStatuses.NeverRun
      }]
    },
    project: {
      model: 'Project'
    },
    isActive: {
      type: 'boolean',
      defaultsTo: true
    }

  }
};

