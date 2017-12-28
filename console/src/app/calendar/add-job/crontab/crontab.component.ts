import { Component, OnInit } from '@angular/core';

import { Subject } from 'rxjs/Subject';
import { BsModalRef } from 'ngx-bootstrap';


import { CronJobsConfig } from 'ngx-cron-jobs/src/app/lib/contracts/contracts';


@Component({
  selector: 'app-crontab',
  templateUrl: './crontab.component.html',
  styleUrls: ['./crontab.component.scss']
})
export class CrontabComponent implements OnInit {
  result: Subject<string> = new Subject<string>();
  cronConfig: CronJobsConfig = {
    multiple: false,
    quartz: false,
    bootstrap: true
  };
  cron: string = '';

  constructor(public bsModalRef: BsModalRef) {
  }

  ngOnInit() {

  }

  onConfirm(): void {
    this.result.next(this.cron);
    this.bsModalRef.hide();
  }

  onClose(): void {
    this.bsModalRef.hide();
  }

}
