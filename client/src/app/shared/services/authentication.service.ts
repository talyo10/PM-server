import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { ConstsService } from './consts.service';

import { Observable } from 'rxjs/Observable';

import { LocalStorageService } from 'angular-2-local-storage';
import * as _ from 'lodash';

@Injectable()
export class AuthenticationService {

  private currentUser: any;
  private userKeyName: string = 'pm-user';
  private serverUrl: string;

  constructor(private http: Http, public options: RequestOptions, private localStorageService: LocalStorageService, private constsService: ConstsService) {
    let headers = new Headers({ 'Content-Type': 'application/json', withCredentials: true });
    this.options = new RequestOptions({ headers: headers });
    this.serverUrl = this.constsService.getServerUrl();
    // TODO: Use official Angular2 CORS support when merged (https://github.com/angular/angular/issues/4231).
    let _build = (<any>http)._backend._browserXHR.build;
    (<any>http)._backend._browserXHR.build = () => {
      let _xhr = _build();
      _xhr.withCredentials = true;
      return _xhr;
    };
  }

  isLoggedIn(): Promise<boolean> {
    /* checking if user is logged in */
    return new Promise((res, rej) => {
      // if (this.localStorageService.get(this.userKeyName)) {
      //   // check if there is a user in local storage
      //   this.currentUser = JSON.parse(this.localStorageService.get(this.userKeyName));
      //   console.log(JSON.parse(this.localStorageService.get(this.userKeyName)));
      // }
      // if(this.currentUser && !_.isEmpty(this.currentUser)) {
      //   return res(true);
      // }
      this.http.get(this.serverUrl + 'isLoggedIn', this.options).subscribe(
        (r) => {
          return res(true)
        },
        (error) => {
          return rej(error);
        }
      )
    })
  }

  login(username, password) {
    return this.http.post(this.serverUrl + 'auth/local', {
      identifier: username,
      password: password
    }).map(this.extractData).map((result) => {
      this.currentUser = result;
      this.localStorageService.set(this.userKeyName, JSON.stringify(this.currentUser));
      return this.currentUser;
    });
  }

  logout() {
    return this.http.get(this.serverUrl + 'logout').map(this.extractData).map((result) => {
      this.currentUser = {};
      this.localStorageService.set(this.userKeyName, JSON.stringify(this.currentUser));
      return this.currentUser;
    });
  }

  register(user) {
    return this.http.post(this.serverUrl + 'auth/local/register', user).map(this.extractData).map((result) => {
      this.currentUser = result;
      this.localStorageService.set(this.userKeyName, JSON.stringify(this.currentUser));
      return this.currentUser;
    });
  }

  getCurrentUser() {
    if (!this.currentUser) {
      this.currentUser = this.localStorageService.get(this.userKeyName);
      this.currentUser = JSON.parse(this.currentUser);
    }
    return this.currentUser;
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
