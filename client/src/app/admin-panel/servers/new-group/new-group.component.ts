import { Component, Input } from '@angular/core';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import * as _ from 'lodash';

/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
  selector: 'modal-content',
  styleUrls: ['new-group.component.css'],
  templateUrl: 'new-group.component.html',
  providers: []

})
export class NewGroupComponentWindow {
  public group: any;

  constructor(public modal: NgbActiveModal) {
    this.group = {
      name: '',
    };
  }

  closeWindow() {
    console.log('closing windows!');
    this.modal.close();
  }

  create() {
    this.modal.close(this.group);
  };

}
