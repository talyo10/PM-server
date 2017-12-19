import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";

import { Observable } from "rxjs/Observable";
import { BehaviorSubject } from "rxjs/BehaviorSubject";

import { Map } from "./models/map.model";
import { MapStructure } from "./models/map-structure.model";
import { MapTrigger } from "./models/map-trigger.model";
import { MapResult } from "./models/execution-result.model";


const serverUrl = environment.serverUrl;

@Injectable()
export class MapsService {
  currentMap: BehaviorSubject<Map> = new BehaviorSubject<Map>(null);
  public currentMapStructure: BehaviorSubject<MapStructure> = new BehaviorSubject<MapStructure>(null);

  constructor(private http: HttpClient) {
  }

  allMaps(): Observable<[Map]> {
    return this.http.get<[Map]>(serverUrl + "api/maps")
  }

  clearCurrentMap() {
    this.currentMap.next(null);
  }

  createMap(map): Observable<Map> {
    return this.http.post<Map>(serverUrl + "api/maps/create", map)
  }

  getCurrentMap(): Observable<any> {
    return this.currentMap.asObservable();
  }

  getMap(id: string): Observable<Map> {
    return this.http.get<Map>(serverUrl + "api/maps/" + id)
  }

  setCurrentMap(map: Map) {
    this.currentMap.next(map);
  }

  updateMap(map: Map) {
    return this.http.put<Map>(serverUrl + "api/maps/" + map.id + "/update", map)
  }

  /* map execution */

  execute(mapId) {
    return this.http.get(serverUrl + "api/maps/" + mapId + "/execute")
  }

  executionResults(mapId) {
    return this.http.get<MapResult[]>(serverUrl + "api/maps/" + mapId + "/results")
  }

  /* map structure */

  createMapStructure(mapId: string, structure: MapStructure) {
    return this.http.post<MapStructure>(serverUrl + "api/maps/" + mapId + "/structure/create", structure)
  }

  clearCurrentMapStructure() {
    this.currentMapStructure.next(null);
  }

  getMapStructure(mapId, structureId = '') {
    return this.http.get<MapStructure>(serverUrl + "api/maps/" + mapId + "/structure/" + structureId)
  }

  getCurrentMapStructure(): Observable<MapStructure> {
    return this.currentMapStructure.asObservable();
  }

  setCurrentMapStructure(structure: MapStructure) {
    this.currentMapStructure.next(structure);
  }

  /* map triggers */

  createTrigger(mapId, trigger) {
    return this.http.post<MapTrigger>(serverUrl + "api/maps/" + mapId + "/triggers/create", trigger);
  }

  deleteTrigger(mapId, triggerId) {
    return this.http.delete<any>(serverUrl + "api/maps/" + mapId + "/triggers/" + triggerId + "/delete", { responseType: 'text' });
  }

  triggersList(mapId) {
    return this.http.get<MapTrigger[]>(serverUrl + "api/maps/" + mapId + "/triggers")
  }

  updateTrigger(mapId, trigger) {
    return this.http.put<MapTrigger>(serverUrl + "api/maps/" + mapId + "/triggers/" + trigger._id + "/update", trigger);
  }

}
