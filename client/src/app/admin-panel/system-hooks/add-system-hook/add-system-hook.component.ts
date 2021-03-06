import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import { FileUploader, ParsedResponseHeaders } from 'ng2-file-upload/ng2-file-upload';
import { ConstsService } from '../../../shared/services/consts.service';

import * as _ from 'lodash';

@Component({
  selector: 'modal-content',
  templateUrl: './add-system-hook.component.html',
  styleUrls: ['./add-system-hook.component.css']
})
export class AddSystemHookComponentWindow {
  error: string;
  dedicateAgents: any[];
  uploader: FileUploader;
  hasBaseDropZoneOver: boolean = false;
  hasAnotherDropZoneOver: boolean = false;

  constructor(public dialog: NgbActiveModal, public modalService: NgbModal, private constsService: ConstsService) {
    this.dedicateAgents = [];
    this.error = '';
    this.uploader = new FileUploader({ url: this.constsService.getServerUrl() + 'addSystemHooks' });
    this.uploader.onCompleteAll = this.closeAfterComplete(this);
  }

  fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  fileOverAnother(e: any): void {
    this.hasAnotherDropZoneOver = e;
  }

  closeAfterComplete(currentWindow: AddSystemHookComponentWindow) {
    return () => {
      currentWindow.closeWindow();
    };
  }

  closeWindow() {
    this.dialog.close();
  }

}
