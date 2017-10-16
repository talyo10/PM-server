import { Component, Input } from '@angular/core';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import { FileUploader } from 'ng2-file-upload/ng2-file-upload';
import { ConstsService } from '../../../shared/services/consts.service';

import * as _ from 'lodash';

@Component({
  selector: 'modal-content',
  templateUrl: './message-popup.component.html',
  styleUrls: ['./message-popup.component.css']
})
export class MessagePopupComponent {
  @Input() message: string;

  constructor(public dialog: NgbActiveModal, private constsService: ConstsService) {
  }

  closeWindow() {
    this.dialog.close();
  }

}
