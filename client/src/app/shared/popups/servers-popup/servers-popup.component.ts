import { OnInit, OnDestroy, Component, Input, ViewChild } from '@angular/core';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { Subscription } from "rxjs/Subscription";
import { TreeNode } from 'primeng/primeng';

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
  agentsTree: TreeNode[];
  selectedNodes: TreeNode[];
  search: any;
  interval: any;
  selected: boolean = false;
  unselected: boolean = false;
  selectedServers: any = {};
  selectedAgents: any[];
  map: any;
  agentsListSubscription: Subscription = new Subscription();
  currentMapSubscription: Subscription = new Subscription();
  treeOptions: any;
  


  constructor(public dialog: NgbActiveModal, public serverService: ServersService, private mapService: MapService) {
    
  }

  ngOnInit() {
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

    this.serverService.getSNodesTree().subscribe((tree) => {
      console.log(tree);
      this.agentsTree = tree;
    });
  }

  ngOnDestroy() {
    this.agentsListSubscription.unsubscribe();
  }

  clearFilter(search: any) {
    search.type = 0;
  }

  closeWindow() {
    // when closing the dialog, return null.
    this.dialog.close();
  }

  onSelect(node) {
    console.log(node);
    if (!this.selectedServers[node.id]) {
      this.selectedServers[node.id] = node.data;
    } else {
      delete this.selectedServers[node.id];
    }
  }

  nodeSelect(event) {
    let selectedAgents = _.filter(this.selectedNodes, (node) => { return node.data.data});
    this.selectedAgents = [];
    selectedAgents.forEach((agent) => {
      this.selectedAgents.push(agent.data.data);
    })
  }

  apply() {
    // save the selected agents to the map;
    this.dialog.close(this.selectedAgents);
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
