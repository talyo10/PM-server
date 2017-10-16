import { OnInit, Component, ViewEncapsulation, Input } from '@angular/core';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import { AgentsService } from '../../../../shared/services/agents.service';

import * as _ from 'lodash';

@Component({
  selector: 'modal-content',
  styleUrls: ['action.component.css'],
  templateUrl: 'action.component.html',
  encapsulation: ViewEncapsulation.None,
  providers: [AgentsService]
})
export class ActionsComponentWindow {
  @Input() action: any = {};
  @Input() serverType: any;
  @Input() header: string;

  constructor(public dialog: NgbActiveModal,
    private agentsService: AgentsService) {
      let action = {
        server: {},
        method: {},
        params: {},
        name: '',
        timeout: 0,
        timeunit: '1',
        retries: 0,
        mandatory: false,
        suspend: false,
        result: '',
        id: ''
      };
  }

  ngOnInit() {
    console.log("action on init");
    console.log(this.action);
    
    console.log(this.serverType);
    this.agentsService.all(false).subscribe((res) => {
      if (_.isEmpty(this.action.server)) {
        this.action.server = _.cloneDeep(this.agentsService.get(this.serverType));
        console.log(this.action.server);
      }
    });
  }

  onChange(methodName) {
    this.action.method = _.find(this.action.server.methods, (m: any) => {
      return m.name === methodName;
    });
  }

  closeWindow() {
    this.dialog.close();
  }

  cancel() {
    this.dialog.close();
  }

  save() {
    let now = new Date();
    this.action.lastUpdate = now;
    this.dialog.close(this.action);
  }
}
