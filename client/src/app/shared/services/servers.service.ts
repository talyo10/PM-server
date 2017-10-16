import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Response } from '@angular/http';
import { ConstsService } from './consts.service';
import * as _ from 'lodash';


@Injectable()
export class ServersService {

  private serverUrl: string;
  public runningServers: Object = {};


  constructor(private http: Http, public options: RequestOptions, private constsService: ConstsService) {
    let headers = new Headers({ 'Content-Type': 'application/json', withCredentials: true });
    this.options = new RequestOptions({ headers: headers });
    this.serverUrl = this.constsService.getServerUrl();
  }

  deleteAgent(agentId) {
    return this.http.get(this.serverUrl + 'BaseAgent/deleteAgent/' + agentId).map(this.extractData);
  }

  getAgents() {
    return this.http.get(this.serverUrl + 'BaseAgent/getAgents').map(this.extractData);
  }

  addAgent(agent) {
    return this.http.post(this.serverUrl + 'BaseAgent/addAgent', agent).map(this.extractData);
  }

  updateAgent(parentId, agent) {
    return this.http.post(this.serverUrl + 'BaseAgent/updateAgent', { parentId, agent }).map(this.extractData);
  }

  updateGroup(group) {
    return this.http.post(this.serverUrl + 'BaseAgent/updateGroup', group).map(this.extractData);
  }

  addGroup(parentId, name) {
    return this.http.post(this.serverUrl + 'BaseAgent/addGroup', { parentId, name }).map(this.extractData);
  }

  deleteGroup(groupId) {
    return this.http.get(this.serverUrl + 'BaseAgent/deleteGroup/' + groupId).map(this.extractData);
  }

  getStatus() {
    return this.http.get(this.serverUrl + 'BaseAgent/statuses').map(this.extractData);
  }

  getNode(id: any) {
    return this.http.get(this.serverUrl + 'BaseAgent/node/'+id, this.options).map(this.extractData);
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
