/**
* Base-agent.js
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
  	url: {
  		type: 'string',
  		required: true
  	},
    attributes: {
      type: 'array',
      defaultsTo: []
    },
    dedicatedAgents: { /* not the same as the server object */
      type: 'array',
      defaultsTo: []
    },
    key: {
      type: 'string',
      required: true
    },
    sshKey: {
      type: 'string'
    }
  }
};