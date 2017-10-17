import { Component, OnInit, OnDestroy, Output, Input, EventEmitter, ViewEncapsulation, ViewContainerRef, ViewChild, OnChanges, SimpleChange } from '@angular/core';

import * as jQuery from 'jquery';
import * as _ from 'lodash';
import * as $ from 'backbone';
import * as joint from 'jointjs';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ContextMenuService, ContextMenuComponent } from 'ngx-contextmenu';
import { Subscription } from 'rxjs/Subscription';

import { MapService } from '../../../shared/services/map.service';
import { ProcessesComponentWindow } from './processes/processes.component';
import { NewProcessComponentWindow } from './new-process/new-process.component';
import { RenameNodeComponentWindow } from './rename-node/rename-node.component';
import { DeleteNodeComponentWindow } from './delete-node/delete-node.component';
import {CombinedPopupComponent} from "./combined-popup/combined-popup.component";

@Component({
  selector: 'app-map-designer',
  templateUrl: './map-designer.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../../../../../node_modules/jointjs/css/layout.css',
              '../../../../../node_modules/jointjs/css/themes/default.css',
              './map-designer.component.css']
})
export class MapDesignerComponent implements OnInit, OnChanges {

  @Output() paperInit = new EventEmitter();
  @Input() width: number = 0;
  @Input() height: number = 0;
  @Input() gridSize: number = 0;
  @ViewChild(ContextMenuComponent) public contextMenu: ContextMenuComponent;
  
  
  public graph: any;
  public paper: any;
  private _currentLink: any;
  private _map: any;
  private reconnectingLink: boolean = false;
  private graphScale: number = 1;
  private innerWidth: number;
  private innerHeight: number;
  
  map: any = {};
  currentMapSubscription: Subscription;
  
  constructor(private modalService: NgbModal, private mapService: MapService, private contextMenuService: ContextMenuService) {
    this._currentLink = null;
    this.reconnectingLink = false;modalService;
    this.currentMapSubscription = this.mapService.getCurrentMapObservable()
      .subscribe(
        (map) => {
          this.map = map;
          this.loadMap();
        }
      );
  }

  openProcessesModal(link: any, src: any, dest: any) {
    const modalRef = this.modalService.open(CombinedPopupComponent);
    modalRef.componentInstance.link = link;
    modalRef.componentInstance.src = src;
    modalRef.componentInstance.dest = dest;
    modalRef.componentInstance.currentProcess = null;
  }

  openNewProcessModal(link: any, src: any, dest: any) {
    const pmodal = this.modalService.open(NewProcessComponentWindow);
    pmodal.componentInstance.link = link;
    pmodal.componentInstance.src = src;
    pmodal.componentInstance.dest = dest;

    pmodal.result
      .then((created: any) => {
          if (!created) {
            let cell = this.graph.getCell(link.id);
            var cellView = this.paper.findViewByModel(cell);
            this.deleteCellView(cellView);
          }
        },
        (error) => { console.log(error); });
  }

  openDeleteModal(cellView: any) {
    let id = cellView.model.id;
    let cell = this.graph.getCell(id);

    const pmodal = this
      .modalService
      .open(DeleteNodeComponentWindow);

    pmodal.componentInstance.name = cell.attributes.attrs['.label'].text;

    pmodal.result
      .then((removeCell: any) => {
          if (removeCell) {
            this.deleteCellView(cellView);
          }
        },
        (error) => { console.log(error); });
  }

  openRenameModal(cellView: any) {
    let id = cellView.model.id;
    let cell = this.graph.getCell(id);

    const pmodal = this
      .modalService
      .open(RenameNodeComponentWindow);

    pmodal.componentInstance.name = cell.attributes.attrs['.label'].text;

    pmodal.result
      .then((name: any) => {
          this.renameCellView(cell, name);
        },
        (error) => { console.log(error); });
  }

  getLink(linkId: any) {
    let res = {};
    res = _.find(this.map.mapView.links, (link: any) => { return link.id === linkId; });
    return res;
  }

  svgCheckPort(portType, elem) {
    return elem.getAttribute('port').startsWith(portType);
  }

  getNode(blockId) {
    let res = {};
    res = _.find(this.map.mapView.nodes, (node: any) => {
      return node.id === blockId;
    });
    return res;
  }

  connectNodes(linkId: any, sourceId: any, targetId: any) {
    let pLink = {
      id: linkId,
      sourceId: sourceId,
      targetId: targetId,
      processes: [],
      result: '',
      condition: false
    };
    this.map.mapView.links.push(pLink);
    let mapLink = this.getLink(linkId);
    let sourceBlock = this.getNode(sourceId);
    let targetBlock = this.getNode(targetId);

    this.openNewProcessModal(mapLink, sourceBlock, targetBlock);

  }

  addNode(id, name, type, node) {
    let truncatedName = name.replace(' ', ''); /* TODO: replace all unallowed charcters */
    let nameIndex = _.keys(this.map.mapView.nodes).length;
    truncatedName = truncatedName + nameIndex;
    this.map.mapView.nodes[truncatedName] = {
      id: id,
      type: type,
      name: name,
      serverUrl: "localhost:8100", /* Default address */
      attributes: {}
    };
    node.attributes.attrs['.label'].text = name + '-' + nameIndex;
    this.graph.addCell(node);
    this.updateMapViewContentGraph();
  }

