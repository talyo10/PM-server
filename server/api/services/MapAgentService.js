module.exports = {
    updateMapAgents: function(mapId, agents) {
        // this function get a map and an array of agents and create the map agent documents
        console.log("*** in updateMapAgents ***")
        return MapAgent.destroy({ map: mapId }).then(() => {
            if (agents) {
                return Map.findOne(mapId).populate('agents')
            } else {
                
            }
            
            }).then((map) => {
                agents.forEach((agent) => {
                    map.agents.add(agent);
                });
                return map.save();
            }).then((map) => { return map.agents })
    },
    getAgentsForMap: function(mapId) {
        console.log("*** in getAllAgentsForMap ***")
        return Map.findOne(mapId).populate('agents').then((map) => { 
            return map.agents
         })
    }
}