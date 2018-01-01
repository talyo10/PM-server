import { Component, OnInit } from '@angular/core';
import { ProjectsService } from '../projects.service';
import { Project } from '../models/project.model';

@Component({
  selector: 'app-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss']
})
export class ProjectsListComponent implements OnInit {
  projects: [Project];
  projectsReq: any;
  filterTerm: string;

  constructor(private projectsService: ProjectsService) {
  }

  ngOnInit() {
    this.projectsReq = this.projectsService.list().subscribe(projects => {
      this.projects = projects;
      this.projects.map(project => Object.assign({}, project, { expanded: false }));
    });
  }

}
