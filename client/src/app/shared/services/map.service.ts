import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Response } from '@angular/http';
import { ConstsService } from './consts.service';

import * as _ from 'lodash';

@Injectable()
export class MapService {
  private serverUrl: string;
  private versions: any = {};

  public runStatuses: any = {
        Running : 1,
        Done: 2,
        Failed: 3,
        Paused: 4,
        Stopped: 5,
        NeverRun: 6
  };

  public openMaps = [];

  constructor(private http: Http, public options: RequestOptions, private constsService: ConstsService) {
    let headers = new Headers({ 'Content-Type': 'application/json', withCredentials: true });
    this.options.headers = headers;
    this.serverUrl = this.constsService.getServerUrl();
    this.versions = {};
  }
  connectTest() {
    let username = 'test';
    let password = 'asdfasdf';
    return this.http.post(this.serverUrl + 'auth/local', {
      identifier: username,
      password: password
    }).map(this.extractData);
  }
  deleteMap(mapId) {
    return this.http.get(this.serverUrl + 'map/deleteMap/' + mapId, this.options).map(this.extractData);
  }
  getMapById(mapId) {
    return this.http.get(this.serverUrl + 'map/getMapById/' + mapId, this.options).map(this.extractData);
  }
  saveMap(map) {
    return this.http.post(this.serverUrl + 'map/addMapVersion', map, this.options).map(this.extractData);
  }
  createMap(parentId, mapName, projectId) {
    return this.http.post(this.serverUrl + 'map/createMap', { parentId: parentId,map:{ name: mapName, Project: projectId }}, this.options).map(this.extractData);
  }
  executeMap(map, agents) {
    return this.http.post(this.serverUrl + 'sysfile/execute', { 'map': map, agentsIds: agents }, this.options).map(this.extractData);
  }
  resumeMap(map) {
    return this.http.post(this.serverUrl + 'sysfile/resumeMap', map, this.options).map(this.extractData);
  }
  stopMap(map) {
    return this.http.post(this.serverUrl + 'map/updateVersionStatus', { map: map, status: this.runStatuses.Stopped }, this.options).map(this.extractData);
  }
  ChangeMapRunStatus(map, status) {
    return this.http.post(this.serverUrl + 'map/updateVersionStatus', { map: map, versionIndex: -1, status: status }, this.options).map(this.extractData);
  }
  updateMapProject(MapId, ProjectId) {
    return this.http.get(this.serverUrl + 'map/updateMapProject/' + MapId + '/' + ProjectId, this.options).map(this.extractData);
  }
  updateMap(map) {
    return this.http.post(this.serverUrl + 'map/updateMapProject/', { map: map }, this.options).map(this.extractData);
  }

  duplicateMap(mapName, projectId, dmapId) {
    return this.http.post(this.serverUrl + 'map/duplicate/' + dmapId, { name: mapName, Project: projectId }, this.options).map(this.extractData);
  }

  getMapVersions(mapId) {
    return this.http.get(this.serverUrl + 'map/versions/' + mapId, this.options).map(this.extractData);
  }

  getMapVersion(mapId, index) {
    return this.http.get(this.serverUrl + 'map/versions/' + mapId + '/' + index, this.options).map(this.extractData);
  }


  /* offline Services */

  private extractData(res: Response) {
    try {
      let body = res.json();
      return body || {};
    } catch (ex) {
      return {};
    }
  }
}
