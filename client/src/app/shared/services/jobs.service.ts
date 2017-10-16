import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { ConstsService } from './consts.service';

@Injectable()
export class JobsService {

  private serverUrl: string;

  constructor(private http: Http, public options: RequestOptions, private constsService: ConstsService) {
    let headers = new Headers({ 'Content-Type': 'application/json', withCredentials: true });
    this.options.headers = headers;
    this.serverUrl = this.constsService.getServerUrl();
  }

  deleteJob(jobId) {
    return this.http.get(this.serverUrl + 'ScheduledJob/deleteJob/' + jobId).map(this.extractData);
  }

  addJob(job) {
    return this.http.post(this.serverUrl + 'ScheduledJob/addJob', job).map(this.extractData);
  }

  getFutureJobs() {
    return this.http.get(this.serverUrl + 'ScheduledJob/getFutureJobs').map(this.extractData);
  }

  updateJob(job) {
    return this.http.post(this.serverUrl + 'ScheduledJob/updateJob', job).map(this.extractData);
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
