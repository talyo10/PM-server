import { Component, OnInit, OnDestroy } from '@angular/core';
import { AgentsService } from '../../shared/services/agents.service';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import { AddDedicatedAgentComponentWindow } from './add-dedicated-agent/add-dedicated-agent.component';

import * as _ from 'lodash';

@Component({
  selector: 'app-dedicated-agents',
  templateUrl: './dedicated-agents.component.html',
  styleUrls: ['./dedicated-agents.component.css'],
  providers: [AgentsService]
})
export class DedicatedAgentsComponent implements OnInit, OnDestroy {

  agents: any[];
  interval: any;

  constructor(public modalService: NgbModal, private agentsService: AgentsService) {
    this.agents = [];
    this.interval = null;
   }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  ngOnInit() {
    if (!this.interval) {
      this.interval = setInterval(this.refreshAgents(this), 5000); // TODO: find a better version for this to add the agent after done uploading
    }
    this.agentsService.all(false).subscribe((agentsData: any) => {
      let agents: any[] = _.cloneDeep(agentsData.servers);
      if (agents.length !== this.agents.length) {
        this.agents = agents;
      } else {
        for (let i = 0; i < agents.length; i++){
          if (agents[i].id !== this.agents[i].id) {
            this.agents = agents;
            break;
          }
        }
      }
    });
  }

  refreshAgents(agentsComp: DedicatedAgentsComponent) {
    return () => {
      agentsComp.ngOnInit();
    };
  }

  addAgent() {
    const modalRef = this
        .modalService
        .open(AddDedicatedAgentComponentWindow);
  }

  deleteAgent(agentIndex) {
    this.agentsService.remove(this.agents[agentIndex]).subscribe( res => {
      console.log('deleted agent');
    });
    this.agents.splice(agentIndex, 1);
  }

}
