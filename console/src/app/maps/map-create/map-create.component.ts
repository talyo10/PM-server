import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { MapsService } from "../maps.service";
import { Map } from "../models/map.model";
import { Project } from "../../projects/models/project.model";
import { ProjectsService } from "../../projects/projects.service";
import { DefaultKeyValueDiffer } from "@angular/core/src/change_detection/differs/default_keyvalue_differ";

@Component({
  selector: 'app-map-create',
  templateUrl: './map-create.component.html',
  styleUrls: ['./map-create.component.scss']
})
export class MapCreateComponent implements OnInit, OnDestroy {
  mapForm: FormGroup;
  projectsReq: any;
  projects: [Project];
  paramsReq: any;
  constructor(private mapsService: MapsService,private projectsService: ProjectsService, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.paramsReq = this.route.queryParams.subscribe(params => {
      if (params) {
        this.initMapForm(params.project);
      } else {
        this.initMapForm();

      }
      console.log(params);
    });
    this.projectsReq = this.projectsService.list().subscribe(projects => {
      this.projects = projects;
    });
  }

  ngOnDestroy() {
    this.projectsReq.unsubscribe();
    this.paramsReq.unsubscribe();
  }

  initMapForm(project?) {
    this.mapForm = new FormGroup({
      project: new FormControl(project, Validators.required),
      name: new FormControl(null, Validators.required),
      description: new FormControl(),
      licence: new FormControl()
    });
  }

  onSubmitForm(value) {
    console.log(value);
    this.mapsService.createMap(value).subscribe(map => {
      console.log(map);
      this.router.navigate(["/maps", map.id])
    });
  }

}
