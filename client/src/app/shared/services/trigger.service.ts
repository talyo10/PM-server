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

    delete(id) {
        return this.http.delete(this.serverUrl + 'trigger/' + id, this.options).map(this.extractData);
    }
    get(id) {
        return this.http.get(this.serverUrl + 'trigger/' + id, this.options).map(this.extractData);
    }
    all() {
        return this.http.get(this.serverUrl + 'trigger', this.options).map(this.extractData);
    }
    add(trigger) {
        return this.http.post(this.serverUrl + 'trigger' , trigger, this.options).map(this.extractData);
    }
    update(trigger) {
        return this.http.post(this.serverUrl + 'trigger/' + trigger.id + "/update", trigger, this.options).map(this.extractData);
    }
    getTypes() {
        return this.types;
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
