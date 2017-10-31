import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';
import { ResizeEvent } from 'angular2-resizable';

import { ProjectService } from '../shared/services/project.service';
import { MapService } from '../shared/services/map.service';
import { AuthenticationService } from '../shared/services/authentication.service';
import { CombinedPopupComponent } from './map-editor/map-designer/combined-popup/combined-popup.component';
import { LeftPanelComponent } from './left-panel/left-panel.component';

import * as _ from 'lodash';
declare var jQuery:any;

@Component({
  selector: 'app-map-managment',
  templateUrl: './map-managment.component.html',
  styleUrls: ['./map-managment.component.css']
})
export class MapManagmentComponent implements OnInit, OnDestroy, AfterViewInit{

  @ViewChild('messagesEl') messagesEl: ElementRef;
  @ViewChild('mapControl') mapControl: ElementRef;
  @ViewChild('mapMain') mapMain: ElementRef;
  @ViewChild('leftPanel') leftPanel: ElementRef;
  @ViewChild('mapEditor') mapEditor: ElementRef;
  @ViewChild('rightPanel') rightPanel: ElementRef;
  @ViewChild(LeftPanelComponent) private leftPanelComponent: LeftPanelComponent;

  public designerOps: any = null;
  public sideBarState: boolean = true;
  public projectsTree: any = [];
  public currentMap: any = {};
  public openMaps: any[];
  public messages: any = [];
  public mapLoaded: boolean = false;
  public leftPanelState: any;
  private minLeftPanelWidth: number = 0;
  private minRightPanelWidh: number = 0;
  private minMessageHeight: number = 0;
  private initialEditorWidth: number = 0;

  private paramsReq: any;
  id: string;
  currentMapSubscription: Subscription;
  projectTreeSubscription: Subscription;
  openMapsSubscription: Subscription;

  constructor(private projectService: ProjectService, private authenticationService: AuthenticationService, public mapService: MapService, private m_elementRef: ElementRef, private router: Router, private route: ActivatedRoute) {  }

  ngOnInit() {
    // getting the id from the url
    this.paramsReq = this.route.params
      .subscribe((p) => this.id = p.id);

    this.projectTreeSubscription = this.projectService.getCurrentProjectTree()
      .subscribe(
        (tree) => {
          this.projectsTree = tree;
        }
      );

    this.currentMapSubscription = this.mapService.getCurrentMapObservable()
      .subscribe(
        (map) => {
          this.mapLoaded = true;
          this.currentMap = map;
        }
      );

    this.openMapsSubscription = this.mapService.getOpenMapsObservable()
      .subscribe(
        (maps) => {
          this.openMaps = maps;
        }
      )

    let user = this.authenticationService.getCurrentUser();
    if (!user || !user.id) {
      return;
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
    this.openMapsSubscription.unsubscribe();
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
    this.mapService.selectMap($event);
  }

  closeMap(index, mapId) {
    this.mapLoaded = false;
    if (mapId == this.currentMap.id) {
      // if the map selected is the current one
      this.currentMap = null;
      this.mapService.setCurrentMap(null);
      this.openMaps.splice(index, 1);
      if (this.openMaps.length > 0) {
        // if there are more openMaps
        this.mapService.setCurrentMap(this.openMaps[0]);
      }
    } else {
      this.mapLoaded = true;
      this.openMaps.splice(index, 1);
    }
    this.mapService.setOpenMaps(this.openMaps);
  }

  /* resizeable functions */

  @HostListener('window:resize', ['$event'])
  onResize(event){
    // called every screen resize to reset the panel size.
    let leftPanel = jQuery(this.leftPanel.nativeElement);
    let rightPanel = jQuery(this.rightPanel.nativeElement);
    let mapControl = jQuery(this.mapControl.nativeElement);
    let mapEditor = jQuery(this.mapEditor.nativeElement);
    let mapMain = jQuery(this.mapMain.nativeElement);
    let messagesEl = jQuery(this.messagesEl.nativeElement);
    
    rightPanel.width(this.minRightPanelWidh);
    leftPanel.width(this.minLeftPanelWidth);
    mapEditor.width(mapMain.width() - leftPanel.width() - rightPanel.width());
    messagesEl.height(this.minMessageHeight);

    let newMargin = mapControl.width() - mapEditor.width() - (rightPanel.width() - this.minRightPanelWidh);
    this.mapEditor.nativeElement.style.marginLeft =  -1*newMargin + 'px';
    mapControl.height(mapMain.height() + 80 - messagesEl.height());
    this.leftPanelComponent.resizeAgentsTree();
  }

  validateMessagesResize(event: ResizeEvent): boolean {
    if (event.rectangle.height < this.minMessageHeight) {
      return false;
    } else {
      return true;
    }
  }

  resizeMessages(event: ResizeEvent): void {
    // resize the message and mapcontrol elements
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

    // resize the projects tree elemnt to include 
    this.leftPanelComponent.resizeAgentsTree();
    
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
