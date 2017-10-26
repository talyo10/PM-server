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
    deleteProject: function(projectId, cb) {
        Project.destroy({id:projectId},function(err) {
            cb(null);
        });
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
    renameFolder: function(folderId, folderName, cb) {
        TNode.findOne({id: folderId} ,function(err, folder) {
            if (err) {
                return cb(err, folder);
            }
            folder.name = folderName;
            folder.save(function (err) {
                cb(err, folder);
            });
        });
    },
    deleteFolder: function(folderId, cb) {
        TNode.findOne({id: folderId} ,function(err, folder) {
            if (err) {
                return cb(err, folder);
            }
            folder.isActive = false;
            folder.save(function (err) {
                cb(err, folder);
            });
        });
    },
    getProjectById: function(projectId, cb) {
        return Project.findOne(projectId).populate('nodes', { where: { isActive: true }, sort: 'type' }).exec(function(err, project){
            cb(err, project);
        });
    },
    getNode: function(id, cb) {
        return TNode.findOne(id).populate('childs', { where: { isActive: true }, sort: 'type' }).exec(function(err, node){
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
    getProjectByUser: function(userId, cb) {
        User.findOne(userId).populate('projects').exec(function(err, user) {
            cb(err,user.projects);
        });
    },
    getJstreeProjectsByUser: function(userId, cb) {
        User.findOne(userId).populate('projects').exec(function(err, user) {
            cb(err,user.projects);
        });
        /*User.findOne(userId).populate('projects').exec(function(err, user) {
            cb(err,user);
        });*/
    }
};