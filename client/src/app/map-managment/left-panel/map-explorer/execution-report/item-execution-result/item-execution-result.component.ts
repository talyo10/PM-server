import { OnInit, Component, Input, ViewChild, AfterViewInit, OnChanges, SimpleChange } from '@angular/core';

import * as _ from 'lodash';
import 'chart.js';
declare var jQuery:any;

@Component({
  selector: 'app-item-execution-result',
  templateUrl: './item-execution-result.component.html',
  styleUrls: ['./item-execution-result.component.css']
})
export class ItemExecutionResultComponent implements OnInit, AfterViewInit, OnChanges {

  map: any = {};
  @Input() process: any = {};
  @ViewChild('aggStatusChart') aggStatusChart;
  @ViewChild('aggResultsChart') aggResultsChart;
  tab: number;
  doughnutChartOptions: any = {
    reponsive: true,
    maintainAspectRatio: false
  };


  // Doughnut
  public aggeregatedStatusData: any[] = [];
  public doughnutChartType: string = 'doughnut';
  aggregatedResultsData: number[] = [];
  aggregatedResulsLabels: any[] = [];
  agents: any[] = [];
  red: string = '#f85656';
  yellow: string = '#eab839';
  green: string = '#44bb75';
  blue: string = '#00a8e9';
  // events
  public chartClicked(e: any): void {
    console.log(e);
  }

  public chartHovered(e: any): void {
    console.log(e);
  }

  constructor() {
  }

  ngOnInit() {
    this.tab = 1; /* 1 = the status view */
    this.process.status = 0;
    let successNum = 0;
    let failNum = 0;
    let partialNum = 0;
    let didntRunNum = 0;
    let resultsData = {};
    this.aggregatedResulsLabels = [];
    _.each(this.process.agents, (agent: any) => {
      this.process.status += agent.status;
      if (agent.status < 0) {
        failNum++;
      } else {
        successNum++;
      }
      if (!resultsData[agent.result]) {
        resultsData[agent.result] = 0;
        this.aggregatedResulsLabels.push({
          text: agent.result,
          color: this.getRandomColor()
        });
      }

      resultsData[agent.result] = resultsData[agent.result] + 1;
    });
    this.aggeregatedStatusData = [
      successNum,
      partialNum,
      failNum,
      didntRunNum
    ];

    this.aggregatedResultsData = _.map(resultsData, (res: number) => { return res; });
    this.agents = _.map(this.process.agents, (agent: any, agentName: string) => {
      let newAgent = _.cloneDeep(agent);
      newAgent.name = agentName;
      return newAgent;
     });
  }

  getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  ngAfterViewInit() {
    this.initStatusChart();
    this.initResultsChart();
  }

  initStatusChart() {

    let backColors = [
      this.green,
      this.yellow,
      this.red,
      this.blue
    ];

    /* Init status chart */
    let StatusData = {
      labels: [
        'Success',
        'Partial',
        'Failed',
        "Didn't Run"
      ],
      datasets: [
        {
          data: this.aggeregatedStatusData,
          backgroundColor: backColors,
          borderWidth: 0,
          hoverBackgroundColor: backColors
        }]
    };

    let statusCtx = this.aggStatusChart.nativeElement.getContext('2d');
    new Chart(statusCtx, {
      type: 'doughnut',
      data: StatusData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false
        }
      }
    });
  }

  initResultsChart() {
    /* Init Results chart */
    let backColors = _.map(this.aggregatedResulsLabels, (item) => { return item.color; } );
    let labels = _.map(this.aggregatedResulsLabels, (item) => { return item.text; });
    let resultsChartData = {
      labels: labels,
      datasets: [
        {
          data: this.aggregatedResultsData,
          backgroundColor: backColors,
          borderWidth: 0,
          hoverBackgroundColor: backColors
        }]
    };

    let resultsCtx = this.aggResultsChart.nativeElement.getContext('2d');
    new Chart(resultsCtx, {
      type: 'doughnut',
      data: resultsChartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false
        }
      }
    });
  }

  ngOnChanges(changes: { [propertyName: string]: SimpleChange }): void {
    if (changes['process'].currentValue != null) {
      this.ngOnInit();
      this.ngAfterViewInit();
    }
  }

}
