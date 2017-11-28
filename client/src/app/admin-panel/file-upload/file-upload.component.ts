import { Component, Input, ViewEncapsulation } from '@angular/core';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { FileUploader, ParsedResponseHeaders } from 'ng2-file-upload/ng2-file-upload';
import { ConstsService } from '../../shared/services/consts.service';

import * as _ from 'lodash';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  error: string;
  uploading: boolean = false;
  dedicateAgents: any[];
  uploader: FileUploader;
  hasBaseDropZoneOver: boolean = false;
  hasAnotherDropZoneOver: boolean = false;

  constructor(public dialog: NgbActiveModal, public modalService: NgbModal, private constsService: ConstsService) {
    this.dedicateAgents = [];
    this.error = '';

    this.uploader = new FileUploader({ url: this.constsService.getServerUrl() + 'plugins/create' });
    this.uploader.onCompleteAll = this.closeAfterComplete(this);
    this.uploader.onSuccessItem = (res) => { this.uploading = false }
  }

  fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  fileOverAnother(e: any): void {
    this.hasAnotherDropZoneOver = e;
  }

  closeAfterComplete(agentWindow: FileUploadComponent) {
    return () => {
      agentWindow.closeWindow();
    };
  }

  closeWindow() {
    this.dialog.close();
  }

  uploadFile() {
    this.uploading = true;
    this.uploader.uploadAll();
  }

}
