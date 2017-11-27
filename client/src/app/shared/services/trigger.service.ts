import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Response } from '@angular/http';
import { ConstsService } from './consts.service';

@Injectable()
export class TriggerService {

  private serverUrl: string;

  private types: any[] = [
        {
            id: 0,
            viewName: 'git',
            params: [
                {
                    "name": "operation",
                    "viewName": "execute hooks",
                    "type": "collection",
                    "options": [{ "id": "push",
                                  "name": "push"}
                                ]
                },
                {
                    "name": "serverUrl",
                    "viewName": "server url",
                    "type": "string"
                },
                {
                    "name": "branch",
                    "viewName": "branch",
                    "type": "string"
                }
            ]
        },
        {
            id: 1,
            viewName: 'github',
            params: [
                {
                    "name": "operation",
                    "viewName": "execute hooks",
                    "type": "collection",
                    "options": [{ "id": "push",
                                  "name": "push"}
                                ]
                },
                {
                    "name": "serverUrl",
                    "viewName": "server url",
                    "type": "string"
                },
                {
                    "name": "branch",
                    "viewName": "branch",
                    "type": "string"
                },
                {
                    "name": "secret",
                    "viewName": "secret",
                    "type": "string"
                }
            ]
        }
    ];

    constructor(private http: Http, public options: RequestOptions, private constsService: ConstsService) {
      let headers = new Headers({ 'Content-Type': 'application/json', withCredentials: true });
      this.options.headers = headers;
      this.serverUrl = this.constsService.getServerUrl();
    }

    add(trigger) {
        return this.http.post(this.serverUrl + 'plugins/trigger/create' , trigger, this.options).map(this.extractData);
    }
    deletePlugin(pluginId) {
        return this.http.delete(this.serverUrl + 'plugins/' + pluginId + "/delete" , this.options).map(this.extractData);
    }
    deleteMapTrigger(triggerId) {
        return this.http.delete(this.serverUrl + 'triggers/map/' + triggerId + "/delete" , this.options).map(this.extractData);
    }
    findByMap(mapId) {
        return this.http.get(this.serverUrl + "triggers/map/" + mapId, this.options).map(this.extractData);
    }
    getPlugin(query) {
        return this.http.get(this.serverUrl + "plugins/" + query, this.options).map(this.extractData);
    }
    getPlugins() {
        return this.http.get(this.serverUrl + "plugins", this.options).map(this.extractData);
    }
    getTriggersPlugin() {
        return this.http.get(this.serverUrl + 'triggers/', this.options).map(this.extractData);
    }
    getMethods(query) {
        return this.http.get(this.serverUrl + 'plugins/' + query + "/methods" , this.options).map(this.extractData);
    }
    getTypes() {
        return this.types;
    }
    
    updateTrigger(trigger) {
        return this.http.post(this.serverUrl + "triggers/" + trigger.id + "/update", trigger, this.options).map(this.extractData);
    }

    private extractData(res: Response) {
        try {
            let body = res.json();
            return body || {};
        } catch (ex) {
            return {};
        }
    }

}
