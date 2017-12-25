import { Component, OnInit } from '@angular/core';

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
import { CalendarEvent } from "angular-calendar";

const colors: any = {
  // TODO: add color pallet
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
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  viewDate = new Date();
  events: any;
  activeDayIsOpen: boolean = false;

  constructor() {
  }

  ngOnInit() {
    this.events = [/* mock event data */
      {
        start: subDays(startOfDay(new Date()), 1),
        end: addDays(new Date(), 1),
        title: 'A 3 day event',
        color: colors.red,
        // actions: this.actions
      },
      {
        start: startOfDay(new Date()),
        title: 'An event with no end date',
        color: colors.yellow,
        // actions: this.actions
      },
      {
        start: subDays(endOfMonth(new Date()), 3),
        end: addDays(endOfMonth(new Date()), 3),
        title: 'A long event that spans 2 months',
        color: colors.blue
      },
      {
        start: addHours(startOfDay(new Date()), 2),
        end: new Date(),
        title: 'A draggable and resizable event',
        color: colors.yellow,
        // actions: this.actions,
        resizable: {
          beforeStart: true,
          afterEnd: true
        },
        draggable: true
      }
    ];
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) { // will not open details if it is not a day at current month
      if ((isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) || events.length === 0) {
        // close the panel if it is the selected day or if that day has no events
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
      }
    }
  }
}
