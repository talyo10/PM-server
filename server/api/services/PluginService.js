const path = require('path');
const unzip = require('unzip');
const fs = require('fs');
const streams = require('memory-streams');

let pluginsModules = {};
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
            console.log("its the one");

            try {
                let plugin = require(fullPath);
                if (!plugin.name) {
                    console.log("no name exported in module");
                    return;
                }
                plugin.main = path.join(path.dirname(fullPath), plugin.main);
                pluginsModules[plugin.name] = plugin;

            } catch (e) {
                console.log("Error while loadin module", e);
                return;
            }
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
                                resolve();
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
    getPlugin: function (query) {
        return Plugin.findOne(query)
    },
    filterPlugins: function (query) {
        return Plugin.find(query)
    },
    pluginsModules: pluginsModules
}

