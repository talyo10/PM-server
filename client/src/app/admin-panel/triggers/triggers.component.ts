import { Component, OnDestroy, OnInit } from '@angular/core';

import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { TriggerService } from '../../shared/services/trigger.service';
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
    this.triggerReq = this.triggerService.getTriggersPlugin().subscribe((triggersData: any) => {
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
      this.triggers.push(trigger);
    });
  }

  deleteTrigger(triggerId, triggerIndex) {
    this.triggerService.deletePlugin(triggerId).subscribe();
    this.triggers.splice(triggerIndex, 1);
  }

}
