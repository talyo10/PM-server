import { OnInit, OnDestroy, Component, Input } from '@angular/core';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import { ServersService } from '../../../shared/services/servers.service';

import * as _ from 'lodash';


// tslint:disable-next-line:use-life-cycle-interface
@Component({
  selector: 'modal-content',
  templateUrl: './servers-popup.component.html',
  styleUrls: ['./servers-popup.component.css']
})
export class ServersPopupComponent {
  servers: any[] = [];
  search: any;
  interval: any;
  @Input() map: any;
  selected: boolean = false;
  unselected: boolean = false;
  selectedServers: any = {};

  constructor(public dialog: NgbActiveModal, public serverService: ServersService) {
  }

  ngOnInit() {
    this.selectedServers = {};
    this.search = {
      type: 0
    };
    this.servers = [];
    this.selected = false;
    this.unselected = false;
    this.interval = setInterval(this.getServers(this), 1000);
    this.getServers(this)();
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  getServers(serversComponent: ServersPopupComponent) {
    return () => {
      let servers = [];
      let serverList = [];

      if (!serversComponent.map || !serversComponent.map.activeServers) {
          return;
      }
      serversComponent.serverService.getAgents().subscribe((res) => {
        if (this.selected) {
          res = _.filter(res, function(o: any) { 
            return serversComponent.map.activeServers[o.id].active;
          });
        }

        if (this.unselected) {
          res = _.filter(res, function(o: any) {
            return !serversComponent.map.activeServers[o.id].active;
          });
        }

        servers = res;
        serversComponent.serverService.getStatus().subscribe((resp) => {
          let serversArray = resp;
          _.each(servers, (server: any) => {
            for(let key in serversArray[server.key]) {
              server[key] = serversArray[server.key][key];
            }
          });
          _.each(servers, (server: any) => {
            serverList.push(server);
            if (!this.selectedServers.hasOwnProperty(server.id)) {
              if (!serversComponent.map.activeServers[server.id]) {
                this.selectedServers[server.id] = false;
              } else {
                this.selectedServers[server.id] = serversComponent.map.activeServers[server.id].active;
              }
            }
          });
          serversComponent.servers = serverList;
        }, (err) => {
          console.log(err);
        });
      });
    };
  }

  clearFilter(search: any) {
    search.type = 0;
  }

  closeWindow() {
    this.dialog.close();
  }

  onChange(agent) {
    if (!this.selectedServers[agent.id]) {
      this.selectedServers[agent.id] = true;
    } else {
      this.selectedServers[agent.id] = !this.selectedServers[agent.id];
    }
  }

  apply() {
    this.map.activeServers = {};
    _.forEach(this.servers, (server) => {
        server.active = this.selectedServers[server.id];
        if (server.active) {
          this.map.activeServers[server.id] = server;
        }
    });
    this.closeWindow();
  }

  showUnSelected() {
    this.unselected = !this.unselected;
    this.servers = _.filter(this.servers, (o: any) => { 
      return !this.map.activeServers[o.id].active;
    });
  }

  showSelected() {
    this.selected = !this.selected;
    this.servers = _.filter(this.servers, (o: any) => {
      return this.map.activeServers[o.id].active;
    });
  }

}
