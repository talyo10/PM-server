/**
* DedicatedAgent.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	type: {
  		type: 'string'
  	},
  	methods: {
  		collection: 'Method',
      via: 'agent'
  	},
    imgUrl: {
      type: 'string'
    },
    api: {
      type: 'string',
      enum: ['static', 'service'],
      defaultsTo: 'static'
    },
    version: {
      type: 'string'
    }
  }
};

