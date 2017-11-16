import { Component, OnDestroy, OnInit, Input, Output, EventEmitter, ViewChild, OnChanges, SimpleChange } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { TreeComponent, TreeModel, TreeNode, TREE_ACTIONS, IActionMapping, KEYS } from 'angular-tree-component';
import { ContextMenuService, ContextMenuComponent } from 'ngx-contextmenu';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs/Subscription';
import { TreeNode as PrimeTreeNode } from 'primeng/primeng';

import { AuthenticationService } from '../../../shared/services/authentication.service';
import { ProjectService } from '../../../shared/services/project.service';
import { MapService } from '../../../shared/services/map.service';
import { NewMapComponentWindow } from './popups/new-map/new-map.component';
import { UpdateMapComponentWindow } from './popups/update-map/update-map.component';
import { NewProjectComponentWindow } from './popups/new-project/new-project.component';
import { NewFolderComponentWindow } from './popups/new-folder/new-folder.component';
import { MapVersionsComponent } from './popups/map-versions/map-versions.component';
import { RenameFolderComponentWindow } from './popups/rename-folder/rename-folder.component';
import { ConfirmPopupComponent } from '../../../shared/popups/confirm-popup/confirm-popup.component';
import { ConfirmPopupModel } from "../../../shared/interfaces/iconfirm-popup";
import { MapExecutionComponent } from "../../map-execution/map-execution.component";


import * as _ from 'lodash';

@Component({
  selector: 'app-map-explorer',
  templateUrl: './map-explorer.component.html',
  styleUrls: ['./map-explorer.component.css']
})
export class MapExplorerComponent implements OnInit, OnDestroy {

  @Input() searchtext: string = null;
  @ViewChild('tree') tree: TreeComponent[];
  @ViewChild('projectCtx') public projectCtx: ContextMenuComponent;
  @ViewChild('mapCtx') public mapCtx: ContextMenuComponent;
  @ViewChild('folderCtx') public folderCtx: ContextMenuComponent;

  private parmasReq: any;
  private openMaps: any[];
  projectsTree: any = [];
  projectTreeSubscription: Subscription;
  openMapsSubscription: Subscription;
  currentMapSubscription: Subscription;
  selectedMap: any;
  mapReq: Subscription;
  id: string = null;
  projectsTreeReq: any;
  populateTnodeReq: any;

    constructor(private authenticationService: AuthenticationService, private projectService: ProjectService, private mapService: MapService, private contextMenuService: ContextMenuService, public modalService: NgbModal, private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    let user = this.authenticationService.getCurrentUser();

    if (!user || !user.id) {
      return;
    }

    this.openMapsSubscription = this.mapService.getOpenMapsObservable()
      .subscribe(
      (maps) => {
        this.openMaps = maps
      }
    )

    this.currentMapSubscription = this.mapService.getCurrentMapObservable()
    .subscribe(
      (map) => {
        this.selectedMap = map;
      }
    );
    
    this.parmasReq = this.route.params.subscribe((params) => {
      this.id = params['id'];
    });

    this.projectsTreeReq = this.projectService.getTnodes().subscribe((projects) => {
      console.log(projects);
      this.projectsTree = projects;
    });
  }

  ngOnDestroy() {
    if (this.mapReq) {
      this.mapReq.unsubscribe();
    }
    this.projectsTreeReq.unsubscribe();
    if (this.populateTnodeReq) {
      this.populateTnodeReq.unsubscribe();
    }
  }

  loadNode(event) {
    let treeNode: TreeNode = event.node;
    if (treeNode.children)
      return;
    this.populateTnodeReq = this.projectService.getTNode(treeNode.data.id).subscribe((node) => {
      event.node.children = node.children;
    })
  }


  selectMap(node: PrimeTreeNode) {
    let mapIndex = null;
    if (this.openMaps && this.openMaps.length > 0) {
      mapIndex = _.findIndex(this.openMaps, (map) => {
        return map.id === node.data.map
      });
    }

    if (mapIndex !== null && mapIndex > -1) {
      this.mapService.selectMap(this.openMaps[mapIndex]);
    }
    else {
      this.mapReq = this.mapService.getMapById(node.data.map).subscribe(
        (map) => {
          this.mapService.selectMap(map);
        }
      );
    }
  }

