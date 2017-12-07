/**
 * FileController
 *
 * @description :: Server-side logic for managing files
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var request = require('request');
var async = require('async');
var vm = require('vm');
var util = require('util');
var sandbox = {};

function evaluateExpression(exp, context) {
  if (!exp.code) {
    return exp.text;
  }
  else {
    sails.log(util.inspect(context));
    return vm.runInNewContext(exp.text, context);
  }
}

function createContext(mapObj, sandbox) {
  vm.createContext(sandbox);
  sails.log(mapObj.code);
  vm.runInNewContext(mapObj.code, sandbox); // fill sandbox with map context
  sails.log("********** contenxt **********");
  sails.log(util.inspect(sandbox));
  sails.log("********** contenxt **********");
}

function addActionResultToContext(context, linkId, processId, actionId, result) {
  /*sails.log.debug("action result! "+result);
    for(var i=0; i < context.map.links.length; i++){
        var link = context.map.links[i];
        if(link.id ===  linkId ){
            for(var j=0; j < link.processes.length; j++){
              var process = link.processes[j];
              if(process.id === processId ){
                for(var k=0; k < process.actions.length; k++){
                  var action = process.actions[k];
                  if(action.id === actionId){
                    action.result = result ;
                    sails.log.debug("success!");
                  }
                }
              }
            }
    }*/

  // result = result.replace("\n", "\\n");
  // sails.log(result);
  // var code = "for(var i=0; i < map.links.length; i++){ \n";
  // 		code+= "var link = map.links[i];\n";
  // 		code+=  "if(link.id === \"" + linkId + "\"){\n";
  // 		code+=  "  for(var j=0; j < link.processes.length; j++){\n";
  // 		code+=  "    var process = link.processes[j];\n";
  // 		code+=  "    if(process.id === " + processId + "){\n";
  // 		code+=  "      for(var k=0; k < process.actions.length; k++){\n";
  // 		code+=  "        var action = process.actions[k];\n";
  // 		code+=  "        if(action.id === " + actionId + "){\n";
  // 		code+=  "          action.result = \"" + result + "\";\n";
  // 		code+=  "        }\n";
  // 		code+=  "      }\n";
  // 		code+=  "    }\n";
  // 		code+=  "  }\n";
  // 		code+=  "}\n";
  // 		code+="}\n";
  // vm.runInNewContext(code, context);
}

function runAction(linkId, processId, action, socket) {
  return function (callback) {
    sails.log.info('Processing action ' + JSON.stringify(action, null, 2));
    for (var param in action.params) {
      action.params[param] = evaluateExpression(action.params[param], sandbox);
    }
    sails.log.info('evaluated! action ' + JSON.stringify(action, null, 2));
    socket.emit('update', 'running action ' + action.name +
      ":" + action.executionString + "\n");
    request.post(
      BaseAgentsService.baseAgent.url + '/task/register',
      { form: action },
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          socket.emit('update', 'finished running action ' + action.name +
            ":" + body + "\n");
          addActionResultToContext(sandbox, linkId, processId, action.id, body);
          callback(null, body);
        }
        else {
          socket.emit('update', 'execution failed action ' + action.name +
            ":" + error + "\n");
          // -1 represents error
          // addActionResultToContext(sandbox, linkId, processId, action.id, -1);
          callback(error);
        }
      }
    );
  }
}

