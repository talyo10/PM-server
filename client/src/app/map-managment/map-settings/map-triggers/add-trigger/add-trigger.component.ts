import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TriggerService } from '../../../../shared/services/trigger.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import * as _ from "lodash";


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
  params: any;
  name: any;

  constructor(public dialog: NgbActiveModal, private triggersService: TriggerService) { }

  ngOnInit() {
    this.trigger = {
      name: null,
      plugin: null,
      method: null,
      params: null
    }
    
    this.triggerReq = this.triggersService.getTriggersPlugin().subscribe((plugins) => {
      this.plugins = plugins;
      if (this.selectedPlugin) {
        let index = _.findIndex(this.plugins, (plugin) => {
          return plugin.id === this.selectedPlugin.id;
        })
        this.methodReq = this.triggersService.getMethods(this.selectedPlugin.id).subscribe((methods) => {
          this.plugins[index].methods = methods;
          this.selectedPlugin.methods = methods;
          if (this.selectedMethod) {
            let methodIndex = _.findIndex(this.selectedPlugin.methods, (method) => {
              return method['id'] === this.selectedMethod.id;
            })
            this.selectedMethod = this.selectedPlugin.methods[methodIndex];
            let params = {};
            if (!this.params) {
              this.selectedMethod.params.forEach(param => {
                console.log(param);
                params[param.name] = null;
              });
            } else {
              for (let param in this.params){
                params[this.params[param]["name"]] = this.params[param]["value"];
              }
            }

            this.trigger = {
              name: this.name,
              plugin: this.selectedPlugin? this.selectedPlugin.id: null,
              method: this.selectedMethod? this.selectedMethod.id: null,
              params: params
            }
          }
        });
      }

    });
  }

  ngOnDestroy() {
    this.triggerReq.unsubscribe();
    if (this.methodReq) {
      this.methodReq.unsubscribe();
    }
  }

  onSelectPlugin(pluginId) {
    let index = _.findIndex(this.plugins, (plugin) => {
      return plugin.id === pluginId
    })

    if (!this.plugins[index].methods) {
      this.methodReq = this.triggersService.getMethods(pluginId).subscribe((methods) => {
        this.plugins[index].methods = methods;
        this.selectedPlugin = this.plugins[index];
    
      });
    }
    this.selectedMethod = null;
  }

  onSelectMethod(methodId) {
    let index = _.findIndex(this.selectedPlugin.methods, (method) => {
      return method['id'] === methodId
    })
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
        viewName: param.viewName,
        name: param.name
      }
      params[param.name] = p;
    })
    this.dialog.close({ name: this.trigger.name, plugin: this.selectedPlugin.id, method: this.selectedMethod.id, params: params })
  }

  closeDialog() {
    this.dialog.close();
  }

}
