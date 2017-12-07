/**
 * ProcessExecutionResult.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    processName: {
      type: 'string'
    },
    status: {
      type: 'string'
    },
    result: {
      type: 'json'
    },
    startTime: {
      type: 'datetime'
    },
    finishTime: {
      type: 'datetime'
    },
    agentExecution: {
      model: 'AgentExecutionResult',
      required: true
    },
    actionResult: {
      collection: 'ActionExecutionResult',
      via: 'processExecution'
    }
  }
};

