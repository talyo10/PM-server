import { Component, OnDestroy, OnInit } from '@angular/core';
import { ProjectsService } from '../projects.service';
import { Project } from '../models/project.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss']
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {
  project: Project;
  id: string;
  projectReq: any;
  routeReq: any;
  filterTerm: string;

  constructor(private route: ActivatedRoute, private projectsService: ProjectsService) {
  }

  ngOnInit() {
    this.routeReq = this.route.params.subscribe(params => {
      this.id = params['id'];
      this.projectReq = this.projectsService.detail(this.id).subscribe(project => {
        this.project = project;
      });
    });
  }

  ngOnDestroy() {
    this.routeReq.unsubscribe();
    if (this.projectReq) {
      this.projectReq.unsubscribe();
    }
  }

}
