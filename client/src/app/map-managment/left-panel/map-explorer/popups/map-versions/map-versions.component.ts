import { Component, OnInit, Input } from '@angular/core';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {MapExecutionsComponent} from '../map-executions/map-executions.component';

import { MapService } from '../../../../../shared/services/map.service';

import * as _ from 'lodash';

/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
  selector: 'modal-content',
  styleUrls: ['map-versions.component.css'],
  templateUrl: 'map-versions.component.html',
  providers: [MapService]
})
export class MapVersionsComponent {
  @Input() map: any;
  versions: any[];

  constructor(private mapService: MapService,
              public dialog: NgbActiveModal,
              public modalService: NgbModal) {

    this.versions = [];
  }

  ngOnInit() {
    this.mapService.getMapVersions(this.map.id).subscribe((versions) => {
      this.versions = versions;
    });
  }

  openExecutions(version) {
    const modalRef = this
      .modalService
    .open(MapExecutionsComponent);
    modalRef.componentInstance.map = this.map;
    modalRef.componentInstance.version = version;

  }

  closeWindow() {
    console.log('closing window');
    this.dialog.close();
  }
}


