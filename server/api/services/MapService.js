var jsonpatch = require('fast-json-patch'),
  request = require('request'),
  async = require('async'),
  Graph = require('graphlib').Graph,
  graphlib = require('graphlib'),
  vm = require('vm'),
  gitrepo = require('../../repos/git-cli'),
  util = require('util'),
  YAML = require('json2yaml'),
  path = require('path'),
  NO_SUCH_MAP_ERR = "Map doesn't exist",
  map_filterServers = 'filterServers();',
  map_onStart = '(function() { if(typeof onStart === \'undefined\'){} else { onStart(); } })();',
  map_onStop = '(function() { if(typeof onStop === \'undefined\'){} else { onStop(); } })();',
  map_onResume = '(function() { if(typeof onResume === \'undefined\'){} else { onResume(); } })();',
  map_onPause = '(function() { if(typeof onPause === \'undefined\'){} else { onPause(); } })();',
  map_onDone = '(function() { if(typeof onDone === \'undefined\'){} else { onDone(); } })();',
  map_getMapValue = '(function() { return map; })();',
  map_getCurrentAgentValue = '(function() { return currentAgent;})();',
  sandbox = {},
  startID = "fd1000fc-11cc-4261-9dcd-b2b9a53a3131",
  runStatuses = sails.config.constants.runStatuses,
  runningMaps = {},
  printToConsoleFromCode = function (agent, mapName, socket) {
    return function (msg) {
      var codeMsg = {
        date: new Date(),
        agent: agent.name,
        map: mapName,
        msg: 'Code Print: ' + msg + '\n'
      };
      socket.emit('update', JSON.stringify(codeMsg));
    };
  },
  fs = require('fs'),
  buildMapGraph = function (map) {
    var map_graph = new Graph({ directed: true });
    for (var nodeName in map.nodes) {
      var node = map.nodes[nodeName];
      map_graph.setNode(node.id, node);
    }
    for (var i = map.links.length - 1; i >= 0; i--) {
      var link = map.links[i];
      link.linkIndex = i;
      map_graph.setEdge(link.sourceId, link.targetId, link);
    }

    sources = map_graph.sources();
    for (var src in sources) {
      src = sources[src];
      if (src !== startID) {
        map_graph.removeNode(src);
      }
    }
    return map_graph;
  },
  getMap = function (mapId) {
    return Map.findOne(mapId);
  },
  updateMap = function (map) {
    return Map.update({ id: map.id }, map);
  },
  updateMapOnFinish = function (mapId, executionContext) {
    var umap = vm.runInNewContext(map_getMapValue, executionContext);
    return Map.update({ id: mapId }, umap);
  },
  updateAgent = function (agent, executionContext) {
    var uAgent = vm.runInNewContext(map_getCurrentAgentValue, executionContext);
    return BaseAgent.update({ id: agent.id }, uAgent);
  },
  updateVersionResult = function (user, mapId, versionIndex, resultLog, resultObj) {
    return Map.findOne(mapId).then((map) => {
      if (user == "-1") {
        user = {
          username: "Trigger Service"
        };
      }

      var latestStructure = generateVersion(map, map.versions.length - 1);
      resultObj.finishDate = (new Date()).toString();
      var executionResult = {
        log: resultLog,
        resObj: resultObj,
        map: latestStructure,
        date: new Date(),
        lastEditor: user.username
      };
      map.versions[versionIndex].executions.push(executionResult);
      map.versions[versionIndex].lastEditor = user.username;
      map.versions[versionIndex].status = sails.config.constants.runStatuses.Done;
      return map
    })
  },
  getDedicatedUrl = function (agent, type) {
    for (var i = agent.dedicatedAgents.length - 1; i >= 0; i--) {
      var dedicated = agent.dedicatedAgents[i];
      if (dedicated.type === type) {
        return dedicated.url;
      }
    }
    return '';
  },
  generateVersion = function (map, versionIndex) {
    if (versionIndex < map.versions.length)
      return map.versions[versionIndex].structure;
    return {};
  },
  updateActionParam = function (context, linkId, processId, actionName, param) {
    for (var i = 0; i < context.map.links.length; i++) {
      var link = context.map.links[i];
      if (link.id === linkId) {
        for (var j = 0; j < link.processes.length; j++) {
          var process = link.processes[j];
          if (process.id === processId) {
            for (var k = 0; k < process.actions.length; k++) {
              var action = process.actions[k];
              if (action.name === actionName) {
                action.params[param.name] = param.value;
              }
            }
          }
        }
      }
    }
  },
  evaluateExpression = function (exp, context, linkId, processId, actionName) {
    var res;
    if (!exp.code) {
      res = exp.text;
    }
    else {
      res = vm.runInNewContext(exp.text, context);
    }
    var param = {
      name: exp.name,
      value: res
    };
    updateActionParam(context, linkId, processId, actionName, param);
    return res;
  },
  createContext = function (mapObj, context) {
    try {
      vm.createContext(context);
      vm.runInNewContext(libpm + "\n" + mapObj.code, context); // fill context with map context
      return 0;
    } catch (error) {
      sails.log.error("Error creating context: ", error);
      return error;
    }
  },
  addProcessResultToContext = function (context, linkId, processId, result, status) {
    for (var i = 0; i < context.map.links.length; i++) {
      var link = context.map.links[i];
      if (link.id == linkId) {
        for (var j = 0; j < link.processes.length; j++) {
          var process = link.processes[j];
          if (process.name == processId) {
            process.result = result;
            process.status = status;
            context.currentProcess.result = result;
            context.currentProcess.status = result;
            link.status = 0;
            return;
          }
        }
      }
    }
  },
  addActionResultToContext = function (context, linkId, processId, actionName, result, status) {
    for (var i = 0; i < context.map.links.length; i++) {
      var link = context.map.links[i];
      if (link.id == linkId) {
        for (var j = 0; j < link.processes.length; j++) {
          var process = link.processes[j];
          if (process.name == processId) {
            for (var k = 0; k < process.actions.length; k++) {
              var action = process.actions[k];
              if (action.name == actionName) {
                action.result = result;
                action.status = status;
                context.currentAction.result = result;
                context.currentAction.status = result;
                link.status = 0;
                return;
              }
            }
          }
        }
      }
    }
  },
  runAction = function (mapId, mapName, versionIndex, executionIndex, linkId, processId, processKey, action, socket, agent, executionContext, executionResult, runningExecutionResults) {
    return function (callback) {
      var action_str = 'var currentAction = ' + JSON.stringify(action) + ";";
      var msg;
      action_str += 'previousAction = getPreviousAction();';
      vm.runInNewContext(action_str, executionContext);

      if (runningMaps[mapId] == runStatuses.Stopped) {
        vm.runInNewContext(map_onStop, executionContext);

        MessagesService.sendMessage("update", "Map '" + mapName + "' paused or stopped", "info");
        callback('Map Stopped');
        return;
      }
      if (!BaseAgentsService.liveAgents[agent.key].runningMaps) {
        BaseAgentsService.liveAgents[agent.key].runningMaps = {};
      }
      BaseAgentsService.liveAgents[agent.key].runningMaps[mapId] = action;

      action = JSON.parse(JSON.stringify(action));
      var key = action.name;


      if (!runningExecutionResults.agents[agent.key].processes[processKey].agents) {
        runningExecutionResults.agents[agent.key].processes[processKey].agents = {};
      }


      if (!executionResult.links[linkId].processes[processKey].actions[key]) {
        executionResult.links[linkId].processes[processKey].actions[key] = JSON.parse(JSON.stringify(action));
        executionResult.links[linkId].processes[processKey].actions[key].agents = {};
      }

      if (!runningExecutionResults.agents[agent.key].processes[processKey].actions[key]) {
        runningExecutionResults.agents[agent.key].processes[processKey].actions[key] = JSON.parse(JSON.stringify(action));
      }

      action.params = {};
      for (var paramIndex in action.method.params) {
        var cParam = action.method.params[paramIndex];
        action.params[cParam.name] = cParam;
      }

      for (var param in action.params) {
        try {
          action.params[param] = evaluateExpression(action.params[param], executionContext, linkId, processId, action.name);
        } catch (e) {
          executionResult.links[linkId].processes[processKey].actions[key].agents[agent.key] = {
            startTime: (new Date()).toString(),
            endTime: (new Date()).toString(),
            status: -1,
            result: "Error:" + e
          };

          runningExecutionResults.agents[agent.key].processes[processKey].actions[key].finishTime = new Date();
          runningExecutionResults.agents[agent.key].processes[processKey].actions[key].status = 'error';
          runningExecutionResults.agents[agent.key].processes[processKey].actions[key].result = 'Error' + e;

          sails.log.error("Error execution map", e);
          MessagesService.sendMessage("serverError", "Action " + action.name + " failed executing", "error")
          if (action.mandatory) {
            callback(e);
          }
          else {
            callback(); // Action failed but we don't care
          }
          return;
        }
      }
      MessagesService.sendMessage("update", "Running action: '" + action.name + "'", "info")
      action.server.url = getDedicatedUrl(agent, action.server.type);
      var startTime = new Date();
      request.post(
        agent.url + '/task/register',
        {
          form: {
            mapId: mapId,
            versionId: versionIndex,
            executionId: executionIndex,
            action: action,
            key: agent.key
          }
        },
        function (error, response, body) {
          try {
            body = JSON.parse(body);
          } catch (e) {
            // statements
            body = {
              res: e
            };
          }
          if (!error && response.statusCode == 200) {
            MessagesService.sendMessage("update", "Action '" + action.name + "' result: " + body.res, "success")
            SystemLogService.create("Finish running map", mapId, 'Map', 'execution', 'success');
            addActionResultToContext(executionContext, linkId, processId, action.name, body.res, 0);
            executionResult.links[linkId].processes[processKey].actions[key].agents[agent.key] = {
              startTime: (new Date()).toString(),
              endTime: (new Date()).toString(),
              status: 0,
              result: body.res
            };
            runningExecutionResults.agents[agent.key].processes[processKey].actions[key].startTime = startTime;
            runningExecutionResults.agents[agent.key].processes[processKey].actions[key].finishTime = new Date();
            runningExecutionResults.agents[agent.key].processes[processKey].actions[key].status = 'success';
            runningExecutionResults.agents[agent.key].processes[processKey].actions[key].result = body.res;
            runningExecutionResults.agents[agent.key].processes[processKey].actions[key].startTime = startTime;

            callback(null, body);
          }
          else {
            sails.log.error(JSON.stringify(body));
            sails.log.error(error);
            var res = body.error;
            if (!res) {
              res = error;
            }
            MessagesService.sendMessage("serverError", "Failed executing action '" + action.name + "': " + res, "error")
            MessagesService.sendMessage("update", "Failed executing action '" + action.name + "': " + res, "error")
            addActionResultToContext(executionContext, linkId, processId, action.name, res, -1);
            executionResult.links[linkId].processes[processKey].actions[key].agents[agent.key] = {
              startTime: (new Date()).toString(),
              endTime: (new Date()).toString(),
              status: -1,
              result: "Error:" + res
            };

            runningExecutionResults.agents[agent.key].processes[processKey].actions[key].startTime = startTime;
            runningExecutionResults.agents[agent.key].processes[processKey].actions[key].finishTime = new Date();
            runningExecutionResults.agents[agent.key].processes[processKey].actions[key].status = 'error';
            runningExecutionResults.agents[agent.key].processes[processKey].actions[key].result = 'Error: ' + res;


            if (action.mandatory) {
              callback(res);
            }
            else {
              callback(); // Action failed but we don't care
            }
          }
        }
      );
    };
  },
  runProcess = function (socket, mapId, mapVersion, executionIndex, agent, executionContext, executionResult, runningExecutionResults) {
    return function (link, callback) {
      if (link.processes.length === 0) {
        console.log("No processes in this link", link.linkIndex);
        callback();
        return;
      }
      var linkIndex = link.linkIndex;
      var link_str = 'var currentLink = ' + JSON.stringify(link);
      var msg;
      var res;
      vm.runInNewContext(link_str, executionContext);
      if (link.condition) {
        try {
          res = vm.runInNewContext(link.conditionCode, executionContext);
        } catch (e) {
          sails.log.error(e);
          callback("Error: undefinde variable " + e);
          return;
        }
        if (res === false) {
          sails.log.info("filter function dropped link");
          callback(); // return
          return;
        }
      }
      if (link.filterAgent) {
        try {
          res = vm.runInNewContext(link.filterAgentCode, executionContext);
        } catch (e) {
          sails.log.error(e);
          callback(null, { error: "Error: undefinde variable " + e });
          return;
        }
        if (res === false) {
          sails.log.info("filter Agent function dropped link");
          callback(); // return
          return;
        }
      }

      var result = [];
      console.log('Processing link ' + link);
      let process;
      for (let i = 0; i < link.processes.length; i++) {
        // Check if there is a default execution
        let proc = link.processes[i];
        if (proc.default_execution === true) {
          console.log("Found a default process");
          if (!proc.condition) {
            process = proc;
            process.id = i;
            break;
          }
          try {
            res = vm.runInNewContext(proc.conditionCode, executionContext);
          } catch (e) {
            // if there was an error, stop running.
            console.log("Error running process in new context", e);
            callback("Error running process " + e);
            return;
          }

          if (res !== false) {
            process = proc;
            process.id = i;
            break;
          }
        }
      }

      if (!process) {
        // No default process found, or it didn't passed its condition
        // checking processes conditions;
        // When finding a process that passes the condition the loop will break (only 1 process can run on each link)
        for (let i = 0; i < link.processes.length; i++) {
          let proc = link.processes[i];
          if (proc.condition) {
            console.log("The process has a condition");
            try {
              res = vm.runInNewContext(proc.conditionCode, executionContext);
            } catch (e) {
              // if there was an error, stop running.
              console.log("Error running process in new context", e);
              callback("Error running process " + e);
              return;
            }

            if (res !== false) {
              process = proc;
              process.id = i;
              break;
            }
          } else {
            process = proc;
            process.id = i;
          }
        }
      }

      if (!process) {
        // no process passed its condition
        MessagesService.sendMessage("update", "No processes passed their conditions", "info")

        console.log("No process passed the condition");
        callback();
        return;
      }

      var process_str = 'previousProcess = JSON.parse(JSON.stringify(currentProcess));';
      process_str += 'currentProcess = ' + JSON.stringify(process) + ";";
      vm.runInNewContext(process_str, executionContext);
      Map.findOne(mapId).then((map) => {
        if (runningMaps[mapId] == runStatuses.Paused) {
          vm.runInNewContext(map_onPause, executionContext);
          MessagesService.sendMessage("update", "Map " + map.name + " Paused", "info")
          callback('error: Map Paused');
          return;
        }

        if (process === -1 || !process) {
          callback('error: no process with default execution flag');
        }

        MessagesService.sendMessage("update", "Running process: '" + process.name + "'", "info")

        /*var actions = process.actions.sort(function (a, b) {
            return b.order - a.order;
        });*/
        var actionFuncs = [];
        var key = process.name;
        for (var i = 0; i < process.actions.length; i++) {
          var act = process.actions[i];
          actionFuncs.push(runAction(mapId, map.name, mapVersion, executionIndex, link.id, process.name, key, act, socket, agent, executionContext, executionResult, runningExecutionResults));
        }

        if (!executionResult.links) {
          executionResult.links = {};
        }

        if (!executionResult.links[link.id]) {
          executionResult.links[link.id] = {};
          executionResult.links[link.id].agents = {};
          executionResult.links[link.id].processes = {};
        }

        if (!executionResult.links[link.id].processes) {
          executionResult.links[link.id].processes = {};
        }

        if (!executionResult.links[link.id].processes[key]) {
          executionResult.links[link.id].processes[key] = JSON.parse(JSON.stringify(process));
          executionResult.links[link.id].processes[key].actions = {};
          executionResult.links[link.id].processes[key].agents = {};
        }

        executionResult.links[link.id].agents[agent.key] = {
          startTime: (new Date()).toString(),
          endTime: (new Date()).toString(),
          status: -1,
          result: '',
          executed: false
        };

        executionResult.links[link.id].processes[key].agents[agent.key] = {
          startTime: (new Date()).toString(),
          endTime: (new Date()).toString(),
          status: -1,
          result: ''
        };

        if (!runningExecutionResults.agents[agent.key]) {
          runningExecutionResults.agents[agent.key] = {};
          runningExecutionResults.agents[agent.key].processes = {};
        }

        if (!runningExecutionResults.agents[agent.key].processes) {
          runningExecutionResults.agents[agent.key].processes = {};
          runningExecutionResults.agents[agent.key].processes[key] = {};
          runningExecutionResults.agents[agent.key].actions = {};
        }

        if (!runningExecutionResults.agents[agent.key].processes[key]) {
          runningExecutionResults.agents[agent.key].processes[key] = JSON.parse(JSON.stringify(process));
        }

        runningExecutionResults.agents[agent.key].processes[key].actions = {};

        // creating a record for the process and setting start time
        var startTime = new Date();

        async.series(actionFuncs, function (err, res) {
          // if any of the file processing produced an error, err would equal that error
          var key = process.name;
          var msg;
          if (err) {
            // One of the iterations produced an error.
            // All processing will now stop.
            MessagesService.sendMessage("update", "Error executing process '" + process.name + "':" + err, "error")

            executionResult.links[link.id].processes[key].agents[agent.key] = {
              startTime: (new Date()).toString(),
              endTime: (new Date()).toString(),
              status: -1,
              result: "Error: " + err
            };

            runningExecutionResults.agents[agent.key].processes[key] = {
              startTime: startTime,
              finishTime: new Date(),
              status: 'error',
              result: "Error: " + err
            };

            addProcessResultToContext(executionContext, link.id, process.name, err, -1);

            if (process.mandatory) {
              callback('process ' + process.name + ' failed to run ' + err, null);
            }
            else {
              callback();
            }
          } else {
            var actionsTotal = "";
            for (var i = 0; i < res.length; i++) {
              if (!res[i]) {
                continue;
              }
              actionsTotal = actionsTotal + res[i].res + "\n";
            }
            MessagesService.sendMessage("update", "Process '" + process.name + "' result: " + actionsTotal, "success");
            executionResult.links[link.id].processes[key].agents[agent.key].result = actionsTotal;
            executionResult.links[link.id].processes[key].agents[agent.key].endTime = (new Date()).toString();
            executionResult.links[link.id].processes[key].agents[agent.key].status = 0;

            executionResult.links[link.id].agents[agent.key].result = actionsTotal;
            executionResult.links[link.id].agents[agent.key].endTime = (new Date()).toString();
            executionResult.links[link.id].agents[agent.key].status = 0;
            executionResult.links[link.id].agents[agent.key].executed = true;

            runningExecutionResults.agents[agent.key].processes[key].startTime = startTime;
            runningExecutionResults.agents[agent.key].processes[key].finishTime = new Date();
            runningExecutionResults.agents[agent.key].processes[key].status = 'success';
            runningExecutionResults.agents[agent.key].processes[key].result = actionsTotal;

            addProcessResultToContext(executionContext, link.id, process.name, actionsTotal, 0);

            map.versions[mapVersion].lastRunLink = linkIndex;
            callback(null, actionsTotal);
          }
        });
      });
    };
  },
  parallelProcesses = function (node, socket, mapId, mapVersion, executionIndex, agent, executionContext, map_graph, executionResult, runningExecutionResults) {
    return function (callback) {
      var links = [];
      var continueExecution = false;
      var inDegrees = map_graph.inEdges(node);
      for (var i = inDegrees.length - 1; i >= 0; i--) {
        var glink = inDegrees[i];
        var mapLink = map_graph.edge(glink.v, glink.w);
        try {
          if (executionResult.links[mapLink.id].agents[agent.key].executed === true) {
            continueExecution = true;
            break;
          }
        } catch (e) {
          continue;
        }

      }
      continueExecution = (inDegrees.length === 0) || continueExecution;
      if (continueExecution === false) {
        callback(null, "stoped execution: condition returned false");
        return;
      }
      var g_links = map_graph.outEdges(node);
      for (i = g_links.length - 1; i >= 0; i--) {
        var link = g_links[i];
        links.push(map_graph.edge(link.v, link.w));
      }
      async.each(links,
        runProcess(socket, mapId, mapVersion, executionIndex, agent, executionContext, executionResult, runningExecutionResults),
        function (err) {
          if (!err) {
            callback(null, "success");
          }
          else {
            callback(null, "Error: " + err);
          }
        });
    };
  };
