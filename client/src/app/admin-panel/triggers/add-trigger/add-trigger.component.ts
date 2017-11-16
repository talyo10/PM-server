import { Component, OnDestroy, ViewEncapsulation, OnInit, Input } from '@angular/core';

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
export class AddTriggerComponentWindow implements OnInit, OnDestroy {
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
  selectedProject: any;
  selectedMap: any;
  projectMaps: any[];
  @Input()triggersList: any[];
  mapsReq: any;
  projectsReq: any;

  constructor(public dialog: NgbActiveModal, public modalService: NgbModal, private constsService: ConstsService,
              private authService: AuthenticationService, private projectService: ProjectService, private triggerService: TriggerService) {
    this.projects = [];
    this.types = this.triggerService.getTypes();
  }

  ngOnInit() {
    this.projectsReq = this.projectService.getJstreeProjectsByUser(this.authService.getCurrentUser().id).subscribe((projects) => {
        this.projects = projects;
        console.log(projects);
      },
      (error) => {
        console.log(error);
    });
  }

  ngOnDestroy() {
    if (this.mapsReq) {
      this.mapsReq.unsubscribe();
    }
    this.projectsReq.unsubscribe()
  }

  onSelectProject() {
    this.selectedMap = null;
    this.mapsReq = this.projectService.getProjectMaps(this.selectedProject.id).subscribe((maps) => {
      this.projectMaps = maps;
    })
  }

  saveTrigger(trigger) {
    console.log(this.selectedMap);
    trigger.params = {};
    
    for (let i = 0; i < trigger.type.params.length; i++) {
      let param = trigger.type.params[i];
      trigger.params[param.name] = param;
    }
    trigger.type = trigger.type.viewName;
    trigger.map = this.selectedMap.id;
    trigger.project = this.selectedProject;

    this.triggerService.add(trigger).subscribe((res) => {
      trigger.map = {name: this.selectedMap.name}
      this.triggersList.push(trigger);
    });
    this.dialog.close();
  }

  closeWindow() {
    this.dialog.close();
  }

}
