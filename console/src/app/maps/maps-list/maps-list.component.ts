import { Component, OnDestroy, OnInit } from '@angular/core';

import { MapsService } from "../maps.service";
import {Map} from "../models/map.model";

@Component({
  selector: 'app-maps-list',
  templateUrl: './maps-list.component.html',
  styleUrls: ['./maps-list.component.scss']
})
export class MapsListComponent implements OnInit, OnDestroy {
  maps: [Map];
  mapReq: any;
  constructor(private mapsService: MapsService) { }

  ngOnInit() {
    this.mapReq = this.mapsService.allMaps().subscribe((maps) => {
      this.maps = maps;
    })
  }

  ngOnDestroy() {
    this.mapReq.unsubscribe();
  }

}
