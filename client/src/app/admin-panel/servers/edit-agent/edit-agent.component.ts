import { Component, ViewEncapsulation, Input } from '@angular/core';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConstsService} from '../../../shared/services/consts.service';
import { ServersService } from '../../../shared/services/servers.service';


import * as _ from 'lodash';

@Component({
  selector: 'modal-content',
  templateUrl: './edit-agent.component.html',
  styleUrls: ['./edit-agent.component.css'],
  providers: [ServersService]
})
export class EditAgentComponentWindow {
  @Input() agent: any;
  @Input() parentId: any;
  updatingAgent: boolean;

  constructor(public dialog: NgbActiveModal, private constsService: ConstsService, private serversService: ServersService) {
    this.updatingAgent = false;
  }

  addAttribute() {
    let attribute = {
      type: 'String',
      name: '',
      value: ''
    };
    if (!this.agent.attributes) {
      this.agent.attributes = [];
    }
    this.agent.attributes.push(attribute);
  }

  deleteAttribute($event, index) {
    this.agent.attributes.splice(index, 1);
  }

  updateAgent(agent) {
    this.updatingAgent = true;
    this.serversService.updateAgent(this.parentId, agent).subscribe((res) => {
      this.updatingAgent = false;
      this.dialog.close();
    });
  }

  closeWindow() {
    this.dialog.close();
  }

}
