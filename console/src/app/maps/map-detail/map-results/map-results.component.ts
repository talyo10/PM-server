import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from "rxjs/Subscription";
import * as _ from "lodash";

import { MapsService } from "../../maps.service";
import { MapStructure } from "../../models/map-structure.model";
import { MapResult } from "../../models/execution-result.model";
import { SocketService } from "../../../shared/socket.service";

@Component({
  selector: 'app-map-results',
  templateUrl: './map-results.component.html',
  styleUrls: ['./map-results.component.scss']
})
export class MapResultsComponent implements OnInit, OnDestroy {
  resultsReq: any;
  results: MapResult[];
  mapStructureSubscription: Subscription;
  mapStructure: MapStructure;
  loading: boolean = true;
  selectedResult: MapResult;
  selectedResultStructure: MapStructure;
  executionLogs: any[];
  executionLogsReq: any;
  messagesSubscription: Subscription;
  selectedProcess: any;
  processChunks: [[any]];
  processChunksIndex: number = 0;
  actionChunks: [[any]];
  actionChunksIndex: number = 0;

  agentAggregatedStatus: [{ name: string, value: number }];


  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };

  constructor(private mapsService: MapsService, private socketService: SocketService) {
  }

  ngOnInit() {
    this.mapStructureSubscription = this.mapsService.getCurrentMapStructure().subscribe(structure => {
      if (!structure)
        return;
      this.mapStructure = structure;
      this.resultsReq = this.mapsService.executionResults(this.mapStructure.map).subscribe(results => {
        this.results = results;
        this.loading = false;
      });
      this.executionLogsReq = this.mapsService.logsList(this.mapStructure.map).subscribe(logs => {
        this.executionLogs = logs;
        this.messagesSubscription = this.socketService.getMessagesAsObservable().subscribe(message => {
          console.log(message);
          this.executionLogs.unshift(message)
        })
      });
    });


  }

  ngOnDestroy() {
    this.mapStructureSubscription.unsubscribe();
    if (this.resultsReq)
      this.resultsReq.unsubscribe();
    if (this.executionLogsReq)
      this.executionLogsReq.unsubscribe();
  }

  onSelectResult(result?) {
    if (!result) {
      this.selectedResult = null;
      return ;
    }
    this.selectedResult = result;
    this.mapsService.getMapStructure(this.mapStructure.map, result.structure).subscribe(structure => {
      this.selectedResultStructure = structure;
      this.aggregateProcessesResults(result.agentsResults, this.selectedResultStructure);
    });
    this.aggregateAgentResults(result);

  }

  aggregateAgentResults(result) {
    let agentValues = {};
    let agentResults = result.agentsResults;
    agentResults.forEach(agent => {
      if (!agentValues[agent.status]) {
        agentValues[agent.status] = {
          name: agent.status,
          value: 0
        }
      }
      agentValues[agent.status].value++;
    });

    this.agentAggregatedStatus = _.toArray(agentValues);
  }

  aggregateProcessesResults(result, structure) {
    let processes = structure.processes.reduce((acc, cur, i) => {
      acc[cur._id] = cur;
      return acc
    }, {});
    // let processes = {};
    result.forEach(agent => {
      agent.processes.forEach(process => {
        if (!processes[process.process].agents)
          processes[process.process].agents = {};
        if (!processes[process.process].status)
          processes[process.process].status = {};
        if (!processes[process.process].status[process.status])
          processes[process.process].status[process.status] = { name: process.status, value: 0 };
        processes[process.process].status[process.status].value++;
        processes[process.process].agents[agent._id] = {
          _id: agent._id,
          status: agent.status,
          actions: process.actions,
          startTime: process.startTime,
          finishTime: process.finishTime
        };
      })
    });

    this.processChunks = (_.chunk(_.toArray(processes), 3));
  }

  onSelectProcess(process) {
    this.selectedProcess = process;
    for (let i = 0; i < this.selectedProcess.actions.length; i++) {
      let action = this.selectedProcess.actions[i];
      action.result = {};
      for (let j in process.agents) {
        action.result[j] = _.find(process.agents[j].actions, (o) => {
          return o.action === action._id;
        });
      }
    }
    this.actionChunks = _.chunk(this.selectedProcess.actions, 3);
  }

  previousProcessChunk() {
    if (this.processChunksIndex === 0)
      return;
    this.processChunksIndex--;
  }

  nextProcessChunk() {
    if (this.processChunksIndex === this.processChunks.length - 1)
      return;
    this.processChunksIndex++;
  }

  previousActionChunk() {
    if (this.actionChunksIndex === 0)
      return;
    this.actionChunksIndex--;
  }

  nextActionChunk() {
    if (this.actionChunksIndex === this.actionChunks.length - 1)
      return;
    this.actionChunksIndex++;
  }

}
