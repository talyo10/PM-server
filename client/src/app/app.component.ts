import { Component, ViewContainerRef, OnInit, ViewEncapsulation } from '@angular/core';
import { Http } from '@angular/http';
import { Router } from '@angular/router';

import * as  _ from 'lodash';

import { AuthenticationService } from './shared/services/authentication.service';
import { ConstsService } from './shared/services/consts.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app works!';

  constructor(private http: Http,
    private authenticationService: AuthenticationService, private router: Router, private constsService: ConstsService) {
  }

  ngOnInit() {
    this.authenticationService.isLoggedIn().subscribe((result) => {
      if (!result) {
        this.router.navigate(['login']);
      }
    },
      (error) => {
        this.router.navigate(['login']);
      });
  }
}

