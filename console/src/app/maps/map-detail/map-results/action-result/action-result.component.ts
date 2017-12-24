import { Component, Input, OnInit } from '@angular/core';

import * as _ from "lodash";


@Component({
  selector: 'app-action-result',
  templateUrl: './action-result.component.html',
  styleUrls: ['./action-result.component.scss']
})
export class ActionResultComponent implements OnInit {
  @Input('action') action: any;
  tab: string = "summary";
  agResults: [{ name: string, value: number }];
  agResponse: [{ name: string, value: number }];
  agents: any[];


  constructor() {
  }

  ngOnInit() {
    this.agents = _.toArray(this.action.result);
    if (this.agents.length === 0)
      return;
    let results = {};
    for (let i in this.action.result) {
      let action = this.action.result[i];
      if (!action || !action.result)
        continue;
      if (action.result.res) {

        if (!results[action.result.res])
          results[action.result.res] = { name: action.result.res, value: 0 };
        results[action.result.res].value++;
      } else {
        if (!results[action.result])
          results[action.result] = { name: action.result, value: 0 };
        results[action.result].value++;
      }
    }
    this.agResponse = _.toArray(results);
    let agResults = this.agents.reduce((total, current) => {
      total[current.status] = (total[current.status] || 0) + 1;
      return total;
    }, {});
    Object.keys(agResults).map((key, index) => {
      agResults[key] = {name: key, value: agResults[key]}
    });
    this.agResults = _.toArray(agResults);
  }
}
