import { Component, OnInit, OnDestroy, Input, SimpleChange } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import { ServersPopupComponent } from '../../../shared/popups/servers-popup/servers-popup.component';
import { ServersService } from '../../../shared/services/servers.service';
import { MapService } from '../../../shared/services/map.service';

import * as _ from 'lodash';

@Component({
  selector: 'app-map-servers',
  templateUrl: './map-servers.component.html',
  styleUrls: ['./map-servers.component.css']
})
export class MapServersComponent implements OnInit, OnDestroy {

  map: any;
  agents: any[] = null;
  agentsReq: any;
  updateAgentsReq: any;
  search: any;
  interval: any;
  currentMapSubscription: Subscription;
  agentsStatusReq: any;
  

  constructor(public modalService: NgbModal, public  serverService: ServersService, private mapService: MapService) { }

  ngOnInit() {
    this.search = {
      type: 1, /* Search by name */
      text: ""
    };

    this.currentMapSubscription = this.mapService.getCurrentMapObservable()
      .subscribe(
        (map) => {
          this.map = map;

          // request agents for this map
          this.agentsReq = this.mapService.getMapAgents(map).subscribe((agents) => {
            this.agents = agents;

            if (agents) {
              this.agentsStatusReq = this.serverService.getAgentsStatusInterval().subscribe((agentsStatus) => {
                this.updateAgentStatus(agentsStatus);
              });
            }
          })
        }
    );
  }

  ngOnDestroy() {
    this.currentMapSubscription.unsubscribe();
    this.agentsReq.unsubscribe();
    if (this.agentsStatusReq) {
      this.agentsStatusReq.unsubscribe();
    }
    if (this.updateAgentsReq) {
      this.updateAgentsReq.unsubscribe();
    }
  }

  updateAgentStatus(agentsStatus) {
    for (let i in this.agents) { 
      this.agents[i].alive = agentsStatus[this.agents[i].key].alive
    }
  }

  addServer() {
    let dialog = this.modalService.open(ServersPopupComponent);
    dialog.result.then((data: any) => {
      this.updateAgentsReq = this.mapService.updateMapAgents(this.map, data).subscribe((agents) => {
        this.agents = agents;
      });
    });
  }

}
