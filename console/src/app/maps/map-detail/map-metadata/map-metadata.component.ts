import { Component, OnInit } from '@angular/core';

import { Subscription } from "rxjs/Subscription";

import { MapsService } from "../../maps.service";
import { Map } from "../../models/map.model";

@Component({
  selector: 'app-map-metadata',
  templateUrl: './map-metadata.component.html',
  styleUrls: ['./map-metadata.component.scss']
})
export class MapMetadataComponent implements OnInit {
  map: Map;
  mapSubscription: Subscription;
  constructor(private mapsService: MapsService) { }

  ngOnInit() {
    this.mapSubscription = this.mapsService.getCurrentMap().subscribe(map => {
      this.map = map;
    })

  }

}
