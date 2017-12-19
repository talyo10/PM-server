import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

import 'rxjs/add/operator/finally';

import { PluginsService } from "../plugins.service";


const serverUrl = environment.serverUrl;

@Component({
  selector: 'app-plugin-upload',
  templateUrl: './plugin-upload.component.html',
  styleUrls: ['./plugin-upload.component.scss']
})
export class PluginUploadComponent implements OnInit {

  constructor(private pluginsService: PluginsService) {
  }

  ngOnInit() {

  }


  onPluginSelect(event) {
    const files = event.target.files || event.srcElement.files;
    const file = files[0];
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    this.pluginsService.upload(formData)
      .finally(() => {
      })
      .subscribe(res => {
          console.log(res);
        },
        error => {
          console.log(error);
        });


  }

}
