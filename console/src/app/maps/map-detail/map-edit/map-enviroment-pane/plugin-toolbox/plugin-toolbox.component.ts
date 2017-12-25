import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';

import * as $ from "jquery";
import * as joint from "jointjs";

import { PluginsService } from "../../../../../plugins/plugins.service";
import { Plugin } from "../../../../../plugins/models/plugin.model";
import { MapDesignService } from "../../map-design.service";


@Component({
  selector: 'app-plugin-toolbox',
  templateUrl: './plugin-toolbox.component.html',
  styleUrls: ['./plugin-toolbox.component.scss']
})
export class PluginToolboxComponent implements AfterViewInit, OnDestroy {
  stencilGraph: joint.dia.Graph;
  stencilPaper: joint.dia.Paper;

  plugins: Plugin[];
  pluginsReq: any;
  pluginCell: any;

  constructor(private pluginsService: PluginsService, private designService: MapDesignService) {
  }

  ngAfterViewInit() {

    this.stencilGraph = new joint.dia.Graph;
    this.stencilPaper = new joint.dia.Paper({
      el: $("#stencil"),
      width: 400,
      height: 300,
      gridSize: 1,
      model: this.stencilGraph,
      interactive: false
    });

    let r1 = new joint.shapes.basic.Rect({
      position: {
        x: 10,
        y: 10
      },
      size: {
        width: 100,
        height: 40
      },
      attrs: {
        text: {
          text: 'Rect1'
        }
      }
    });

    this.pluginsReq = this.pluginsService.list().subscribe(plugins => {
      this.plugins = plugins.filter(plugin => {
        return plugin.type === "executer"
      });
      this.addPluginsToGraph();
    });

    this.stencilPaper.on('cell:pointerdown', (cellView, event, x, y) => {
        this.flyCell(cellView, event, x, y);
      }
    );
  }

  flyCell(cellView, event, x, y) {
    let self = this;

    $('body').append('<div id="flyPaper" style="position:fixed;z-index:100;opacity:.7;pointer-event:none;background: transparent"></div>');
    var flyGraph = new joint.dia.Graph,
      flyPaper = new joint.dia.Paper({
        el: $('#flyPaper'),
        model: flyGraph,
        interactive: false
      }),
      flyShape = cellView.model.clone(),
      pos = cellView.model.position(),
      offset = {
        x: x - pos.x,
        y: y - pos.y
      };

    flyShape.position(0, 0);
    flyGraph.addCell(flyShape);
    $("#flyPaper").offset({
      left: event.pageX - offset.x,
      top: event.pageY - offset.y
    });
    $('body').on('mousemove.fly', function (e) {
      $("#flyPaper").offset({
        left: e.pageX - offset.x,
        top: e.pageY - offset.y
      });
    });

    $('body').on('mouseup.fly', function (e) {
      let x = e.pageX;
      let y = e.pageY;


      $('body').off('mousemove.fly').off('mouseup.fly');
      flyShape.remove();
      self.designService.drop(x, y, cellView);
      $('#flyPaper').remove();
    });

  }


  addPluginsToGraph() {
    let PMCell = joint.dia.Element.define('examples.Ellipse', {
      markup: '<g class="rotatable"><g class="scalable"><rect/></g><text/></g>',
      attrs: {
        rect: {
          fill: 'white',
          stroke: 'black',
        },
        size: { width: 90, height: 62 },
      }
    });
    let itteration = 0;
    this.plugins.forEach(plugin => {
      let attr = { text: { text: plugin.name } };
      this.stencilGraph.addCell((new PMCell).attr(attr).position(0, itteration * 62));
      itteration++;
    });
  }


  ngOnDestroy() {
    this.pluginsReq.unsubscribe();
  }

}