  mapToItem(map) {
    map.hasChildren = false;
    map.text = map.name;
    map.type = 'map';
  }

  folderToItem(folder) {
    folder.hasChildren = true;
    folder.type = 'folder';
    if (!folder.children) {
      folder.children = [];
    }
  }

  projectToItem(project) {
    project.hasChildren = true;
    project.type = 'project';
  }

  getNodeProject(node: PrimeTreeNode) {
    // get the project ancestor
    let nodeClone = _.cloneDeep(node);
    while (nodeClone.parent) {
      nodeClone = nodeClone.parent;
    }
    return nodeClone;
  }

  addMap(node: PrimeTreeNode) {
    let project = this.getNodeProject(node);
    const pmodal = this
      .modalService
      .open(NewMapComponentWindow);
    pmodal.componentInstance.projectId = project.data.id;
    pmodal.componentInstance.parentId = node.data.id;

    pmodal.result
      .then((map: any) => {
        if (!map) return;
        let newNode: PrimeTreeNode = this.projectService.tnodeToTreeNode(map);
        if (!node.children)
          node.children = [];
        node.children.push(newNode);
        // this.selectMap(newNode);
      },
      (error) => { console.log(error); });
  }

  addFolder(node: PrimeTreeNode) {

    const pmodal = this
      .modalService
      .open(NewFolderComponentWindow);

    pmodal.componentInstance.projectId = node.data.type? -1: this.getNodeProject(node).data.id;
    pmodal.componentInstance.parentId = node.data.id;

    pmodal.result
      .then((folder: any) => {
        if (!folder) return;
        let newNode: PrimeTreeNode = this.projectService.tnodeToTreeNode(folder);
        if (!node.children)
        {
          node.children = [newNode];
          return;
        }
        node.children.unshift(newNode);
      },
      (error) => { console.log(error); });
  }

  addProject() {
    this.projectsTree.push({label: 'work!'});
    
    const pmodal = this
      .modalService
      .open(NewProjectComponentWindow);

    pmodal.result
      .then((project: any) => {
        if (!project) return;
        let newNode: PrimeTreeNode = {
          label: project.name,
          data: project,
          leaf: false,

        }
        this.projectsTree.push(newNode);
        this.projectsTree.push({label: 'work!'});
    
      },
      (error) => { console.log(error); });
  }

  deleteProject(node: PrimeTreeNode) {
    let project: any = node;

    const pmodal = this.modalService.open(ConfirmPopupComponent);
    let popupFields: ConfirmPopupModel = new ConfirmPopupModel();
    popupFields.title = "Delete Project";
    popupFields.message = "Are you sure you want to delete project: '" + node.label + "'?";
    popupFields.action = "Delete";

    pmodal.componentInstance.popupFields = popupFields;

    pmodal.result
      .then((r) => {
        if (r) {
          this.projectService.deleteProject(project.data.id).subscribe((res) => {
            _.remove(this.projectsTree, (proj: any) => { return proj.data.id === project.data.id; });
          });
        }
      })
      .catch((error) => console.log("Error deleting project!"))


  }

  openContextMenu($event, node: TreeNode) {
    if (this.isProject(node)) {
      this.contextMenuService.show.next({
        contextMenu: this.projectCtx,
        event: $event,
        item: node,
      });
    } else if (this.isMap(node)) {
      this.contextMenuService.show.next({
        contextMenu: this.mapCtx,
        event: $event,
        item: node,
      });
    } else if (this.isFolder(node)) {
      this.contextMenuService.show.next({
        contextMenu: this.folderCtx,
        event: $event,
        item: node,
      });
    }
  }

