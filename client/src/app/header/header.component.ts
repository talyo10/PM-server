import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { ContextMenuService, ContextMenuComponent } from 'ngx-contextmenu';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthenticationService } from '../shared/services/authentication.service';
import { ConfirmPopupComponent } from '../shared/popups/confirm-popup/confirm-popup.component';
import { ConfirmPopup } from "../shared/interfaces/iconfirm-popup"



@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  public user: any = {};
  @ViewChild(ContextMenuComponent) public contextMenu: ContextMenuComponent;

  constructor(private authService: AuthenticationService, private contextMenuService: ContextMenuService, public modalService: NgbModal, private router: Router) { }

  openContextMenu($event) {
    console.log($event);
    this.contextMenuService.show.next({
      contextMenu: this.contextMenu,
      event: $event,
      item: {},
    });
  }

  logout() {
    const pmodal = this.modalService.open(ConfirmPopupComponent);
    let popupFields: ConfirmPopup = new ConfirmPopup();
    popupFields.title = "Logout";
    popupFields.message = "Are you sure you want to logout?";
    popupFields.action = "Logout";
    
    pmodal.componentInstance.popupFields = popupFields;

    pmodal.result
      .then((r) => {
        if (r) {
          this.authService.logout()
            .subscribe((res) => {
              this.router.navigate(['/login']);
            });
        }
      })
      .catch((error) => console.log("Error logging out!"))
    
  }

}
