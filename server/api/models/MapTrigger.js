/**
 * MapTrigger.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: 'string',
      required: true
    },
    map: {
      model: 'Map',
      required: true
    },
    plugin: {
      model: 'Plugin',
      required: true
    },
    method: {
      model: 'PluginMethod',
      required: true
    },
    params: {
      type: 'json',
      defaultsTo: []
    },
    active: {
      type: 'boolean',
      defaultsTo: true
    }
  }
};

