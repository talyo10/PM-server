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
  
  
  @Input() trigger: any;
  types: any[] = [];
  projects: any[] = [];
  selectedProject: any;
  selectedMap: any;
  projectMaps: any[];
  mapsReq: any;
  projectsReq: any;
  title: string;
  update: boolean;

  constructor(public dialog: NgbActiveModal, public modalService: NgbModal, private constsService: ConstsService,
              private authService: AuthenticationService, private projectService: ProjectService, private triggerService: TriggerService) {
    this.projects = [];
    this.types = this.triggerService.getTypes();
  }

  ngOnInit() {
    this.projectsReq = this.projectService.getJstreeProjectsByUser(this.authService.getCurrentUser().id).subscribe((projects) => {
        this.projects = projects;
      },
      (error) => {
        console.log(error);
    });

    console.log(">>", this.trigger);

    if (this.trigger) {
      this.update = true;
      this.title = "Edit trigger";
      this.selectedProject = this.trigger.project;
      let typeIndex = _.findIndex(this.types, (type) => {
        return type.viewName === this.trigger.type
      });
      this.trigger.type = this.types[typeIndex];
      this.trigger.type.params = _.toArray(this.trigger.params);
      if (this.selectedProject) {
        this.onSelectProject().then(() => {
          let mapIndex = _.findIndex(this.projectMaps, (map) => {
            return map.id === this.trigger.map.id
          })
          this.selectedMap = this.projectMaps[mapIndex];
        });
      }
      
    } else {
      this.update = false;
      this.trigger = "Add Trigger";
      this.trigger = {
        project: {
          maps: []
        },
        type: {
          params: []
        }
      };
    }
    console.log("^^", this.selectedMap);
  }

  ngOnDestroy() {
    if (this.mapsReq) {
      this.mapsReq.unsubscribe();
    }
    this.projectsReq.unsubscribe()
  }

  onSelectProject() {
    return new Promise((res, rej) => {
      this.selectedMap = null;
      this.mapsReq = this.projectService.getProjectMaps(this.selectedProject.id).subscribe((maps) => {
        this.projectMaps = maps;
        res();
      })
    })
    // this.selectedMap = null;
    
  }

  saveTrigger(trigger) {
    console.log(trigger);
    trigger.params = {};
    
    for (let i = 0; i < trigger.type.params.length; i++) {
      let param = trigger.type.params[i];
      trigger.params[param.name] = param;
    }
    trigger.type = trigger.type.viewName;
    trigger.map = this.selectedMap? this.selectedMap.id: null;
    trigger.project = this.selectedProject;
    console.log(trigger);
    if (this.update) {
      this.triggerService.update(trigger).subscribe();
    } else {
      this.triggerService.add(trigger).subscribe();
    }
    trigger.map = {name: this.selectedMap.name}
    this.dialog.close(trigger);
    
  }

  closeWindow() {
    this.dialog.close();
  }

}
