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
  plugins: any[];

  constructor(public modalService: NgbModal, private triggerService: TriggerService) {  }

  ngOnInit() {
    this.triggerReq = this.triggerService.getPlugins().subscribe((triggersData: any) => {
      this.plugins = triggersData;
    });
  }

  ngOnDestroy() {
    this.triggerReq.unsubscribe();
  }

  addTrigger() {
    const modalref = this.modalService.open(FileUploadComponent);
    // modalref.componentInstance.triggersList = this.triggers;
    modalref.result.then((trigger) => {
      console.log(trigger);
      this.plugins.push(trigger);
    });
  }

  deletePlugin(triggerId, triggerIndex) {
    this.triggerService.deletePlugin(triggerId).subscribe();
    this.plugins.splice(triggerIndex, 1);
  }

}
