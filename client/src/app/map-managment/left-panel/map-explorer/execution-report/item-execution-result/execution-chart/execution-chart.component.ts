import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';

import * as _ from 'lodash';
declare var jQuery:any;
import 'chart.js';

@Component({
  selector: 'app-execution-chart',
  templateUrl: './execution-chart.component.html',
  styleUrls: ['./execution-chart.component.css']
})
export class ExecutionChartComponent implements OnInit, AfterViewInit {

  @ViewChild('chart') chart;
  red: string = '#f85656';
  yellow: string = '#eab839';
  green: string = '#44bb75';
  blue: string = '#00a8e9';

  constructor() { }

  ngOnInit() {}
  ngAfterViewInit() {
    /* Init status chart */
    let data = {
      labels: [
        "Red",
        "Blue",
        "Yellow",
        "asdsd"
      ],
      datasets: [
        {
          data: [300, 50, 100, 222],
          backgroundColor: [
            this.red,
            this.green,
            this.yellow,
            this.blue
          ],
          hoverBackgroundColor: [
            this.red,
            this.green,
            this.yellow,
            this.blue
          ],
          borderWidth: 0,
        }]
    };


    /* only needed for debug */
    window.setTimeout(() => {
      let ctx = this.chart.nativeElement.getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          legend: {
            display: false
          }
        }
      });
    }, 100);

  }

}
