/**
 * Execution.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    map: {
      model: 'Map',
      required: true
    },
    agentsExecutionResult: {
      collection: 'AgentExecutionResult',
      via: 'execution',
    },
    status: {
      type: 'string',
      enum: ['success', 'error'],
    },
    startAgentsNumber: {
      type: 'int'
    },
    mapVersion: {
      type: 'int',
      required: true
    },
    startTime: {
      type: 'datetime'
    },
    finishTime: {
      type: 'datetime'
    }
  }
};

