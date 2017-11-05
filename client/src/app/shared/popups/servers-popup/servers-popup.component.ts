import { OnInit, OnDestroy, Component, Input, ViewChild } from '@angular/core';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { TreeComponent, TreeModel, TreeNode, TREE_ACTIONS, IActionMapping, KEYS, ITreeOptions } from 'angular-tree-component';
import * as _ from 'lodash';
import { Subscription } from "rxjs/Subscription";

import { ServersService } from "../../services/servers.service";
import { MapService } from "../../services/map.service";
import { MapServersComponent } from "../../../map-managment/map-settings/map-servers/map-servers.component";


@Component({
  selector: 'modal-content',
  templateUrl: './servers-popup.component.html',
  styleUrls: ['./servers-popup.component.css']
})
export class ServersPopupComponent implements OnInit, OnDestroy {
  agents: any[] = [];
  search: any;
  interval: any;
  selected: boolean = false;
  unselected: boolean = false;
  selectedServers: any = {};
  map: any;
  agentsListSubscription: Subscription = new Subscription();
  currentMapSubscription: Subscription = new Subscription();
  treeOptions: any;
  @ViewChild('tree') tree: TreeComponent;
  


  constructor(public dialog: NgbActiveModal, public serverService: ServersService, private mapService: MapService) {
    this.treeOptions = {
      getChildren: (node:TreeNode) => {
        return new Promise((resolve, reject) => {
          this.serverService.getNode(node.id).subscribe((node) => {
            return resolve(node.children);
          });
        });
      },
      allowDrag: false
    };
  }

  ngOnInit() {
    this.selectedServers = {};
    this.search = {
      type: 0
    };
    this.agents = this.serverService.getLatestAgentsList();
    this.selected = false;
    this.unselected = false;

    this.currentMapSubscription = this.mapService.getCurrentMapObservable().subscribe((map) => {
      this.map = map;
    });

    this.agentsListSubscription = this.serverService.getAgentsListAsObservable().subscribe((agents) => {
      this.agents = agents;
    });
  }

  ngOnDestroy() {
    this.agentsListSubscription.unsubscribe();
  }

  clearFilter(search: any) {
    search.type = 0;
  }

  closeWindow() {
    // when closing the dialog, return the selected servers array.
    this.dialog.close(this.selectedServers);
  }

  onSelect(node) {
    console.log(node);
    if (!this.selectedServers[node.id]) {
      this.selectedServers[node.id] = node.data;
    } else {
      delete this.selectedServers[node.id];
    }
  }

  apply() {
    // save the selected agents to the map;
    let selectedAgentsData = [];
    this.agents.forEach((agent) => {
      selectedAgentsData.push(agent.data);
    });
    this.closeWindow();
  }

  showUnSelected() {
    this.unselected = !this.unselected;
    this.agents = _.filter(this.agents, (o: any) => {
      return !this.map.activeServers[o.id].active;
    });
  }

  showSelected() {
    this.selected = !this.selected;
    this.agents = _.filter(this.agents, (o: any) => {
      return this.map.activeServers[o.id].active;
    });
  }

}
