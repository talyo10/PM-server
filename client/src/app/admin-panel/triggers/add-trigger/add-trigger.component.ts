import { Component, ViewEncapsulation, OnInit, Input } from '@angular/core';

import { ConstsService } from '../../../shared/services/consts.service';
import { AuthenticationService } from '../../../shared/services/authentication.service';
import { ProjectService } from '../../../shared/services/project.service';
import { TriggerService } from '../../../shared/services/trigger.service';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import * as _ from 'lodash';

@Component({
  selector: 'modal-content',
  templateUrl: './add-trigger.component.html',
  styleUrls: ['./add-trigger.component.css'],
  providers: [TriggerService]
})
export class AddTriggerComponentWindow {
  trigger: any = {
    project: {
      maps: []
    },
    type: {
      params: []
    }
  };
  types: any[] = [];
  projects: any[] = [];
  @Input()triggersList: any[];

  constructor(public dialog: NgbActiveModal, public modalService: NgbModal, private constsService: ConstsService,
              private authService: AuthenticationService, private projectService: ProjectService, private triggerService: TriggerService) {
    this.projects = [];
    this.types = this.triggerService.getTypes();
  }

  ngOnInit() {
    this.projectService.getJstreeProjectsByUser(this.authService.getCurrentUser().id).subscribe((projects) => {
        this.projects = projects;
      },
      (error) => {
        console.log(error);
    });
  }

  saveTrigger(trigger) {
    trigger.params = {};
    for (let i = 0; i < trigger.type.params.length; i++) {
      let param = trigger.type.params[i];
      trigger.params[param.name] = param;
    }
    trigger.type = trigger.type.viewName;

    this.triggerService.add(trigger).subscribe((res) => {
      this.triggersList.push(trigger);
    });
    this.dialog.close();
  }

  closeWindow() {
    this.dialog.close();
  }

}
