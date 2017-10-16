import { Component, OnInit, OnDestroy } from '@angular/core';
import { SystemHooksService } from '../../shared/services/system-hooks.service';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import { AddSystemHookComponentWindow } from './add-system-hook/add-system-hook.component';

import * as _ from 'lodash';

@Component({
  selector: 'app-system-hooks',
  templateUrl: './system-hooks.component.html',
  styleUrls: ['./system-hooks.component.css'],
  providers: [SystemHooksService]
})
export class SystemHooksComponent implements OnInit, OnDestroy {

  systemHooks: any[];
  interval: any;

  constructor(public modalService: NgbModal, private systemHooksService: SystemHooksService) {
    this.systemHooks = [];
    this.interval = null;

    this.refreshHooks = this.refreshHooks.bind(this);
   }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  ngOnInit() {
    if (!this.interval) {
      this.interval = setInterval(this.refreshHooks(), 5000);
    }
    this.systemHooksService.getHooks().subscribe((hooks: any[]) => {
      this.systemHooks = hooks;
    });
  }

  refreshHooks() {
    return () => {
      this.ngOnInit();
    };
  }

  addSystemHook() {
    const modalRef = this
        .modalService
        .open(AddSystemHookComponentWindow);
  }

  deleteSystemHook(index) {
    this.systemHooksService.remove(this.systemHooks[index].id).subscribe( res => {
      console.log('deleted system hook');
    });
    this.systemHooks.splice(index, 1);
  }

}
