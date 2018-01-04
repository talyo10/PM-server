import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ModalModule } from 'ngx-bootstrap/modal';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { CalendarModule as AngularCalendarModule } from 'angular-calendar';
import { CronJobsModule } from 'ngx-cron-jobs';
import { CalendarModule as PrimeCalendarModule } from 'primeng/primeng';

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
    ModalModule,
    PopoverModule.forRoot(),
    // ngx-cron-jobs
    CronJobsModule,
    // primeng
    PrimeCalendarModule
  ],
  exports: [
    CalendarContainerComponent
  ],
  entryComponents: [CrontabComponent]
})
export class CalendarModule {
}
