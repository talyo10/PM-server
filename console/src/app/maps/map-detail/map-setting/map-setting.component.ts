import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";

import { MapsService } from "../../maps.service";
import { MapStructure } from "../../models/map-structure.model";

@Component({
  selector: 'app-map-setting',
  templateUrl: './map-setting.component.html',
  styleUrls: ['./map-setting.component.scss']
})
export class MapSettingComponent implements OnInit {
  structures: MapStructure[];
  structureId: string;
  mapId: string;
  constructor(private mapsService: MapsService, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.route.parent.params.subscribe(params => {
      this.mapId = params.id;
      this.mapsService.structuresList(params.id).subscribe(structures => {
        this.structures = structures
      });
    });
  }

  changeStructure() {
    this.mapsService.getMapStructure(this.mapId, this.structureId).subscribe(structure => {
      this.mapsService.setCurrentMapStructure(structure);
    });
  }

  archiveMap() {
  //  TODO: archive map
  }

}
