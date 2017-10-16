import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { ServersService } from '../../shared/services/servers.service';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import { TreeComponent, TreeModel, TreeNode, TREE_ACTIONS, IActionMapping, KEYS, ITreeOptions } from 'angular-tree-component';
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
  @ViewChild('tree') tree: TreeComponent;
  @ViewChild('groupCtx') public groupCtx: ContextMenuComponent;
  @ViewChild('serverCtx') public serverCtx: ContextMenuComponent;

  constructor(public modalService: NgbModal, public serverService: ServersService, public contextMenuService: ContextMenuService) {
    let actionMapping: IActionMapping = {
      mouse: {
        contextMenu: (tree, node, $event) => {
          $event.preventDefault();
          this.openContextMenu($event, node);
        },
        dblClick: (tree: TreeModel, node: TreeNode, $event: any) => {
          if (this.isGroup(node)) {
            return TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
          } else {
            this.editAgent(node);
          }
        },
        click: (tree, node, $event) => {
          $event.shiftKey
            ? TREE_ACTIONS.TOGGLE_SELECTED_MULTI(tree, node, $event)
            : TREE_ACTIONS.TOGGLE_SELECTED(tree, node, $event);
          // this.selectMap(node);
        }
      }
    };

    this.treeOptions = {
      getChildren: (node:TreeNode) => {
        return new Promise((resolve, reject) => {
          this.serverService.getNode(node.id).subscribe((node) => {
            return resolve(node.children);
          });
        });
      },
      allowDrag: true,
      actionMapping,
      hasCustomContextMenu: true
    };
    this.getActiveAgents = this.getActiveAgents.bind(this);
    this.getAgents = this.getAgents.bind(this);

  }

  onMoveNode($event) {
    if (this.isGroup($event.node)) {
      $event.node.parent = $event.to.parent.id;
      let snode = $event.node;
      snode.parent = $event.to.parent.id;
      this.serverService.updateGroup(snode).subscribe(function(res) {
        console.log(res);
      });
    } else if (this.isServer($event.node)) {
      this.serverService.updateAgent($event.to.parent.id, $event.node.data).subscribe(function(res) {
        console.log(res);
      });
    }
    console.log(
      "Moved",
      $event.node.name,
      "to",
      $event.to.parent.name,
      "at index",
      $event.to.index);
  }


  ngOnInit() {
    this.search = {
      type: 0
    };
    this.interval = setInterval(this.getActiveAgents, 5000);
    this.getAgents();
    
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  editAgent(agent) {
    const modalRef = this
        .modalService
        .open(EditAgentComponentWindow);
      modalRef.componentInstance.agent = agent;
      try {
        modalRef.componentInstance.parentId = agent.parent.data.id;
      } catch(ex) {
        modalRef.componentInstance.parentId = -1;
      }
  }

  deleteAgent(agent) {
  	this.serverService.deleteAgent(agent.id).subscribe((res) => {
  		this.deleteNode(this.agents, agent);
      this.tree.treeModel.update();
  	});
  }

  deleteNode(agents, node) {
    _.remove(agents, (ag: any) => { return ag.id === node.id; });
    _.each(agents, (agent: any) => {
      if (agent.hasChildren) {
        this.deleteNode(agent.children, node);  
      }
    });
  }

  deleteGroup(group) {
    this.serverService.deleteGroup(group.id).subscribe((res) => {
      this.deleteNode(this.agents, group);
      this.tree.treeModel.update();
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
        this.tree.treeModel.update();
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
        this.tree.treeModel.update();
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

  openContextMenu($event, node: TreeNode) {
    if (this.isGroup(node)) {
      this.contextMenuService.show.next({
        contextMenu: this.groupCtx,
        event: $event,
        item: node,
      });
    } else if (this.isServer(node)){
      this.contextMenuService.show.next({
        contextMenu: this.serverCtx,
        event: $event,
        item: node,
      });
    }
  }

  newGroup(node: TreeNode) {
    const pmodal = this
      .modalService
      .open(NewGroupComponentWindow);

    let parentId = -1;

    if (node !== null) {
      parentId = node.data.id;
    }

    pmodal.result
      .then((group: any) => {
          if (!group) return;
          console.log('created');
          this.serverService.addGroup(parentId, group.name).subscribe((groupItem) => {
            if (node == null) {
              this.agents.push(groupItem);
            } else {
              node.data.children.push(groupItem);
            }
            this.tree.treeModel.update();
          });
        },
        (error) => { console.log(error); });
  }

}
