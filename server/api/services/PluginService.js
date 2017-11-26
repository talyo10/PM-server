const path = require('path');
const unzip = require('unzip');
const fs = require('fs');
const streams = require('memory-streams');
const _ = require('lodash');

let pluginsModules = {};
let routesModule = {};
let pluginsPath = path.join(sails.config.appPath, "plugins");

let loadModule = function (fullPath = pluginsPath, parentDir) {
    fs.lstat(fullPath, function (err, stat) {
        if (err) {
            console.log("Error loading modules ", err);
        }
        if (stat.isDirectory() && path.basename(fullPath) !== "node_modules") {
            // we have a directory: do a tree walk
            fs.readdir(fullPath, function (err, files) {
                var f, l = files.length;
                for (var i = 0; i < l; i++) {
                    f = path.join(fullPath, files[i]);
                    loadModule(f, path);
                }
            });
        } else {
            // its a file, check if it is a config.json
            if (path.basename(fullPath) !== "config.json") {
                return;
            }
            try {
                let plugin = require(fullPath);
                if (!plugin.name) {
                    console.log("no name exported in module");
                    return;
                }
                Plugin.findOne({ name: plugin.name }).then((savedPlugin) => {
                    // save only plugins that exists in db
                    if (!savedPlugin) {
                        return;
                    }
                    plugin.main = path.join(path.dirname(fullPath), plugin.main);
                    pluginsModules[plugin.name] = plugin;

                    let methods = plugin.methods;

                    methods.forEach(method => {
                        let pluginAppPath = plugin.main.slice(0, plugin.main.lastIndexOf('.'));
                        let app = require(pluginAppPath);
                        routesModule[method.route] = app[method.name];
                        sails.router.bind(method.route, app[method.name]);
                    })
                })
            } catch (e) {
                console.log("Error while loadin module", e);
                return;
            }
        }
    })

}

let unbindRoute = function (plugin) {
    let methods = pluginsModules[plugin.name].methods;
    console.log(methods);
    methods.forEach(method => {
        if (method.route) {
            console.log(method.route);
            sails.router.unbind({ path: method.route, verb: routesModule[method.route] })
        }
    })
}


module.exports = {
    createPlugin: function (pluginDir) {
        return new Promise((resolve, reject) => {
            // parse the plugin config file
            fs.createReadStream(pluginDir)
                .pipe(unzip.Parse())
                .on('entry', function (entry) {
                    var fileName = entry.path;
                    var type = entry.type; // 'Directory' or 'File'
                    var size = entry.size;
                    if (fileName === 'config.json') {
                        var writer = new streams.WritableStream();
                        entry.pipe(writer);
                        entry.on('readable', function () {
                            let obj = JSON.parse(writer.toString());
                            Plugin.findOne({ name: obj.name }).then((plugin) => {
                                if (!plugin) {
                                    return Plugin.create(obj)
                                }
                                return Plugin.update({ name: obj.name }, obj)
                            }).then((plugin) => {
                                console.log("created a new plugin", plugin)
                                resolve(plugin);
                            }).catch((error) => {
                                console.log("Error creating plugin", error)
                                reject(error);
                            })
                        });
                    } else {
                        entry.autodrain();
                        resolve();
                    }
                });
        })
    },
    loadPluginsModule: loadModule,
    unbindPluginRoutes: unbindRoute,
    getPlugin: function (query) {
        return Plugin.findOne(query)
    },
    filterPlugins: function (query) {
        return Plugin.find(query)
    },
    pluginsModules: pluginsModules
}

