import { Component, OnInit, Input, OnChanges, SimpleChange } from '@angular/core';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import { AttributeWindow } from '../../../shared/popups/attribute-window/attribute-window.component';


@Component({
  selector: 'app-map-attributes',
  templateUrl: './map-attributes.component.html',
  styleUrls: ['./map-attributes.component.css']
})
export class MapAttributesComponent implements OnInit, OnChanges {

  @Input() map: any;
  searchtext: string = null;

  constructor(public modalService: NgbModal) {
    this.map = {
      mapView: {
        attributes: []
      }
    };
  }

  initAttributes() {
    if (!this.map || !this.map.mapView || !this.map.mapView.attributes) {
      this.map = {
        mapView: {
          attributes: []
        }
      };
    }
  }

  ngOnInit() {
    this.initAttributes();
  }

  addAttribute() {
    let attribute = {
      type: 'String',
      name: '',
      value: ''
    };
    if (!this.map.mapView.attributes) {
      this.map.mapView.attributes = [];
    }

    const modalRef = this
      .modalService
    .open(AttributeWindow);
    modalRef.componentInstance.attribute = attribute;
    
    modalRef.result
    .then((attr) => {
      if (attr) {
        this.map.mapView.attributes.push(attr);
      }
    });
  }

  ngOnChanges(changes: { [propertyName: string]: SimpleChange }): void {
    if (changes['map'].currentValue != null) {
      this.initAttributes();
    }
  }

  deleteAttribute($event, index) {
    this.map.mapView.attributes.splice(index, 1);
  }

}
