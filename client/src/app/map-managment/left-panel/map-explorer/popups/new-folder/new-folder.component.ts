import { Component, Input } from '@angular/core';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {ProjectService} from "../../../../../shared/services/project.service";

import * as _ from 'lodash';

/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
  selector: 'modal-content',
  styleUrls: ['new-folder.component.css'],
  templateUrl: 'new-folder.component.html',
})
export class NewFolderComponentWindow {
  @Input() folder: any;
  @Input() parentId: any;
  @Input() projectId: any;

  constructor(private projectService: ProjectService,
              public modal: NgbActiveModal) {
    this.folder = {
      name: '',
    };
  }

  closeWindow() {
    console.log('closing windows!');
    this.modal.close();
  }

  create() {
    this.projectService.addFolder(this.projectId, this.parentId, this.folder.name).subscribe((folder) => {
      this.modal.close(folder);
    });
  };

}
