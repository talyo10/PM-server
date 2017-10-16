import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ConstsService } from '../../shared/services/consts.service';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import { MessagePopupComponent } from './message-popup/message-popup.component';
import * as _ from 'lodash';

declare const io: any;


@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {

  @Input() messages: any = [];
  @Output() getUpdatedMessages: EventEmitter<any> = new EventEmitter();

  socket: any;
  private tmpMessages: any[] = [];

  constructor(private constsService: ConstsService, public modalService: NgbModal) { }

  ngOnInit() {
    this.socket = io.sails.connect(this.constsService.getServerUrl());
    this.socket.on('update', (msg) => {
      msg = JSON.parse(msg);
      console.log('got message');
      console.log(msg);
      msg.date = new Date(msg.date);
      msg.time = msg.date.getTime();
      msg.result = 1;
      this.tmpMessages.push(msg);
      this.messages = _(_.sortBy(this.tmpMessages, ['time'])).reverse().value();
      this.getUpdatedMessages.emit(this.messages);
    });

    this.socket.on('serverError', (msg) => {
      msg = JSON.parse(msg);
      console.log('got message');
      console.log(msg);
      msg.date = new Date(msg.date);
      msg.time = msg.date.getTime();
      msg.result = -1;
      this.tmpMessages.push(msg);
      this.messages = _(_.sortBy(this.tmpMessages, ['time'])).reverse().value();
      this.getUpdatedMessages.emit(this.messages);
    });
  }

  openMessage(message) {
    const pmodal = this
      .modalService
      .open(MessagePopupComponent);
    pmodal.componentInstance.message = message.msg;
  }

  clearMessages() {
    this.tmpMessages.splice(0, this.tmpMessages.length);
    this.messages.splice(0, this.messages.length);
  }

}
