import { Component, Input, OnInit } from '@angular/core';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import * as _ from 'lodash';

@Component({
  selector: 'modal-content',
  styleUrls: ['attribute-window.component.css'],
  templateUrl: 'attribute-window.component.html'
})
export class AttributeWindow {
  @Input() attribute: any;
  public attr: any;
  public types: any[];

  constructor(public dialog: NgbActiveModal) {
    this.types = ['String', 'List'];
  }

  ngOnInit() {
    this.attr = _.cloneDeep(this.attribute);
  }
  closeWindow() {
    this.dialog.close(false);
  }

  apply() {
    this.attr.value = this.attr.strValue;
    if (this.attr.type == "List") {
      this.attr.value = this.attr.value.split(",");
    } 
    this.dialog.close(this.attr);
  };
}
