import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChange } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AttributeWindow } from '../../../shared/popups/attribute-window/attribute-window.component';
import { MapService } from '../../../shared/services/map.service'


@Component({
  selector: 'app-map-attributes',
  templateUrl: './map-attributes.component.html',
  styleUrls: ['./map-attributes.component.css']
})
export class MapAttributesComponent implements OnInit, OnChanges, OnDestroy {

  map: any = {};
  currentMapSubscription: Subscription;

  searchtext: string = null;

  constructor(public modalService: NgbModal, private mapService: MapService) {
    this.map = {
      mapView: {
        attributes: []
      }
    };
    this.currentMapSubscription = this.mapService.getCurrentMapObservable()
      .subscribe(
      (map) => this.map = map
      );
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

  ngOnDestroy() {
    this.currentMapSubscription.unsubscribe();
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
