const path = require('path');
const unzip = require('unzip');
const fs = require('fs');
const streams = require('memory-streams');
const child_process = require("child_process");
const _ = require('lodash');

let pluginsModules = {};
let routesModule = {};
let pluginsPath = path.join(sails.config.appPath, "plugins");
let uploadPath = path.join(sails.config.appPath, "static", "upload");


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
          savedPlugin.main = path.join(path.dirname(fullPath), savedPlugin.main);
          savedPlugin.dir = path.dirname(fullPath);
          pluginsModules[savedPlugin.name] = savedPlugin;
          let methods = plugin.methods;
          let app = require(savedPlugin.main);
          methods.forEach(method => {
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
  if (plugin.type == "executer" || !pluginsModules)
    return;
  let methods = pluginsModules[plugin.name].methods;
  console.log(methods);
  methods.forEach(method => {
    if (method.route) {
      console.log(method.route);
      sails.router.unbind({
        path: method.route,
        verb: routesModule[method.route]
      })
    }
  })
}

let installPluginOnAgent = function (pluginDir, obj) {
  console.log("install plugin on agent");
  console.log(path.join(pluginsPath, obj.name));
  outputPath = path.join(pluginsPath, obj.name);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  // unzipping the img
  fs.createReadStream(pluginDir)
    .pipe(unzip.Parse())
    .on('entry', (entry) => {
      let fileName = entry.path;
      let type = entry.type;
      let size = entry.size;
      if (fileName === obj.imgUrl) {
        entry.pipe(fs.createWriteStream(path.join(outputPath, fileName)));
      }
    });

  BaseAgentsService.installExecuterPluginOnAgent(pluginDir).then(() => {
    console.log("Finish installing plugin on agents");
  }).catch(error => {
    console.log("Error installing plugin on agenst", error);
  });
};

let installPluginOnServer = function (pluginDir, obj) {
  outputPath = path.join(pluginsPath, obj.name);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  // unziping the file and installing the modules
  fs.createReadStream(pluginDir)
    .pipe(unzip.Parse())
    .on('entry', (entry) => {
      let fileName = entry.path;
      let type = entry.type;
      let size = entry.size;
      entry.pipe(fs.createWriteStream(path.join(outputPath, fileName)));
    }).on('close', (data) => {
    // when done unzipping, install the packages.
    let cmd = 'cd ' + outputPath + ' &&' + ' npm install ' + " && cd " + outputPath;
    child_process.exec(cmd, function (error, stdout, stderr) {
      if (error) {
        console.log("ERROR", error, stderr);
      }
    });
  });
};


module.exports = {
  createPlugin: function (pluginDir) {
    console.log("Create plugin");
    return new Promise((resolve, reject) => {
      // parse the plugin config file
      fs.createReadStream(pluginDir)
        .pipe(unzip.Parse())
        .on('entry', function (entry) {
          let fileName = entry.path;
          let type = entry.type;
          let size = entry.size;
          if (fileName === 'config.json') {
            let writer = new streams.WritableStream();
            entry.pipe(writer);
            entry.on('readable', function () {
              let obj = JSON.parse(writer.toString());
              // check the plugin type
              if (obj.type === "executer") {
                installPluginOnAgent(pluginDir, obj);
              }
              else if (obj.type === "trigger" || obj.type === "module" || obj.type === "server")
                installPluginOnServer(pluginDir, obj);
              else
                return reject("No type was provided for this plugin");
              Plugin.findOne({
                name: obj.name
              }).then((plugin) => {
                if (!plugin) {
                  return Plugin.create(obj)
                }
                return Plugin.update({
                  name: obj.name
                }, obj)
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
  pluginsModules: pluginsModules,
  pluginsPath: pluginsPath,
  uploadPath: uploadPath
}
