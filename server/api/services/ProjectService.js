var hooks = require('./HooksService').hooks;

module.exports = {

    createProject: function(name,req, cb) {
        Project.create({name:name},function(err,model){
            model.users.add(req.user.id);
            model.save(function(err){
                cb(err,model);
            });
        });
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
        return Project.findOne(projectId).populate('nodes').exec(function(err, model){
            let childs = [];
            async.each(model.nodes, function(child, callback) {
                if (child.type == "map") {
                    TNode.findOne(child.id).populate('map').exec(function(err, node) {
                        if (err) {
                            callback(err);    
                        }
                        if (node.map.isActive) {
                            childs.push(node);
                        }
                        callback();
                    });
                } else {
                    if(child.isActive) {
                        childs.push(child);
                    }
                    callback();
                }
            }, function(err) {
                model.nodes = childs;
                cb(err, model);
            });
        });
    },
    getNode: function(id, cb) {
        return TNode.findOne(id).populate('childs').exec(function(err, model){
            let childs = [];
            async.each(model.childs, function(child, callback) {
                if (child.type == "map") {
                    TNode.findOne(child.id).populate('map').exec(function(err, node) {
                        if (err) {
                            callback(err);    
                        }
                        if (node.map.isActive) {
                            JstreeService.MapToItem(node);
                            childs.push(node);
                        }
                        callback();
                    });
                } else if(child.type == "folder") {
                    if(child.isActive) {
                        JstreeService.FolderToItem(child);
                        childs.push(child);
                        callback();
                    }
                }
            }, function(err) {
                model.childs = childs;
                cb(err, model);
            });
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