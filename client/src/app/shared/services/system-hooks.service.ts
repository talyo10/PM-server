import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Response } from '@angular/http';
import { ConstsService } from './consts.service';
import * as _ from 'lodash';

@Injectable()
export class SystemHooksService {

    private serverUrl: string;

    constructor(private http: Http, public options: RequestOptions, private constsService: ConstsService) {
        let headers = new Headers({ 'Content-Type': 'application/json', withCredentials: true });
        this.options = new RequestOptions({ headers: headers });
        this.serverUrl = this.constsService.getServerUrl();
      }
    
      getHooks() {
        return this.http.get(this.serverUrl + 'SystemHooks/getHooks').map(this.extractData);
      }

      remove(id) {
        return this.http.get(this.serverUrl + 'SystemHooks/deleteHook/' + id).map(this.extractData);
      }

      private extractData(res: Response) {
        try {
          let body = res.json();
          return body || {};
        } catch (ex) {
          return {};
        }
      }
}