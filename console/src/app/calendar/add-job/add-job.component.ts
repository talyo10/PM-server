import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ProjectsService } from '../../projects/projects.service';
import { Project } from '../../projects/models/project.model';
import { CalendarService } from '../calendar.service';

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

  constructor(private calendarService: CalendarService, private projectsService: ProjectsService) {
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
      date: new FormControl(null, Validators.required),
      time: new FormControl(null, Validators.required)
    });
  }

  onSubmit(form) {
    console.log(form);
    const time = form.time;
    console.log(time);
    const date = form.date;
    const datetime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), time.getSeconds());

    form.datetime = datetime;
      this.calendarService.create(form.map, form).subscribe(job => {
        console.log(job);
      });
  }

}
