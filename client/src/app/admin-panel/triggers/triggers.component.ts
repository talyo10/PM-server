import { Component, OnDestroy, OnInit } from '@angular/core';

import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { TriggerService } from '../../shared/services/trigger.service';
import { AddTriggerComponentWindow } from './add-trigger/add-trigger.component';
import { FileUploadComponent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-triggers',
  templateUrl: './triggers.component.html',
  styleUrls: ['./triggers.component.css'],
  providers: [TriggerService]
})
export class TriggersComponent implements OnInit, OnDestroy {
  triggerReq: any;
  triggers: any[];

  constructor(public modalService: NgbModal, private triggerService: TriggerService) {
    this.triggers = [];
  }

  ngOnInit() {
    this.triggerReq = this.triggerService.all().subscribe((triggersData: any) => {
      this.triggers = triggersData;
    });
  }

  ngOnDestroy() {
    this.triggerReq.unsubscribe();
  }

  addTrigger() {
    const modalref = this.modalService.open(FileUploadComponent);
    // modalref.componentInstance.triggersList = this.triggers;
    modalref.result.then((trigger) => {
      this.triggerReq = this.triggerService.all().subscribe((triggersData: any) => {
        this.triggers = triggersData;
      });
    });
  }

  deleteTrigger(triggerIndex) {
    this.triggerService.delete(this.triggers[triggerIndex].id).subscribe(res => {
      console.log('deleted trigger');
    });
    this.triggers.splice(triggerIndex, 1);
  }

  // editTrigger(trigger) {
  //   const modalref = this.modalService.open(AddTriggerComponentWindow);
  //   modalref.componentInstance.trigger = trigger;
  //   modalref.result.then((trigger) => {
  //     this.triggerReq = this.triggerService.all().subscribe((triggersData: any) => {
  //       this.triggers = triggersData;
  //     });
  //   });
  // }

}
