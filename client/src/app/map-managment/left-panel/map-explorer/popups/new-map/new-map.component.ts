import { Component, Input } from '@angular/core';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {MapService} from "../../../../../shared/services/map.service";

import * as _ from 'lodash';


/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
  selector: 'modal-content',
  styleUrls: ['new-map.component.css'],
  templateUrl: 'new-map.component.html'
})
export class NewMapComponentWindow {
  @Input() public projectId: any;
  @Input() public parentId: any;
  public mapName: any;

  constructor(private mapService: MapService,
              public dialog: NgbActiveModal) {

    this.mapName = '';
  }

  closeWindow() {
    console.log('closing window');
    this.dialog.close();
  }

  create() {
    this.mapService.createMap(this.parentId, this.mapName, this.projectId).subscribe((map) => {
      this.dialog.close(map);
    });
  };

}
