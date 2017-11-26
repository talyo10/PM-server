import { Component, OnInit } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { TriggerService } from '../../../shared/services/trigger.service';
import { MapService } from '../../../shared/services/map.service';
import { AddTriggerComponent } from './add-trigger/add-trigger.component';

@Component({
  selector: 'app-map-triggers',
  templateUrl: './map-triggers.component.html',
  styleUrls: ['./map-triggers.component.css']
})
export class MapTriggersComponent implements OnInit {
  triggers: any[];
  triggersReq: any;
  map: any;
  mapSubscription: Subscription;
  constructor(private triggersService: TriggerService, private mapsService: MapService, public modalService: NgbModal) { }

  ngOnInit() {
    this.mapSubscription = this.mapsService.getCurrentMapObservable().subscribe(
      (map) => {
        this.map = map;
        this.triggersReq = this.triggersService.findByMap(this.map.id).subscribe((triggers) => {
          this.triggers = triggers;
        })
      }
    );
  }

  addTrigger() {
    const modalref = this.modalService.open(AddTriggerComponent);
    modalref.result.then(trigger => {
      if (!trigger) {
        return;
      }
      trigger.map = this.map.id;
      this.triggersService.add(trigger).subscribe((trigger) => {
        console.log("Created new trigger", trigger);
        this.triggers.push(trigger);
      });
    })
  }

  deleteTrigger(triggerId, triggerIndex) {
    this.triggersService.deleteMapTrigger(triggerId).subscribe();
    this.triggers.splice(triggerIndex, 1);
  }

  editTrigger(trigger, triggerIndex) {
    const modalref = this.modalService.open(AddTriggerComponent);
    modalref.componentInstance.selectedPlugin = trigger.plugin;
    modalref.componentInstance.selectedMethod = trigger.method;
    modalref.componentInstance.params = trigger.params;
    modalref.componentInstance.name = trigger.name;
    
    modalref.result.then(updatedTrigger => {
      updatedTrigger.id = trigger.id;
      this.triggersService.updateTrigger(updatedTrigger).subscribe((trigger) => {
        this.triggers[triggerIndex] = trigger;
      });
    })
  }
}
