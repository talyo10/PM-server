import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { ServersService } from '../../shared/services/servers.service';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { TreeNode } from 'primeng/primeng';
import { ContextMenuService, ContextMenuComponent } from 'ngx-contextmenu';

import { EditAgentComponentWindow } from './edit-agent/edit-agent.component';
import { InstallAgentComponentWindow } from './install-agent/install-agent.component';
import { NewGroupComponentWindow } from './new-group/new-group.component';

import { Observable, Subject } from 'rxjs/Rx';

import * as _ from 'lodash';

@Component({
  selector: 'app-servers',
  templateUrl: './servers.component.html',
  styleUrls: ['./servers.component.css'],
  providers: []
})
export class ServersComponent implements OnInit, OnDestroy {

  agents: any[] = [];
  search: any;
  interval: any;
  items: any[] = [];
  treeOptions: any;
  @ViewChild('groupCtx') public groupCtx: ContextMenuComponent;
  @ViewChild('serverCtx') public serverCtx: ContextMenuComponent;
  agentsStatusReq: any;
  snodeReq: any;
  agentsStatus: {any};
  snodesTree: TreeNode[];

  constructor(public modalService: NgbModal, public serverService: ServersService, public contextMenuService: ContextMenuService) {
  }

  ngOnInit() {
    this.search = {
      type: 0
    };
    this.snodeReq = this.serverService.getSNodesTree().subscribe((tree) => {
      this.snodesTree = tree;
    });

    this.agentsStatusReq = this.serverService.getStatus().subscribe((status) => {
      this.agentsStatus = status;
    })
    
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  editAgent(node) {
    const modalRef = this
        .modalService
        .open(EditAgentComponentWindow);
      modalRef.componentInstance.agent = node.data;
      modalRef.componentInstance.parentId = node.parent;
  }

  deleteAgent(agent) {
    console.log(agent);
  	this.serverService.deleteAgent(agent.id).subscribe((res) => {
  		if (agent.parent && agent.parent != "-1") {
        console.log("!");
        _.remove(agent.parent.children, (o) => {
          return o['data'].id === agent.id;
        })
      } else {
        console.log("@")
        _.remove(this.snodesTree, (o) => {
          return o['data'].id === agent.id;
        })
      }
  	});
  }

  deleteGroup(group) {
    this.serverService.deleteGroup(group.data.id).subscribe((res) => {
      if (group.parent && group.parent != "-1") {
        _.remove(group.parent.children, (o) => {
          return o['data'].id === group.data.id;
        })
      } else {
        _.remove(this.snodesTree, (o) => {
          return o['data'].id === group.data.id;
        })
      }
    });
  }


  setChildrenStatus(children: any, agentsStatuses: any) {
    _.each(children, (agent: any) => {
      if (agent.hasChildren) {
        this.setChildrenStatus(agent.children, agentsStatuses);
      } else {
        this.setAgentStatus(agent, agentsStatuses);
      }
    });
  }

  setAgentStatus(agent: any, agentsStatuses: any) {
    let agentData = agent.data;
    for(let key in agentsStatuses[agentData.key]) {
      agentData[key] = agentsStatuses[agentData.key][key];
    }
  }

  updateAgents(agents: any[]) {
    _.each(agents, (agent:any) => {
      let index = _.findIndex(this.agents, (ag: any) => {
        return ag.id == agent.id;
      });
      if (index < 0) {
        this.agents.push(agent);
      }
    });
  }

  getActiveAgents() {
    let agentsArray = [];
    this.serverService.getAgents().subscribe((res) => {
      let agents = res;
      this.updateAgents(agents);
      this.serverService.getStatus().subscribe((resp) => {
        agentsArray = resp;
        this.setChildrenStatus(this.agents, agentsArray);
      }, (err) => {
        console.log(err);
      });
    });
  }

  getAgents() {
    let agentsArray = [];
    this.serverService.getAgents().subscribe((res) => {
      let agents = res;
      this.serverService.getStatus().subscribe((resp) => {
        agentsArray = resp;
        this.setChildrenStatus(agents, agentsArray);
        this.agents = agents;
      }, (err) => {
        console.log(err);
      });
    });
  }

  installAgent() {
    const modalRef = this
        .modalService
        .open(InstallAgentComponentWindow);
  }

  clearFilter(search: any) {
    search.type = 0;
  }

  isGroup(node: any) {
    return node.hasChildren == true || node.data.hasChildren == true;
  }

  isServer(node: any) {
    return node.hasChildren == false || node.data.hasChildren == false;
  }

  newGroup(node: TreeNode) {
    const pmodal = this
      .modalService
      .open(NewGroupComponentWindow);

    let parentId = node? node.data.id: -1;

    pmodal.result
      .then((group: any) => {
        if (!group) return;
        this.serverService.addGroup(parentId, group.name).subscribe((groupItem) => {
          let obj: TreeNode = {};
          obj.data = groupItem;
          obj.parent = node;
          obj.children = [];
          
          if (node) {
            node.children.push(obj);
          } else {
            this.snodesTree.push(obj);
          }
        });
      },
      (error) => { console.log(error); });
  }

}
