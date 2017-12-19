import { Component, OnDestroy, OnInit } from '@angular/core';
import { PluginsService } from "../plugins.service";

import { Plugin } from "../models/plugin.model";

@Component({
  selector: 'app-plugins-list',
  templateUrl: './plugins-list.component.html',
  styleUrls: ['./plugins-list.component.scss']
})
export class PluginsListComponent implements OnInit, OnDestroy {
  plugins: [Plugin];
  pluginsReq: any;

  constructor(private pluginsService: PluginsService) {
  }

  ngOnInit() {
    this.pluginsReq = this.pluginsService.list().subscribe(plugins => {
      this.plugins = plugins;
    })
  }

  ngOnDestroy() {
    this.pluginsReq.unsubscribe();
  }

  deletePlugin(id, index) {
    this.pluginsService.delete(id).subscribe(() => {
      this.plugins.splice(index, 1);
    })
  }

}