  ngOnInit() {
    this._currentLink = null;
    this.reconnectingLink = false;
    this.graphScale = 1;
    this.innerWidth = this.width;
    this.innerHeight = this.height;
    // Canvas where sape are dropped
    this.graph = new joint.dia.Graph;
    this.paper = new joint.dia.Paper({
      el: jQuery('#paper'),
      width: this.innerWidth,
      height: this.innerHeight,
      gridSize: this.gridSize,
      model: this.graph,
      snapLinks: { radius: 75 },
      linkPinning: false,
      embeddingMode: false,
      defaultLink: new joint.dia.Link({
        router: { name: 'manhattan' },
        connector: { name: 'rounded' }
      }),
      markAvailable: true,
      validateConnection: (cellViewS, magnetS, cellViewT, magnetT, end, linkView) => {
        // Prevent loop linking and input to output
        return (cellViewS.id !== cellViewT.id) && this.svgCheckPort('in', magnetT) && this.svgCheckPort('out', magnetS);
      },
      interactive: (cellView: any): any => {
          if (cellView.model instanceof joint.dia.Link) {
              // Disable the default vertex add functionality on pointerdown.
              return { vertexAdd: false };
          }
          return true;
      }
    });

    joint.shapes.devs.PMStartPoint = joint.shapes.devs.Model.extend({

      markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><image/><text class="label"/><g class="inPorts"/><g class="outPorts"/></g>',
      portMarkup: '<g class="port port<%= id %>"><circle class="port-body"/><text class="port-label"/></g>',

      defaults: joint.util.deepSupplement({

        type: 'devs.PMStartPoint',
        size: { width: 40, height: 39 },
        outPorts: [''],
        attrs: {
          '.body': { stroke: '#3c3e41', fill: '#2c2c2c', 'rx': 6, 'ry': 6, 'opacity': 0 },
          '.label': {
            text: '', 'ref-y': 0.83, 'y-alignment': 'middle',
            fill: '#f1f1f1', 'font-size': 13
          },
          '.port-body': { r: 7.5, stroke: 'gray', fill: '#2c2c2c', magnet: 'active' },
          'image': {
            'ref-x': 10, 'ref-y': 18, ref: 'rect',
            width: 35, height: 34, 'y-alignment': 'middle',
            'x-alignment': 'middle', 'xlink:href': 'assets/img/start.png'
          }
        }

      }, joint.shapes.devs.Model.prototype.defaults)
    });

    joint.shapes.devs.PMStartPointView = joint.shapes.devs.ModelView;

    joint.shapes.devs.PMDragModel = joint.shapes.devs.Model.extend({

      markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><image/><text class="label"/><g class="inPorts"/><g class="outPorts"/></g>',
      portMarkup: '<g class="port port<%= id %>"><circle class="port-body"/><text class="port-label"/></g>',

      defaults: joint.util.deepSupplement({

        type: 'devs.PMDragModel',
        size: { width: 110, height: 84 },
        inPorts: [''],
        outPorts: [''],
        attrs: {
          '.body': { stroke: '#3c3e41', fill: '#2c2c2c', 'rx': 6, 'ry': 6 },
          '.label': { text: 'Command Line', 'ref-y': 0.83, 'y-alignment': 'middle', fill: '#f1f1f1', 'font-size': 13 },
          '.port-body': { r: 7.5, stroke: 'gray', fill: '#2c2c2c', magnet: 'active' },
          'image': {
            'ref-x': 34, 'ref-y': 30, ref: 'rect',
            width: 46, height: 34, 'y-alignment': 'middle',
            'x-alignment': 'middle', 'xlink:href': 'assets/img/agents-small-01.png'
          }
        }

      }, joint.shapes.devs.Model.prototype.defaults)
    });

    joint.shapes.devs.PMDragModelView = joint.shapes.devs.ModelView;

    let startShape = new joint.shapes.devs.PMStartPoint({
      position: { x: 40, y: 30 },
    });

    this.graph.addCells([startShape]);

    this.paper.on('cell:pointerup', (cellView, evt, x, y) => {
      if (cellView.model.isLink()) {
        if (this._currentLink && !this.reconnectingLink) {
          let link = this._currentLink;
          let sourceId = link.get('source').id;
          let targetId = link.get('target').id;

          this.connectNodes(link.id, sourceId, targetId);
          delete this._currentLink.newProcess;
          this._currentLink = null;
        } else if (this.reconnectingLink) {
          this.reconnectingLink = false;
        }
      }
      this.updateMapViewContentGraph();
    });

    this.paper.on('cell:contextmenu', (cellView, evt) => {
      this.openContextMenu(evt, cellView);
    });

    this.paper.on('cell:pointerdown', (cellView, evt, x, y) => {
      /* if we changing existing link we want to save its process because only target block is related when using links */
      if (cellView.model.isLink()) {
        let mapLink = this.getLink(cellView.model.id);
        if (mapLink) {
          this.reconnectingLink = true;
          this._currentLink = cellView.model;
        }
      }
    });

    this.paper.on('cell:pointermove', () => {
      this.updatePaper();
    });

    this.paper.on('cell:pointerdblclick', (cellView, evt, x, y) => {
      if (!cellView.model.isLink())
        return;
      let link = cellView.model;
      let sourceId = link.get('source').id;
      let targetId = link.get('target').id;
      let mapLink = this.getLink(cellView.model.id);
      let sourceBlock = this.getNode(sourceId);
      let targetBlock = this.getNode(targetId);

      this.openProcessesModal(mapLink, sourceBlock, targetBlock);
    });
    this.graph.on('change:source change:target', (link) => {
      let sourceId = link.get('source').id;
      let targetId = link.get('target').id;

      if (targetId && sourceId) {
        this._currentLink = link;
      } else {
        this._currentLink = null;
      }

    });

    /* only needed for debug */
    window.setTimeout(() => {
      this.paperInit.emit({
        paper: this.paper,
        graph: this.graph,
        designerOps: this
      });
    }, 100);

    this.loadMap();
  }