  renameNode(node: PrimeTreeNode) {
    console.log(node);
    const pmodal = this
      .modalService
      .open(UpdateMapComponentWindow);
    pmodal.componentInstance.mapName = node.label;

    pmodal.result
      .then((mapName) => {
        if (!mapName) return;
        node.label = mapName;
        this.mapService.mapUpdate(node.data.map, {name: mapName}).subscribe((map) => { console.log(map)});
      },
      (error) => {
        console.log(error);
      });
  }

  renameFolder(node: PrimeTreeNode) {
    let folder = node.data;
    const pmodal = this
      .modalService
      .open(RenameFolderComponentWindow);
    pmodal.componentInstance.name = node.label;

    pmodal.result
      .then((name) => {
        if (!name) return;
        folder.name = name;
        this.projectService.renameFolder(node.data.id, name).subscribe((res) => {
          node.data.name = name;
          node.label = name;
        });
      },
      (error) => console.log(error));
  }

  renameProject(node: PrimeTreeNode) {
    let folder = node.data;
    const pmodal = this.modalService.open(RenameFolderComponentWindow);
    pmodal.componentInstance.name = node.label;

    pmodal.result
      .then((name) => {
        if (!name) return;
        folder.name = name;
        this.projectService.updateProject(node.data.id, { name: name }).subscribe((res) => {
          node.data.name = name;
          node.label = name;
        });
      },
      (error) => console.log(error));
  }

  deleteMap(node: PrimeTreeNode) {
    const pmodal = this.modalService.open(ConfirmPopupComponent);
    let popupFields: ConfirmPopupModel = new ConfirmPopupModel();
    popupFields.title = "Delete Map";
    popupFields.message = "Are you sure you want to delete map: '" + node.label + "'?";
    popupFields.action = "Delete";

    pmodal.componentInstance.popupFields = popupFields;

    pmodal.result
      .then((r) => {
        if (r) {
          this.mapService.deleteMap(node.data.map).subscribe((res) => {
            _.remove(node.parent.children, (map: any) => { return map.data.id === node.data.id; });
          });
        }
      })
      .catch((error) => console.log("Error deleting map!"))


  }

  deleteFolder(node: PrimeTreeNode) {
    const pmodal = this.modalService.open(ConfirmPopupComponent);
    let popupFields: ConfirmPopupModel = new ConfirmPopupModel();
    popupFields.title = "Delete Folder";
    popupFields.message = "Are you sure you want to delete folder: '" + node.label + "'?";
    popupFields.action = "Delete";

    pmodal.componentInstance.popupFields = popupFields;

    pmodal.result
      .then((r) => {
        if (r) {
          this.projectService.deleteFolder(node.data.id).subscribe((res) => {
            _.remove(node.parent.children, (obj: any) => { return obj.data.id === node.data.id; });
          });
        }
      })
      .catch((error) => console.log("Error deleting folder!"))

  }

  isProject(node: TreeNode) {
    return node.data.type == 'project';
  }

  isMap(node: TreeNode) {
    return node.data.type == 'map';
  }

  isFolder(node: TreeNode) {
    return node.data.type == 'folder';
  }

  mapNode(node: any) {
    if (node.type == "map") {
      return this.mapToItem(node);
    } else if (node.type == "folder") {
      return this.folderToItem(node);
    } else if (node.type == "project") {
      return this.projectToItem(node);
    } else {
      return;
    }
  }

 

  showExecutions(node: TreeNode) {
    let mapId = node.data.map;
    const pmodal = this.modalService.open(MapExecutionComponent);
    pmodal.componentInstance.mapNode = node.data;
  }

  showVersions(node: TreeNode) {
    let map = node.data.map;
    const pmodal = this
      .modalService
      .open(MapVersionsComponent);
    pmodal.componentInstance.map = map;
  }

  ngOnChanges(changes: { [propertyName: string]: SimpleChange }): void {
    // if (changes['searchtext'] != null &&
    //   changes['searchtext'].currentValue != null &&
    //   changes['searchtext'].currentValue) {
    //   let searchtext = changes['searchtext'].currentValue;
    //   try {
    //     this.tree.treeModel.filterNodes(searchtext, true);
    //   } catch (error) {
    //     console.log(error);
    //   }
    // }
  }


}
