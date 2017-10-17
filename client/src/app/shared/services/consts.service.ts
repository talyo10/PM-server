import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare var jQuery:any;

@Injectable()
export class ConstsService {

  private serverUrl = environment.serverUrl;

  constructor() {
    if (environment.production) {
      this.serverUrl = 'http://' + window.location.host + "/";
    }
  }

  getServerUrl() {
    return this.serverUrl;
  }

}
