import { Component, Input } from '@angular/core';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {MapService} from '../../../../../shared/services/map.service';

import * as _ from 'lodash';


/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
  selector: 'modal-content',
  styleUrls: ['update-map.component.css'],
  templateUrl: 'update-map.component.html'
})
export class UpdateMapComponentWindow {
  public currProject: any;
  @Input() mapName: any;

  constructor(private mapService: MapService,
              public dialog: NgbActiveModal) {
  }

  closeWindow() {
    this.dialog.close();
  }

  update() {
      this.dialog.close(this.mapName);
  };

}
