import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';

import * as _ from 'lodash';

import { ConstsService } from './consts.service';
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Rx";
import { Subscription } from "rxjs/Subscription";

@Injectable()
export class ServersService {

  private serverUrl: string;
  public runningServers: Object = {};
  private agents: BehaviorSubject<any[]> = new BehaviorSubject<any[]>(null);
  public agentsIntervalReq: Subscription = new Subscription;


  constructor(private http: Http, public options: RequestOptions, private constsService: ConstsService) {
    let headers = new Headers({ 'Content-Type': 'application/json', withCredentials: true });
    this.options = new RequestOptions({ headers: headers });
    this.serverUrl = this.constsService.getServerUrl();

    this.agentsIntervalReq = this.getAgentInterval().subscribe((r) => {
      this.setAgentsList(r);
    });
  }

  getAgentsListAsObservable(): Observable<any[]> {
    return this.agents.asObservable();
  }

  setAgentsList(agents: any[]) {
    this.agents.next(agents);
  }

  getLatestAgentsList() {
    return this.agents.getValue();
  }

  getAgentInterval() {
    //setting an observable with interval of 3s.
    return Observable
      .timer(0, 3000)
      .flatMap(() => {
        return this.http.get(this.serverUrl + 'BaseAgent/getAgents')
      }).map((res) => res.json());
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
