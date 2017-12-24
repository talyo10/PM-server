const agentsService = require("../api/services/agents.service");
const pluginsService = require("../api/services/plugins.service");

module.exports = {
    bootstrap: (app) => {
        console.log("Restarting agents status");
        agentsService.restartAgentsStatus();
        console.log("Reloading plugins");
        pluginsService.loadModules(app);
        // setTimeout(() => {
        //     pluginsService.loadPlugins();
        // }, 3000);
    }
};
