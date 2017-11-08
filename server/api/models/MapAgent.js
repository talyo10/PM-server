/**
 * MapAgents.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

// https://sailsjs.com/documentation/concepts/models-and-orm/associations/through-associations
// this is a through model for binding map and agents with many-to-many realtionship

module.exports = {
  
    attributes: {
      map: {
        model: 'map'
      },
      agent: {
        model: 'baseagent'
      }
    }
  };
  
  