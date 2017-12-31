import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from "@angular/common/http";

import { environment } from "../../environments/environment";
import { Project } from "./models/project.model";


const serverUrl = environment.serverUrl;

@Injectable()
export class ProjectsService {

  constructor(private http: HttpClient) {
  }

 create(project) {
    return this.http.post<Project>(serverUrl + "api/projects/create", project);
 }

  detail(projectId) {
    return this.http.get<Project>(serverUrl + "api/projects/" + projectId);
  }

  filter(query) {
    let params = new HttpParams().set('q', query);
    return this.http.get<[Project]>(serverUrl + "api/maps/", { params: params });
  }

  list() {
    return this.http.get<[Project]>(serverUrl + "api/projects");
  }

  update(projectId, project) {
    return this.http.put<Project>(serverUrl + "api/projects/" + projectId + "/update", project);
  }
}
