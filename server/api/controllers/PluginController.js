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

let pluginPath = path.join(sails.config.appPath, "plugins");
let uploadPath = path.join(sails.config.appPath, "static", "upload");

module.exports = {
    uploadPlugin: function (req, res) {
        // installing plugin on server and agents
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

            async.each(uploadedFiles, (file, callback) => {
                // for each file uploaded, check if it has an extension and if it is a archive.
                let extension = file.filename.substring(file.filename.lastIndexOf(".") + 1);
                if (extension && _.indexOf(["zip", "rar"], extension) === -1) {
                    console.log("Bad format");
                    return res.badRequest()
                }
                let dirname;
                extension ? dirName = file.filename.substring(0, file.filename.lastIndexOf(".")) : dirname = file.filename;
                let outputPath = path.join(pluginPath, dirName);
                if (!fs.existsSync(outputPath)) {
                    fs.mkdirSync(outputPath);
                }
                // unzip the file;
                fs.createReadStream(file.fd)
                    .pipe(unzip.Parse())
                    .on('entry', (entry) => {
                        var fileName = entry.path;
                        var type = entry.type; // 'Directory' or 'File'
                        var size = entry.size;
                        entry.pipe(fs.createWriteStream(path.join(pluginPath, dirName, fileName)));
                    }).on('close', (data) => {
                        // when done unziping, install the packages.
                        let cmd = 'cd ' + outputPath + ' &&' + ' npm install ' + " && cd " + outputPath;
                        exec(cmd, function (error, stdout, stderr) {
                            if (error || stderr) {
                                callback(error);
                            }
                            callback();
                        });
                    });
            }, (error) => {
                if (error) {
                    console.log("Error uploading plugin", error);
                    res.badRequest();
                } else {
                    res.ok();
                }
            })

        });
    }
};