runMapFromAgent = function (links, mapId, versionIndex, executionIndex, socket, globalScope, mapstruct, executionResult, cleanWorkspace, runningExecutionResults) {
  return function (agent, callback) {
    var startTime = new Date();
    var map_graph = buildMapGraph(mapstruct);
    var executionContext = JSON.parse(JSON.stringify(globalScope));
    createContext(mapstruct, executionContext);
    executionContext.printToConsole = printToConsoleFromCode(agent, executionContext.map.name, socket);
    var agent_str = 'var currentAgent = ' + JSON.stringify(agent);
    vm.runInNewContext(agent_str, executionContext);
    var processesFuncs = [];
    var sortedNodes = graphlib.alg.topsort(map_graph);
    for (var i = 0; i < sortedNodes.length; i++) {
      var node = sortedNodes[i];
      processesFuncs.push(parallelProcesses(node, socket, mapId, versionIndex, executionIndex, agent, executionContext, map_graph, executionResult, runningExecutionResults));
    }
    async.series(processesFuncs, function (err, myres) {
      // update the agent value
      updateAgent(agent, executionContext).then((agent) => {
        return updateMapOnFinish(mapId, executionContext)
      }).then((updatedMapModel) => {
        var totalResult = "";
        for (var key in executionResult.links) {
          for (var pkey in executionResult.links[key].processes) {
            totalResult = totalResult + executionResult.links[key].processes[pkey].agents[agent.key].result + "\n";
          }
        }
        executionResult.agents[agent.key].result = totalResult;
        executionResult.agents[agent.key].status = 0;
        executionResult.agents[agent.key].endTime = (new Date()).toString();

        runningExecutionResults.agents[agent.key].result = totalResult;
        runningExecutionResults.agents[agent.key].finishTime = new Date();
        runningExecutionResults.agents[agent.key].startTime = new Date();
        runningExecutionResults.agents[agent.key].status = 'success';


        if (cleanWorkspace) {
          request.post(
            agent.url + '/deleteworkspace',
            {
              form: {
                mapId: mapId,
                versionId: versionIndex,
                executionId: executionIndex,
                key: agent.key
              }
            },
            function (error, response, body) {
              return callback(null, totalResult);
            }
          );
        } else {
          return callback(null, totalResult);
        }
      }).catch((error) => {
        sails.log.error("Error in runMapFromAgent", error);
        MapService.updateVersionStatus(mapId, versionIndex, sails.config.constants.runStatuses.Failed, function () {
          callback(null, 'Error: ' + error + " " + errorVal);
        });
      });
    })
  };
};

