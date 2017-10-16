import { AuthenticationService } from '../../../shared/services/authentication.service';
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, OnChanges, SimpleChange } from '@angular/core';

import { TreeComponent, TreeModel, TreeNode, TREE_ACTIONS, IActionMapping, KEYS } from 'angular-tree-component';
import { ContextMenuService, ContextMenuComponent } from 'ngx-contextmenu';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ProjectService } from '../../../shared/services/project.service';
import { MapService } from '../../../shared/services/map.service';
import { ExecutionReportComponent } from './execution-report/execution-report.component';
import { NewMapComponentWindow } from './popups/new-map/new-map.component';
import { UpdateMapComponentWindow } from './popups/update-map/update-map.component';
import { NewProjectComponentWindow } from './popups/new-project/new-project.component';
import { NewFolderComponentWindow } from './popups/new-folder/new-folder.component';
import { MapVersionsComponent } from './popups/map-versions/map-versions.component';
import { RenameFolderComponentWindow } from './popups/rename-folder/rename-folder.component';

import * as _ from 'lodash';

@Component({
  selector: 'app-map-explorer',
  templateUrl: './map-explorer.component.html',
  styleUrls: ['./map-explorer.component.css']
})
export class MapExplorerComponent implements OnInit {

  @Input() projectsTree: any = [];
  @Input() searchtext: string = null;
  @Output() onMapSelect: EventEmitter<any> = new EventEmitter();
  @ViewChild('tree') tree: TreeComponent;
  @ViewChild('projectCtx') public projectCtx: ContextMenuComponent;
  @ViewChild('mapCtx') public mapCtx: ContextMenuComponent;
  @ViewChild('folderCtx') public folderCtx: ContextMenuComponent;

  treeOptions: any;

  actionMapping: IActionMapping = {
    mouse: {
      contextMenu: (tree, node, $event) => {
        $event.preventDefault();
        this.openContextMenu($event, node);
      },
      dblClick: (tree: TreeModel, node: TreeNode, $event: any) => {
        if (this.isProject(node)) {
          return TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
        } else {
          /* add code for opening new map tab */
        }
      },
      click: (tree, node, $event) => {
        $event.shiftKey
          ? TREE_ACTIONS.TOGGLE_SELECTED_MULTI(tree, node, $event)
          : TREE_ACTIONS.TOGGLE_SELECTED(tree, node, $event);
        this.selectMap(node);
      }
      // ,
      // dragStart: (tree, node) => console.log('start drag', node),
      // drag: (tree, node) => console.log('drag', node),
      // dragEnd: (tree, node, $event, ...rest) => console.log('drag end', node, rest[0]),
      // dragOver: (tree, node) => console.log('drag over', node),
      // drop: (tree, node) => console.log('drop', node),
    },
    keys: {
      [KEYS.ENTER]: (tree, node, $event) => {
        if (node.data.editMode === false) {
          return;
        }
        if (this.isProject(node)) {
          this.projectService.updateProject(node.data);
        } else {
          this.mapService.updateMap(node.data);
        }
        node.data.editMode = false;
      }
    }
  };

  constructor(private authenticationService: AuthenticationService,private projectService: ProjectService, private mapService: MapService, private contextMenuService: ContextMenuService, public modalService: NgbModal) {

  }

