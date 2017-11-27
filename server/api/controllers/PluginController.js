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
const child_process = require('child_process');

let pluginsPath = path.join(sails.config.appPath, "plugins");
let uploadPath = path.join(sails.config.appPath, "static", "upload");

module.exports = {
  pluginsList: function (req, res) {
    Plugin.find().then((plugins) => {
      console.log(plugins);
      res.json(plugins);
    }).catch((error) => {
      MessagesService.sendMessage("notification", "Error getting plugins", "error");
      console.log("Error getting plugins", error);
      res.badRequest();
    })
  },
  uploadPlugin: function (req, res) {
    let newPlugin;
    // installing plugin on server.
    try {
      // trying to get filename
      filename = req.file('file')._files[0].stream.filename;
    } catch (error) {
      sails.log.error("can't read file " + error);
      MessagesService.sendMessage("notification", "Can't read file", "error");

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
        MessagesService.sendMessage("notification", "No file was uploaded, please try again", "error");

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
        PluginService.createPlugin(file.fd).then((obj) => {
          newPlugin = obj;
          console.log("Created plugin")
        });
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
            child_process.exec(cmd, function (error, stdout, stderr) {
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
          MessagesService.sendMessage("notification", "No uploading plugin, please try again", "error");

          return res.badRequest();
        } else {
          // load the plugin to current modules
          PluginService.loadPluginsModule(outputPath, null);
          res.json(newPlugin);
        }
      })

    });
  },
  triggerEvent: function (req, res) {
    let triggerdPlugin;
    let p = new Promise((resolve, reject) => {
      PluginService.getPlugin({
        name: req.param("name")
      }).then((plugin) => {
        if (!plugin.active) {
          reject("Plugin is not active");
        }
        triggerdPlugin = plugin;
        resolve(MapTrigger.find({
          plugin: plugin.id
        }).populate("method"));
      })
    }).then((triggers) => {
      triggers.forEach(trigger => {
        let currentModule = PluginService.pluginsModules[triggerdPlugin.name];
        params = {
          headers: req.headers,
          body: req.body
        }

        let workerProcess = child_process.spawn(currentModule.execProggram, [currentModule.main, JSON.stringify(params), JSON.stringify(trigger)]);

        workerProcess.stdout.on('data', (data) => {
          console.log(`trigger info: ${data}`);
        });

        workerProcess.stderr.on('data', (data) => {
          console.log(`trigger error: ${data}`);
        });

        workerProcess.on('close', function (code) {
          if (code === 0) {
            console.log("Executing map")
            MapService.executeMap("-1", trigger.map, 0, 0).then((result) => {
              console.log("finish executing map from trigger");
            });
          }
        });
      })
      res.ok()
    }).catch((error) => {
      console.log("Error during calling trigger", error);
      res.badRequest();
    })
  },
  triggersList: function (req, res) {
    PluginService.filterPlugins({
      type: ["server", "trigger"]
    }).then((plugins) => {
      res.json(plugins);
    }).catch((error) => {
      console.log("Error getting plugins", error);
      res.badRequest();
    })
  },
  pluginDelete: function (req, res) {
    Plugin.findOne(req.param("id")).then((plugin) => {
      if (!plugin)
        throw new Error("No plugin found");
      PluginService.unbindPluginRoutes(plugin);
      if (plugin.type === "server") {
        return PluginMethod.destroy({
          plugin: req.param("id")
        })
      } else {
        Plugin.destroy({
          id: plugin.id
        }).then(() => {
          res.ok();
        })
      }
    }).then(() => {
      return MapTrigger.destroy({
        plugin: req.param("id")
      })
    }).then(() => {
      Plugin.destroy({
        id: req.param("id")
      }).then(() => {
        res.ok();
      });
    }).catch((error) => {
      console.log("Error deleteing plugin", error);
      res.badRequest();
    });
  },
  pluginDetail: function (req, res) {
    Plugin.findOne({
      or: [{
          id: req.param("query")
        },
        {
          name: req.param("query")
        }
      ]
    }).then((plugin) => {
      res.json(plugin);
    }).catch((error) => {
      console.log("Error getting plugin", error);
      res.badRequest();
    });
  },
  pluginMethods: function (req, res) {
    PluginMethod.find({
      plugin: req.param('id')
    }).populate("params").then((methods) => {
      res.json(methods);
    }).catch((error) => {
      console.log("Error getting methods", error);
      res.badRequest();
    });
  },
  triggersList: function (req, res) {
    PluginService.filterPlugins({
      type: "server"
    }).then((plugins) => {
      res.json(plugins);
    }).catch((error) => {
      console.log("Error getting plugins", error);
      res.badRequest();
    })
  },
  pluginDelete: function (req, res) {
    Plugin.findOne(req.param("id")).then((plugin) => {
      PluginService.unbindPluginRoutes(plugin);
      if (plugin.type === "server") {
        return PluginMethod.destroy({
          plugin: req.param("id")
        })
      } else {
        Plugin.destroy({
          id: plugin.id
        }).then(() => {
          res.ok();
        })
      }
    }).then(() => {
      return MapTrigger.destroy({
        plugin: req.param("id")
      })
    }).then(() => {
      Plugin.destroy({
        id: req.param("id")
      }).then(() => {
        res.ok();
      });
    }).catch((error) => {
      console.log("Error deleteing plugin", error);
      MessagesService.sendMessage("notification", "Error deleting plugins", "error");

      res.badRequest();
    });
  },
  pluginMethods: function (req, res) {
    PluginMethod.find({
      plugin: req.param('id')
    }).populate("params").then((methods) => {
      res.json(methods);
    }).catch((error) => {
      console.log("Error getting methods", error);
      res.badRequest();
    });
  },
  mapTriggerDelete: function (req, res) {
    MapTrigger.destroy({
      id: req.param("id")
    }).then(() => {
      res.ok();
    }).catch((error) => {
      console.log("Error deleteing trigger", error);
      MessagesService.sendMessage("notification", "Error deleting trigger", "error");

      res.badRequest();
    })
  },
  createMapTrigger: function (req, res) {
    console.log(req.body)
    MapTrigger.create(req.body).then((trigger) => {
      res.json(trigger);
    }).catch((error) => {
      console.log("Error creating trigger", error);
      MessagesService.sendMessage("notification", "Error creating trigger", "error");

      res.badRequest();
    })
  },
  findByMap: function (req, res) {
    MapTrigger.find({
      map: req.param("id")
    }).populate("method").populate("plugin").then((triggers) => {
      res.json(triggers);
    }).catch((error) => {
      console.log("Error finding triggers", error);
      res.badRequest();
    });
  },
  mapTriggerUpdate: function (req, res) {
    console.log(req.body);
    MapTrigger.update({
      id: req.body.id
    }, req.body).then((triggers) => {
      MapTrigger.findOne(triggers[0].id).populate("plugin").populate("method").then((trigger) => {
        res.json(trigger);
      })
    }).catch((error) => {
      console.log("Error updating trigger", error);
      MessagesService.sendMessage("notification", "Error updating trigger", "error");

      res.badRequest();
    })

  },
  pluginsPath: pluginsPath,
};
