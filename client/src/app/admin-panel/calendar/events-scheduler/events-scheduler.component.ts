import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  TemplateRef,
  Input,
  OnInit,
  SimpleChanges,
  OnChanges,
  EventEmitter,
  Output,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours
} from 'date-fns';
import { Subject } from 'rxjs/Subject';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent
} from 'angular-calendar';

import * as _ from 'lodash';

const colors: any = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3'
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF'
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA'
  }
};



@Component({
  selector: 'app-events-scheduler',
  templateUrl: './events-scheduler.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./events-scheduler.component.css'],
  providers: []
})
export class EventsSchedulerComponent implements OnInit {

  view: string = 'month';
  viewDate: Date = new Date();
  refresh: Subject<any> = new Subject();
  activeDayIsOpen: boolean = true;
  private interval: any;


  @Input() events : CalendarEvent[];
  @Input() changes: Boolean;

  modalData: {
    action: string,
    event: CalendarEvent
  };

  constructor() {

  }

  ngOnInit() {

    this.interval = setInterval(() => {
     //this.refresh.next();
    }, 2000);

  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  ngAfterViewInit() {
    this.refresh.next();
  }

  dayClicked({date, events}: {date: Date, events: CalendarEvent[]}): void {
    this.refresh.next();
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
      }
    }
  }

  eventTimesChanged({event, newStart, newEnd}: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.refresh.next();
  }

  addEvent(): void {
    this.events.push({
      title: 'New event',
      start: startOfDay(new Date()),
      end: endOfDay(new Date()),
      color: colors.red,
      draggable: true,
      resizable: {
        beforeStart: true,
        afterEnd: true
      }
    });
    this.refresh.next();
  }

  ngOnChanges(changes : SimpleChanges) : void {
    this.refresh.next();
  }

}
