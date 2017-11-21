import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TriggerService } from '../../../../shared/services/trigger.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';


@Component({
  selector: 'app-add-trigger',
  templateUrl: './add-trigger.component.html',
  styleUrls: ['./add-trigger.component.css']
})
export class AddTriggerComponent implements OnInit, OnDestroy {
  plugins: any[];
  triggerReq: any;
  methodReq: any;
  selectedPlugin: any;
  selectedMethod: any;
  form: FormGroup;
  trigger: any;
  paramsForm: any;

  constructor(public dialog: NgbActiveModal, private triggersService: TriggerService) { }

  ngOnInit() {
    this.triggerReq = this.triggersService.getTriggersPlugin().subscribe((plugins) => {
      this.plugins = plugins;
    });

    this.trigger = {
      name: null,
      plugin: null,
      method: null,
      params: null
    }


  }

  ngOnDestroy() {
    this.triggerReq.unsubscribe();
    if (this.methodReq) {
      this.methodReq.unsubscribe();
    }
  }

  onSelectPlugin(index) {
    if (!this.plugins[index].methods) {
      this.methodReq = this.triggersService.getMethods(this.plugins[index].id).subscribe((methods) => {
        this.plugins[index].methods = methods;
        this.selectedPlugin.methods = methods;
      });
    }
    this.selectedPlugin = this.plugins[index];
    this.selectedMethod = null;
  }

  onSelectMethod(index) {
    this.selectedMethod = this.selectedPlugin.methods[index];
    let params = {};
    this.selectedMethod.params.forEach(param => {
      params[param.name] = null;
    });
    this.trigger.params = params;
  }

  createTrigger() {
    let params = {};
    this.selectedMethod.params.forEach(param => {
      let p = {
        id: param.id,
        type: param.type,
        value: this.trigger.params[param.name],
        viewName: param.viewName
      }
      params[param.name] = p;
    })
    this.dialog.close({ name: this.trigger.name, plugin: this.selectedPlugin.id, method: this.selectedMethod.id, params: params })
  }

}
