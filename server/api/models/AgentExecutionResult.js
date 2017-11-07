/**
 * AgentExecutionResult.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    agent: {
      model: 'BaseAgent'
    },
    status: {
      type: 'string',
      enum: ['success', 'error']
    },
    result: {
      type: 'text'
    },
    startTime: {
      type: 'datetime'
    },
    finishTime: {
      type: 'datetime'
    },
    execution: {
      model: 'Execution',
      required: true
    },
    processResults: {
      collection: 'ProcessExecutionResult',
      via: 'agentExecution',
    }
  }
};

