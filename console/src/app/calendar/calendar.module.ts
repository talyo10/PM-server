import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModalModule } from 'ngx-bootstrap/modal';
import { CalendarModule as AngularCalendarModule } from 'angular-calendar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { CronJobsModule } from 'ngx-cron-jobs';

import { AddJobComponent } from './add-job/add-job.component';
import { CalendarComponent } from './calendar/calendar.component';
import { CalendarContainerComponent } from './calendar-container/calendar-container.component';
import { CrontabComponent } from './add-job/crontab/crontab.component';


@NgModule({
  declarations: [
    AddJobComponent,
    CalendarComponent,
    CalendarContainerComponent,
    CrontabComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    // angular-calendar
    AngularCalendarModule.forRoot(),
    // ngx-bootstrap
    BsDatepickerModule.forRoot(), // only needed in this module, so using for root
    TimepickerModule.forRoot(), // only needed in this module, so using for root
    ModalModule,

    // ngx-cron-jobs
    CronJobsModule
  ],
  exports: [
    CalendarContainerComponent
  ],
  entryComponents: [CrontabComponent]
})
export class CalendarModule {
}
