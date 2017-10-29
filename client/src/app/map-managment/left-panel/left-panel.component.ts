import { Component, OnInit, Input, OnChanges, SimpleChange, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';

import { MapService } from '../../shared/services/map.service'
import { ProjectService } from '../../shared/services/project.service'

@Component({
  selector: 'app-left-panel',
  templateUrl: './left-panel.component.html',
  styleUrls: ['../../shared/css/map-bar.css', './left-panel.component.css']
})
export class LeftPanelComponent implements OnInit {

  @Input() graphProps: any;
  public innerPaper: any = null;
  public innerGraph: any = null;
  public designerOps: any = null;
  public sideBarState: boolean = true;
  public currentPanel: number;
  public leftPanelTitle: string;
  public searchtext: string = null;
  public panelsTitles: any;
  @ViewChild('agents') agentsElement: ElementRef;

  constructor(private mapService: MapService, private projectService: ProjectService) {
    this.panelsTitles = [
      'PROJECTS',
      'Plugins'
    ];
  }


  ngOnInit() {
    this.selectPanel(0);
    this.agentsElement.nativeElement.style.maxHeight = (this.agentsElement.nativeElement.clientHeight - 72) + 'px';
  }

  selectPanel(panelId: number) {
    this.searchtext = "";
    this.currentPanel = panelId;
    this.leftPanelTitle = this.panelsTitles[this.currentPanel];
  }

  setSideBarState(state: boolean) {
    this.sideBarState = state;
  }

  updateToolBox($event: any) {
    this.innerPaper = $event.paper;
    this.innerGraph = $event.graph;
    this.designerOps = $event.designerOps;
  }

  ngOnChanges(changes: { [propertyName: string]: SimpleChange }): void {
    if (changes['graphProps'] && changes['graphProps'].currentValue != null && this.graphProps != null) {
      this.updateToolBox(this.graphProps);
    }
  }


}
