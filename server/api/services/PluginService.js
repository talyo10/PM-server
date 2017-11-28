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
            console.log("No plugin found at db. abort!")
            return;
          }
          savedPlugin.main = path.join(path.dirname(fullPath), savedPlugin.main);
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
    return ;
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

let installPluginOnAgent = function (pluginDir) {
  BaseAgentsService.installExecuterPluginOnAgent(pluginDir).then(() => {
    console.log("finish installing plugin on agents");
  }).catch(error => {
    console.log("Shit", error);
    
  })
}

let installPluginOnServer = function (pluginDir) {
  let dirname;
  let filename = path.basename(pluginDir);
  let extension = filename.substring(filename.lastIndexOf(".") + 1);

  extension ? dirName = filename.substring(0, filename.lastIndexOf(".")) : dirname = filename;
  outputPath = path.join(pluginsPath, dirName);
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
      entry.pipe(fs.createWriteStream(path.join(pluginsPath, dirName, fileName)));
    }).on('close', (data) => {
      // when done unziping, install the packages.
      let cmd = 'cd ' + outputPath + ' &&' + ' npm install ' + " && cd " + outputPath;
      child_process.exec(cmd, function (error, stdout, stderr) {
        if (error) {
          console.log("ERROR", error, stderr);
        }
      });
    });
}


module.exports = {
  createPlugin: function (pluginDir) {
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
              if (obj.type === "executer")
                installPluginOnAgent(pluginDir);
              else if (obj.type === "trigger" || obj.type === "module" || obj.type === "server")
                installPluginOnServer(pluginDir)
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
  uploadPath: uploadPath
}
