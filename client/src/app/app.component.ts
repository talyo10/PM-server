import { Component, ViewContainerRef, OnInit, ViewEncapsulation } from '@angular/core';
import { Http } from '@angular/http';
import { Router } from '@angular/router';

import * as  _ from 'lodash';
import { Subscription } from 'rxjs/Subscription';
import { ToastrService } from 'ngx-toastr';

import { AuthenticationService } from './shared/services/authentication.service';
import { ConstsService } from './shared/services/consts.service';
import { NotificationsService } from './shared/services/notifications.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app works!';
  messageSubscription: Subscription;

  constructor(private http: Http, private authenticationService: AuthenticationService, private router: Router, private constsService: ConstsService, private notificationsService: NotificationsService, private toastrService: ToastrService) {  }
  

  ngOnInit() {
    this.messageSubscription = this.notificationsService.getNotification().subscribe((message) => {
      this.showNotification(JSON.parse(message));
    })
  }

  showNotification(notification) {
    if (notification.type === "success")
      this.toastrService.success(notification.msg, null, { positionClass: 'toast-bottom-right' });
    else if (notification.type === "error")
      this.toastrService.error(notification.msg, null, { positionClass: 'toast-bottom-right' });
    else if (notification.type === "warning")
      this.toastrService.warning(notification.msg, null, { positionClass: 'toast-bottom-right' });
    else
      this.toastrService.info(notification.msg, null, { positionClass: 'toast-bottom-right' });
  }
}

