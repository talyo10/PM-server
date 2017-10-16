import { Component, Input } from '@angular/core';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import * as _ from 'lodash';


/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
  selector: 'modal-content',
  styleUrls: ['rename-folder.component.css'],
  templateUrl: 'rename-folder.component.html',
  providers: []
})
export class RenameFolderComponentWindow {
  @Input() name: any;

  constructor(public dialog: NgbActiveModal) {
  }

  closeWindow() {
    console.log('closing window');
    this.dialog.close();
  }

  update() {
      this.dialog.close(this.name);
  };

}
