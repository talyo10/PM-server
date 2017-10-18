import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';

import { ConstsService } from './consts.service';

@Injectable()
export class ProjectService {
  private serverUrl: string;

  constructor(private http: Http, public options: RequestOptions, private constsService: ConstsService) {
    let headers = new Headers({ 'Content-Type': 'application/json', withCredentials: true });
    this.options.headers = headers;
    this.serverUrl = this.constsService.getServerUrl();
  }

  addFolder(projectId, parentId, folderName) {
    return this.http.post(this.serverUrl + 'project/addFolder', { projectId: projectId, parentId: parentId, name: folderName }, this.options).map(this.extractData);
  }

  createProject(projectName) {
    return this.http.post(this.serverUrl + 'project/createProject', { name: projectName }, this.options).map(this.extractData);
  }

  deleteFolder(id) {
    return this.http.post(this.serverUrl + 'project/deleteFolder', { id: id }, this.options).map(this.extractData);
  }

  deleteProject(projectId) {
    return this.http.get(this.serverUrl + 'project/deleteProject/' + projectId, this.options).map(this.extractData);
  }

  getProjectById(projectId) {
    return this.http.get(this.serverUrl + 'project/getProjectById/' + projectId, this.options).map(this.extractData);
  }

  getJstreeProjectsByUser(userId) {
    return this.http.get(this.serverUrl + 'project/getJstreeProjectsByUser/' + userId, this.options).map(this.extractData);
  }

  getNode(id: any) {
    return this.http.get(this.serverUrl + 'project/node/'+id, this.options).map(this.extractData);
  }
  
  getProjectsByUser(userId) {
    return this.http.get(this.serverUrl + 'project/getProjectByUser/' + userId, this.options).map(this.extractData);
  }
  
  renameFolder(id, name) {
    return this.http.post(this.serverUrl + 'project/renameFolder', { id: id, name: name }, this.options).map(this.extractData);
  }

  updateProject(project) {
    //TODO: create rename function for projects at the server
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
