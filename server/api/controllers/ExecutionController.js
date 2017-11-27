/**
 * ExecutionController
 *
 * @description :: Server-side logic for managing Executions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	executionDetail: function(req, res) {
        ExecutionService.executionDetailByProcess(req.param('id')).then((exec) => {
                res.send(exec);
            }).catch((error) => {
                sails.log.error("Error getting execution result", error);
                MessagesService.sendMessage("notification", "Error getting execution result", "error");
                
                res.badRequest();
            })
    }
};

