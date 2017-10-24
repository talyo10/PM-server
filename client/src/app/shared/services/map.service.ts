import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';

import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

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

  public openMaps: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public maxOpenMaps: number = 4;
  private map: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private http: Http, public options: RequestOptions, private constsService: ConstsService) {
    let headers = new Headers({ 'Content-Type': 'application/json', withCredentials: true });
    this.options.headers = headers;
    this.serverUrl = this.constsService.getServerUrl();
    this.versions = {};

    if (localStorage.getItem('openMaps') && localStorage.getItem('openMaps') !== "null") {
      let maps = JSON.parse(localStorage.getItem('openMaps'));
      if (Array.isArray(maps)) {
        this.setOpenMaps(maps);
        this.setCurrentMap(maps[0]);
      } else {
        localStorage.removeItem('openMaps');
      }      
    }
  }

  connectTest() {
    let username = 'test';
    let password = 'asdfasdf';
    return this.http.post(this.serverUrl + 'auth/local', {
      identifier: username,
      password: password
    }).map(this.extractData);
  }

  ChangeMapRunStatus(map, status) {
    return this.http.post(this.serverUrl + 'map/updateVersionStatus', { map: map, versionIndex: -1, status: status }, this.options).map(this.extractData);
  }

  createMap(parentId, mapName, projectId) {
    return this.http.post(this.serverUrl + 'map/createMap', { parentId: parentId,map:{ name: mapName, Project: projectId }}, this.options).map(this.extractData);
  }

  deleteMap(mapId) {
    return this.http.get(this.serverUrl + 'map/deleteMap/' + mapId, this.options).map(this.extractData);
  }

  duplicateMap(mapName, projectId, dmapId) {
    return this.http.post(this.serverUrl + 'map/duplicate/' + dmapId, { name: mapName, Project: projectId }, this.options).map(this.extractData);
  }

  executeMap(map, agents) {
    return this.http.post(this.serverUrl + 'sysfile/execute', { 'map': map, agentsIds: agents }, this.options).map(this.extractData);
  }

  getMapById(mapId) {
    return this.http.get(this.serverUrl + 'map/getMapById/' + mapId, this.options).map(this.extractData);
  }

  getMapVersions(mapId) {
    return this.http.get(this.serverUrl + 'map/versions/' + mapId, this.options).map(this.extractData);
  }

  getMapVersion(mapId, index) {
    return this.http.get(this.serverUrl + 'map/versions/' + mapId + '/' + index, this.options).map(this.extractData);
  }

  resumeMap(map) {
    return this.http.post(this.serverUrl + 'sysfile/resumeMap', map, this.options).map(this.extractData);
  }

  saveMap(map) {
    return this.http.post(this.serverUrl + 'map/addMapVersion', map, this.options).map(this.extractData);
  }

  setCurrentMap(map) {
    this.map.next(map);
  }

  setOpenMaps(maps) {
    if (!maps) {
      localStorage.removeItem('openMaps');
    } else {
      localStorage.setItem('openMaps', JSON.stringify(maps));
    }
    this.openMaps.next(maps);
  }

  getOpenMapsObservable(): Observable<any[]>{
    return this.openMaps.asObservable();
  }

  getCurrentMapObservable(): Observable<any> {
    /* return the map subject as an observable */
    return this.map.asObservable();
  }
  
  stopMap(map) {
    return this.http.post(this.serverUrl + 'map/updateVersionStatus', { map: map, status: this.runStatuses.Stopped }, this.options).map(this.extractData);
  }

  selectMap(selectedMap) {
    /* change the selected map */
    this.setCurrentMap(selectedMap);
    let openMaps = this.openMaps.getValue();
    if(!openMaps) {
      openMaps = [selectedMap];
      this.setOpenMaps(openMaps);
    } else {
      let mapIndex = _.findIndex(openMaps, (map) => { return map['id'] === selectedMap.id; });
      if (mapIndex === -1) {
        if (openMaps.length < this.maxOpenMaps) {
          openMaps.push(selectedMap);
        } else {
          openMaps[this.maxOpenMaps - 1] = selectedMap;
        }
        this.setOpenMaps(openMaps);
      }
    }
    
  }
  
  updateMapProject(MapId, ProjectId) {
    return this.http.get(this.serverUrl + 'map/updateMapProject/' + MapId + '/' + ProjectId, this.options).map(this.extractData);
  }

  updateMap(map) {
    return this.http.post(this.serverUrl + 'map/updateMapProject/', { map: map }, this.options).map(this.extractData);
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
