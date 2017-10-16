import { Component, Input } from '@angular/core';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import * as _ from 'lodash';

/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
  selector: 'modal-content',
  styleUrls: ['rename-node.component.css'],
  templateUrl: 'rename-node.component.html'
})
export class RenameNodeComponentWindow {
  @Input() name: any;

  constructor(public activeModal : NgbActiveModal, public modalService : NgbModal) {
  }

  closeWindow() {
    console.log('closing window');
    this.activeModal.close();
  }

  rename() {
    this.activeModal.close(this.name);
  }

}
