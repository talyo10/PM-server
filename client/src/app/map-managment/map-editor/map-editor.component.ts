import { Component, OnInit, OnDestroy, Output, Input, EventEmitter } from '@angular/core';
import { NgSwitch, NgSwitchCase } from '@angular/common';

import { Subscription } from 'rxjs/Subscription';

import { MapService } from '../../shared/services/map.service';
import { LibPMService } from '../../shared/services/libpm.service';

import * as _ from 'lodash';

@Component({
  selector: 'app-map-editor',
  templateUrl: './map-editor.component.html',
  styleUrls: ['./map-editor.component.css'],
  providers: [LibPMService]
})
export class MapEditorComponent implements OnInit, OnDestroy {

  @Output() informOuterLayer = new EventEmitter();
  @Output() onExecution = new EventEmitter();
  map: any = {};

  public currentPanel: number = 0;
  public executingMap: boolean = false;
  public savingMap: boolean = false;

  currentMapSubscription: Subscription;

  constructor(private mapService: MapService, private libpmService: LibPMService) {
    this.currentMapSubscription = this.mapService.getCurrentMapObservable()
      .subscribe(
        (map) => {
          this.map = map;
        }
      );
  }

  ngOnInit() {
    this.executingMap = false;
    this.savingMap = false;
  }

  ngOnDestroy() {
    this.currentMapSubscription.unsubscribe();
  }

  selectPanel(panelId: number) {
    this.currentPanel = panelId;
  }

  updateManagmentPanel($event: any) {
    this.informOuterLayer.emit($event);
  }

  stopMap(map) {
    if (!this.executingMap) {
      return;
    }
    this.mapService.ChangeMapRunStatus(map, this.mapService.runStatuses.Stopped).subscribe((res) => {
      this.executingMap = false;
      console.log(res);
    });
  }

  executeMap(map, executingMap) {
    if (this.executingMap) {
      // this.mapService.stopMap(map).subscribe((result) => {
      //   this.executingMap = false;
      // });
      return;
    }
    this.executingMap = true;
    this.mapService.saveMap(map).subscribe((result) => {

      if (result.date) {
        map.mapView = result.structure;
        map.versionIndex++;
      }
      /* execute the map */
      this.mapService.executeMap(map, []).subscribe((mapResult) => {
        let res = '';
        let vid = map.versionIndex;
        let eid = mapResult.resObj.resObj.executionId;
        if (mapResult.res) {
          res = mapResult.res;
        } else if (mapResult.error) {
          res = mapResult.error;
        }
        this.onExecution.emit(res);
        this.executingMap = false;
      });
    });
  }

  saveMap(map) {
    this.savingMap = true;
    this.mapService.saveMap(map).subscribe((result) => {
      if (result.date) {
        map.versionIndex++;
        map.mapView = result.structure;
      }
      console.log(result);
      this.savingMap = false;
    }, (err: any) => {
      this.savingMap = false;
    });
  }

}
