/**
 * PluginController
 *
 * @description :: Server-side logic for managing Plugins
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const async = require('async');
const fs = require('fs');
const unzip = require('unzip');
const path = require('path');
const _ = require('lodash');
const exec = require('child_process').exec;

let pluginsPath = path.join(sails.config.appPath, "plugins");
let uploadPath = path.join(sails.config.appPath, "static", "upload");

module.exports = {
    uploadPlugin: function (req, res) {
        // installing plugin on server.
        try {
            // trying to get filename
            filename = req.file('file')._files[0].stream.filename;
        } catch (error) {
            sails.log.error("can't read file " + error);
            return res.badRequest('No file was uploaded ' + error);
        }
        // configuring file upload
        req.file('file').upload({
            dirname: path.join(uploadPath),
            saveAs: filename,
            // don't allow the total upload size to exceed ~10MB
            maxBytes: 10000000
        }, function whenDone(err, uploadedFiles) {
            if (err) {
                return res.negotiate(err);
            }
            // If no files were uploaded, respond with an error.
            if (uploadedFiles.length === 0) {
                return res.badRequest('No file was uploaded');
            }
            let dirname;
            let outputPath;

            async.each(uploadedFiles, (file, callback) => {

                // for each file uploaded, check if it has an extension and if it is a archive.
                let extension = file.filename.substring(file.filename.lastIndexOf(".") + 1);
                if (extension && _.indexOf(["zip", "rar"], extension) === -1) {
                    console.log("Bad format");
                    return res.badRequest()
                }
                PluginService.createPlugin(file.fd).then(() => { console.log("Created plugin") });
                extension ? dirName = file.filename.substring(0, file.filename.lastIndexOf(".")) : dirname = file.filename;
                outputPath = path.join(pluginsPath, dirName);
                if (!fs.existsSync(outputPath)) {
                    fs.mkdirSync(outputPath);
                }
                // unzip the file; Important: when merging with DedicatedAgent, should check if need to unzip, or save only the original zipfile.
                fs.createReadStream(file.fd)
                    .pipe(unzip.Parse())
                    .on('entry', (entry) => {
                        let fileName = entry.path;
                        let type = entry.type; // 'Directory' or 'File'
                        let size = entry.size;
                        entry.pipe(fs.createWriteStream(path.join(pluginsPath, dirName, fileName)));
                    }).on('close', (data) => {
                        // when done unziping, install the packages.
                        let cmd = 'cd ' + outputPath + ' &&' + ' npm install ' + " && cd " + outputPath;
                        exec(cmd, function (error, stdout, stderr) {
                            if (error) {
                                console.log("ERROR", error, stderr);
                                callback(error);
                            }
                            callback();
                        });
                    });
            }, (error) => {
                if (error) {
                    console.log("Error uploading plugin", error);
                    return res.badRequest();
                } else {
                    res.ok();
                }
            })

        });
    },
    triggerEvent: function (req, res) {
        PluginService.getPlugin({ name: req.param("name") }).then((plugin) => {
            console.log(Object.keys(req.params))
            console.log(req.url, req.method);
            if (!plugin.exposeRoute) {
                console.log("Forbidden");
                return res.badRequest();
            }
            res.json(plugin);
        })
    },
    pluginsList: function (req, res) {
        PluginService.filterPlugins({ type: "server" }).then((plugins) => {
            res.json(plugins);
        }).catch((error) => {
            console.log("Error getting plugins", error);
            res.badRequest();
        })
    },
    pluginMethods: function (req, res) {
        PluginMethod.find({ plugin: req.param('id') }).populate("params").then((methods) => {
            res.json(methods);
        }).catch((error) => {
            console.log("Error getting methods", error);
            res.badRequest();
        });
    },
    createMapTrigger: function (req, res) {
        console.log(req.body)
        MapTrigger.create(req.body).then((trigger) => {
            res.json(trigger);
        }).catch((error) => {
            console.log("Error creating trigger", error);
            res.badRequest();
        })
    },
    findByMap: function (req, res) {
        MapTrigger.find({ map: req.param("id") }).then((triggers) => {
            res.json(triggers);
        }).catch((error) => {
            console.log("Error finding triggers", error);
            res.badRequest();
        });
    },

    pluginsPath: pluginsPath,
};