function runProcess(link, socket, mapId, mapVersion, linkIndex) {
  var result = [];
  sails.log.info('Processing Process ' + link);
  var process = -1;
  for (var i = 0; i < link.processes.length; i++) {
    var proc = link.processes[i];
    if (proc.default_execution == true) {
      process = proc;
      break;
    }
  }
  if (link.processes.length == 1) {
    process = link.processes[0];
  }
  return function (callback) {
    var runStatuses = sails.config.constants.runStatuses;
    MapService.getMapById(mapId, function (map, err) {
      if (map.versions[mapVersion].status == runStatuses.Paused || map.versions[mapVersion].status == runStatuses.Stopped) {
        socket.emit('update', 'Map Paused or Stopped. \n');
        callback('error: Map Paused or Stopped');
        return;
      }

      socket.emit('update', 'running process ' + process.name +
        "\n");
      if (process === -1) {
        callback('error: no process with default execution flag');
      }
      sails.log.info("running process " + process);
      var actions = process.actions.sort(function (a, b) {
        return a.order - b.order;
      });
      var actionFuncs = [];
      for (var i = actions.length - 1; i >= 0; i--) {
        var act = actions[i];
        actionFuncs.push(runAction(link.id, process.id, act, socket));
      }
      ;
      async.series(actionFuncs, function (err, res) {
        // if any of the file processing produced an error, err would equal that error
        if (err) {
          // One of the iterations produced an error.
          // All processing will now stop.
          socket.emit('update', 'failed running process ' + process.name +
            ":" + err + "\n");
          callback('process ' + process.name + ' failed to run ' + err);
        } else {
          var actionsTotal = "";
          for (var i = 0; i < res.length; i++) {
            actionsTotal = actionsTotal + res[i] + "\n";
          }
          ;
          socket.emit('update', 'Finished running process ' + process.name + ":" + actionsTotal + "\n");

          map.versions[mapVersion].lastRunLink = linkIndex;

          callback(null, actionsTotal);
        }
      });
    });
  }
}

