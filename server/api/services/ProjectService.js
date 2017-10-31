var hooks = require('./HooksService').hooks;

module.exports = {
    addFolder: function(projectId, parentId, name) {
        return TNode.create({ name: name, type: 'folder' })
            .then((folder) => {
                if (projectId == -1) {
                    return [TNode.findOne(parentId), folder]
                }
                return [Project.findOne(projectId), folder];
            }).spread((parent, folder) => {
                if(parent.type == 'folder') {
                    sails.log.debug(parent);
                    parent.childs.add(folder);
                }
                else {
                    parent.nodes.add(folder);
                }
                parent.save();
                return folder
            }).catch((error) => sails.log.error("Error creating new folder", error));
    },
    deleteFolder: function(folderId) {
        return TNode.update(folderId, { isActive: false });
    },
    renameFolder: function(folderId, folderName) {
        return TNode.update(folderId, { name: folderName })
    },
    createProject: function(req, name) {
        return Project.create({ name: name, users: [req.user.id] })
            .catch(
                (error) => {
                    sails.log.error("Error creating new project", error);
                    return error
                }
            )
    },
    deleteProject: function(projectId) {
        return Project.destroy(projectId)
    },
    getProjectById: function(projectId) {
        return Project.findOne(projectId).populate('nodes', { where: { isActive: true }, sort: 'type ASC' })
        
    },
    getNode: function(id, cb) {
        return TNode.findOne(id).populate("childs", { where: { isActive: true }, sort: 'type ASC' }).exec(function(err, node){
            let childs = [];
            node.childs.forEach(function(child) {
                if(child.type == 'folder') {
                    
                    JstreeService.FolderToItem(child);
                }
                childs.push(child);

            });
            node.childs = childs;
            cb(err, node);
        });
    },
    getProjectByUser: function(userId) {
        return User.findOne(userId).populate("projects").then((user) => {
            return user.projects
        })
    },
    getJstreeProjectsByUser: function(userId, cb) {
        User.findOne(userId).populate('projects').exec(function(err, user) {
            cb(err,user.projects);
        });
    }
};