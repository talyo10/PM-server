import { Component, Input, OnInit } from '@angular/core';
import * as _ from "lodash";

@Component({
  selector: 'app-process-result',
  templateUrl: './process-result.component.html',
  styleUrls: ['./process-result.component.scss']
})
export class ProcessResultComponent implements OnInit {
  @Input('process') process: any;
  tab: string = 'summary';
  agRes: [{ name: string, value: number }];
  agents: any[];

  constructor() {
  }

  ngOnInit() {
    this.agRes = _.toArray(this.process.status);
    this.agents = _.toArray(this.process.agents);
  }

}
