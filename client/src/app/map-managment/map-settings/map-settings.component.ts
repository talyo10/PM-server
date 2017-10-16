import { Component, OnInit, Input } from '@angular/core';
import { NgSwitch, NgSwitchCase } from "@angular/common";

@Component({
  selector: 'app-map-settings',
  templateUrl: './map-settings.component.html',
  styleUrls: ['../../shared/css/map-bar.css', './map-settings.component.css']
})
export class MapSettingsComponent implements OnInit {

  public currentPanel: number = 0;
  @Input() map: any = {};

  constructor() { }

  ngOnInit() {
  }

  selectPanel(panelId: number) {
    this.currentPanel = panelId;
  }

}
