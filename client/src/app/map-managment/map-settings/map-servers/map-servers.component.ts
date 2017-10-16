import { Component, OnInit, Input, OnChanges, SimpleChange, OnDestroy } from '@angular/core';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';


import { ServersPopupComponent } from '../../../shared/popups/servers-popup/servers-popup.component';

import { ServersService } from '../../../shared/services/servers.service';

import * as _ from 'lodash';

@Component({
  selector: 'app-map-servers',
  templateUrl: './map-servers.component.html',
  styleUrls: ['./map-servers.component.css']
})
export class MapServersComponent implements OnInit, OnChanges, OnDestroy {

  @Input() map: any;
  servers: any[];
  search: any;
  interval: any;

  constructor(public modalService: NgbModal, public  serverService: ServersService) { }

  ngOnInit() {
    this.search = {
      type: 1, /* Search by name */
      text: ""
    };

    this.interval = setInterval(this.getAgents(this), 5000);
    this.getAgents(this)();
  }

  ngOnChanges(changes: { [propertyName: string]: SimpleChange }): void {
    if (changes['map'].currentValue != null) {
      this.servers = _.filter(_.toArray(this.map.activeServers), (o: any) => { return o.active; });
    }
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  getAgents(serversComponent: MapServersComponent) {
    return () => {
      let agentsArray = [];
      let resServers =[];
      var activeServers =  _.toArray(this.map.activeServers);
      console.log(activeServers);
      serversComponent.serverService.getAgents().subscribe((res) => {
        let agents = res;
        serversComponent.serverService.getStatus().subscribe((resp) => {
          agentsArray = resp;
          _.each(agents, (agent: any) => {
            for(let key in agentsArray[agent.key]) {
              agent[key] = agentsArray[agent.key][key];
            }
            if (_.findIndex(activeServers, (v: any) => { return v.key == agent.key; }) != -1) {
                resServers.push(agent);
            }
          });
          serversComponent.servers = resServers;
        }, (err) => {
          console.log(err);
        });
      });
    };
  }

  addServer() {
    let dialog = this.modalService.open(ServersPopupComponent);
    dialog.componentInstance.map = this.map;
    dialog.result.then((data: any) => {
      this.servers = _.filter(_.toArray(this.map.activeServers), (o: any) => { return o.active; });
    });
  }

}
