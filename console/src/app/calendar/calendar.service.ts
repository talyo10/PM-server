import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { Job } from "./models/job.model";

const serverUrl = environment.serverUrl;


@Injectable()
export class CalendarService {

  constructor(private http: HttpClient) {
  }

  deleteJob(jobId) {
    return this.http.get(serverUrl + 'api/maps/scheduledJob/deleteJob/' + jobId, { responseType: 'text' as 'json' });
  }

  addJob(job) {
    return this.http.post<Job>(serverUrl + 'api/maps/scheduledJob/addJob', job);
  }

  getFutureJobs() {
    return this.http.get<Job[]>(serverUrl + 'api/maps/scheduledJob/getFutureJobs');
  }

  updateJob(job) {
    return this.http.put<Job>(serverUrl + 'api/maps/scheduledJob/updateJob', job);
  }

}
