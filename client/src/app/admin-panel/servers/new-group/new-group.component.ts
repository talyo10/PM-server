import { Component, OnInit, Input } from '@angular/core';

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
export class NewGroupComponentWindow implements OnInit {
  @Input() name: any;
  label: string;

  constructor(public modal: NgbActiveModal) {  }

  ngOnInit() {
    this.label = this.name? 'Rename': 'Create';
  }

  closeWindow() {
    this.modal.close();
  }

  create() {
    this.modal.close(this.name);
  };

}
