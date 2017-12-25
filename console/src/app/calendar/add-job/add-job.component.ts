import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ProjectsService } from "../../projects/projects.service";
import { MapsService } from "../../maps/maps.service";
import { Project } from "../../projects/models/project.model";

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

  constructor(private mapsService: MapsService, private projectsService: ProjectsService) {
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
      project: new FormControl(),
      map: new FormControl(),
      type: new FormControl(),
      date: new FormControl(),
      time: new FormControl()
    });
  }

  onSubmit(form) {
    console.log(form);
  }

}
