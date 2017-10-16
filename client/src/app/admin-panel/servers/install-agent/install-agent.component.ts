import { Component, OnInit, Input } from '@angular/core';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { AgentsService } from '../../../shared/services/agents.service';
import {SlimLoadingBarService} from 'ng2-slim-loading-bar';

import * as _ from 'lodash';


@Component({
  selector: 'modal-content',
  templateUrl: './install-agent.component.html',
  styleUrls: ['./install-agent.component.css'],
  providers: [AgentsService]
})
export class InstallAgentComponentWindow {
  @Input() agent: any;
  installing: boolean;

  constructor(public dialog: NgbActiveModal, private agentsService: AgentsService) {
    this.agent = {
      username: '',
      sshKey: '',
      port: 8080,
      url: 'localhost'
    };
    this.installing = false;
  }

  ngOnInit() {
    this.installing = false;
  }

  installAgent(agent) {
    this.startProgress();
    this.agentsService.install(this.agent).subscribe((res) => {
      this.closeWindow();
    });
  }

  startProgress() {
      this.installing = true;
  }

  closeWindow() {
    this.dialog.close();
  }

}
