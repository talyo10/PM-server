/**
 * ProjectController
 *
 * @description :: Server-side logic for managing Projects
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var _ = require('lodash');
var async = require('async');
var hooks = require('../services/HooksService').hooks;


module.exports = {
    addFolder: function (req, res) {
        return ProjectService.addFolder(req.body.projectId, req.body.parentId, req.body.name)
            .then(
            (folder) => {
                JstreeService.FolderToItem(folder);
                sails.log.info(folder);
                hooks.addFolder(req.user, folder);
                MessagesService.sendMessage("notification", "'" + req.body.name + "' created successfuly", "success");
                res.json(folder);
            }
            )
            .catch((error) => {
                sails.log.error("Error creating new Folder \n", error)
                res.badRequest();
            });
    },
    deleteFolder: function (req, res) {
        ProjectService.deleteFolder(req.body.id).then((folder) => {
            JstreeService.FolderToItem(folder);
            hooks.deleteFolder(req.user, folder);
            MessagesService.sendMessage("notification", "Deleted folder successfuly", "success");
            res.json(folder);
        }).catch((error) => {
            res.badRequest();
            sails.log.error("Error deleting folder", error);
        });
    },
    renameFolder: function (req, res) {
        ProjectService.renameFolder(req.body.id, req.body.name).then((folder) => {
            JstreeService.FolderToItem(folder);
            res.json(folder);
        }).catch((error) => {
            sails.log.error("Error renaming folder", error);
            res.badRequest();
        });
    },
    createProject: function (req, res) {
        return ProjectService.createProject(req, req.body.name)
            .then(
            (project) => {
                JstreeService.ProjectToItem(project);
                hooks.addProject(req.user, project);
                MessagesService.sendMessage("notification", "'" + req.body.name + "' created successfuly", "success");
                
                res.json(project);
            }
            )
            .catch((err) => res.badRequest());
    },
    deleteProject: function (req, res) {
        ProjectService.deleteProject(req.param('id')).then(() => {
            hooks.deleteProject(req.user, { name: req.param('id') });
            res.ok();
        }).catch((error) => {
            sails.log.error("Error deleting project", error);
            MessagesService.sendMessage("notification", "Error deleting project", "error");
            
            res.badRequest();
        })
    },
    getProjectById: function (req, res) {
        ProjectService.getProjectById(req.param('id')).then((project) => {
            res.json(project);
        }).catch((error) => {
            sails.log.error("Error finding project", error);
            res.badRequest();

        })
    },
    getNode: function (req, res) {
        ProjectService.getNode(req.param('id')).then((node) => {
            res.json(node);
        }).catch((error) => {
            sails.log.error("Error getting node", error);
            res.badRequest();
        });
    },
    getTNode: function (req, res) {
        ProjectService.getTNode(req.param('id')).then((node) => {
            res.json(node);
        }).catch((error) => {
            sails.log.error("Error getting node", error);
            res.badRequest();
        });
    },
    getProjectByUser: function (req, res) {
        ProjectService.getProjectByUser(req.param('id')).then((project) => {
            res.json(project);
        }).catch((error) => {
            sails.log.error("Error getting project", error);
        });
    },
    getJstreeProjectsByUser: function (req, res) {
        ProjectService.getProjectByUser(req.param('id')).then((projects) => new Promise((resolve, reject) => {
            var jstreeProjects = [];
            async.each(projects, function (project, callback) {
                ProjectService.getProjectById(project.id).then((populatedProject) => {
                    if (populatedProject.isActive !== false) {
                        JstreeService.ProjectToItem(populatedProject);

                        jstreeProjects.push(populatedProject);
                    }
                    callback();
                });
            }, function (err) {
                if (err) {
                    reject();
                }
                resolve(_.orderBy(jstreeProjects, ['name'], ['asc']));
            });
        })).then((tree) => {
            res.json(tree);
        }).catch((error) => {
            sails.log.error("Error finding project", error);
            res.badRequest();
        })
    },
    userProjects: function (req, res) {
        ProjectService.getProjectByUser(req.session.passport.user).then((projects) => new Promise((resolve, reject) => {
            let nodes = [];

            async.each(projects, function (project, callback) {
                ProjectService.getProjectById(project.id).then((populatedProject) => {
                    if (populatedProject.isActive !== false) {
                        nodes.push(populatedProject);
                    }
                    callback();
                });
            }, function (err) {
                if (err) {
                    reject();
                }
                resolve(_.orderBy(nodes, ['name'], ['asc']));
            });
        })).then((nodes) => {
            res.json(nodes);
        }).catch((error) => {
            sails.log.error("Error finding project", error);
            res.badRequest();
        });
    },
    updateProject: function (req, res) {
        ProjectService.updateProject(req.param('id'), req.body).then((project) => {
            res.json(project);
        }).catch((error) => {
            sails.log.error("Error updating project", error);
            res.badRequest();
        });
    },
    getProjectMaps: function (req, res) {
        MapService.findMaps({ Project : req.param('id')}).then((maps) => {
            res.json(maps);
        }).catch((error) => {
            sails.log.error("Error finding maps", error);
            res.badRequest();
        });
    }
};

