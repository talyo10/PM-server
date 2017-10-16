import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';

import { AttributeWindow } from '../../../../shared/popups/attribute-window/attribute-window.component';

@Component({
  selector: 'app-map-attribute',
  templateUrl: './map-attribute.component.html',
  styleUrls: ['./map-attribute.component.css']
})
export class MapAttributeComponent implements OnInit {

  @Input() attribute: any;
  @Output() deleteAttribute = new EventEmitter();

  constructor(public modalService: NgbModal) {
  }

  ngOnInit() {
  }

  edit() {
    const modalRef = this
      .modalService
    .open(AttributeWindow);
    modalRef.componentInstance.attribute = this.attribute;

    modalRef.result.then((attr: any) => {
      if (!attr) {
        return;
      }
      this.attribute.name = attr.name;
      this.attribute.type = attr.type;
      this.attribute.strValue = attr.strValue;
      this.attribute.value = attr.value;
    });
  }

  delete() {
    this.deleteAttribute.emit(this.attribute);
  }

}
