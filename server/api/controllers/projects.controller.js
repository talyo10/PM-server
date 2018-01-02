let projectsService = require("../services/projects.service");

module.exports = {
    /* add a new project */
    create: (req, res) => {
        projectsService.create(req.body).then(project => {
            req.io.emit('notification', {
                title: 'Project created',
                message: `${project.name} created successfuly`,
                type: 'success'
            });
            return res.json(project);
        }).catch((error) => {
            console.log("Error creating new project: ", error);
            res.status(500).send(error);
        });
    },

    /* add a map to project */
    addMap: (req, res) => {
        let projectId = req.params.projectId;
        let mapId = req.params.mapId;
        projectsService.addMap(projectId, mapId).then(project => {
            res.json(project);
        }).catch((error) => {
            console.log("Error adding map to project: ", error);
            res.status(500).send(error);
        });
    },

    /* get project details */
    detail: (req, res) => {
        projectsService.detail(req.params.id).then(project => {
            res.json(project);
        }).catch((error) => {
            req.io.emit('notification', { title: 'Whoops..', message: `Error getting project details`, type: 'error' });
            console.log("Error getting project's details: ", error);
            res.status(500).send(error);
        });
    },

    /* delete a project */
    delete: (req, res) => {
        projectsService.delete(req.params.id).then(() => {
            req.io.emit('notification', {
                title: 'Project deleted',
                message: ``,
                type: 'success'
            });

            return res.status(200).send("OK");
        }).catch((error) => {
            req.io.emit('notification', { title: 'Whoops..', message: `Error deleting project`, type: 'error' });

            console.log("Error deleting map to project: ", error);
            res.status(500).send(error);
        });
    },

    /* filter projects */
    filter: (req, res) => {
        projectsService.filter(req.query).then(data => {
            if (!data || data.totalCount === 0) {
                return res.status(204).send();
            }
            return res.json(data);
        }).catch((error) => {
            req.io.emit('notification', { title: 'Whoops..', message: `Error getting projects list`, type: 'error' });

            console.log("Error creating new project: ", error);
            res.status(500).send(error);
        })
    },

    /* update a project */
    update: (req, res) => {
        let project = req.body;
        project._id = req.params.id;
        projectsService.update(req.body).then(project => {
            req.io.emit('notification', { title: 'Project updated', message: `${project.name} updated successfully`, type: 'success' });

            res.json(project);
        }).catch((error) => {
            req.io.emit('notification', { title: 'Whoops..', message: `We couldn't update the project`, type: 'error' });
            console.log("Error updating project: ", error);
            res.status(500).send(error);
        })
    }

};