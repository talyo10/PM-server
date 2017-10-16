import { Component, Input } from '@angular/core';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import * as _ from 'lodash';

/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
  selector: 'modal-content',
  styleUrls: ['delete-node.component.css'],
  templateUrl: 'delete-node.component.html'
})
export class DeleteNodeComponentWindow {
  @Input() name: any;

  constructor(public activeModal : NgbActiveModal, public modalService : NgbModal) {
  }

  closeWindow() {
    console.log('closing window');
    this.activeModal.close(false);
  }

  delete() {
    this.activeModal.close(true);
  }

}
