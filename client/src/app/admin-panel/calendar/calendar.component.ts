import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer,
  ViewChild
} from '@angular/core';

import { JobsService } from '../../shared/services/jobs.service';
import { ProjectService } from '../../shared/services/project.service';
import { AuthenticationService } from '../../shared/services/authentication.service';
import { DatePickerOptions, DateModel } from 'ng2-datepicker';

import * as _ from 'lodash';
import * as $ from 'jquery';

import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours,
  getMinutes,
  getHours,
  addMinutes,
  subHours,
  subMinutes,
  format
} from 'date-fns';

import { Subject } from 'rxjs/Subject';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent
} from 'angular-calendar';

import {NgForm} from "@angular/forms";
import {DatePickerComponent} from "ng2-datepicker/lib-dist/ng2-datepicker.component";

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
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./calendar.component.css'],
  providers: [JobsService, ProjectService]
})
export class CalendarComponent implements OnInit, OnDestroy {

  listener: Function;
  projects: any[];
  job: any;
  event: any;
  calendar: any;
  eventSources: any;
  cronJobs: any;
  errors: any;
  projectMaps: any[] = [];
  selectedProjectModel: any;
  hadChange: Boolean = false;
  hours: number;
  minutes: number;

  cDate: any;
  formattedDate: string;

  date: DateModel;
  options: DatePickerOptions;
  @ViewChild(DatePickerComponent) private datepickercomponent: DatePickerComponent;

  constructor(private jobsService: JobsService,
              private projectService: ProjectService,
              private authenticationService: AuthenticationService,
              public el: ElementRef,
              public renderer: Renderer,
              private ref: ChangeDetectorRef) {

    this.listener = renderer.listenGlobal('document', 'click', (event) => {
      this.datepickercomponent.close();
      ref.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if(this.listener) {
      this.listener();
    }
  }

  ngOnInit() {

    this.options = new DatePickerOptions();

    this.datepickercomponent.el.nativeElement.onclick = (ev: MouseEvent) => {
      ev.stopPropagation();
    };

    let user = this.authenticationService.getCurrentUser();
    this.projectService.getJstreeProjectsByUser(user.id).subscribe((projects) => {
        this.projects = projects;
      },
      (error) => {
        console.log(error);
      });

    this.cDate = new Date();
    this.hours = this.cDate.getHours();
    this.minutes = this.cDate.getMinutes();

    this.job = {
      startAt: this.formatDate(new Date()),
      isCron: false,
      selectedProject: {
        maps: []
      }
    };
    this.event = {};
    this.calendar = {
      calendarDay: new Date(),
      isCellOpen: true,
      calendarView: 'month',
      events: []
    };
    this.eventSources = [];
    this.cronJobs = [];

    this.jobsService.getFutureJobs().subscribe((result) => {
      result.forEach((job) => {
        if (!job.isCron) {
          this.calendar.events.push(this.jobToEvent(job));
        } else {
          this.cronJobs.push(job);
        }
      });
    });


  }



  onAddJob(form: NgForm) {
    const value = form.value;

    if(!this.validateForm(value)) {
      return;
    }
    this.job.Map = value.selectedMap.map;
    this.job.version = this.job.Map.versionIndex;
    this.job.startAt = this.formatDate(value.date);
    this.job.startAt = addHours(this.job.startAt, this.hours);
    this.job.startAt = addMinutes(this.job.startAt, this.minutes);

    this.jobsService.addJob(this.job).subscribe((result) => {
      if (!result.isCron) {
        let job = result;
        this.calendar.events.push(this.jobToEvent(job));
      } else {
        this.cronJobs.push(result);
      }

      this.job = {
        startAt: new Date(),
        isCron: false,
        selectedProject: {
          maps: []
        }
      };
    });

    console.log(value);
  }

  createJob() {
    this.job.version = this.job.Map.versionIndex;
    this.job.startAt = this.formatDate(this.job.startAt);
    this.job.startAt = new Date(this.job.startAt);
    this.job.startAt = addHours(this.job.startAt, getHours(this.cDate));
    this.job.startAt = addMinutes(this.job.startAt, getMinutes(this.cDate));
    this.jobsService.addJob(this.job).subscribe((result) => {
      if (!result.isCron) {
        let job = result;
        this.calendar.events.push(this.jobToEvent(job));
      } else {
        this.cronJobs.push(result);
      }
      this.job = {
        startAt: new Date(),
        isCron: false,
        selectedProject: {
          maps: []
        }
      };

    });
  }

  editJob(event) {
    this.event = event;
    this.job = event.job;
  }

  deleteJob(event) {
    this.calendar.events = this.calendar.events.filter(iEvent => iEvent !== event);
    this.jobsService.deleteJob(event.job.id).subscribe((result) => {
      console.log("job " + event.job.id + " deleted.");
    });
  }

  updateJob() {
    this.jobsService.updateJob(this.job).subscribe((result) => {
      let job = result;
      let event = {
        title: this.job.Map.name,
        type: 'important',
        startsAt: job.startAt,
        draggable: false,
        resizable: false,
        actions: this.actions,
        job: _.cloneDeep(this.job)
      };

      this.calendar.events.splice(this.calendar.events.indexOf(this.event), 1);

      this.calendar.events.push(event);

      this.job = {
        startAt: new Date()
      };
    })
  }

  formatDate(date) {
    this.formattedDate = format(new Date(date.year + "/" + date.month +"/" + date.day), 'YYYY-MM-DD');
    return this.formattedDate;
  }

  addTimeH() {
    this.cDate = new Date(addHours(this.cDate, 1));
    this.hours = getHours(this.cDate);
  }

  decTimeH() {
    this.cDate = new Date(subHours(this.cDate, 1));
    this.hours = getHours(this.cDate);
  }

  addTimeM() {
    let minutesToAdd = this.getMinutesToChange(this.cDate.getMinutes());
    this.cDate = new Date(addMinutes(this.cDate, minutesToAdd));
    this.minutes = getMinutes(this.cDate);
  }

  decTimeM() {
    let minutesToRemove = this.getMinutesToChange(this.cDate.getMinutes(), true);
    this.cDate = new Date(subMinutes(this.cDate, minutesToRemove));
    this.minutes = getMinutes(this.cDate);
  }

  getMinutesToChange(minutes: number, isDec?: boolean): number {
    let gaps = [45 , 30 , 15];
    let ans = 0;
    let factor = 15;

    for(var i = 0; i < gaps.length; i++) {
      if(minutes >= gaps[i]) {
        if(isDec){
          return minutes - gaps[i] + factor;
        }
        return gaps[i] + factor - minutes;
      }
    }

    return factor - minutes;
  }

  actions: CalendarEventAction[] = [ {
      label: '<i class="pmap-27"></i>',
      onClick: ({event}: {event: CalendarEvent}): void => {
        this.deleteJob(event);
      }
    }];

  private jobToEvent(job) {
    return {
      title: job.Map.name,
      type: 'important',
      start: new Date(job.startAt),
      draggable: false,
      resizable: false,
      color: colors.blue,
      actions: this.actions,
      job: job
    };
  }

  private validateForm(value: any) {
    this.errors = {};
    let containErr = false;

    if(!value.date) {
      this.errors.date = true;
      containErr = true;
    }

    return !containErr;
  }
}
