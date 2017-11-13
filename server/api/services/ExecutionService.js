const async = require('async');

module.exports = {
  getExecuitionsByMap: function (mapId) {
    return Execution.find({ map: mapId }).populate("agentsExecutionResult")
  },

  executionDetailByProcess: function (execId) {
    // get all the agent execution results for this execution.
    return AgentExecutionResult.find({ execution: execId }).populate('agent')
      .then((agentsResult) => new Promise((resolve, reject) => {
          let agents = [];
          async.each(agentsResult, function (agentResult, callback) {
            //for each result, build a basic model.
            let agent = {};
            agent.id = agentResult.agent.id;
            agent.startTime = agentResult.startTime;
            agent.finishTime = agentResult.finishTime;
            agent.status = agentResult.status;
            agent.execution = agentResult.id;
            agent.name = agentResult.agent.name;


            agents.push(agent);
            callback();
          }, function (error) {
            console.log("Callback");
            resolve(agents);
          })
        }).then((agents) => new Promise((resolve, reject) => {
          let agrPrc = {};
          async.each(agents,
            function (agent, callback) {
              //for each agentResult, get the process execution.
              ProcessExecutionResult.find({ agentExecution: agent.execution }).populate("actionResult").then((populatedProcesses) => {
                console.log("FOUND PROCESSES");
                async.each(populatedProcesses,
                  function (process, cb) {
                    console.log(process.processName);
                    if (!agrPrc[process.processName]) {
                      agrPrc[process.processName] = {};
                      agrPrc[process.processName].agents = [];
                      agrPrc[process.processName].actions = {};
                      agrPrc[process.processName].status = 'success';
                    }
                    agent.processExec = process.id;
                    // store the action result inside the agent.
                    agent.actionsResult = process.actionResult;
                    agrPrc[process.processName].agents.push(agent);
                    agrPrc[process.processName].name = process.processName;
                    if (process.status === 'error' || agent.status === 'error') {
                      agrPrc[process.processName].status = 'error';
                    }

                    process.actionResult.forEach((action) => {
                      let agentClone = agent;

                      if (!agrPrc[process.processName].actions[action.actionName]) {
                        agrPrc[process.processName].actions[action.actionName] = {};
                        agrPrc[process.processName].actions[action.actionName].agents = [];
                        agrPrc[process.processName].actions[action.actionName].status = 'success';
                        agrPrc[process.processName].actions[action.actionName].name = action.actionName;

                      }
                      delete agentClone['actionsResult'];
                      agrPrc[process.processName].actions[action.actionName].agents.push({agent: agentClone, result: action.result});

                      if (action.status === 'error') {
                        agrPrc[process.processName].actions[action.actionName].status = 'error';
                      }


                    });
                    // agrPrc[process.processName].actions = actions;
                    cb();

                  }, function (error) {
                    callback();
                  })
              })
            }, function (error) {
              console.log("DONE DONE DONE");
              resolve(agrPrc);
            })
        })).then((agrPrc) => {
          console.log("WOW THATS REAL!");
          return agrPrc;
        })
      )
  }
}
