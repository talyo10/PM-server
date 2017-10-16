import { Component, ViewEncapsulation, OnInit } from '@angular/core';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ProcessesComponentWindow } from '../processes/processes.component';

import * as _ from 'lodash';
import {CombinedPopupComponent} from "../combined-popup/combined-popup.component";

/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
  selector: 'ngbd-modal-content',
  styleUrls: ['../processes/processes.component.css'],
  templateUrl: 'new-process.component.html'
})
export class NewProcessComponentWindow {
  public link: any;
  public src: any;
  public dest: any;
  public process: any;

  constructor(public active : NgbActiveModal, private modalService : NgbModal) {
  }

  ngOnInit() {
    this.process = {
      name: '',
      description: '',
      order: 0,
      default_execution: false,
      mandatory: false,
      actions: [],
      result: '',
      condition: false,
      id: this.link.processes.length
    };
  }

  closeWindow(res) {
    this.active.close(res);
  }

  createProcess() {
    this.link.processes.push(this.process);
    this.closeWindow(true);
    const modalRef = this
        .modalService
        .open(CombinedPopupComponent);
    modalRef.componentInstance.link = this.link;
    modalRef.componentInstance.src = this.src;
    modalRef.componentInstance.dest = this.dest;
    modalRef.componentInstance.currentProcess = this.process;
  };

}
