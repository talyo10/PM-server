import { Component, OnInit } from '@angular/core';

import { TriggerService } from '../../shared/services/trigger.service';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import { AddTriggerComponentWindow } from './add-trigger/add-trigger.component';

@Component({
  selector: 'app-triggers',
  templateUrl: './triggers.component.html',
  styleUrls: ['./triggers.component.css'],
  providers: [TriggerService]
})
export class TriggersComponent implements OnInit {

  triggers: any[];

constructor(public modalService: NgbModal, private triggerService: TriggerService) {
    this.triggers = [];
   }

  ngOnInit() {
    this.triggerService.all().subscribe((triggersData: any) => {
      this.triggers = triggersData;
    });
  }

  addTrigger() {
    const modalref = this.modalService.open(AddTriggerComponentWindow);
    modalref.componentInstance.triggersList = this.triggers;
  }

  deleteTrigger(triggerIndex) {
    this.triggerService.delete(this.triggers[triggerIndex].id).subscribe( res => {
      console.log('deleted trigger');
    });
    this.triggers.splice(triggerIndex, 1);
  }

}
