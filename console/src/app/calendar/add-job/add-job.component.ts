import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { BsModalService, BsModalRef } from 'ngx-bootstrap';

import { ProjectsService } from '../../projects/projects.service';
import { Project } from '../../projects/models/project.model';
import { CalendarService } from '../calendar.service';
import { CrontabComponent } from './crontab/crontab.component';

@Component({
  selector: 'app-add-job',
  templateUrl: './add-job.component.html',
  styleUrls: ['./add-job.component.scss']
})
export class AddJobComponent implements OnInit {
  projects: [Project];
  selectedProject: Project;
  projectsReq: any;
  form: FormGroup;


  constructor(private calendarService: CalendarService, private projectsService: ProjectsService, private modalService: BsModalService) {
  }

  ngOnInit() {
    this.projectsReq = this.projectsService.list().subscribe(projects => {
      this.projects = projects;
    });
    this.form = this.initForm();
  }

  onSelectProject() {
    let projectId = this.form.controls.project.value;
    this.projectsService.detail(projectId).subscribe(project => {
      this.selectedProject = project;
    });

  }

  initForm(): FormGroup {
    return new FormGroup({
      project: new FormControl(null, Validators.required),
      map: new FormControl(null, Validators.required),
      type: new FormControl('once', Validators.required),
      date: new FormControl(null),
      time: new FormControl(null),
      cron: new FormControl(null)
    });
  }

  onSubmit(form) {
    const time = form.time;
    const date = form.date;
    if (time && date) {
      const datetime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), time.getSeconds());
      form.datetime = datetime;
    }

    this.calendarService.create(form.map, form).subscribe(job => {
      this.calendarService.setNewJob(job);
    });
  }

  openCrontab() {
    let modal: BsModalRef;
    modal = this.modalService.show(CrontabComponent);
    modal.content.cron = this.form.controls.cron.value;
    modal.content.result.subscribe(cron => {
      this.form.controls.cron.setValue(cron);
    });
  }

}
