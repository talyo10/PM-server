import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';

import * as _ from 'lodash';
import { TreeNode } from 'primeng/primeng';

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
  }

  buildSNodeTree(nodes, parent = "-1"): TreeNode[] {
    // The function gets an array of flatten snodes with parent property. By defult, to level nodes parent is -1.
    // The function return a nested array tree of the snodes.
    let tree: TreeNode[] = [];
    let nodesClone = nodes;
    for (let i in nodes) {
        if(nodes[i].parent == parent) {
          let children = this.buildSNodeTree(nodes, nodes[i].id)
          nodesClone[i] = { data: nodesClone[i] }
          if(children.length) {
              nodes[i].children = children
              nodesClone[i].children = children
          }
          tree.push(nodesClone[i])
        }
    }
    return tree
  }

  getSNodesTree() {
    // get a list of all snodes (with populated agent data) and return it as a tree
    return this.http.get(this.serverUrl + "agents/snodes", this.options).map((nodes) => {
      return this.buildSNodeTree(nodes.json());
    })
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

  getAgentsStatusInterval() {
    return Observable
    .timer(0, 10000)
    .flatMap(() => {
      return this.http.get(this.serverUrl + 'BaseAgent/statuses')
    }).map((res) => res.json());
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
