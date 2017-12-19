import { Component, OnInit } from '@angular/core';

import { Subscription } from "rxjs/Subscription";
import { BsModalRef, BsModalService } from "ngx-bootstrap";
import * as _ from "lodash";

import { AddAttributeComponent } from "./add-attribute/add-attribute.component";
import { MapsService } from "../../../../maps.service";
import { MapStructure } from "../../../../models/map-structure.model";

@Component({
  selector: 'app-map-attributes',
  templateUrl: './map-attributes.component.html',
  styleUrls: ['./map-attributes.component.scss']
})
export class MapAttributesComponent implements OnInit {
  mapStructureSubscription: Subscription;
  mapStructure: MapStructure;

  constructor(private modalService: BsModalService, private mapsService: MapsService) {
  }

  ngOnInit() {
    this.mapStructureSubscription = this.mapsService.getCurrentMapStructure().subscribe(structure => {
      this.mapStructure = structure;
    });
  }

  openAddAtrributeModal(attr) {
    let modal: BsModalRef;
    modal = this.modalService.show(AddAttributeComponent);
    modal.content.result.subscribe(result => {
      console.log(result);
      let attr = _.find(this.mapStructure.attributes, (o) => {
        return o.name === result.name
      });
      if (!attr) {
        this.mapStructure.attributes.push(result);
        this.mapsService.setCurrentMapStructure(this.mapStructure);
      } else {
        console.log("Attribute with this name exists");
      }
    });

  }

  removeAttribute(index) {
    this.mapStructure.attributes.splice(index, 1);
    this.mapsService.setCurrentMapStructure(this.mapStructure);
  }

}
