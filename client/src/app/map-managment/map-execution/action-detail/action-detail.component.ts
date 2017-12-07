import {Component, OnInit, Input, ViewChild} from '@angular/core';

import 'chart.js'


@Component({
  selector: 'app-action-detail',
  templateUrl: './action-detail.component.html',
  styleUrls: ['./action-detail.component.css']
})
export class ActionDetailComponent implements OnInit {
  @Input() action: any;
  @ViewChild('agResponse') agResponse;
  @ViewChild('agStatus') agStatus;

  red: string = '#f85656';
  yellow: string = '#eab839';
  green: string = '#44bb75';
  blue: string = '#00a8e9';

  constructor() {
  }

  ngOnInit() {
    console.log(this.action);
    this.initResponseGraph();
    this.initStatusGraph();

  }

  initStatusGraph() {
    let success = 0;
    let error = 0;
    this.action.agents.forEach((agent) => {
      if (agent.agent.status === 'success') {
        success++;
      } else {
        error++;
      }
    });
    let data = [success, error]
    let labels = ["Success", "Error"];
    let colors = [this.green, this.red];

    let statusData = {
      labels: labels,
      datasets: [
        {
          data: data,
          borderWidth: 0,
          backgroundColor: colors
        }]
    }

    let statusCtx = this.agStatus.nativeElement.getContext('2d');
    new Chart(statusCtx, {
      type: 'doughnut',
      data: statusData,
      options: {
        legend: {
          display: false
        }
      }
    });
  }

  initResponseGraph() {
    let aggregate = {};
    this.action.agents.forEach((agent) => {
      if (!aggregate[agent.result.res])
        aggregate[agent.result.res] = 0;
      aggregate[agent.result.res]++;
    });
    let data = [];
    let labels = [];
    let colors = [this.red, this.green, this.blue, this.yellow];
    for (let i in aggregate) {
      data.push(aggregate[i]);
      labels.push(i);
    }

    let statusData = {
      labels: labels,
      datasets: [
        {
          data: data,
          borderWidth: 0,
          backgroundColor: colors
        }]
    }

    let statusCtx = this.agResponse.nativeElement.getContext('2d');
    new Chart(statusCtx, {
      type: 'doughnut',
      data: statusData,
      options: {
        legend: {
          display: false
        }
      }
    });
  }

}