var libpm = '';
fs.readFile(path.join(sails.config.appPath, 'static/libs/lib_production_map.js'), 'utf8', function (err, data) {
  // opens the lib_production file. this file is used for user to overwrite custom function at map code.
  if (err) {
    return console.log(err);
  }
  libpm = data;
});

function addNewMapVersion(map) {
  return Map.findOne(map.id).populate("agents").then((oldMap) => {
    if (!oldMap || oldMap === "") {
      sails.log.error("Problem loading map");
    }
    var latestStructure = generateVersion(oldMap, oldMap.versions.length - 1);
    var diff = jsonpatch.compare(latestStructure, map.mapView);

    if (diff.length > 0) {
      var version = {
        date: new Date(),
        structure: map.mapView,
        executions: []
      };
      oldMap.versions.push(version);
    }
    oldMap.versionIndex = oldMap.versions.length - 1;

    return oldMap.save();
  });
}

function createExecutionModels(runningExecutionResults) {
  Execution.create({
    map: runningExecutionResults.map,
    startAgentsNumber: runningExecutionResults.map.agents.length,
    status: runningExecutionResults.status,
    mapVersion: runningExecutionResults.mapVersion,
    startTime: runningExecutionResults.startTime,
    finishTime: runningExecutionResults.finishTime
  }).then((exec) => {
    return exec
  }).then((exec) => new Promise((resolve, reject) => {
    for (let i in runningExecutionResults.agents) {
      let agentResults = runningExecutionResults.agents[i];
      AgentExecutionResult.create({
        agent: agentResults.id,
        status: agentResults.status,
        result: agentResults.result,
        startTime: agentResults.startTime,
        finishTime: agentResults.finishTime,
        execution: exec.id
      })
        .then((agentExec) => {
          for (let k in agentResults.processes) {
            let processResults = agentResults.processes[k];
            ProcessExecutionResult.create({
              status: processResults.status,
              result: processResults.result,
              startTime: processResults.startTime,
              finishTime: processResults.finishTime,
              processName: k,
              agentExecution: agentExec.id
            }).then((processExec) => {
              for (let j in processResults.actions) {
                let actionResult = processResults.actions[j];
                ActionExecutionResult.create({
                  status: actionResult.status,
                  startTime: actionResult.startTime,
                  finishTime: actionResult.finishTime,
                  actionName: j,
                  processExecution: processExec.id,
                  result: actionResult.result
                }).then(() => {
                  resolve();
                });
              }
            });
          }
        });
    }

    resolve();
  }))

}
function executeMapById(userId, mapId, versionIndex, cleanWorkspace) {
  MessagesService.sendMessage("update", "Start executing map", "info");
  MessagesService.sendMessage("notification", "Starting map executin", "info");

  var socket = sails.io;
  var user = null;
  var map = null;
  var executionContext = null;
  var executionIndex = null;
  var executionResult = {};
  var runningExecutionResults = {};
  var mapVersionStructure = null;
  var globalContext = null;

  return User.findOne({ id: userId }).then((ruser) => {
    user = ruser
    return Map.findOne(mapId).populate('agents')
  }).then((rmap) => {
    map = rmap;

    SystemLogService.info("Starting map execution", map, "execution");

    if (versionIndex <= 0) versionIndex = map.versions.length - 1;
    if (!map || map.versions.length - 1 < versionIndex) {
      MessagesService.sendMessage("update", "Map or map version not found", "error");
      SystemLogService.error("Map or map version not found", map, "execution");
      throw new Error("Whoops! Map or map version Not Found");
    } else {
      map.versions[versionIndex].status = sails.config.constants.runStatuses.Running;
      return MapService.updateMap(map);
    }
  }).then(() => {
    executionResult.name = map.name;
    executionResult.version = versionIndex;
    executionResult.date = (new Date()).toString();
    executionResult.startDate = (new Date()).toString();

    runningExecutionResults.map = map;
    runningExecutionResults.mapVersion = versionIndex;
    runningExecutionResults.startTime = new Date();

    mapVersionStructure = generateVersion(map, versionIndex);
    executionContext = {
      map: {
        name: map.name,
        id: map.id,
        nodes: mapVersionStructure.nodes,
        links: mapVersionStructure.links,
        attributes: mapVersionStructure.attributes
      }
    };

    globalContext = JSON.parse(JSON.stringify(executionContext));

    var contextRes = createContext(mapVersionStructure, executionContext);
    if (contextRes !== 0) {
      map.versions[versionIndex].status = sails.config.constants.runStatuses.Failed;
      MessagesService.sendMessage("update", "Error: '" + contextRes.message + "\n" + contextRes.stack + "'", "error");
      MessagesService.sendMessage("update", "Failed running map '" + executionResult.name + "'", "error");
      SystemLogService.error("Failed running map", map, "execution");
      throw new Error("Failed running map " + executionResult.name);
    }
    sails.log("Running map onstart hook: " + map.name);
    vm.runInNewContext(map_onStart, executionContext);
    /* onStart hook execution */
    sails.log("Finished Running map onstart hook: " + map.name);
    return BaseAgentsService.getAgentsData()
  }).then((initialAgents) => {
    /* filter baseagents */
    vm.runInNewContext("var servers = " + JSON.stringify(initialAgents) + ";", executionContext);
    try {
      res = vm.runInNewContext(map_filterServers, executionContext);
    } catch (e) {
      SystemLogService.error("Failed running map", map, "execution");
      MessagesService.sendMessage("update", "Failed executing map '" + map + "'", "error");
      throw new Error("Error: undefinde variable " + e);
    }
    if (!res) {
      sails.log.error("no filter function (this should not happen)");
      MessagesService.sendMessage("update", "No filter function at '" + map.name + "'" , "info");

    }
    else if (res !== false) {
      agentsIds = {};
      for (var i = res.length - 1; i >= 0; i--) {
        var myAgent = res[i];
        agentsIds[myAgent] = true;
      }
    }

    var agents = {};
    var agentsStats = BaseAgentsService.liveAgents;
    for (var mapAgent of map.agents) {
      if (mapAgent && mapAgent.key && agentsStats[mapAgent.key].alive) {
        agents[mapAgent.key] = mapAgent;
      }
    }
    if (Object.keys(agents).length === 0 ){
      MessagesService.sendMessage("update", "No agents selected or none is alive. Please check agents status at the agents tab.", "error");
    }
    executionResult.agents = agents;

    // sets the map agents which are alive.
    runningExecutionResults.agents = agents;
    executionIndex = map.versions[versionIndex].executions.length;
    return new Promise((resolve, reject) => {
      async.each(agents,
        runMapFromAgent(mapVersionStructure.links, mapId, versionIndex, executionIndex, socket, JSON.parse(JSON.stringify(globalContext)), mapVersionStructure, executionResult, cleanWorkspace, runningExecutionResults),
        function (err) {
          if (err) {
            sails.log.error(JSON.stringify(err));
            map.versions[versionIndex].status = sails.config.constants.runStatuses.Failed;
            SystemLogService.error("Failed running map", map, "execution");
            MessagesService.sendMessage("update", "Failed executing map", "error");

            runningExecutionResults.agents[agent.key].status = 'error';
            reject(JSON.stringify(err))
          }

          executionResult.status = 0;
          runningExecutionResults.status = 'success';
          runningExecutionResults.finishTime = new Date();
          resolve();
        }
      )
    }).then(() => {
      MessagesService.sendMessage("update", "Finished executing map '" + map.name + "'", "success");
      MessagesService.sendMessage("notification", "Finished executing map '" + map.name + "'", "success");
      SystemLogService.success("Finish running map", map, "execution");
      createExecutionModels(runningExecutionResults);
      return { resObj: map }
    })
  }).catch((error) => {
    SystemLogService.error("Error executing map " + error, map, "execution");
    MessagesService.sendMessage("update", "Error executing map '" + map.name + "': " + error, "error");

    sails.log.error("ERROR EXECUTING MAP!:", error);
  })
}

