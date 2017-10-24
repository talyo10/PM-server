/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

    /***************************************************************************
     *                                                                          *
     * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
     * etc. depending on your default view engine) your home page.              *
     *                                                                          *
     * (Alternatively, remove this and add an `index.html` file in your         *
     * `assets` directory)                                                      *
     *                                                                          *
     ***************************************************************************/

    // '/': {
    //     view: 'homepage'
    // },


    'get /logout': 'AuthController.logout',
    'get /isLoggedIn': 'AuthController.isLoggedIn',


    'post /auth/local': 'AuthController.callback',
    'post /auth/local/:action': 'AuthController.callback',

    'get /auth/:provider': 'AuthController.provider',
    'get /auth/:provider/callback': 'AuthController.callback',
    /***************************************************************************
     *                                                                          *
     * Custom routes here...                                                    *
     *                                                                          *
     * If a request to a URL doesn't match any of the custom routes above, it   *
     * is matched against Sails route blueprints. See `config/blueprints.js`    *
     * for configuration options and examples.                                  *
     *                                                                          *
     ***************************************************************************/

    'get /project/deleteProject/:id': 'ProjectController.deleteProject',
    'get /project/getProjectById/:id': 'ProjectController.getProjectById',
    'get /project/getProjectByUser/:id': 'ProjectController.getProjectByUser',
    'get /project/getJstreeProjectsByUser/:id': 'ProjectController.getJstreeProjectsByUser',
    'POST /project/createProject': 'ProjectController.createProject',
    'POST /project/addFolder': 'ProjectController.addFolder',
    'POST /project/renameFolder': 'ProjectController.renameFolder',
    'POST /project/deleteFolder': 'ProjectController.deleteFolder',
    'get /project/node/:id': 'ProjectController.getNode',

    'get /map/:id': 'MapController.getMapById',
    'get /map/deleteMap/:id': 'MapController.deleteMap',
    'get /map/updateMapProject/:mapId/:projectId': 'MapController.updateMapProject',
    'POST /map/updateMapProject': 'MapController.updateMap',
    'POST /map/addMapVersion': 'MapController.addMapVersion',
    'POST /map/createMap': 'MapController.addNewMap',
    'POST /map/updateVersionStatus': 'MapController.updateVersionStatus',
    'POST /map/duplicate/:mapId': 'MapController.duplicateMap',
    'GET /map/versions/:mapId': 'MapController.getVersions',
    'GET /map/versions/:mapId/:versionId': 'MapController.getVersion',

    'POST /ScheduledJob/addJob': 'ScheduledJobController.addJob',
    'get /ScheduledJob/deleteJob/:id': 'ScheduledJobController.deleteJob',
    'get /ScheduledJob/getFutureJobs': 'ScheduledJobController.getFutureJobs',
    'POST /ScheduledJob/updateJob': 'ScheduledJobController.updateJob',

    'POST /BaseAgent/addAgent': 'BaseAgentController.addAgent',
    'POST /BaseAgent/installAgent': 'BaseAgentController.installAgent',
    'get /BaseAgent/deleteAgent/:id': 'BaseAgentController.deleteAgent',
    'get /BaseAgent/statuses': 'BaseAgentController.getAgentsState',

    'get /BaseAgent/deleteGroup/:id': 'BaseAgentController.deleteGroup',
    'post /BaseAgent/addGroup': 'BaseAgentController.addGroup',
    'POST /BaseAgent/updateGroup': 'BaseAgentController.updateGroup',
    'get /BaseAgent/node/:id': 'BaseAgentController.getNode',

    'POST /BaseAgent/updateAgent': 'BaseAgentController.updateAgent',
    'POST /registerDedicated': 'BaseAgentController.registerDedicated',

    'POST /SysFile/executeByName': 'SysFileController.executeByName',
    'POST /SysFile/execute': 'SysFileController.execute',
    'POST /map/addAttribute': 'SysFileController.updateByName',

    'POST /trigger': 'TriggerController.addTrigger',

    'get /SystemHooks/deleteHook/:id': 'DedicatedAgentController.deleteHook',
    'get /SystemHooks/getHooks': 'DedicatedAgentController.getHooks',
    'POST /addSystemHooks': 'DedicatedAgentController.addHooks',

    'get /getallagents': 'DedicatedAgentController.getAllAgents',
    'post /installAgents': 'DedicatedAgentController.installAgents',

    'post /github/push': 'TriggerController.githubPush'



};
