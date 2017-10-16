var async = require('async');
var fs = require('fs');
var unzip = require('unzip');
var streams = require('memory-streams');
var request = require('request');
var path = require('path');
var hooks = require('./HooksService').hooks;

function addDedicatedAgent(user, file, callback) {
        fs.createReadStream(file)
            .pipe(unzip.Parse())
            .on('entry', function (entry) {
                var fileName = entry.path;
                var type = entry.type; // 'Directory' or 'File'
                var size = entry.size;
                if (fileName === 'config.json') {
                    var writer = new streams.WritableStream();
                    entry.pipe(writer);
                    entry.on('readable', function() {
                        var agent = JSON.parse(writer.toString());
                        DedicatedAgent.findOne({type: agent.type}).then(function (dagent, err) {
                            if (err) {
                                return callback(err);
                            }
                            else if (!dagent) {
                                DedicatedAgent.create(agent, function (err, model) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    hooks.addPlugin(user, model);
                                    callback();
                                });   
                            } else {
                                BaseAgent.update({type: agent.type}, agent).exec(function (err, updatedAgent) {        
                                    if (err) {
                                      return  callback(err);
                                    } 
                                    callback();
                                });
                            }
                        });
                    });
                } else {
                    entry.autodrain();
                }
            });
    }

module.exports = {
    loadAgents: function() {
        fs.readdir(BaseAgentsService.modulesPath, (err, files) => {
            async.each(files, 
                function(plugin, fileSendingCallback){
                    var filePath = path.join(BaseAgentsService.modulesPath, plugin);
                    addDedicatedAgent({username: 'system'}, filePath, fileSendingCallback)
                },
                function(err) {
                });
        });
    },
    addDedicatedAgent: addDedicatedAgent
};