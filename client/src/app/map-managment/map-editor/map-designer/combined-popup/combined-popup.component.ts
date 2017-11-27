import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { NewProcessComponentWindow } from "../new-process/new-process.component";
import { AgentsService } from "../../../../shared/services/agents.service";
import * as _ from 'lodash';
import { TriggerService } from '../../../../shared/services/trigger.service';

@Component({
  selector: 'ngbd-modal-content',
  templateUrl: './combined-popup.component.html',
  styleUrls: ['./combined-popup.component.css'],
  providers: [AgentsService]
})
export class CombinedPopupComponent implements OnInit {

  @Input() link: any;
  @Input() src: any;
  @Input() dest: any;
  @Input() currentProcess: any;

  editingAction: boolean;
  currentAction: any;

  constructor(
    public activeModal: NgbActiveModal,
    public modalService: NgbModal,
    private agentsService: AgentsService,
    private triggersService: TriggerService
  ) { }

  ngOnInit() {

    this.editingAction = false;

    if (this.currentProcess == null) {
      if (this.link.processes) {
        this.currentProcess = this.link.processes[0];
      }
    } else {
      console.log('current process');
      //this.currentProcess = this.createNewProcess();
    }

    this.setCurrentAction();
  }

  setCurrentAction() {
    if (this.currentProcess.actions[0])
      this.currentAction = this.currentProcess.actions[0];
    else {
      this.currentAction = this.createNewAction();
    }
    console.log(this.currentAction);
  }

  private createNewProcess() {
    return {
      name: '',
      description: '',
      order: 0,
      default_execution: false,
      mandatory: false,
      actions: [],
      result: '',
      condition: false
    }
  }

  closeWindow() {
    this.activeModal.close();
  }

  createNewAction() {
    return {
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
  }


  onAddActionClick() {
    let newAction = this.createNewAction();
    this.currentAction = newAction;
    let now = new Date();
    this.currentAction.lastUpdate = now;
    this.currentProcess.actions.push(this.currentAction);

    this.triggersService.getPlugin(this.dest.name).subscribe((plugin) => {
      this.triggersService.getMethods(this.dest.name).subscribe((methods) => {
        plugin.methods = methods;
        this.currentAction.server = plugin;
        console.log(this.currentAction);

      })
    })

    this.editingAction = true;
  }

  onChangeMethod(methodName) {
    this.currentAction.method = _.find(this.currentAction.server.methods, (m: any) => {
      return m.name === methodName;
    });
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

  editAction(action: any, index: number) {
    this.currentAction = action;
    this.editingAction = true;
  }

  editProcess() {
    this.editingAction = false;
  }

  onEditActionClick() {
    this.editingAction = true;
  }

  onDeleteActionClick(actionIdx) {
    this.currentProcess.actions.splice(actionIdx, 1);
  }

  moveActionUp(actionIndex) {
    let prevAction = this.currentProcess.actions[actionIndex - 1];
    this.currentProcess.actions[actionIndex - 1] = this.currentProcess.actions[actionIndex];
    this.currentProcess.actions[actionIndex] = prevAction;
  }

  moveActionDown(actionIndex) {
    let nextAction = this.currentProcess.actions[actionIndex + 1];
    this.currentProcess.actions[actionIndex + 1] = this.currentProcess.actions[actionIndex];
    this.currentProcess.actions[actionIndex] = nextAction;
  }

  onDeleteProcess() {
    if (this.link.processes.length == 1) {
      alert('Can\'t remove single process');
    } else {

      // @TODO fix this
      //this.link.processes.splice(processIndex, 1);
    }
  }

  onSaveClick() {
    this.closeWindow();
  }

  deleteAction() {

  }

}
