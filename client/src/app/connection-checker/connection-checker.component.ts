import { Component, OnInit } from '@angular/core';
import { ConstsService } from '../shared/services/consts.service';

declare const io: any;

@Component({
  selector: 'pm-connection-checker',
  templateUrl: './connection-checker.component.html',
  styleUrls: ['./connection-checker.component.css']
})
export class ConnectionCheckerComponent implements OnInit {

  public disconnected: boolean = false;
  private socket: any;

  constructor(private constsService: ConstsService) { }

  ngOnInit() {
    try {
      this.socket = io.connect(this.constsService.getServerUrl());

      this.socket.on('connect', () => {
        console.log('Got connection from server.');
      });

      this.socket.on('disconnect', () => {
          this.disconnected = true;
      });
    } catch (ex) {
      this.disconnected = true;
    }
  }

}
