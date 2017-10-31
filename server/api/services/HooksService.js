var async = require('async');
var fs = require('fs');
var unzip = require('unzip');
var streams = require('memory-streams');
var request = require('request');
var path = require('path');
var mv = require('mv');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var systemHooks = {};

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function LoadModules(cpath, parentDir) {
    fs.lstat(cpath, function(err, stat) {
        if (stat.isDirectory()) {
            // we have a directory: do a tree walk
            fs.readdir(cpath, function(err, files) {
                var f, l = files.length;
                for (var i = 0; i < l; i++) {
                    f = path.join(cpath, files[i]);
                    LoadModules(f, cpath);
                }
            });
        } else {
            // we have a file: load it
            if (cpath.endsWith('package.json')) {
                var loadedModule = require(cpath);
                systemHooks[loadedModule.developer + "." + loadedModule.name] = require(path.join(parentDir, 'app.js'));
            }
        }
    });
}

var hookExecuter = function(hookName, ...args) {
    return _.forEach(systemHooks, (hook) => {
        try {
            hook[hookName](args);   
        } catch (error) {
            sails.log.info("No hook for " + hookName);
        }
    });
}

var hooks = {
    
    /* User hooks */
        /* called when new user is registered*/
        addUser: (user) => {
            return hookExecuter("addUser", user);
        },
        
        /* called when user is deleted*/
        deleteUser: (user) => {
            return hookExecuter("deleteUser", user);
        },
        
        /* called when user is signing in*/
        userSignIn: (user) => {
            return hookExecuter("userSignIn", user);
        },
        
        /* called when new user is signing out*/
        userSignOut: (user) => {
            return hookExecuter("userSignOut", user);
        },
    /* End of User hooks */

    /* Project hooks */
        /* called when new Project is created*/
        addProject: (user, project) => {
            return hookExecuter("addProject", user, project);
        },
        
        /* called when Project is deleted*/
        deleteProject: (user, project) => {
            return hookExecuter("deleteProject", user, project);
        },
        
        /* called when adding folder*/
        addFolder: (user, folder) => {
            return hookExecuter("addFolder", user, folder);
        },
        
        /* called when deleting folder*/
        deleteFolder: (user, folder) => {
            return hookExecuter("deleteFolder", user, folder);
        },
    /* End of Project hooks */

    /* Map hooks */
        /* called when new Map is created*/
        addMap: (user, map) => {
            return hookExecuter("addMap", user, map);
        },

        /* called when new Map version is created*/
        addMapVersion: (user, map) => {
            return hookExecuter("addMapVersion", user, map);
        },
        
        /* called when Map is deleted*/
        deleteMap: (user, map) => {
            return hookExecuter("deleteMap", user, map);
        },
        
        /* called when executing a map*/
        executeMap: (user, map) => {
            return hookExecuter("executeMap", user, map);
        },

        /* called after map execution*/
        doneExecutingMap: (user, map) => {
            return hookExecuter("doneExecutingMap", user, map);
        },
        
        /* called when map is paused */
        pauseMapExecution: (user, map) => {
            return hookExecuter("pauseMapExecution", user, map);
        },

        /* called on map resume after pause*/
        resumeMapExecution: (user, map) => {
            return hookExecuter("resumeMapExecution", user, map);
        },

        /* called when deleting folder*/
        stopMapExecution: (user, map) => {
            return hookExecuter("stopMapExecution", user, map);
        },

    /* End of Map hooks */

    /* Servers hooks */
        /* called when new server is created*/
        addServer: (user, server) => {
            return hookExecuter("addServer", user, server);
        },
 
        /* called when Server is deleted*/
        deleteServer: (user, server) => {
            return hookExecuter("deleteServer", user, server);
        },

        /* called when new server group is created*/
        addServerGroup: (user, group) => {
            return hookExecuter("addServerGroup", user, group);
        },
        
        /* called when Server group is deleted*/
        deleteServerGroup: (user, group) => {
            return hookExecuter("deleteServerGroup", user, group);
        },
        
    /* End of Servers hooks */

    /* Plugins hooks */
        /* called when new Plugin is created*/
        addPlugin: (user, plugin) => {
            return hookExecuter("addPlugin", user, plugin);
        },
        
        /* called when Plugin is deleted*/
        deletePlugin: (user, plugin) => {
            return hookExecuter("deletePlugin", user, plugin);
        }
        
    /* End of Plugins hooks */
    
}


var mpath = path.join(sails.config.appPath, "hooks");

module.exports = {
    hooks,
    modulesPath: mpath,
    addSystemHook: function addSystemHook(user, file, callback) {
        let jsFile = {};
        let tmpPath = path.join(mpath, "." + guid());
        let moduleName = "";
        mkdirp(tmpPath, function (err) {
            if (err) {
                sails.log.error(err)
                return callback(err);
            }

            fs.createReadStream(file)
                .pipe(unzip.Parse())
                .on('entry', function (entry) {
                    var fileName = entry.path;
                    var type = entry.type; // 'Directory' or 'File'
                    var size = entry.size;
                    
                    entry.pipe(fs.createWriteStream(path.join(tmpPath,  fileName)));
                    
                    if (fileName === 'package.json') {
                        var writer = new streams.WritableStream();
                        entry.pipe(writer);
                        entry.on('readable', function() {
                            var hook = JSON.parse(writer.toString());
                            SystemHook.findOne({name: hook.name, developer: hook.developer}).then(function (chook, err) {
                                if (err) {
                                    return callback(err);
                                }
                                else if (!chook) {
                                    SystemHook.create(hook, function (err, model) {
                                        if (err) {
                                            return callback(err);
                                        }
                                        hooks.addPlugin(user, model);
                                        moduleName = model.developer + "." + model.name;
                                    });   
                                } else {
                                    SystemHook.update({developer: chook.developer, name: chook.name}, hook).exec(function (err, resHook) {        
                                        if (err) {
                                        return  callback(err);
                                        } 
                                        moduleName = chook.developer + "." + chook.name;
                                    });
                                }
                            });
                        });
                    }
                })
                .on('close', function(data){
                    console.log('end data');
                    mv(tmpPath, path.join(mpath, moduleName), {mkdirp: true}, function(err) {
                        systemHooks[moduleName] = require(path.join(mpath, moduleName, 'app.js'));
                        callback(null, moduleName);
                    });
                });
        });
    },
    loadHooks: function () {
        LoadModules(mpath, sails.config.appPath);
    },
    deleteHook: function(id) {
        return SystemHook.findOne(id).then((hook) => {
            rimraf(path.join(mpath, hook.developer + "." + hook.name),
                    function () {
                        SystemHook.destroy(id); 
                    }
                );
        })
        
    }
}