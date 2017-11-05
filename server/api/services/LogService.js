function modelFor(instance) {
    /* the function get an instance and check which model its intance of. then, return the class name or null if not found  */
    var model;
    for (var key in sails.models) {
        model = sails.models[key];
        if ( instance instanceof model._model.__bindData__[0] ) {
            break;
        }
        model = undefined;
    }
    if (model) {
        return key.charAt(0).toUpperCase() + key.slice(1);
    } else {
        return ;
    }
  }

module.exports = {

    create: function(msg, instanceId, instanceModel, reason, status) {
        let obj = { message: msg, objectId: instanceId, model: instanceModel, reason: reason, status: status };
        return Log.create(obj).catch((error)=> console.log(error));
    },

    createLogWithInstance: function(msg, instance, reason, status) {
        console.log("Creating log");
        let obj = { message: msg, objectId: instance.id, model: modelFor(instance), reason: reason, status: status };
        return Log.create(obj).catch((error)=> console.log(error));
    },

    getLogsForInstance: function(instance) {
        /* this function get an instance and returns all the logs for this instance */
        return Log.find({ objectId: instance.id, model: modelFor(instance) });
    },

    error: function(msg, instance, reason) {
        return LogService.createLogWithInstance(msg, instance, reason, "error");
    },

    success: function(msg, instance, reason) {
        return LogService.createLogWithInstance(msg, instance, reason, "success");
    },

    info: function(msg, instance, reason) {
        return LogService.createLogWithInstance(msg, instance, reason, "info");
    }

 }