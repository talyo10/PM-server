import { Component, OnInit } from '@angular/core';
import { AgentsService } from "../../../../../../agents/agents.service";

import { BsModalRef } from "ngx-bootstrap";
import { TreeNode } from 'primeng/primeng';

import { Agent } from "../../../../../../agents/models/agent.model";
import { Subject } from "rxjs/Subject";

@Component({
  selector: 'app-select-agent',
  templateUrl: './select-agent.component.html',
  styleUrls: ['./select-agent.component.scss']
})
export class SelectAgentComponent implements OnInit {
  agents: [Agent];
  agentsReq: any;
  agentsTree: TreeNode[];
  selectedNodes: TreeNode[];
  selectedAgents: Agent[] = [];

  public result: Subject<any> = new Subject();


  constructor(public bsModalRef: BsModalRef, private agentsService: AgentsService) {
  }

  ngOnInit() {
    this.agentsReq = this.agentsService.list().subscribe(agents => {
      this.agents = agents;
      this.agentsTree = this.agentsService.buildAgentsTree(agents);
    });

  }

  onConfirm(): void {
    this.result.next(this.selectedAgents);
    this.bsModalRef.hide();
  }

  nodeSelect(event) {
    this.selectedAgents.push(event.node.data);
  }

  onClose(): void {
    this.bsModalRef.hide();
  }

}
