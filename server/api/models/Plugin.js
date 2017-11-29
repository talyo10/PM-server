/**
 * Plugin.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    name: {
      type: 'string',
      unique: true
    },
    type: {
      type: 'string',
      enum: ["server", "executer", "trigger", "module"]
    },
    execProgram: {
      type: 'string',
      required: true
    },
    active: {
      type: 'boolean',
      defaultsTo: true
    },
    methods: {
      collection: 'PluginMethod',
      via: 'plugin'
    },
    imgUrl: {
      type: 'string'
    },
    version: {
      type: 'string'
    },
  }
};

