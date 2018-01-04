import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ProjectsService } from '../projects.service';
import { Project } from '../models/project.model';
import { Map } from '../../maps/models/map.model';

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
  archiveReq: any;
  filterTerm: string;
  featuredMaps: Map[];

  constructor(private route: ActivatedRoute, private projectsService: ProjectsService) {
  }

  ngOnInit() {
    this.routeReq = this.route.params.subscribe(params => {
      this.id = params['id'];
      this.projectReq = this.projectsService.detail(this.id).subscribe(project => {
        this.project = project;
        this.featureMaps(project.maps);
      });
    });
  }

  ngOnDestroy() {
    this.routeReq.unsubscribe();
    if (this.projectReq) {
      this.projectReq.unsubscribe();
    }
    if (this.archiveReq) {
      this.archiveReq.unsubscribe();
    }
  }

  archiveProject() {
    if (confirm('Sure you want to archive this project?').valueOf()) {
      this.archiveReq = this.projectsService.archive(this.id).subscribe(() => this.project.archived = true);
    }
  }

  featureMaps(maps) {
    maps = maps.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
    this.featuredMaps = maps.slice(0, 4);
  }

}