module.exports = {
  execute: function (req, res) {
    var userId = req.session.passport.user;
    if (MapService.runningMaps[req.body.map.id] == sails.config.constants.runStatuses.Running) {
      MessagesService.sendMessage("notification", "This map is already running", "info");
      res.badRequest();
      return;
    }

    MapService.runningMaps[req.body.map.id] = sails.config.constants.runStatuses.Running;
    MapService.executeMap(userId, req.body.map.id, req.body.map.versionIndex, req.body.map.deleteData).then((result) => {
      console.log("!@#!@#!@#");
      MapService.runningMaps[req.body.map.id] = sails.config.constants.runStatuses.Done;
      res.json(result);
    }).catch((error) => {
      sails.log.error("Error executing map", error);
      MapService.runningMaps[req.body.map.id] = sails.config.constants.runStatuses.Done;
      res.badRequest();
    })
  },
  resumeMap: function (req, res) {
    var mapObj = req.body;
    sandbox = {
      map: {
        nodes: mapObj.mapView.nodes,
        links: mapObj.mapView.links,
        attributes: mapObj.mapView.attributes
      }
    };

    MapService.getMapById(mapId).then((map) => {
      if (!map || map.versions.length - 1 < mapObj.versionIndex) {
        socket.emit('update', 'Map or map version Not Found');
        res.badRequest();
        return;
      } else if (map.versions[mapObj.versionIndex].status != sails.config.constants.runStatuses.Paused) {
        socket.emit('update', 'Map version Not Paused');
        res.badRequest();
        return;
      } else {
        map.versions[mapObj.versionIndex].status = sails.config.constants.runStatuses.Running;
        MapService.updateMap(map);
      }
      createContext(mapObj.mapView, sandbox);
      var links = mapObj.mapView.links;
      sails.log(JSON.stringify(links));
      var processesFuncs = [];
      for (var i = map.versions[mapObj.versionIndex].lastRunLink; i < links.length; i++) {
        var myLink = links[i];
        processesFuncs.push(runProcess(myLink, sails.io, mapObj.id, mapObj.versionIndex, i));
      }
      ;

      async.series(processesFuncs, function (err, myres) {
        // if any of the file processing produced an error, err would equal that error
        if (err) {
          map.versions[mapObj.versionIndex].status = sails.config.constants.runStatuses.Failed;
          // One of the iterations produced an error.
          // All processing will now stop.
          MapService.updateMap(map).then((updatedMap) => {
            sails.log.info("Map updated")
          });
        } else {
          var totalResult = "";
          for (var i = 0; i < myres.length; i++) {
            totalResult = totalResult + myres[i] + "\n";
          }
          map.versions[mapObj.versionIndex].status = sails.config.constants.runStatuses.Done;
          MapService.updateMap(map).then((updatedMap) => {
            res.send(totalResult);
          });
        }
      });
    }).catch((error) => {
      sails.log.error("Error resuming map", error);
      res.badRequest();
    })

  },
  testProcess: function (req, res) {
    var mapObj = req.body.map;
    var socket = sails.io;
    sandbox = {
      map: {
        nodes: mapObj.nodes,
        links: mapObj.links,
        attributes: mapObj.attributes
      }
    };
    createContext(mapObj, sandbox);
    result = "";
    var process = req.body.process;
    sails.log.info("running process " + JSON.stringify(process));
    socket.emit('update', "running process: " + process.name);
    var actions = process.actions.sort(function (a, b) {
      return a.order - b.order;
    });
    var linkId = 0;
    var actionFuncs = [];
    for (var i = actions.length - 1; i >= 0; i--) {
      var act = actions[i];
      actionFuncs.push(runAction(linkId, process.id, act, socket));
    }
    ;
    async.series(actionFuncs, function (err, myres) {
      // if any of the file processing produced an error, err would equal that error
      if (err) {
        // One of the iterations produced an error.
        // All processing will now stop.
        return res.send('process ' + process.name + ' failed to run');
      } else {
        var actionsTotal = "";
        for (var i = 0; i < myres.length; i++) {
          actionsTotal = actionsTotal + myres[i] + "\n";
        }
        ;
        socket.emit('update', "Finished running process: " + process.name + " result: " + actionsTotal);
        return res.send(actionsTotal);
      }
    });
  },
  testAction: function (req, res) {
    var mapObj = req.body.map;
    sails.log(req.body);
    sandbox = {
      map: {
        nodes: mapObj.nodes,
        links: mapObj.links,
        attributes: mapObj.attributes
      }
    };
    createContext(mapObj, sandbox);
    result = "";
    var action = req.body.action;
    sails.log.info('Processing action ' + JSON.stringify(action, null, 2));
    for (var param in action.params) {
      action.params[param] = evaluateExpression(action.params[param], sandbox);
    }
    sails.log.info('evaluated! action ' + JSON.stringify(action, null, 2));
    request.post(
      BaseAgentsService.baseAgent.url + '/task/register',
      { form: action },
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          result = result + "\n" + body;
          return res.send(result);
        }
        else {
          sails.log.error(error);
          return res.send("Error:" + error);
        }
      }
    );
  },
  executeByName: function (req, res) {
    var projectName = req.body.project;
    var mapName = req.body.map;
    var mapVersionIndex = req.body.versionIndex;
    var userId = req.session.passport.user;

    sails.log.debug("************* version index %d **************", mapVersionIndex);
    if (!projectName || !mapName) {
      sails.log.error("not enough parameters");
      return res.badRequest("Not enough parameters");
    }
    if (!mapVersionIndex) {
      mapVersionIndex = 0;
    }
    sails.log.debug("Executing map: %s proj: %s index: %s", mapName, projectName, mapVersionIndex);
    Map.findOne({ name: mapName }).populate("Project", { name: projectName }).then((map) => {
      return MapService.executeMap(userId, map.id, mapVersionIndex, [])
    }).then((result) => {
      res.json(text);
    }).catch((error) => {
      sails.log.error("Error executing map");
      res.badRequest();
    });
  },
  updateByName: function (req, res) {
    var projectName = req.body.project;
    var mapName = req.body.map;
    var name = req.body.name;
    var value = req.body.value;
    var type = req.body.type;
    var userId = req.session.passport.user;

    sails.log.debug("enter updated by name");

    if (!projectName || !mapName || !name || !value) {
      sails.log.error("not enough parameters");
      return res.badRequest("Not enough parameters");
    }
    Map.findOne({ name: mapName }).populate("Project", { name: projectName, user: userId }).then((map) => {
      sails.log.debug("map --- >");
      sails.log.debug(JSON.stringify(map));
      return MapService.addMapAttr(map, name, value, type).then((updatedMap) => {
        res.json(updatedMap);
      }).catch((error) => {
        sails.log.error("Error updating map", error);
        res.badRequest();
      });
    });
  }
};

