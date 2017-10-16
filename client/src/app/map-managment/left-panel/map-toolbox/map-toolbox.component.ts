import { Component, OnInit, Input, OnChanges, SimpleChange } from '@angular/core';
import { MapDesignerComponent } from '../../map-editor/map-designer/map-designer.component';
import { AgentsService } from '../../../shared/services/agents.service';


import * as jQuery from 'jquery';
import * as _ from 'lodash';
import * as $ from 'backbone';
import * as joint from 'jointjs';

@Component({
  selector: 'app-map-toolbox',
  templateUrl: './map-toolbox.component.html',
  styleUrls: ['./map-toolbox.component.css'],
  providers: [AgentsService]
})
export class MapToolboxComponent implements OnInit, OnChanges {

  @Input() paper: any;
  @Input() graph: any;
  @Input() designerOps: MapDesignerComponent;
  @Input() searchtext: string = null;

  private stencilGraph: any;
  private stencilPaper: any;
  private agentsBlocks: any[];

  constructor(private agentsService: AgentsService) {
  }

  initDragPanel(graph) {
    return (blocks) => {
      let mapBlock = new joint.shapes.basic.DecoratedRect({
        position: { x: 50, y: 50 },
        attrs: {
          text: {
            text: 'Obstacle'
          }
        }
      });

      let offset = 62;
      let iteration = 0;

      _.forEach(blocks, (block: any) => {
        let url = block.img_url;
        let node = mapBlock.clone().position(0, iteration * offset).attr({
          image: {
            'xlink:href': url
          },
          text: {
            text: block.text
          }
        });
        iteration++;
        graph.addCell(node);
      });
    };
  }

  ngOnInit() {
    if (this.stencilPaper != null) {
      return;
    }
    // Canvas from which you take shapes
    this.stencilGraph = new joint.dia.Graph;
    this.stencilPaper = new joint.dia.Paper({
      el: jQuery('#stencil'),
      height: 434,
      width: 238,
      model: this.stencilGraph,
      interactive: false
    });

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

    joint.shapes.basic.DecoratedRect = joint.shapes.basic.Generic.extend({

      markup: '<g class="rotatable"><g class="scalable"><rect/></g><image/><text/></g>',

      defaults: joint.util.deepSupplement({

        type: 'basic.DecoratedRect',
        size: { width: this.stencilPaper.options.width, height: 62 },
        attrs: {
          '.': { magnet: false },
          'rect': { width: this.stencilPaper.options.width, height: 62, fill: '#2d2f30' },
          'text': {
            'font-size': 13,
            text: '',
            'ref-x': 0.44,
            'ref-y': 0.5,
            ref: 'rect',
            'y-alignment': 'middle',
            'x-alignment': 'middle',
            fill: '#bbb'
          },
          'image': {
            'ref-x': 37, 'ref-y': 30, ref: 'rect',
            width: 29, height: 33, 'y-alignment': 'middle',
            'x-alignment': 'middle'
          }
        }

      }, joint.shapes.basic.Generic.prototype.defaults)
    });

    console.log('get all services');
    this.agentsService.all(false).subscribe((data) => {
      this.agentsBlocks = _.cloneDeep(data.blocks);
      this.initDragPanel(this.stencilGraph)(data.blocks);
    });
  }

  getFlyCell(cellView: any): any {
    return new joint.shapes.devs.PMDragModel({
      position: { x: 22, y: 100 },
      attrs: {
        '.label': {
          text: cellView.model.attr('text/text')
        },
        image: {
          'xlink:href': cellView.model.attr('image/xlink:href')
        }
      }
    });
  }

  ngOnChanges(changes: { [propertyName: string]: SimpleChange }): void {
    if (changes['searchtext'] != null && changes['searchtext'].currentValue != null) {
      let blocks = this.agentsService.all("dragblocks");
      let filteredBlocks = [];
      let searchtext: string = changes['searchtext'].currentValue;

      try {
        _.forEach(blocks, (block: any) => {
          let txt: string = block.text.toLowerCase();
          if (txt.startsWith(searchtext, 0)) {
            filteredBlocks.push(block);
          }
        });

        let cells = this.stencilGraph.getCells();
        _.forEach(cells, (cell) => {
            let view = this.stencilPaper.findViewByModel(cell)
            view.remove();
        });

        this.initDragPanel(this.stencilGraph)(filteredBlocks);
      } catch (error) {
        console.log(error);
      }
    }

    if (changes['paper'] != null && changes['paper'].currentValue != null) {
      if (this.stencilPaper == null) {
        this.ngOnInit();
      }
      this.stencilPaper.on('cell:pointerdown', (cellView, e, x, y) => {
        let paper = changes['paper'].currentValue;
        let graph = changes['graph'].currentValue;
        jQuery('body').append('<div id="flyPaper" style="position:fixed;z-index:100;opacity:.7;pointer-event:none;"></div>');
        let flyGraph = new joint.dia.Graph,
          flyPaper = new joint.dia.Paper({
            el: jQuery('#flyPaper'),
            model: flyGraph,
            interactive: false
          }),
          flyShape = this.getFlyCell(cellView),
          pos = cellView.model.position(),
          offset = {
            x: x - pos.x,
            y: y - pos.y
          };

        flyShape.position(0, 0);
        flyGraph.addCell(flyShape);
        jQuery("#flyPaper").offset({
          left: e.pageX - offset.x,
          top: e.pageY - offset.y
        });
        jQuery('body').on('mousemove.fly', (e) => {
          jQuery("#flyPaper").offset({
            left: e.pageX - offset.x,
            top: e.pageY - offset.y
          });
        });
        jQuery('body').on('mouseup.fly', (e) => {
          let x = e.pageX,
            y = e.pageY,
            target = paper.$el.offset();
          // Dropped over paper ?
          if (x > target.left && x < target.left + paper.$el.width() && y > target.top && y < target.top + paper.$el.height()) {
            let s = flyShape.clone();
            s.position(x - target.left - offset.x, y - target.top - offset.y);
            this.designerOps.addNode(s.id, cellView.model.attr('text/text'), cellView.model.attr('text/text'), s);
          }
          jQuery('body').off('mousemove.fly').off('mouseup.fly');
          flyShape.remove();
          jQuery('#flyPaper').remove();
        });
      });
    }
  }

}