  selectMap(node: TreeNode) {
    if (this.isMap(node)) {
      this.onMapSelect.emit(node.data.map);
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
  }

  projectToItem(project) {
    project.hasChildren = true;
    project.type = 'project';
  }

  addMap(node: TreeNode) {
    let project = -1;
    if (this.isProject(node)) {
      project = node.data.id;
    }
    const pmodal = this
      .modalService
      .open(NewMapComponentWindow);
    pmodal.componentInstance.currProject = project;
    pmodal.componentInstance.parentId = node.data.id;

    pmodal.result
      .then((map: any) => {
          if (!map) return;
          console.log('created');
          map.editMode = true;
          this.mapToItem(map);
          node.data.children.push(map);
          this.tree.treeModel.update();
        },
        (error) => { console.log(error); });
  }

  addFolder(node: TreeNode) {
    let project = -1;
    if (this.isProject(node)) {
      project = node.data.id;
    }
    const pmodal = this
      .modalService
      .open(NewFolderComponentWindow);

    pmodal.componentInstance.projectId = project;
    pmodal.componentInstance.parentId = node.data.id;

    pmodal.result
      .then((folder: any) => {
          if (!folder) return;
          console.log('created');
          this.folderToItem(folder);
          node.data.children.push(folder);
          this.tree.treeModel.update();
        },
        (error) => { console.log(error); });
  }

  addProject() {

      const pmodal = this
      .modalService
        .open(NewProjectComponentWindow);

      pmodal.result
      .then((project: any) => {
          if (!project) return;
          console.log('created');
          project.editMode = true;
          this.projectsTree.push(project);
          this.tree.treeModel.update();
        },
        (error) => { console.log(error); });
  }

  deleteProject(node: TreeNode) {
    let project: any = node.data;
    this.projectService.deleteProject(project.id).subscribe((res) => {
      _.remove(this.projectsTree, (proj: any) => { return proj.id === project.id; });
      this.tree.treeModel.update();
    });
  }

  openContextMenu($event, node: TreeNode) {
    if (this.isProject(node)) {
      this.contextMenuService.show.next({
        contextMenu: this.projectCtx,
        event: $event,
        item: node,
      });
    } else if (this.isMap(node)){
      this.contextMenuService.show.next({
        contextMenu: this.mapCtx,
        event: $event,
        item: node,
      });
    } else if (this.isFolder(node)){
      this.contextMenuService.show.next({
        contextMenu: this.folderCtx,
        event: $event,
        item: node,
      });
    }
  }

  renameNode(node: TreeNode) {
    let map = node.data.map;
    const pmodal = this
      .modalService
    .open(UpdateMapComponentWindow);
    pmodal.componentInstance.mapName = map.name;

    pmodal.result
      .then((mapName) => {
          if (!mapName) return;
          map.name = mapName;
          this.mapService.updateMap(map).subscribe((res)=> {
            node.data.text = map.name;
            node.data.name = map.name;
            this.tree.treeModel.update();
          });
        },
        (error) => { console.log(error);
      });
  }

  renameFolder(node: TreeNode) {
    let folder = node.data;
    const pmodal = this
      .modalService
    .open(RenameFolderComponentWindow);
    pmodal.componentInstance.name = node.data.name;

    pmodal.result
      .then((name) => {
          if (!name) return;
          folder.name = name;
          this.projectService.renameFolder(node.data.id, name).subscribe((res)=> {
            node.data.text = name;
            node.data.name = name;
            this.tree.treeModel.update();
          });
        },
        (error) => { console.log(error);
      });
  }

  deleteMap(node: TreeNode) {
    this.mapService.deleteMap(node.data.map.id).subscribe((res) => {
      _.remove(node.parent.data.children, (map: any) => { return map.id === node.data.id; });
      this.tree.treeModel.update();
    });
  }

  deleteFolder(node: TreeNode) {
    this.projectService.deleteFolder(node.data.id).subscribe((res) => {
      _.remove(node.parent.data.children, (obj: any) => { return obj.id === node.data.id; });
      this.tree.treeModel.update();
    });
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
    } else if (node.type == "project"){
      return this.projectToItem(node);
    } else {
      return;
    }
  }


  ngOnInit() {
    
    let user = this.authenticationService.getCurrentUser();

    if (!user || !user.id) {
      return;
    }
    
    this.projectService.getJstreeProjectsByUser(user.id).subscribe((data) => {
      this.projectsTree = data;
      this.tree.treeModel.update();
    });

    let actionMapping = this.actionMapping;
    this.treeOptions = {
      getChildren: (node:TreeNode) => {
        return new Promise((resolve, reject) => {
          this.projectService.getNode(node.id).subscribe((node) => {
            _.map(node.childs, this.mapNode.bind(this))
            return resolve(node.childs);
          });
        });
      },
      hasCustomContextMenu: true,
      actionMapping
    };
  }

  showExecutions(node: TreeNode) {
    let map = node.data.map;
    const pmodal = this
      .modalService
      .open(ExecutionReportComponent);
    pmodal.componentInstance.map = map;
    pmodal.componentInstance.execution = null;

  }

  showVersions(node: TreeNode) {
    let map = node.data.map;
    const pmodal = this
      .modalService
      .open(MapVersionsComponent);
    pmodal.componentInstance.map = map;
  }

  ngOnChanges(changes: { [propertyName: string]: SimpleChange }): void {
    if (changes['searchtext'] != null &&
      changes['searchtext'].currentValue != null &&
      changes['searchtext'].currentValue) {
      let searchtext = changes['searchtext'].currentValue;
      try {
        this.tree.treeModel.filterNodes(searchtext, true);
      } catch (error) {
        console.log(error);
      }
    }
  }


}