module.exports = {
  listenMapTrigger: function () {
    Trigger.find({ on: true }).then((triggers) => new Promise((resolve, reject) => {
      sails.log.info("Triggers!");
      async.each(triggers, function (trigger, callback) {
        console.log(trigger.params.branch.text + "asdfasdf");
        gitrepo.branchChanged(trigger.folder, trigger.params.branch.text, function (obj) {
          sails.log.debug("branch changed return " + JSON.stringify(obj));
          if (obj.res) {
            if (obj.res === true) {
              sails.log.debug(trigger.map + "   <--->asdfasdfsdf");
              executeMapById("-1", trigger.map, 0, 0, function (result, text) {
                callback();
              });
            }
          }
        });
      }, function (err) {
        if (err) {
          reject(err);
        }
        else {
          //do something else
        }
      });
    })).catch((error) => {
      sails.log.error("Error listenning triggers", error);
    })

  },
  getMapById: function (mapId, callback) {
    getMap(mapId).then(function (map, error) {
      callback(map, error);
    });
  },
  getRenderedMapById: function (mapId) {
    return getMap(mapId).then((map) => {
      MapService.MapToItem(map);
      return map;
    })
  },
  getVersions: function (mapId) {
    return Map.findOne(mapId).then((map) => {
      return map.versions
    })
  },
  getVersion: function (mapId, vid) {
    return Map.findOne(mapId).then((map) => {
      return map.versions[vid]
    });
  },
  addMapVersion: addNewMapVersion,
  deleteMap: function (mapId) {
    return TNode.update({ map: mapId }, { isActive: false }).then(() => Map.update(mapId, { isActive: false }));
  },
  addNewMap: function (parentId, map) {
    var node = null;
    var resultMap = null;
    return Map.create(map).then((newMap) => {
      newMap.mapView = JSON.parse(JSON.stringify(newMap.structure));

      // create a start node
      newMap.mapView.nodes.Start = {
        id: startID,
        name: "Start",
        type: "startNode",
        serverUrl: '',
        attributes: {}
      };

      // set default map content
      var content = {
        "cells": [
          {
            "type": "devs.PMStartPoint",
            "size": {
              "width": 40,
              "height": 39
            },
            "outPorts": [
              ""
            ],
            "inPorts": [],
            "position": {
              "x": 40,
              "y": 30
            },
            "angle": 0,
            "id": "fd1000fc-11cc-4261-9dcd-b2b9a53a3131",
            "embeds": "",
            "z": 1,
            "attrs": {
              ".outPorts>.port0>.port-label": {
                "text": ""
              },
              ".outPorts>.port0>.port-body": {
                "port": {
                  "id": "out6",
                  "type": "out"
                }
              },
              ".outPorts>.port0": {
                "ref": ".body",
                "ref-y": 0.5,
                "ref-dx": 0
              }
            }
          }
        ]
      };
      newMap.mapView.content = JSON.stringify(content);

      return addNewMapVersion(newMap)

    }).then((updatedMap) => {
      resultMap = updatedMap;
      if (updatedMap.length > 0) {
        updatedMap = updatedMap[0];
      }
      // creating a new node for the map.
      return TNode.create({ name: map.name, type: 'map', map: updatedMap })
    }).then((newNode) => {
      node = newNode;
      return Project.findOne({ id: parentId })
    }).then((project) => {
      if (!project) {
        TNode.findOne({ id: parentId }).then((parentNode) => {
          parentNode.childs.add(resultMap.id);
          node.parent = parentId;
          parentNode.childs.add(resultMap.id)
          return TNode.update({ id: node.id }, node);
          // Map.update({ id: resultMap.id }, resultMap);
        })
      } else {
        project.nodes.add(node);
        project.save();
      }
      return node;
    }).then((newNode) => {
      node = newNode;
      return node;
    });
  },
  mapUpdate: function (mapId, map) {
    return Map.update(mapId, map).then((updatedMap) => {
      if (updatedMap.length > 0) {
        updatedMap = updatedMap[0];
      }
      return updatedMap
    })
  },
  updateMap: function (map) {
    return Map.update(map.id, map).then((updatedMap) => {
      if (updatedMap.length > 0) {
        updatedMap = updatedMap[0];
      }
      return updatedMap
    })
  },
  updateVersionStatus: function (mapId, versionIndex, status) {
    return getMap(mapId).then(map => new Promise((res, rej) => {
      runningMaps[mapId] = status;
      if (status == sails.config.constants.runStatuses.Stopped) {
        async.each(BaseAgentsService.liveAgents,
          function (agent, callback) {
            if (agent.runningMaps && agent.runningMaps[mapId]) {
              request.post(
                agent.url + '/task/unregister',
                {
                  form: {
                    action: agent.runningMaps[mapId],
                    mapId: map.id,
                    key: agent.key
                  }
                },
                function (error, response, body) {
                  rej();
                }
              );
            } else {
              callback();
            }
          },
          function (err) {
            if (err) {
              rej(err);
            }
            res();
          }
        );
      }
    })).then(() => {
      return true
    }).catch(
      (error) => {
        sails.log.error("Error updating status", error);
      });
  },
  executeMap: executeMapById,
  updateMapProject: function (mapId, projectId) {
    return Map.update(mapId, { project: projectId })
  },
  duplicateMap: function (map, dmapId) {
    dmap = null;
    // get the map we want to duplicate
    Map.findOne({ id: dmapId }).then((map) => {
      dmap = map;
      return Map.create(map)
    }).then((newMap) => {
      // copy structure and versions from the map to duplicate.
      newMap.structure = dmap.structure;
      newMap.versions = dmap.versions;
      return Map.update({ id: newMap.id }, newMap)
    })
  },
  addMapAttr: function (map, name, value, type) {
    return new Promise((resolve, reject) => {
      var latestStructure = generateVersion(map, map.versions.length - 1);
      sails.log.debug("****************   latest structure add map attribute  *********************");
      sails.log.debug(latestStructure);
      sails.log.debug("****************************************************************************");
      value = JSON.parse(value);
      if (!latestStructure.attributes) {
        latestStructure.attributes = {};
        latestStructure.attributes[name] = {
          name: name,
          type: type,
          value: value
        };
        if (type === "list") {
          latestStructure.attributes[name].value = JSON.stringify([value]);
        }
      }
      else if (!latestStructure.attributes[name] && type == "string") {
        latestStructure.attributes[name] = {
          name: name,
          type: type,
          value: value
        };
      }
      else if (!latestStructure.attributes[name] && type == "list") {
        latestStructure.attributes[name] = {
          name: name,
          type: type,
          value: JSON.stringify([value])
        };
      }
      else if (latestStructure.attributes[name].type == "string" && type == "string") {
        latestStructure.attributes[name].value = value;
        latestStructure.attributes[name].type = type;
      }
      else if (latestStructure.attributes[name].type == "list" && type == "string") {
        latestStructure.attributes[name].value = value;
        latestStructure.attributes[name].type = type;
      }
      else if (latestStructure.attributes[name].type == "list" && type == "list") {
        var jsList = JSON.parse(latestStructure.attributes[name].value);
        jsList.push(value);
        latestStructure.attributes[name].value = JSON.stringify(jsList);
      }
      else if ((latestStructure.attributes[name].type === "string" || latestStructure.attributes[name].type === "") && type == "list") {
        latestStructure.attributes[name] = {
          name: name,
          type: type,
          value: JSON.stringify([value])
        };
      }
      map.mapView = latestStructure;

      resolve(addNewMapVersion(map));
    })

  },
  findMaps: function (query) {
    return Map.find(query)
  },
  MapToItem: function (map) {
    map.text = map.name;
    map.type = 'map';
    map.hasChildren = false;
    map.versionIndex = map.versions.length - 1;
    map.mapView = _.cloneDeep(map.versions[map.versionIndex].structure);
    delete map.versions;
    delete map.inspect;
  },
  'runningMaps': runningMaps
};
