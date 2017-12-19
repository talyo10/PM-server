const Map = require("../models/map.model");
const MapStructure = require("../models/map-structure.model");

module.exports = {
    create: (map) => {
        return Map.create(map)
    },
    /* Create a map structure*/
    createStructure: (structure) => {
        return MapStructure.create(structure)
    },
    filter: (query = {}) => {
        return Map.find(query)
    },
    get: (id) => {
        console.log(id);
        return Map.findOne({ _id: id }).populate('agents')
    },
    /* get map structure. if structure id isnot defined, get the latest */
    getMapStructure: (mapId, structureId) => {
        if (structureId) {
            return MapStructure.findById(structureId)
        }
        return MapStructure.find({ map: mapId }).then((structures) => {
            return structures.pop();
        })
    },
    update: (map) => {
        return Map.findByIdAndUpdate(map._id, map).populate('agents')
    },

};