import {Component, Input, OnInit, ViewChild} from '@angular/core';

import 'chart.js';

@Component({
  selector: 'app-proccess-detail',
  templateUrl: './proccess-detail.component.html',
  styleUrls: ['./proccess-detail.component.css']
})
export class ProccessDetailComponent implements OnInit {
  @Input() process;
  @Input() selected;
  @ViewChild('processChart') processChart;

  red: string = '#f85656';
  yellow: string = '#eab839';
  green: string = '#44bb75';
  blue: string = '#00a8e9';

  constructor() {  }

  ngOnInit() {
    console.log(this.selected);

    let success = 0;
    let error = 0;
    this.process.agents.forEach((agent) => {
      if (agent.status === "success") {
        success++;
      } else {
        error++;
      }
      this.process.dataset = [success, error];
    });
    console.log(this.process);
    this.initGraph();
  }

  initGraph() {

    let statusData = {
      labels: [
        'Success',
        'Failed',
      ],
      datasets: [
        {
          data: this.process.dataset,
          borderWidth: 0,
          backgroundColor: [this.green, this.red]
        }]
    }
    let statusCtx = this.processChart.nativeElement.getContext('2d');
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
