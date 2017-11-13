import {Component, OnInit, OnDestroy, Input, ViewChild} from '@angular/core';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import 'chart.js';

import {MapService} from '../../shared/services/map.service';


@Component({
  selector: 'app-map-execution',
  templateUrl: './map-execution.component.html',
  styleUrls: ['./map-execution.component.css']
})
export class MapExecutionComponent implements OnInit, OnDestroy {
  @Input() mapNode: any;
  @ViewChild('myChart') myChart;
  execReq: any;
  executionResultsReq: any;
  execution: any;
  executionByProcesses: any;
  executionByAgents: any;
  selectedProcess: any = null;
  processesChunks: any[];
  processesChunksIndex: number = 0;
  actionChunksIndex: number = 0;

  red: string = '#f85656';
  yellow: string = '#eab839';
  green: string = '#44bb75';
  blue: string = '#00a8e9';


  constructor(public activeModal: NgbActiveModal, private mapsService: MapService) {
  }

  ngOnInit() {
    this.execReq = this.mapsService.getExecutionsList(this.mapNode.map).subscribe((executions) => {
      this.execution = executions[executions.length - 1]; // currently - get only the last execution.
      this.executionByAgents = this.execution.agentsExecutionResult;
      this.executionResultsReq = this.mapsService.getExecutionDetail(this.execution.id).subscribe((result) => {
        console.log(result);
        this.parseExecutionResult(result);
        this.initGraph();
      });
    })
  }

  ngOnDestroy() {
    this.execReq.unsubsctibe();
    this.executionResultsReq.unsubscribe();
  }

  parseExecutionResult(results) {
    for (let i in results) {
      let success = 0;
      let error = 0;
      results[i].agents.forEach((agent) => {
        if (agent.status === "success") {
          success++;
        } else {
          error++;
        }
        results[i].dataset = [success, error];
      })
    }
    this.executionByProcesses = _.toArray(results);
    this.processesChunks = this.chunk(this.executionByProcesses);
  }

  initGraph() {
    console.log(this.execution);
    let aggregate;
    _.each(this.executionByAgents, function (agent: Object) {
      let success = 0;
      let error = 0;
      if (agent['status'] === 'success') {
        success++;
      } else {
        error++;
      }
      aggregate = [success, error];
    });

    aggregate.push(parseInt(this.execution.startAgentsNumber) - this.executionByAgents.length);
    console.log(this.execution.startAgentsNumber);
    console.log(aggregate);

    let backColors = [
      this.green,
      this.red,
      this.yellow,
      this.blue
    ];

    let statusData = {
      labels: [
        'Success',
        'Failed',
        "Didn't run"
      ],
      datasets: [
        {
          data: aggregate,
          borderWidth: 0,
          backgroundColor: backColors
        }]
    };

    let statusCtx = this.myChart.nativeElement.getContext('2d');
    new Chart(statusCtx, {
      type: 'doughnut',
      data: statusData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: true,
          position: 'right'
        }
      }
    });

  }

  chunk(arr: any[], n = 3) {
    return _.chunk(arr, n)
  }

  nextProcessesChunk() {
    if (this.processesChunksIndex < this.processesChunks.length - 1) {
      this.processesChunksIndex++;
    }
  }

  previousProcessesChunk() {
    if (this.processesChunksIndex > 0) {
      this.processesChunksIndex--;
    }
  }

  nextActionsChunk() {
    if (this.actionChunksIndex < this.selectedProcess.actionChunks.length - 1) {
      this.actionChunksIndex++;
    }
  }

  previousActionsChunk() {
    if (this.actionChunksIndex > 0) {
      this.actionChunksIndex--;
    }
  }


  onSelectProcess(process, index) {
    this.actionChunksIndex = 0;
    process.actionChunks = this.chunk(_.toArray(process.actions));
    this.selectedProcess = process;
    this.selectedProcess.index = index;
  }



  closeWindow() {
    this.activeModal.close();
  }

}
