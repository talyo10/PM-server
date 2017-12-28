import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddJobComponent } from './add-job/add-job.component';
import { CalendarComponent } from './calendar/calendar.component';
import { CalendarContainerComponent } from './calendar-container/calendar-container.component';
import { CalendarModule as AngularCalendarModule } from 'angular-calendar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// calendar
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';


@NgModule({
  declarations: [
    AddJobComponent,
    CalendarComponent,
    CalendarContainerComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    // angular-calendar
    AngularCalendarModule.forRoot(),
    // ngx-bootstrap
    BsDatepickerModule.forRoot(), // only needed in this module, so using for root
    TimepickerModule.forRoot() // only needed in this module, so using for root
  ],
  exports: [
    CalendarContainerComponent
  ]
})
export class CalendarModule {
}
