/**
* Node.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
    
      attributes: {
        name: {
            type: 'string',
            required: true
        },
        type: {
            type: 'string',
            enum: ['map', 'folder'],
            defaultsTo: 'map',
            required: true
        },
        parent: {
            model: 'TNode',
        },
        map: {
            model: 'Map',
            required: false
        },
        childs: {
            collection: 'TNode',
            via: 'parent',
            defaultsTo: []
        },
        project: {
            model: 'Project'
        },
        isActive: {
            type: 'boolean',
            required: true,
            defaultsTo: true
        }
      }
    };
    
    