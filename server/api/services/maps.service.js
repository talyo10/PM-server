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
        if (query.q) {
            // if there's is a query, filter on the name and the description
            return Map.find({
                $or: [
                    {
                        name:
                            {
                                $regex: `.*${query.q}.*`
                            }
                    },
                    {
                        description:
                            {
                                $regex: `.*${query.q}.*`
                            }
                    }
                ]
            })
        }
        return Map.find(query)
    },
    get: (id) => {
        console.log(id);
        return Map.findOne({ _id: id }).populate('agents')
    },
    /* get map structure. if structure id is not defined, get the latest */
    getMapStructure: (mapId, structureId) => {
        if (structureId) {
            return MapStructure.findById(structureId)
        }
        return MapStructure.find({ map: mapId }).then((structures) => {
            return structures.pop();
        })
    },
    structureList: (mapId) => {
        return MapStructure.find({ map: mapId }, '_id createdAt', { sort: {createdAt: -1}})
    },
    update: (mapId, map) => {
        return Map.findByIdAndUpdate(mapId, map).populate('agents')
    },

};