import { Component, Input, OnInit } from '@angular/core';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import { ActionsComponentWindow } from '../action/action.component';
import { NewProcessComponentWindow } from '../new-process/new-process.component';
import * as _ from 'lodash';

/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
  selector: 'ngbd-modal-content',
  styleUrls: ['processes.component.css'],
  templateUrl: 'processes.component.html'
})
export class ProcessesComponentWindow {
  
  @Input() link: any;
  @Input() src: any;
  @Input() dest: any;
  @Input() currentProcess: any;

  constructor(public activeModal: NgbActiveModal, public modalService: NgbModal) {
  }

  ngOnInit() {
    // new link
    if (this.currentProcess == null) {
      if (this.link.processes) {
        this.currentProcess = this.link.processes[0];
      } else {
        // no processes - this is a placeholder
        this.currentProcess = {
          name: '',
          description: '',
          order: 0,
          default_execution: false,
          mandatory: false,
          actions: [],
          result: '',
          condition: false
        };
      }
    }
  }

  closeWindow() {
    this.activeModal.close();
  }

  newProc() {
    this.currentProcess = {
      name: '',
      description: '',
      order: 0,
      default_execution: false,
      mandatory: false,
      actions: [],
      result: '',
      id: this.link.processes.length
    };
  }

  addAction() {
    let action = {
      server: {},
      method: {},
      params: {},
      name: '',
      timeout: 0,
      timeunit: '1',
      retries: 0,
      mandatory: false,
      suspend: false,
      result: '',
      id: this.currentProcess.actions.length
    };
    const modalRef = this
      .modalService
    .open(ActionsComponentWindow);
    modalRef.componentInstance.action = _.cloneDeep(action);
    modalRef.componentInstance.serverType = this.dest.type;
    modalRef.componentInstance.header = "Add Action";

    modalRef.result
      .then((resAction) => {
          if (!resAction) {
            return;
          }
          this.currentProcess.actions.push(resAction);
        },
        (error) => { console.log(error); });
  }

  editAction(action, index) {
      const modalRef = this
        .modalService
        .open(ActionsComponentWindow);
      modalRef.componentInstance.header = "Edit Action";
      modalRef.componentInstance.action = _.cloneDeep(action);
      modalRef.componentInstance.dest.type = this.dest.type;
      

      modalRef.result
      .then((resAction) => {
          if (!resAction) {
            return;
          }
          this.currentProcess.actions[index] = resAction;
        },
        (error) => { console.log(error); });
  }

  openNewProcessModal(link: any, src: any, dest: any) {
    this.closeWindow();
    const pmodal = this.modalService.open(NewProcessComponentWindow);
    pmodal.componentInstance.link = link;
    pmodal.componentInstance.src = src;
    pmodal.componentInstance.dest = dest;
  }

  addProcess() {
    this.openNewProcessModal(this.link, this.src, this.dest);
  };

  moveActionUp(actionIndex) {
    let prevAction = this.currentProcess.actions[actionIndex - 1];
    this.currentProcess.actions[actionIndex - 1] = this.currentProcess.actions[actionIndex];
    this.currentProcess.actions[actionIndex] = prevAction;
  }

  moveActionDown(actionIndex) {
    var nextAction = this.currentProcess.actions[actionIndex + 1];
    this.currentProcess.actions[actionIndex + 1] = this.currentProcess.actions[actionIndex];
    this.currentProcess.actions[actionIndex] = nextAction;
  }

  deleteAction(actionIndex) {
    this.currentProcess.actions.splice(actionIndex, 1);
  }

  deleteProcess(process) {
    _.remove(this.link.processes, (proc: any) => { return process.name === proc.name; });
    this.newProc();
  }

}
