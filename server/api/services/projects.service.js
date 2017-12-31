const Project = require("../models/project.model");


module.exports = {
    /* add a new project */
    create: (project) => {
        return Project.create(project)
    },

    /* add a map to project */
    addMap: (projectId, mapId) => {
        return Project.update({ _id: projectId }, { $push: { maps: mapId } });
    },

    /* get project details */
    detail: (projectId) => {
        return Project.findOne({ _id: projectId }).populate('maps')
    },

    /* delete a project */
    delete: (projectId) => {
        return Project.remove({ _id: projectId })
    },

    /* filter projects */
    filter: (query = {}) => {
        if (query.q) {
            // if there's is a query, filter on the name and the description
            return Project.find({
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
        return Project.find(query)

    },

    /* update a project */
    update: (project) => {
        return Project.findByIdAndUpdate(project._id, project)
    },
    /* Updating the maps list of the project.
    */
    updateMap: (mapId, projectId) => {
        return Project.update({ maps: mapId }, { $pull: { maps: mapId } }) // remove the map from all
            .then(projects => {
            return module.exports.addMap(projectId, mapId); // add map to the selected project
        });

    }

};