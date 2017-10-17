import { Component, OnDestroy, Input } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import { NgSwitch, NgSwitchCase } from "@angular/common";

import { MapService } from '../../shared/services/map.service'

@Component({
  selector: 'app-map-settings',
  templateUrl: './map-settings.component.html',
  styleUrls: ['../../shared/css/map-bar.css', './map-settings.component.css']
})
export class MapSettingsComponent implements OnDestroy {

  public currentPanel: number = 0;
  map: any = {};
  currentMapSubscription: Subscription;

  constructor(private mapService: MapService) {
    this.currentMapSubscription = this.mapService.getCurrentMapObservable()
      .subscribe(
        (map) => {
          this.map = map;
        }
      );
   }

  ngOnDestroy() {
    this.currentMapSubscription.unsubscribe();
  }


  selectPanel(panelId: number) {
    this.currentPanel = panelId;
  }

}
