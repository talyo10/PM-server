import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';
import { ResizeEvent } from 'angular2-resizable';

import { ProjectService } from '../shared/services/project.service';
import { MapService } from '../shared/services/map.service';
import { AuthenticationService } from '../shared/services/authentication.service';
import { CombinedPopupComponent } from './map-editor/map-designer/combined-popup/combined-popup.component';

import * as _ from 'lodash';
declare var jQuery:any;

@Component({
  selector: 'app-map-managment',
  templateUrl: './map-managment.component.html',
  styleUrls: ['./map-managment.component.css'],
  providers: [ProjectService]
})
export class MapManagmentComponent implements OnInit, OnDestroy, AfterViewInit{

  @ViewChild('messagesEl') messagesEl: ElementRef;
  @ViewChild('mapControl') mapControl: ElementRef;
  @ViewChild('mapMain') mapMain: ElementRef;
  @ViewChild('leftPanel') leftPanel: ElementRef;
  @ViewChild('mapEditor') mapEditor: ElementRef;
  @ViewChild('rightPanel') rightPanel: ElementRef;

  public designerOps: any = null;
  public sideBarState: boolean = true;
  public projectsTree: any = [];
  public currentMap: any = {};
  public messages: any = [];
  public mapLoaded: boolean = false;
  public leftPanelState: any;
  private maxOpenMaps: number = 4;
  private minLeftPanelWidth: number = 0;
  private minRightPanelWidh: number = 0;
  private minMessageHeight: number = 0;
  private initialEditorWidth: number = 0;

  private paramsReq: any;
  id: string;
  currentMapSubscription: Subscription;
  projectTreeSubscription: Subscription;

  constructor(private projectService: ProjectService, private authenticationService: AuthenticationService, public mapService: MapService, private m_elementRef: ElementRef, private router: Router, private route: ActivatedRoute) {
    this.projectTreeSubscription = this.projectService.getCurrentProjectTree()
      .subscribe(
        (tree) => {
          this.projectsTree = tree;
        }
      )
  }

  ngOnInit() {
    // getting the id from the url
    this.paramsReq = this.route.params
      .subscribe((p) => this.id = p.id);

    this.currentMapSubscription = this.mapService.getCurrentMapObservable()
    .subscribe(
      (map) => {
        this.mapLoaded = true;
        this.currentMap = map;
        
        // router.navigate([map.id], {relativeTo: this.route})
      }
    );

    let user = this.authenticationService.getCurrentUser();
    if (!user || !user.id) {
      return;
    }

    if (this.mapService.openMaps.length === 0) {
      this.mapLoaded = false;
    } else {
      this.currentMap = _.find(this.mapService.openMaps, (mp: any) => {
        return mp.active;
      })
      this.mapLoaded = true;
    }

    this.resizeMessages({
      edges: {
        top: -1
      },
      rectangle: {
        bottom: 978.296875,
        height:143.296875,
        left:56,
        right:919,
        top:835,
        width:863
      }
    })

  }

  ngOnDestroy() {
    this.paramsReq.unsubscribe();
    this.currentMapSubscription.unsubscribe();
    this.projectTreeSubscription.unsubscribe();
  }

  ngAfterViewInit() {
    let leftPanel = jQuery(this.leftPanel.nativeElement);
    let rightPanel = jQuery(this.rightPanel.nativeElement);
    let messagesEl = jQuery(this.messagesEl.nativeElement);
    let mapControl = jQuery(this.mapControl.nativeElement);

    this.minRightPanelWidh = rightPanel.width();
    this.minLeftPanelWidth = leftPanel.width();
    this.minMessageHeight = messagesEl.height();
    this.initialEditorWidth = mapControl.width();
  }

  setSideBarState(state: boolean) {
    this.sideBarState = state;
  }

  updateToolBox($event: any) {
    this.designerOps = $event;
  }

  mapExecuted($event) {
    this.messages.unshift(JSON.parse($event));
  }

  changeMap($event) {
    this.currentMap.active = null;
    this.mapService.selectMap($event);
    this.currentMap.active = true;
  }

  closeMap(ind) {
    let mapIndex = _.findIndex(this.mapService.openMaps, (map) => { return map.name === this.currentMap.name; });
    this.mapService.openMaps.splice(ind, 1);
    if (this.mapService.openMaps.length > 0) {
      if (mapIndex === ind) {
        this.currentMap = this.mapService.openMaps[0];
        this.currentMap.active = true;
      }
    } else {
      this.currentMap = {};
      this.mapLoaded = false;
    }
  }

  /* resizeable functions */

  validateMessagesResize(event: ResizeEvent): boolean {
    if (event.rectangle.height < this.minMessageHeight) {
      return false;
    } else {
      return true;
    }
  }

  resizeMessages(event: ResizeEvent): void {

    let margin = 2;
    let mapControl = jQuery(this.mapControl.nativeElement);
    let messagesEl = jQuery(this.messagesEl.nativeElement);
    let mapMain = jQuery(this.mapMain.nativeElement);

    if (event.rectangle.height < this.minMessageHeight) {
      messagesEl.height(this.minMessageHeight);
    } else {
      let mapControlHeight = mapMain.height() + 80 - event.rectangle.height;
      if (mapControlHeight < 100) {
        return;
      }
      messagesEl.height(event.rectangle.height);
    }

    mapControl.height(mapMain.height() + 80 - messagesEl.height() + margin);
  }

  validateLeftPanelResize(event: ResizeEvent): boolean {
    if (event.rectangle.width < this.minLeftPanelWidth) {
      return false;
    } else {
      return true;
    }
  }

  resizeLeftPanel(event: ResizeEvent): void {
    let mapMain = jQuery(this.mapMain.nativeElement);
    let leftPanel = jQuery(this.leftPanel.nativeElement);
    let mapEditor = jQuery(this.mapEditor.nativeElement);
    let rightPanel = jQuery(this.rightPanel.nativeElement);
    let mapControl = jQuery(this.mapControl.nativeElement);

    if (event.rectangle.width < this.minLeftPanelWidth) {
      leftPanel.width(this.minLeftPanelWidth);
    } else {
      let mapEditorWidth = mapMain.width() - leftPanel.width() - event.rectangle.width;
      if (mapEditorWidth < 50) {
        return;
      }
      leftPanel.width(event.rectangle.width);
    }

    mapEditor.width(mapMain.width() - leftPanel.width() - rightPanel.width());
    let newMargin = mapControl.width() - mapEditor.width() - (rightPanel.width() - this.minRightPanelWidh);
    this.mapEditor.nativeElement.style.marginLeft =  newMargin + 'px';
  }

  validateRightPanelResize(event: ResizeEvent): boolean {
    if (event.rectangle.width < this.minRightPanelWidh) {
      return false;
    } else {
      return true;
    }
  }

  resizeRightPanel(event: ResizeEvent): void {
    let mapMain = jQuery(this.mapMain.nativeElement);
    let leftPanel = jQuery(this.leftPanel.nativeElement);
    let mapEditor = jQuery(this.mapEditor.nativeElement);
    let rightPanel = jQuery(this.rightPanel.nativeElement);

    if (event.rectangle.width < this.minRightPanelWidh) {
      rightPanel.width(this.minRightPanelWidh);
    } else {
      let mapEditorWidth = mapMain.width() - event.rectangle.width - rightPanel.width();
      if (mapEditorWidth < 50) {
        return;
      }
      rightPanel.width(event.rectangle.width);
    }
    mapEditor.width(mapMain.width() - leftPanel.width() - rightPanel.width());
  }

  getMessages($event: any[]) {
    this.messages = $event;
  }
}