  ngOnChanges(changes: { [propertyName: string]: SimpleChange }): void {
    console.log("--->", changes);
    // if (changes['map'].currentValue != null && this.graph != null) {
    //   console.log(this.graph);
    //   this.loadMap();
    // }
  }

  updatePaper() {
    this.paper.fitToContent({
        padding: 20, /* Use const padding from all edges at the fitting process */
        minWidth: this.innerWidth,
        minHeight: this.innerHeight,
        gridWidth: this.gridSize,
        gridHeight: this.gridSize
    });
  }

  loadMap() {
    // Clear the graph (Genius .__.)
    this.graph.clear();

    try {

      // Wait 1s and add the cells
      if (this.map && this.map.mapView && !this.map.mapView.content) {
        console.log("no content");
        console.log(this.map.mapView);
        console.log("content");
        return;
      }
      this.graph.fromJSON(JSON.parse(this.map.mapView.content));

    } catch (e) {
      console.log("Error loading map", e);
    }

    this.updatePaper();
  }

  /* when changing the graph we want to update the inner content that saves the graph json */
  /* http://resources.jointjs.com/docs/jointjs/v1.1/joint.html#dia.Graph.prototype.toJSON */
  updateMapViewContentGraph() {
    let res = this.graph.toJSON();
    res = JSON.stringify(res);
    this.map.mapView.content = JSON.stringify(this.graph.toJSON());
    this.updatePaper();
  }

  openContextMenu($event, cellView) {
    console.log($event);
    this.contextMenuService.show.next({
      contextMenu: this.contextMenu,
      event: $event,
      item: cellView,
    });
  }

  deleteCellView(cellView) {
    let id = cellView.model.id;
    let cell = this.graph.getCell(id);
    cellView.remove();
    if (cell.isLink()) {
      this.deleteLink(this.getLink(id));
    } else {
      this.deleteNode(this.getNode(id));
    }
    this.updateMapViewContentGraph();
  }

  renameCellView(cell: any, name: string)  {
    let truncatedName = name.replace(' ', ''); /* TODO: replace all unallowed charcters */
    for (var key in this.map.mapView.nodes) {
      let node = this.map.mapView.nodes[key];
      if (node.id === cell.id) {
        delete this.map.mapView.nodes[key];
        this.map.mapView.nodes[truncatedName] = node;
        cell.attr('.label/text', name);
        this.updateMapViewContentGraph();
        return node;
      }
    }
  }

  deleteLink(link) {
    _.remove(this.map.mapView.links, (l: any) => { return l.id === link.id; });
  }

  deleteNode(node) {
    this.removeNodeLinks(node.id);
    _.forEach(this.map.mapView.nodes, (cNode: any, key) => {
      if (node.id === cNode.id) {
        delete this.map.mapView.nodes[key];
      }
    });
    _.remove(this.graph.attributes.cells.models, (l: any) => { return l.id === node.id; });
  }

  /* we use this function instead of the regular graph.removeLinks because we want to remove
     them from the mapView. */
  removeNodeLinks(nodeId) {
    this.graph.getLinks().forEach((link) => {
      if (this.isLinkInvalid(nodeId, link)) {
        link.remove();
        this.deleteLink(link);
      }
    });
  }

  /* checks if the link is directed to the deleted element */
  isLinkInvalid(nodeId, link) {
    if (link.prop('source/id') && link.prop('target/id')) {
      return (link.prop('target/id') === nodeId);
    }
    return true;
  }

  zoomIn() {
    this.graphScale += 0.1;
    this.paperScale(this.graphScale, this.graphScale);
  }

  zoomOut() {
    this.graphScale -= 0.1;
    this.paperScale(this.graphScale, this.graphScale);
  }

  private paperScale(sx, sy) {
    this.paper.scale(sx, sy);
    this.updatePaper();
  };

}
