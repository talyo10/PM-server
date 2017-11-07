/**
 * ActionExecutionResult.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  
    attributes: {
      actionName: {
        type: 'string'
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
      processExecution: {
        model: 'ProcessExecutionResult',
        required: true
      }
    }
  };
  
  