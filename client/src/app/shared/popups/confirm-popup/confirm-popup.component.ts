import { Component, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ConfirmPopupModel } from '../../interfaces/iconfirm-popup'

@Component({
  selector: 'app-confirm-popup',
  templateUrl: './confirm-popup.component.html',
  styleUrls: ['./confirm-popup.component.css']
})
export class ConfirmPopupComponent {
  @Input() popupFields: ConfirmPopupModel;
  // @Input() title: string;
  // @Input() message: string;
  // @Input() object: any = null; // an object that can be attached to the popup.
  // @Input() action: string = "Yes"; // the text on the button. if it is not set it would be set to "yes"
  // @Input() abort: string = "Cancel"; // the text on the button. if it is not set it would be set to "yes"

  constructor(public activeModal : NgbActiveModal, public modalService : NgbModal) { }

  closeWindow(value: boolean) {
    this.activeModal.close(value);
  }
}
