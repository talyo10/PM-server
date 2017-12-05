module.exports = {

  attributes: {
    nodes: {
      type: 'json'
    },
    links: {
      type: 'json'
    },
    content: {
      type: 'json'
    },
    attributes: {
      type: 'Array',
      defaultsTo: []
    },
    code: {
      type: 'string'
    },
    map: {
      model: 'Map'

    }
  }
};
// TODO: add a schema and a pre save validator
