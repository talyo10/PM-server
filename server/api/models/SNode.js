/**
* serversGroup.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
    
      attributes: {
        children: {
          collection: 'SNode',
          via: 'parent',
          defaultsTo: []
        },
        parent: {
          model: 'SNode',
          required: false,
          defaultsTo: -1
        },
        data: {
            model: 'BaseAgent',
            required: false
        },
        hasChildren: {
          type: 'boolean',
          defaultsTo: false
        },
        name: {
          type: 'string',
          defaultsTo: ""
        }
      }

    };