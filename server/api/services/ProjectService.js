var hooks = require('./HooksService').hooks;

module.exports = {

    createProject: function(req, name) {
        return Project.create({ name: name })
            .then(
                (project) => {
                    project.users.add(req.user.id);
                    project.save();
                    return project
                }
            )
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
    addFolder: function(projectId, parentId, name, req, cb) {
        TNode.create({name: name, type: 'folder'}, function(err, model) {
            if (projectId == -1) {
                TNode.findOne({id: parentId}, function(err, parent) {
                    parent.childs.add(model.id);
                    parent.save(function(err){
                        model.parent = parentId;
                        cb(err, model);
                    });
                });
            } else {
                Project.findOne({id: projectId}, function(err, project) {
                    project.nodes.add(model);
                    project.save(function(err){
                        model.project = project;
                        cb(err, model);
                    });
                });
            }
        });
    },
    deleteProject: function(projectId, cb) {
        Project.destroy({id:projectId},function(err) {
            cb(null);
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