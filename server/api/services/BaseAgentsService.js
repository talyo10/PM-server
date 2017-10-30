var request = require('request');
var agents = {};
var KEEPALIVEINTERVAL = 5000;
var LIVE_COUNTER = 5;
var fs = require('fs');
var laeh = require('laeh2').leanStacks(true);
var _e = laeh._e;
var _x = laeh._x;
var path = require('path');
var modulesPath = path.join(sails.config.appPath, "agents");

var bytesToSize = function (bytes) {
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (bytes == 0) return '0 Byte';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
   return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

var installPluginsOnAgent = function(agent, callback){
        if (agent.alive) {
            fs.readdir(modulesPath, (err, files) => {
                async.each(files, 
                    function(plugin, fileSendingCallback){
                        var formData = {
                            file: {
                                value:  fs.createReadStream(path.join(modulesPath, plugin)),
                                options: {
                                    filename: plugin
                                }
                            }
                        };
                        // Post the file to the upload server
                        request.post({url: agent.url + "/registeragent", formData: formData});
                        fileSendingCallback();
                    },
                    function(err) {
                        callback();
                    });
            })
        } else {
            callback();
        }
    };

var deleteNode = function(nodeId) {
    return SNode.findOne({ id: nodeId }).populate('children').then((node) => new Promise((res, rej) => {
        if (node.hasChildren) {
            // iterate through all node children and delete them
            node.children.forEach((child) => {
                deleteNode(child.id);
            });
            res();
        } else {
            // if it doesnt has children than its a base agent
            res(BaseAgent.destroy({ id: node.data }));
        }
        
    })).then(() => {
        return SNode.destroy({ id: nodeId });
    })
}



var listenOnAgent = function(agent) {
    sails.log.debug(`agentUrl for interval ${JSON.stringify(agent, null, 2)}`);
    agent = JSON.parse(JSON.stringify(agent));
    var iid = setInterval(function(){
        sails.log.debug(`inside interval ${JSON.stringify(agent, null, 2)}`);
        var start = new Date();
        request.post(
                    agent.url + '/isalive',
                    { form: {
                            key: agent.key
                        }
                    },
                    function (error, response, body) {
                        sails.log.debug("1) Got keep alive status: " + JSON.stringify(body, null, 2));
                        try{
                            body = JSON.parse(body);
                        } catch(e) {
                            // statements
                            body = {
                                res:e
                            };
                        }
                        if (!error && response.statusCode == 200) {
                            sails.log.debug("2) Got keep alive status: " + JSON.stringify(body, null, 2));
                            agents[agent.key].alive = true;
                            agents[agent.key].hostname = body.info.hostname;
                            agents[agent.key].arch = body.info.arch;
                            agents[agent.key].freeSpace = bytesToSize(body.info.freeSpace);
                            agents[agent.key].respTime = new Date() - start;
                            agents[agent.key].url = agent.url;
                            agents[agent.key].key = agent.key;
                            agents[agent.key].liveCounter = LIVE_COUNTER;
                        }
                        else if ((--agents[agent.key].liveCounter) == 0) {
                            agents[agent.key].alive = false;
                            if (!agents[agent.key].hostname) {
                                agents[agent.key].hostname = 'wait for update';
                            }
                            if (!agents[agent.key].arch) {
                                agents[agent.key].arch = 'wait for update';
                            }
                            if (!agents[agent.key].freeSpace) {
                                agents[agent.key].freeSpace = 0;
                            }
                            agents[agent.key].respTime = 0;
                            sails.log.error(error);
                        }
                    });
    }, KEEPALIVEINTERVAL);
    agents[agent.key] = {intervalId: iid, alive: false};
};

function populateTree(agentsTree, cb) {
    let children = [];
    async.each(agentsTree.children, function(child, callback) {
        if (!child.hasChildren) {
            SNode.findOne({id: child.id}).populate('data').exec(function (err, data) {
                if (err) {
                    return callback(err);
                }
                children.push(data);
                callback();
            });
        } else if (child.hasChildren) {
            SNode.findOne({id: child.id}).populate('children').exec(function (err, data) {
                if (err) {
                    return callback(err);
                }
                children.push(data);
                callback();
            });
        }
    }, function(err) {
        agentsTree.children = children;
        cb(err, agentsTree);
    });
}

var SSH = require('simple-ssh');
var getIP = require('external-ip')();

module.exports = {
    baseAgent: {},
    liveAgents: agents,
    installAgent: function (req, baseAgent, cb) {
        var sshKey = baseAgent.sshKey;
        var username = baseAgent.username;
        var port = baseAgent.port;

        if (!username || !sshKey || !baseAgent.port || !baseAgent.url) {
            return cb("Invalid input");
        }

        var ssh = new SSH({
            host: baseAgent.url,
            user: username,
            key: sshKey,
        });

		getIP(function (err, ip) {
			if (err) {
				console.log('invalid ip');
				return cb("Invalid ip");
			}
			console.log(ip);
			var baseConf = {
            serverUrl: "http://" + ip + ":8080",// + req.port,
            baseAgentAddress: baseAgent.url ,
            baseAgentPort: baseAgent.port
        };

        ssh.exec('echo "' + fs.readFileSync('./baseAgentInstall.sh') + '" > ~/install.sh', {
            out: function(stdout) {
                console.log(stdout);
            }
        }).exec('sudo chmod a+x ~/install.sh', {
            out: function(stdout) {
                console.log(stdout);
            }
        }).exec('sudo apt-get install -y dos2unix', {
            out: function(stdout) {
                console.log(stdout);
            }
        }).exec('dos2unix ~/install.sh', {
            out: function(stdout) {
                console.log(stdout);
            }
        }).exec('sudo ~/install.sh', {
            out: function(stdout) {
                console.log(stdout);
            }
        }).exec('sudo chmod 777 ~/production-map/production-map-base-agent/production-map-base-agent/conf/baseagent.json', {
            out: function(stdout) {
                console.log(stdout);
            }
        }).exec(`sudo echo '` + JSON.stringify(baseConf) + `' > ~/production-map/production-map-base-agent/production-map-base-agent/conf/baseagent.json`, {
            out: function(stdout) {
                console.log(stdout);
            }
        }).exec('sudo chmod 644 ~/production-map/production-map-base-agent/production-map-base-agent/conf/baseagent.json', {
            out: function(stdout) {
                console.log(stdout);
            }
        }).exec('sudo forever start ~/production-map/production-map-base-agent/production-map-base-agent/bin/www ' + port, {
            out: function(stdout) {
                console.log(stdout);
            }
        }).exec('wget ' + baseAgent.url + ":" + port + "/registerserver", {
            out: function(stdout) {
                return cb();
            }
        }).exec('echo "Done"', {
            out: function(stdout) {
                return cb();
            }
        }).start();

		});


    },
    addBaseAgent: function (baseAgent) {
        var newAgent = null;
        sails.log.debug("AGENT \n", baseAgent);
            // tring to find a base agent with the same key
        return BaseAgent.findOne({ key: baseAgent.key }).then((agent) => {
                if(!agent) {
                    // if there isn't an agent create it
                    return BaseAgent.create(baseAgent)
                } else {
                    // otherwise update the agent
                    return BaseAgent.update({ key: baseAgent.key }, baseAgent)
                }
            }).then((agent) => {
                if (Array.isArray(agent)) {
                    agent = agent[0];
                }
                if (!BaseAgentsService.baseAgent.id) {
                    BaseAgentsService.baseAgent = agent;
                    SchedultJobsService.loadJobs();
                } else if (BaseAgentsService.baseAgent.id == agent.id){
                    BaseAgentsService.baseAgent = agent;
                }

                agent.alive = true;
                newAgent = agent;
                return SNode.findOne({ data: newAgent.id })
            }).then((node) => {
                if (!node) {
                    // if it is an new agent, create a SNode record for it.
                    return SNode.create({ hasChildren: false, data: newAgent.id })
                } 
                return ;
            }).then((node) => {
                if(node) {
                    BaseAgentsService.installPluginsOnAgent(newAgent, function() {
                    });
                }
                listenOnAgent(newAgent);
                return newAgent
            });
    },
    deleteBaseAgent: function (nodeId) {
        return deleteNode(nodeId);
    },
    addGroup: function (parentId, name) {
        return SNode.create({hasChildren: true, name: name, parent: parentId});
    },
    deleteGroup: function (nodeId) {
        return deleteNode(nodeId);
    },
    updateGroup: function (snode, cb) {
        return SNode.update({id: snode.id }, snode)
    },
    updateBaseAgent: function (parentId, baseAgent) {
        return SNode.findOne({ data: baseAgent.id }).then((node) => {
            node.parent = parentId;
            return SNode.update({ id: node.id }, node);
        }).then((node) => {
            return BaseAgent.update({ id: baseAgent.id }, baseAgent)
        }).then((agent) => {
            if (BaseAgentsService.baseAgent.id == agent.id) {
                BaseAgentsService.baseAgent = agent;
            }
            return agent
        })
    },
    getNode: function(id, cb) {
        return SNode.findOne(id).populate('children').then((node) => new Promise((res, rej) =>{
            let childs = [];
            async.each(node.children, function(child, callback) {
                if (!child.hasChildren) {
                    SNode.findOne(child.id).populate('data').exec(function(err, node) {
                        if (err) {
                            callback(err);    
                        }
                        childs.push(node);
                        callback();
                    });
                } else {
                    childs.push(child);
                    callback();
                }
            }, function(err) {
                if (err) {
                    rej();
                } else {
                    node.children = childs;
                    res(node)
                }
            });
        }));
    },
    getAgents: function(){
        return SNode.find({parent: "-1"}).populate('data').populate('children').then((nodes) => new Promise((res, rej) => {
            let trees = [];
            async.each(nodes, function(node, callback) {
                populateTree(node, function(err, populatedNode) {
                    if (err) {
                        return callback(err);
                    }
                    trees.push(populatedNode);
                    callback();
                });
            }, function(err) {
                if (err) {
                    rej(err);
                } else {
                    res(trees);
                }
            });
        }));
    },
    listenOnAgents: function () {
        BaseAgentsService.getAgents(function (err, agents) {
            if (agents && agents.length>0)
            {
                agents.forEach(function(agent) {
                    listenOnAgent(agent);
                }, this);
            }
        });
    },
    loadBaseAgent: function (cb) {
        BaseAgentsService.getAgents(function (err, agents) {
            if (agents && agents.length>0)
                BaseAgentsService.baseAgent = agents[0];

            cb(err,agents);
        })
    },
    getAgentsState: function() {
        var resAgents = {};
        for(var prop in agents){
            var agent = agents[prop];
            resAgents[prop] = {alive: agent.alive, hostname: agent.hostname, freeSpace: agent.freeSpace, arch: agent.arch, respTime: agent.respTime};
        }
        return resAgents
    },
    modulesPath: modulesPath,
    installPluginsOnAgent: installPluginsOnAgent,
};
