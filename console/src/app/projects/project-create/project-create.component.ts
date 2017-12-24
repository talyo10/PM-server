import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";

import { ProjectsService } from "../projects.service";
import { Project } from "../models/project.model";

@Component({
  selector: 'app-project-create',
  templateUrl: './project-create.component.html',
  styleUrls: ['./project-create.component.scss']
})
export class ProjectCreateComponent implements OnInit {
  projectForm: FormGroup;
  constructor(private projectsService: ProjectsService, private router: Router) { }

  ngOnInit() {
    this.initProjectForm();
  }

  initProjectForm() {
    this.projectForm = new FormGroup({
      name: new FormControl(null, Validators.required),
      description: new FormControl(),
    });
  }

  onSubmitForm(form: Project) {
    this.projectsService.create(form).subscribe(project => {
      this.router.navigate(["/projects", project.id])
    });
  }

}
