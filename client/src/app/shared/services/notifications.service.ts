import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

declare const io: any;

@Injectable()
export class NotificationsService {

  socket: any;
  serverUrl: string = environment.serverUrl;

  private toast: Subject<any> = new Subject<any>();



  constructor() {
    this.socket = io.sails.connect(this.serverUrl);
    this.socket.on('notification', (message) => {
      this.toast.next(message);
    });
  }



  getNotification() {
    return this.toast.asObservable();
  }

}
