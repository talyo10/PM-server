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
  map: any;

  public currentPanel: number = 0;
  public executingMap: boolean = false;
  public savingMap: boolean = false;
  private openMaps: any[];

  currentMapSubscription: Subscription;
  currentOpenMapsSubscription: Subscription;

  constructor(private mapService: MapService, private libpmService: LibPMService) {
    this.currentMapSubscription = this.mapService.getCurrentMapObservable()
      .subscribe(
        (map) => {
          this.map = map;
        }
      );
    this.currentMapSubscription = this.mapService.getOpenMapsObservable()
      .subscribe(
        (maps) => {
          this.openMaps = maps;
        }
      )
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

  executeMap(map) {
    if (this.executingMap) {
      // this.mapService.stopMap(map).subscribe((result) => {
      //   this.executingMap = false;
      // });
      return;
    }
    this.executingMap = true;
    this.mapService.saveMap(map).subscribe((result) => {
      
      /* execute the map */
      this.mapService.executeMap(result).subscribe(
        (mapResult) => {
          console.log(mapResult);
          this.onExecution.emit(mapResult['res']? mapResult['res']: '');
          this.executingMap = false;
        }, 
        (error) => {
          this.executingMap = false;
        });
    });
  }

  saveMap(map) {
    this.savingMap = true;
    this.mapService.saveMap(map)
      .subscribe(
        (result) => {
          if (result.date) {
            map.versionIndex++;
            map.mapView = result.structure;

            // updating the open maps.
            let mapIndex = _.findIndex(this.openMaps, (mapa) => { return mapa.id === map.id })
            this.openMaps[mapIndex] = map;
            this.mapService.setOpenMaps(this.openMaps);
          }
          this.savingMap = false;
        }, (err: any) => {
          this.savingMap = false;
        }
      );
  }

}
