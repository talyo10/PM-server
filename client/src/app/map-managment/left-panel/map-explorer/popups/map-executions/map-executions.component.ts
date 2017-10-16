import { Component, Input } from '@angular/core';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import { ExecutionReportComponent } from '../../execution-report/execution-report.component';

import { MapService } from '../../../../../shared/services/map.service';

import * as _ from 'lodash';

/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
  selector: 'modal-content',
  styleUrls: ['map-executions.component.css'],
  templateUrl: 'map-executions.component.html',
  providers: [MapService]
})
export class MapExecutionsComponent {
  @Input() map: any;
  @Input() version: any;

  constructor(private mapService: MapService,
              public dialog: NgbActiveModal,
              public modalService: NgbModal) {
  }

  openExecution(execution) {
    const pmodal = this.modalService.open(ExecutionReportComponent);
    pmodal.componentInstance.map = this.map;
    pmodal.componentInstance.execution = execution;
  }

  closeWindow() {
    console.log('closing window');
    this.dialog.close();
  }
}
