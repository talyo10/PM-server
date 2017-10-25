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
    createProject: function (req, res) {
        return ProjectService.createProject(req, req.body.name)
            .then(
                (project) => {
                    JstreeService.ProjectToItem(project);
                    hooks.addProject(req.user, project);
                    res.json(project);
                }
            )
            .catch((err) => res.badRequest());
    },
    addFolder: function (req, res) {
        ProjectService.addFolder(req.body.projectId, req.body.parentId, req.body.name, req, function (err, folder) {
            if (err)
                res.badRequest();
            else
            {
                JstreeService.FolderToItem(folder)
                hooks.addFolder(req.user, user);
                res.json(folder);
            }

        });
    },
    renameFolder: function (req, res) {
        ProjectService.renameFolder(req.body.id, req.body.name, function (err, folder) {
            if (err)
                res.badRequest();
            else
            {
                JstreeService.FolderToItem(folder);
                res.json(folder);
            }
        });
    },
    deleteFolder: function (req, res) {
        ProjectService.deleteFolder(req.body.id, function (err, folder) {
            if (err)
                res.badRequest();
            else
            {
                JstreeService.FolderToItem(folder);
                hooks.deleteFolder(req.user, folder);
                res.json(folder);
            }

        });
    },
    deleteProject: function (req, res) {
        ProjectService.deleteProject(req.param('id'), function (err) {
            if (err)
                res.badRequest();
            else {
                hooks.deleteProject(req.user, {name: req.param('id')});
                res.ok();
            }
        });
    },
    getProjectById: function (req, res) {
        ProjectService.getProjectById(req.param('id'), function (err, project) {
            if (err)
                res.badRequest();
            else
                res.json(project);
        });
    },
    getNode: function (req, res) {
        ProjectService.getNode(req.param('id'), function (err, node) {
            if (err)
                res.badRequest();
            else
                res.json(node);
        });
    },
    getProjectByUser: function (req, res) {
        ProjectService.getProjectByUser(req.param('id'), function (err, user) {
            if (err)
                res.badRequest();
            else
                res.json(user.projects);
        });
    },
    getJstreeProjectsByUser: function (req, res) {
        ProjectService.getProjectByUser(req.param('id'), function (err, projects) {
            if (err) {
                res.badRequest();
                return;
            }
            var jstreeProjects = [];
            async.each(projects, function(project, callback) {
                ProjectService.getProjectById(project.id, function(err, fullProject){
                    if (fullProject.isActive !== false) {
                        JstreeService.ProjectToItem(fullProject);
                        jstreeProjects.push(fullProject);
                    }
                    callback();
                });
            }, function(err) {
                res.json(_.orderBy(jstreeProjects, ['name'], ['asc']));
            });
        });
    }
};

