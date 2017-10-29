var jsonpatch = require('fast-json-patch'),
    request = require('request'),
    async = require('async'),
    Graph = require('graphlib').Graph,
    graphlib = require('graphlib'),
    vm = require('vm'),
    gitrepo = require('../../repos/git-cli'),
    util = require('util'),
    YAML = require('json2yaml'),
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
    printToConsoleFromCode = function(agent, mapName, socket) {
        return function(msg) {
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
    updateMapOnFinish = function (map, executionContext) {
        var umap = vm.runInNewContext(map_getMapValue, executionContext);
        return Map.update({ id: map }, umap);
    },
    updateAgent = function (agent, executionContext) {
        var uAgent = vm.runInNewContext(map_getCurrentAgentValue, executionContext);
        return BaseAgent.update({ id: agent.id }, uAgent);
    },
    updateVersionResult = function (user, mapId, versionIndex, resultLog, resultObj, cb) {
        getMap(mapId).then(function (map, err) {
            if (user == "-1") {
                user =  {
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
            updateMap(map).exec(function (err, updatedModel) {
                cb(err, executionResult);
            });
        });
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
            sails.log(util.inspect(context));
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
        sails.log.debug("action result! " + result);
        for (var i = 0; i < context.map.links.length; i++) {
            var link = context.map.links[i];
            sails.log("log log log link.id: " + link.id + "linkId: " + linkId);
            if (link.id == linkId) {
                for (var j = 0; j < link.processes.length; j++) {
                    var process = link.processes[j];
                    sails.log("log log log process.id: " + process.name + "processId: " + processId);
                    if (process.name == processId) {
                        for (var k = 0; k < process.actions.length; k++) {
                            var action = process.actions[k];
                            sails.log.debug("action: " + action.name + "actionName: " + actionName);
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
    runAction = function (mapId, mapName, versionIndex, executionIndex, linkId, processId, processKey, action, socket, agent, executionContext, executionResult) {
        return function (callback) {
            var action_str = 'var currentAction = ' + JSON.stringify(action) + ";";
            var msg;
            action_str += 'previousAction = getPreviousAction();';
            vm.runInNewContext(action_str, executionContext);

            if (runningMaps[mapId] == runStatuses.Stopped) {
                vm.runInNewContext(map_onStop, executionContext);
                msg = {
                            date: new Date(),
                            agent: agent.name,
                            map: mapName,
                            msg: 'Map Paused or Stopped.\n'
                };
                socket.emit('update', JSON.stringify(msg));
                callback('error: Map Stopped');
                return;
            }
            if (!BaseAgentsService.liveAgents[agent.key].runningMaps) {
                BaseAgentsService.liveAgents[agent.key].runningMaps = {};
            }
            BaseAgentsService.liveAgents[agent.key].runningMaps[mapId] = action;

            action = JSON.parse(JSON.stringify(action));
            var key = action.name;

            if (!executionResult.links[linkId].processes[processKey].actions[key]) {
                executionResult.links[linkId].processes[processKey].actions[key] = JSON.parse(JSON.stringify(action));
                executionResult.links[linkId].processes[processKey].actions[key].agents = {};
            }

            sails.log.info('Processing action ' + JSON.stringify(action, null, 2));
            action.params = {};
            for (var paramIndex in action.method.params) {
                var cParam = action.method.params[paramIndex];
                action.params[cParam.name] = cParam;
            }

            for (var param in action.params) {
                sails.log.info('***********************************');
                sails.log.info(param);
                try {
                    action.params[param] = evaluateExpression(action.params[param], executionContext, linkId, processId, action.name);
                } catch (e) {
                    executionResult.links[linkId].processes[processKey].actions[key].agents[agent.name] = {
                        startTime: new Date().toString(),
                        endTime: new Date().toString(),
                        status: -1,
                        result: "Error:" + e
                    };
                    sails.log.error(e);
                    msg = {
                            date: new Date(),
                            agent: agent.name,
                            map: mapName,
                            msg: ' execution failed action ' + action.name + ": " + e + "\n"
                    };
                    socket.emit('serverError', JSON.stringify(res));
                    if (action.mandatory) {
                        callback(e);
                    }
                    else {
                        callback(); // Action failed but we don't care
                    }
                    return;
                }
            }
            sails.log.info('evaluated! action ' + JSON.stringify(action, null, 2));
            msg = { date: new Date(), agent: agent.name, map: mapName, msg: 'running action ' + action.name +
                ": " + action.method.name + "\n" };
            socket.emit('update', JSON.stringify(msg));
            action.server.url = getDedicatedUrl(agent, action.server.type);
            var startTime = new Date().toString();
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
                    sails.log("-----------------");
                    sails.log(body);
                    sails.log("-----------------");
                    if (!error && response.statusCode == 200) {
                        msg = {
                            date: new Date(),
                            agent: agent.name,
                            map: mapName,
                            msg: 'finished running action ' + action.name + ":" + body.res + "\n"
                        };
                        socket.emit('update', JSON.stringify(msg));
                        addActionResultToContext(executionContext, linkId, processId, action.name, body.res, 0);
                        executionResult.links[linkId].processes[processKey].actions[key].agents[agent.name] = {
                            startTime: startTime,
                            endTime: new Date().toString(),
                            status: 0,
                            result: body.res
                        };
                        callback(null, body);
                    }
                    else {
                        sails.log.error(JSON.stringify(body));
                        sails.log.error(error);
                        var res = body.error;
                        if (!res) {
                            res = error;
                        }
                        msg = {
                            date: new Date(),
                            agent: agent.name,
                            map: mapName,
                            msg: 'execution failed action ' + action.name + ":" + res + "\n"
                        };
                        socket.emit('serverError', JSON.stringify(msg));
                        sails.log(res);
                        addActionResultToContext(executionContext, linkId, processId, action.name, res, -1);
                        executionResult.links[linkId].processes[processKey].actions[key].agents[agent.name] = {
                            startTime: startTime,
                            endTime: new Date().toString(),
                            status: -1,
                            result: "Error:" + res
                        };
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
    runProcess = function (socket, mapId, mapVersion, executionIndex, agent, executionContext, executionResult) {
        return function (link, callback) {
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
            sails.log.info('Processing Process ' + link);
            var process = -1;
            var proc, i;
            for (i = 0; i < link.processes.length; i++) {
                proc = link.processes[i];
                if (proc.default_execution === true) {
                    process = proc;
                    process.id = i;
                    break;
                }
            }
            if (process === -1) {
                sails.log.info("checking process conditions");
                for (i = 0; i < link.processes.length; i++) {
                    proc = link.processes[i];
                    sails.log.info(proc);
                    if (proc.condition === true) {
                        try {
                            res = vm.runInNewContext(proc.conditionCode, executionContext);
                        } catch (e) {
                            sails.log.error(e);
                            callback("Error: undefinde variable " + e);
                            return;
                        }

                        sails.log.info("****" + (res !== false) + "******");
                        if (res !== false) {
                            process = proc;
                            process.id = i;
                            break;
                        }
                    }
                }
            }
            if (link.processes.length >= 1 && process === -1 && link.processes[0].condition === false) {
                process = link.processes[0];
            } else {
                callback();
                return;
            }
            var process_str = 'previousProcess = JSON.parse(JSON.stringify(currentProcess));';
            process_str +='currentProcess = ' + JSON.stringify(process) + ";";
            vm.runInNewContext(process_str, executionContext);

            MapService.getMapById(mapId, function (map, err) {
                if (runningMaps[mapId] == runStatuses.Paused) {
                    vm.runInNewContext(map_onPause, executionContext);
                    msg = {
                        date: new Date(),
                        agent: agent.name,
                        map: map.name,
                        msg: 'Map Paused, not running process ' + process.name + "\n"
                    };
                    socket.emit('update', JSON.stringify(msg));
                    callback('error: Map Paused');
                    return;
                }

                if (process === -1 || !process) {
                    callback('error: no process with default execution flag');
                }

                sails.log.info('************************************');
                sails.log.info(agent);
                sails.log.info(process);
                sails.log.info('************************************');
                msg = {
                    date: new Date(),
                    agent: agent.name,
                    map: map.name,
                    msg: 'running process ' + process.name + "\n"
                };
                socket.emit('update', JSON.stringify(msg));
                sails.log.info("running process " + process);
                /*var actions = process.actions.sort(function (a, b) {
                    return b.order - a.order;
                });*/
                var actionFuncs = [];
                var key = process.name;
                for (var i = 0; i < process.actions.length; i++) {
                    var act = process.actions[i];
                    actionFuncs.push(runAction(mapId, map.name, mapVersion, executionIndex, link.id, process.name, key, act, socket, agent, executionContext, executionResult));
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

                executionResult.links[link.id].agents[agent.name] = {
                    startTime: new Date().toString(),
                    endTime: new Date().toString(),
                    status: -1,
                    result: '',
                    executed: false
                };

                executionResult.links[link.id].processes[key].agents[agent.name] = {
                    startTime: new Date().toString(),
                    endTime: new Date().toString(),
                    status: -1,
                    result: ''
                };


                async.series(actionFuncs, function (err, res) {
                    // if any of the file processing produced an error, err would equal that error
                    var key = process.name;
                    var msg;
                    if (err) {
                        // One of the iterations produced an error.
                        // All processing will now stop.
                        msg = {
                            date: new Date(),
                            agent: agent.name,
                            map: map.name,
                            msg: ' failed running process ' + process.name + ":" + err + "\n"
                        };
                        socket.emit('update', JSON.stringify(msg));

                        executionResult.links[link.id].processes[key].agents[agent.name] = {
                            startTime: new Date().toString(),
                            endTime: new Date().toString(),
                            status: -1,
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

                        msg = {
                            date: new Date(),
                            agent: agent.name,
                            map: map.name,
                            msg: 'Finished running process ' + process.name + ":" + actionsTotal + "\n"
                        };
                        socket.emit('update', JSON.stringify(msg));

                        executionResult.links[link.id].processes[key].agents[agent.name].result = actionsTotal;
                        executionResult.links[link.id].processes[key].agents[agent.name].endTime = new Date().toString();
                        executionResult.links[link.id].processes[key].agents[agent.name].status = 0;

                        executionResult.links[link.id].agents[agent.name].result = actionsTotal;
                        executionResult.links[link.id].agents[agent.name].endTime = new Date().toString();
                        executionResult.links[link.id].agents[agent.name].status = 0;
                        executionResult.links[link.id].agents[agent.name].executed = true;

                        addProcessResultToContext(executionContext, link.id, process.name, actionsTotal, 0);

                        map.versions[mapVersion].lastRunLink = linkIndex;
                        callback(null, actionsTotal);
                    }
                });
            });
        };
    },
    parallelProcesses = function (node, socket, mapId, mapVersion, executionIndex, agent, executionContext, map_graph, executionResult) {
        return function (callback) {
            var links = [];
            var continueExecution = false;
            var inDegrees = map_graph.inEdges(node);
            for (var i = inDegrees.length - 1; i >= 0; i--) {
                var glink = inDegrees[i];
                var mapLink = map_graph.edge(glink.v, glink.w);
                try {
                    sails.log.warn(mapLink.processes[0].actions[0].name);
                    sails.log.warn(isNaN(mapLink.status));
                    if (executionResult.links[mapLink.id].agents[agent.name].executed === true) {
                        sails.log.warn("*******************" + mapLink + "********************");
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
            async.each(links, runProcess(socket, mapId, mapVersion, executionIndex, agent, executionContext, executionResult),
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
runMapFromAgent = function (links, mapId, versionIndex, executionIndex, socket, globalScope, mapstruct, executionResult, cleanWorkspace) {
    return function (agent, callback) {
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
            processesFuncs.push(parallelProcesses(node, socket, mapId, versionIndex, executionIndex, agent, executionContext, map_graph, executionResult));
        }

        async.series(processesFuncs, function (err, myres) {
            // update the agent value
            updateAgent(agent, executionContext).exec(function (errorVal, updateAgentModel) {
                // if any of the file processing produced an error, err would equal that error
                if (err || errorVal) {
                    // One of the iterations produced an error.
                    // All processing will now stop.
                    MapsService.updateVersionStatus(mapId, versionIndex, sails.config.constants.runStatuses.Failed, function () {
                        callback(null, 'Error: ' + err + " " + errorVal);
                    });
                } else {
                    updateMapOnFinish(mapId, executionContext).exec(function (errorVal, updatedMapModel) {
                        if (errorVal) {
                            MapsService.updateVersionStatus(mapId, versionIndex, sails.config.constants.runStatuses.Failed, function () {
                                callback(null, 'Error: ' + err + " " + errorVal);
                            });
                        }
                        var totalResult = "";
                        for (var key in executionResult.links) {
                            for (var pkey in executionResult.links[key].processes) {
                                totalResult = totalResult + executionResult.links[key].processes[pkey].agents[agent.name].result + "\n";
                            }
                        }
                        executionResult.agents[agent.name].result = totalResult;
                        executionResult.agents[agent.name].status = 0;
                        executionResult.agents[agent.name].endTime = new Date().toString();
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
                    });
                }
            });
        });
    };
};

var libpm = '';
sails.log(__dirname);
fs.readFile(__dirname + '/../../assets/libs/lib_production_map.js', 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }
    libpm = data;
});

function addNewMapVersion(map) {
    return getMap(map.id).then((oldMap) => {
        if (!oldMap || oldMap === "") {
            sails.log.error("Problem loading map");
        }
        var latestStructure = generateVersion(oldMap, oldMap.versions.length -1);
        var diff = jsonpatch.compare(latestStructure, map.mapView);

        if (diff.length > 0) {
            var version = {
                date: new Date(),
                structure: map.mapView,
                executions: []
            };
            oldMap.versions.push(version);
        }

        oldMap.activeServers = map.activeServers;
        return updateMap(oldMap)
    }).then((savedMap) => {
        return savedMap
    });
}

function executeMapById(userId, mapId, versionIndex, agentsIds, cleanWorkspace, cb) {
    var socket = sails.io;
    sails.log.warn("executing map! *******************");
    sails.log.info("map version " + versionIndex);
    User.find({ id: userId }).then(function (users, err) {
        var msg;
        if (err) {
            msg = {
                date: new Date(),
                map: map.name,
                msg: 'No such user \n'
            };
            socket.emit('update', JSON.stringify(msg));
            cb(false);
            return;
        }
        var user = users[0];
        MapService.getMapById(mapId, function (map, err) {
            if (versionIndex <= 0) versionIndex = map.versions.length - 1;
            if (!map || map.versions.length - 1 < versionIndex) {
                msg = {
                    date: new Date(),
                    agent: agent.name,
                    map: map.name,
                    msg: 'Map or map version Not Found'
                };
                socket.emit('update', JSON.stringify(msg));
                cb(false);
                return;
                // } else if (map.versions[versionIndex].status == sails.config.constants.runStatuses.Running) {
                //     socket.emit('update', 'Map already Running');
                //     cb(false);//res.badRequest();
                //     return;
            } else {
                map.versions[versionIndex].status = sails.config.constants.runStatuses.Running;
                MapService.updateMap(map);
            }
            sails.log("***************************************************************** " + versionIndex + " ****");
            var executionResult = {};
            executionResult.name = map.name;
            executionResult.version = versionIndex;
            executionResult.date = (new Date()).toString();
            executionResult.startDate = (new Date()).toString();

            var mapVersionStructure = generateVersion(map, versionIndex);

            var executionContext = {
                map: {
                    name: map.name,
                    id: map.id,
                    nodes: mapVersionStructure.nodes,
                    links: mapVersionStructure.links,
                    attributes: mapVersionStructure.attributes
                }
            };

            var globalContext = JSON.parse(JSON.stringify(executionContext));

            var contextRes = createContext(mapVersionStructure, executionContext);
            if (contextRes !== 0) {
                map.versions[versionIndex].status = sails.config.constants.runStatuses.Failed;
                msg = {
                    date: new Date(),
                    map: map.name,
                    msg: "Error: '" + contextRes.message + "\n" + contextRes.stack + "'"
                };
                socket.emit('update', JSON.stringify(msg));
                msg = {
                    date: new Date(),
                    map: map.name,
                    msg: "failed running map " + executionResult.name
                };
                return cb(true, { res:  JSON.stringify(msg)}); //res.badRequest();
            }

            sails.log("Running map onstart hook: " + map.name);
            vm.runInNewContext(map_onStart, executionContext); /* onStart hook execution */
            sails.log("Finished Running map onstart hook: " + map.name);

            var links = mapVersionStructure.links;
            BaseAgentsService.getAgents(function (err, initialAgents) {
                var res;
                if (err) {
                    msg = {
                        date: new Date(),
                        map: map.name,
                        msg: "Error: " + err
                    };
                    return cb(true, { error: JSON.stringify(msg) });
                }
                /* filter baseagents */
                vm.runInNewContext("var servers = " + JSON.stringify(initialAgents) + ";", executionContext);
                try {
                    res = vm.runInNewContext(map_filterServers, executionContext);
                } catch (e) {
                    sails.log.error(e);
                    msg = {
                        date: new Date(),
                        map: map.name,
                        msg: "Error: undefinde variable " + e
                    };
                    return cb(true, { error: JSON.stringify(msg) });
                }
                if (!res) {
                    sails.log.error("no filter function (this should not happen)");
                }
                else if (res !== false) {
                    sails.log.info("executing on servers -->" + res + "<--");
                    agentsIds = {};
                    for (var i = res.length - 1; i >= 0; i--) {
                        var myAgent = res[i];
                        agentsIds[myAgent] = true;
                    }
                }
                var agents = {};
                var agentsStats = BaseAgentsService.liveAgents;
                for (var agentId in map.activeServers) {
                    var c_agent = map.activeServers[agentId];
                    if (c_agent && agentsStats[c_agent.key] && agentsStats[c_agent.key].alive && c_agent.active) {
                        agents[c_agent.name] = JSON.parse(JSON.stringify(c_agent));
                        agents[c_agent.name].url = agentsStats[c_agent.key].url;
                    }
                }
                executionResult.agents = agents;
                sails.log.warn("executing on " + agents.length + " base agents");
                var executionIndex = map.versions[versionIndex].executions.length;
                async.each(agents, runMapFromAgent(links, mapId, versionIndex, executionIndex, socket, JSON.parse(JSON.stringify(globalContext)), mapVersionStructure, executionResult, cleanWorkspace),
                    function (err) {
                        if (err) {
                            sails.log.error(JSON.stringify(err));
                            map.versions[versionIndex].status = sails.config.constants.runStatuses.Failed;
                            executionResult.status = -1;
                            msg = {
                                date: new Date(),
                                map: map.name,
                                msg: "Error: " + JSON.stringify(err)
                            };
                            return cb(true, { error: JSON.stringify(msg) });
                        }

                        var yamlLog = YAML.stringify(executionResult);

                        executionResult.status = 0;
                        updateVersionResult(user, mapId, versionIndex, yamlLog, executionResult, function (err, mapRes) {
                            if (err) {
                                msg = {
                                    date: new Date(),
                                    map: map.name,
                                    msg: "Error: " + err
                                };
                                return cb(true, { res: JSON.stringify(msg), log: yamlLog });
                            }
                            if (!cb){
                                sails.log("ERRRRRRRRRRR **************** no cb");
                            }
                            mapRes.executionId = executionIndex;
                            msg = {
                                date: new Date(),
                                map: map.name,
                                msg: "finished running map " + executionResult.name
                            };
                            return cb(true, { res: JSON.stringify(msg), resObj: mapRes });
                        });
                    }
                );
            });
        });
    });
}

module.exports = {
    listenMapTrigger: function () {
        Trigger.find({ on: true }).then(function (triggers, err) {
            if (err) {
                sails.log.error("Triggers error: " + err);
            }
            else {
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
                        //do something
                    }
                    else {
                        //do something else
                    }
                });
            }
        });
    },
    getMapById: function (mapId, callback) {
        getMap(mapId).then(function(map, error) {
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
    getVersion: function (mapId, vid, cb) {
        return Map.findOne(mapId).then((map) => {
            return map.versions[vid]
        });
    },
    addMapVersion: addNewMapVersion,
    deleteMap: function (mapId) {
        return TNode.update({map: mapId}, {isActive: false}).then(() => Map.update(mapId, { isActive: false }));
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
                        "inPorts": [

                        ],
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
    updateMap: function (map) {
        return Map.update(map.id, map).then((updatedMap) => {
            if (updatedMap.length > 0) {
                updatedMap = updatedMap[0];
            }
            return updatedMap
        })
    },
    updateVersionStatus: function (mapId, versionIndex, status, cb) {
        getMap(mapId).then(function (map, err) {
            runningMaps[mapId] = status;
            if (status === sails.config.constants.runStatuses.Stopped) {
                async.each(BaseAgentsService.liveAgents,
                    function(agent, callback) {
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
                                    callback(error);
                                }
                            );
                        } else {
                            callback();
                        }
                    },
                    function (err) {
                        cb(err);
                    }
                );
            }
            else {
                cb(null);
            }
        });
    },
    executeMap: executeMapById,
    updateMapProject: function (mapId, projectId, cb) {
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
    addMapAttr: function (map, name, value, type, cb) {
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
        addNewMapVersion(map, function (err, version, updatedMap) {
            sails.log.info(updatedMap);
            if (updatedMap.length > 0) {
                updatedMap = updatedMap[0];
                var latestStructure = generateVersion(updatedMap, updatedMap.versions.length - 1);
                sails.log.debug("*****");
                sails.log.debug(JSON.stringify(latestStructure.attributes));
            }
            return cb(err, updatedMap);
        });
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