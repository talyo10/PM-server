import { Component, Input } from '@angular/core';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {ProjectService} from "../../../../../shared/services/project.service";

import * as _ from 'lodash';

/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
  selector: 'modal-content',
  styleUrls: ['new-project.component.css'],
  templateUrl: 'new-project.component.html',
  providers: [ProjectService]

})
export class NewProjectComponentWindow {
  @Input() project: any;

  constructor(private projectService: ProjectService,
              public modal: NgbActiveModal) {

    this.project = {
      name: '',
    };
  }

  closeWindow() {
    console.log('closing windows!');
    this.modal.close();
  }

  create() {
    this.projectService.createProject(this.project.name).subscribe((project) => {
      this.modal.close(project);
    });

  };

}
