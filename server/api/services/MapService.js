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
  _ = require('lodash'),
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
  };

let libpm = '';
fs.readFile(path.join(sails.config.appPath, 'static/libs/lib_production_map.js'), 'utf8', function (err, data) {
  // opens the lib_production file. this file is used for user to overwrite custom function at map code.
  if (err) {
    return console.log(err);
  }
  console.log(libpm);
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
  console.log("****");
  let processResults
  Execution.create({
    map: runningExecutionResults.map.id,
    startAgentsNumber: runningExecutionResults.map.agents.length,
    status: runningExecutionResults.status,
    mapVersion: runningExecutionResults.map.version,
    startTime: runningExecutionResults.startTime,
    finishTime: runningExecutionResults.finishTime
  }).then((exec) => new Promise((resolve, reject) => {
    for (let i in runningExecutionResults.agents) {
      let agentResults = runningExecutionResults.agents[i];
      console.log(agentResults.id, agentResults.status,);
      AgentExecutionResult.create({
        agent: agentResults.id,
        status: agentResults.status === "available" ? "success" : "error",
        startTime: agentResults.startTime,
        finishTime: agentResults.finishTime,
        execution: exec.id
      }).then((agentExec) => {
        for (let k in agentResults.links) {
          processResults = agentResults.links[k].process;
          ProcessExecutionResult.create({
            status: processResults.status,
            result: processResults.results,
            startTime: processResults.startTime,
            finishTime: processResults.finishTime,
            processName: processResults.name,
            agentExecution: agentExec.id
          }).then((processExec) => {
            for (let j in processResults.actions) {
              let actionResult = processResults.actions[j];
              console.log(actionResult);
              console.log(actionResult.status,actionResult.startTime,actionResult.finishTime,j,processExec.id,actionResult.result)
              ActionExecutionResult.create({
                status: actionResult.status,
                startTime: actionResult.startTime,
                finishTime: actionResult.finishTime,
                actionName: actionResult.name,
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
  console.log("Executing map");

  let map;
  let mapAgents;
  let executionContext;
  Map.findOne(mapId).populate("agents").then(pmap => {
    if (!pmap) {
      console.log("no map found");
      return;
    }
    MessagesService.sendMessage("update", "Starting map execution", "info");
    MessagesService.sendMessage("notification", "Starting map execution", "info");
    map = pmap;
    mapAgents = pmap.agents;

    if (!mapAgents || mapAgents.length === 0) {
      console.log("No map agents");
      return;
    }

    let mapVersionStructure = map.versions[versionIndex].structure;

    let mapGraph = buildMapGraph(mapVersionStructure);


    executionContext = {
      map: {
        name: map.name,
        agents: map.agents,
        id: map.id,
        nodes: mapVersionStructure.nodes,
        links: mapVersionStructure.links,
        attributes: mapVersionStructure.attributes,
        code: mapVersionStructure.code,
        version: versionIndex
      },
      startTime: new Date()
    };

    let startNodes = mapGraph.sources(); // return all the nodes that dont have an in-link

    let sortedNodes = graphlib.alg.topsort(mapGraph);
    let liveAgents = BaseAgentsService.liveAgents; // get living agent from the baseagent service

    let executionAgents = {};

    for (let mapAgent of map.agents) {
      if (mapAgent && mapAgent.key && liveAgents[mapAgent.key].alive) {
        mapAgent.status = "available";
        mapAgent.executionContext = vm.createContext(_.cloneDeep(executionContext)); // cloning the execution context for each agent
        vm.runInNewContext(libpm + "\n" + mapVersionStructure.code, mapAgent.executionContext);
        mapAgent.links = {};
        executionAgents[mapAgent.key] = mapAgent;
      }
    }

    if (Object.keys(executionAgents).length === 0) {
      console.log("No agents selected or no live agents");
      MessagesService.sendMessage("update", "No agents selected or none are alive", "error");

      runningMaps[map.id] = sails.config.constants.runStatuses.Done;


      return;
    }

    executionContext.agents = executionAgents; // saving the map living agents in the execution context

    let res = createContext(mapVersionStructure, executionContext);
    if (res !== 0) {
      console.log("Error running map, exiting");
      return;
    }

    startNodes.forEach(node => {
      runNodeLinks(map, mapGraph, node, _.cloneDeep(executionContext), executionAgents);
    });
  })
}

function runNodeLinks(map, mapGraph, node, executionContext, executionAgents) {
  executionContext.agents = executionAgents; // setting the context with the latest agents results
  let outEdges = mapGraph.outEdges(node); // getting the node out links;
  let links = [];
  outEdges.forEach(edge => {
    links.push(mapGraph.edge(edge.v, edge.w)); // stores the links data.
  });

  // links can run in parallel
  async.each(links,
    executeLink(map, mapGraph, node, executionContext, executionAgents),

    (error) => {
      if (error) {
        console.log("Error while running links: ", error);
      }
      if ((_.filter(executionAgents, (o) => {
          return o.status !== "occupied"
        })).length === Object.keys(executionAgents).length) {
        let flag = true;
        for (let i in executionAgents) {
          if (Object.keys(executionAgents[i].links).length !== mapGraph.edges().length) {
            flag = false;
          }
        }
        if (flag && executionContext.status !== "done") {
          executionContext.status = "success";
          MessagesService.sendMessage("update", "Finish map execution", "info");
          MessagesService.sendMessage("notification", "Finish map execution", "info");

          executionContext.agents = executionAgents;
          executionContext.finishTime = new Date();
          runningMaps[map.id] = sails.config.constants.runStatuses.Done;
          createExecutionModels(executionContext);
        }
      }
    })
}

function filterAgents(executionAgents) {
  let agents = _.filter(executionAgents, (o) => {
    return o.status === 'available';
  });
  return agents;
}

function executeLink(map, mapGraph, node, executionContext, executionAgents) {
  return (link, linkCb) => {
    MessagesService.sendMessage("update", "Running link: '" + link.name + "'", "info");

    let successors = mapGraph.successors(node);
    let agents = filterAgents(executionAgents, link);
    async.each(agents,
      (agent, agentCb) => {
        if (executionAgents[agent.key].startTime) {
          executionAgents[agent.key].startTime = new Date();
        }
        if (executionAgents[agent.key].links[link.id]) {
          if (executionAgents[agent.key].links[link.id].status === "executing" || executionAgents[agent.key].links[link.id].status === "fail" || executionAgents[agent.key].links[link.id].status === "error" || executionAgents[agent.key].links[link.id].status === "success") {
            agentCb();
            executionAgents[agent.key].finishTime = new Date();

            return;
          }
        }

        executionAgents[agent.key].links[link.id] = {
          status: "executing",
          result: ''
        };

        let agentStr = 'var currentAgent = ' + JSON.stringify(agent);
        vm.runInNewContext(agentStr, executionAgents[agent.key].executionContext);


        executionAgents[agent.key].status = "occupied";
        if (link.condition) {
          if (link.condition) {
            let res;
            try {
              res = vm.runInNewContext(link.conditionCode, executionAgents[agent.key].executionContext);
            } catch (e) {
              console.log("Error running link condition");
              MessagesService.sendMessage("update", "Error running link '" + link.name + "' condition: " + e, "error");

              agentCb();
              executionAgents[agent.key].finishTime = new Date();
              return;
            }
            if (res === false) { // if the condition failed, stop with this link.
              executionAgents[agent.key].links[link.id].status = "fail";
              executionAgents[agent.key].links[link.id].result = "Didn't passed condition";
              console.log("Link didnt pass condition");
              agentCb();
              executionAgents[agent.key].finishTime = new Date();
              return;
            }
          }
        }

        if (link.filterAgents) {
          let res;
          try {
            res = vm.runInNewContext(link.filterAgentsCode, executionAgents[agent.key].executionContext);

          } catch (e) {
            console.log("Error trying to run filter agent function", e);
            MessagesService.sendMessage("update", "Error running link '" + link.name + "' filter agent function: " + e, "error");

            executionAgents[agent.key].links[link.id].status = "fail";
            executionAgents[agent.key].links[link.id].result = "Error running filter agent function";
            executionAgents[agent.key].status = "available";
            agentCb();
            executionAgents[agent.key].finishTime = new Date();
            return;
          }

          if (res === false) {
            console.log("Agent didn't pass link filter agent function");
            executionAgents[agent.key].links[link.id].status = "fail";
            executionAgents[agent.key].links[link.id].result = "Agent didn't pass link filter agents condition";
            executionAgents[agent.key].status = "available";
            agentCb();
            executionAgents[agent.key].finishTime = new Date();
            return;
          }
        }

        if (link.preRun) {
          // pre run hook for link (enables user to change context)
          let res;
          try {
            res = vm.runInNewContext(link.preRunCode, executionAgents[agent.key].executionContext);
            executionAgents[agent.key].links[link.id].preRun = res; // storing the result so user can use it later...
          } catch (e) {
            console.log("Error running pre link function")
            MessagesService.sendMessage("update", "Error running link '" + link.name + "' pre link function: " + e, "error");

          }
        }


        let selectedProcess = selectProcess(link, executionAgents[agent.key].executionContext);
        if (!selectedProcess) {
          console.log("No process on link or none passed condition");
          executionAgents[agent.key].links[link.id].status = "fail";
          executionAgents[agent.key].links[link.id].result = "No process passed condition or none exists";
          executionAgents[agent.key].status = "available";
          agentCb();
          executionAgents[agent.key].finishTime = new Date();
          return;
        }

        if (selectedProcess.filterAgent) {
          let res;
          try {
            res = vm.runInNewContext(selectedProcess.filterAgentCode, executionAgents[agent.key].executionContext);
          } catch (e) {
            console.log("Error trying to run filter agent function", e);
            MessagesService.sendMessage("update", "Error running process '" + selectedProcess.name + "' filter agent function: " + e, "error");

            executionAgents[agent.key].links[link.id].status = "fail";
            executionAgents[agent.key].links[link.id].result = "Error running filter agent function";
            executionAgents[agent.key].status = "available";
            agentCb();
            executionAgents[agent.key].finishTime = new Date();
            return;
          }
          if (res === false) {
            console.log("Agent didn't pass process filter agent function");
            executionAgents[agent.key].links[link.id].status = "fail";
            executionAgents[agent.key].links[link.id].result = "Agent didn't pass process filter link condition";
            executionAgents[agent.key].status = "available";
            agentCb();
            executionAgents[agent.key].finishTime = new Date();
            return;
          }
        }

        let actionExecutionFunctions = {};
        selectedProcess.startTime = new Date();
        executionAgents[agent.key].links[link.id].process = selectedProcess;
        selectedProcess.actions.forEach(action => {
          actionExecutionFunctions[action.name + "(" + action.id + ")"] = executeAction(map, link, selectedProcess, _.cloneDeep(action), agent, executionContext, executionAgents);
          // actionExecutionFunctions.push(executeAction(map, link, selectedProcess, _.cloneDeep(action), agent, executionAgents[agent.key].executionContext, executionAgents));
        });
        async.series(actionExecutionFunctions,
          (error, actionsResults) => {
            if (error) {
              console.log("There was a fatal error. Stopping agent execution (agent will not run further links)" + error);
              addProcessResultToContext(executionAgents[agent.key].executionContext, link.id, selectedProcess.id, error, -1);
              if (runningMaps[map.id] !== sails.config.constants.runStatuses.Running) {
                agentCb("Map stopped");
                return;
              }
              executionAgents[agent.key].status = "stop"; // this will prevent the agent to run in further links.
              executionAgents[agent.key].links[link.id].status = "error";
              executionAgents[agent.key].links[link.id].process.status = "error";
              executionAgents[agent.key].links[link.id].process.results = error;
              executionAgents[agent.key].links[link.id].process.finishTime = new Date();

              MessagesService.sendMessage("update", "Process: '" + selectedProcess.name + "' finish with error: " + JSON.stringify(actionsResults), "error");
            } else {
              executionAgents[agent.key].status = "available"; // setting agent free for future links
              executionAgents[agent.key].links[link.id].status = "success";
              executionAgents[agent.key].links[link.id].results = actionsResults;
              executionAgents[agent.key].links[link.id].process.status = "success";
              executionAgents[agent.key].links[link.id].process.results = actionsResults;
              executionAgents[agent.key].links[link.id].process.finishTime = new Date();
              MessagesService.sendMessage("update", "Process: '" + selectedProcess.name + "' finish with result: " + JSON.stringify(actionsResults), "success");
            }

            if (link.postRun) {
              try {
                res = vm.runInNewContext(link.postRunCode, executionContext);
                executionAgents[agent.key].links[link.id].postRun = res; // storing the result so user can use it later...
              } catch (e) {
                console.log("Error running link post run function")
                MessagesService.sendMessage("update", "Error running link '" + link.name + "' post link function: " + e, "error");

              }
            }

            if (!link.correlateAgents) { // if agents don't need to be correlated, call next nodes;
              successors.forEach(s => {
                runNodeLinks(map, mapGraph, s, executionContext, executionAgents);
              });
            }
            agentCb();
            executionAgents[agent.key].finishTime = new Date();
          })

      }, (error) => {
        if (error) {
          console.log("There was an error while running agents: ", error);

        }
        if (link.correlateAgents) {
          // if need to correlate agents, the next node will be called only after all agents are done;
          // due to the way we get live agents, we must check in the execution agents if this link finish in all agents that are still available.
          let agentsStats = _.filter(executionAgents, (o) => {
            return o.status === 'executing';
          });
          if (agentsStats.length === 0) { // if there is an agent that is still executing, we shouldn't pass to the next node
            successors.forEach(s => {
              runNodeLinks(map, mapGraph, s, executionContext, executionAgents);
            });
          }

        }
        linkCb(); // all done with this link, call the cb
      });
  }
}

function executeAction(map, link, process, action, agent, executionContext, executionAgents) {
  return (callback) => {
    let sTime = new Date();
    if (runningMaps[map.id] !== sails.config.constants.runStatuses.Running)
      callback("Map stopped");
    let action_str = 'var currentAction = ' + JSON.stringify(action) + ";";
    action_str += 'previousAction = getPreviousAction();';
    vm.runInNewContext(action_str, executionContext);
    let key = action.name;

    if (!executionAgents[agent.key].links[link.id].process.actions)
      executionAgents[agent.key].links[link.id].process.actions = {};


    action.params = {};
    for (let paramIndex in action.method.params) {
      let cParam = action.method.params[paramIndex];
      action.params[cParam.name] = cParam;
    }

    for (let param in action.params) {
      try {
        action.params[param] = evaluateExpression(action.params[param], executionAgents[agent.key].executionContext, link.id, process.id, action.name);
      } catch (e) {
        console.log("Error evaluating action!!");
        MessagesService.sendMessage("update", "Error evaluating action '" + action.name + "' value: " + e, "error");


        if (action.madatory) {
          console.log("The action was mandatory, its a fatal error");
          callback("Action '" + action.name + "' failed");
          return;
        }
        else {
          console.log("But it doesnt matter...");
          callback(null, "Error evaluating action");
          return;
        }
      }


    }

    MessagesService.sendMessage("update", "Running action: '" + action.name + "'", "info");
    action.server.url = getDedicatedUrl(agent, action.server.type);
    action.status = 'executing';
    executionAgents[agent.key].links[link.id].process.actions[key] = action;

    request.post(
      agent.url + '/task/register',
      {
        form: {
          mapId: map.id,
          versionId: executionContext.map.version,
          executionId: 0,
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
        if (!error && response.statusCode === 200) {
          MessagesService.sendMessage("update", "Action '" + action.name + "' result: " + body.res, "success");
          executionAgents[agent.key].links[link.id].process.actions[key].status = "success";
          executionAgents[agent.key].links[link.id].process.actions[key].result = body;
          executionAgents[agent.key].links[link.id].process.actions[key].finishTime = new Date();
          executionAgents[agent.key].links[link.id].process.actions[key].startTime = sTime;
          addActionResultToContext(executionAgents[agent.key].executionContext, link.id, process.id, action.name, body.res, 0);
          callback(null, body);
          return;
        }
        else {
          let res = body.error;
          if (!res) {
            res = error;
          }
          MessagesService.sendMessage("serverError", "Failed executing action '" + action.name + "': " + res, "error");
          MessagesService.sendMessage("update", "Failed executing action '" + action.name + "': " + res, "error");
          addActionResultToContext(executionAgents[agent.key].executionContext, link.id, process.id, action.name, res, -1);
          executionAgents[agent.key].links[link.id].process.actions[key].status = "error";
          executionAgents[agent.key].links[link.id].process.actions[key].result = "Error " + res;
          executionAgents[agent.key].links[link.id].process.actions[key].finishTime = new Date();

          if (action.mandatory) {
            console.log("The action was mandatory, its a fatal error");
            callback("Action '" + action.name + "' failed: " + res);
            return;
          }
          else {
            callback(); // Action failed but it doesnt mater
            return;
          }
        }
      }
    );
  }
}

function selectProcess(link, executionContext) {
  let selectedProcess;
  for (let i = 0; i < link.processes.length; i++) {
    // Check if there is a default execution
    let process = link.processes[i];
    if (process.default_execution === true) {
      console.log("Found a default process");
      if (!process.condition) {
        selectedProcess = process;
        selectedProcess.id = i;
        break;
      }
      try {
        res = vm.runInNewContext(selectedProcess.conditionCode, executionContext);
      } catch (e) {
        // if there was an error, stop running.
        console.log("Error running process in new context", e);
        MessagesService.sendMessage("update", "Error running process '" + selectedProcess.name + "' condition function: " + e, "error");

        return;
      }

      if (res !== false) {
        selectedProcess = process;
        selectedProcess.id = i;
        break;
      }
    }
  }

  if (!selectedProcess) {
    // No default process found, or it didn't passed its condition
    // checking processes conditions;
    // When finding a process that passes the condition the loop will break (only 1 process can run on each link)
    for (let i = 0; i < link.processes.length; i++) {
      let process = link.processes[i];
      if (process.condition) {
        console.log("The process has a condition");
        let res;
        try {
          res = vm.runInNewContext(process.conditionCode, executionContext);
        } catch (e) {
          // if there was an error, stop running.
          console.log("Error running process in context", e);
        }

        if (res !== false) {
          selectedProcess = process;
          selectedProcess.id = i;
          break;
        }
      } else {
        selectedProcess = process;
        selectedProcess.id = i;
      }
    }
  }

  if (!selectedProcess) {
    // no process passed its condition
    MessagesService.sendMessage("update", "No processes passed their conditions", "info");

    console.log("No process passed the condition");
    return;
  }
  return selectedProcess
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
