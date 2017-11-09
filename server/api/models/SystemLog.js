/**
 * Log.js
 *
 * @description :: a generic model to save logs to db.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */


module.exports = {

  attributes: {
    message: {
      type: 'string',
      required: true
    },
    objectId: {
      type: 'string',
    },
    model: {
      type: 'string',
    },
    reason: {
      type: 'string'
    },
    status: {
      type: 'string',
      enum: ['success', 'error', 'warn', 'info']
    }
  }
};

