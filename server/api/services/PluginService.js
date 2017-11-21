const path = require('path');
const unzip = require('unzip');
const fs = require('fs');
var streams = require('memory-streams');


let pluginsPath = path.join(sails.config.appPath, "plugins");

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
    }
}

