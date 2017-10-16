import { Component, OnInit } from '@angular/core';
import { Response } from '@angular/http';
import { Router } from '@angular/router';

import { AuthenticationService } from '../shared/services/authentication.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  public currentPanel: number = 0;
  public error: string = '';
  constructor(private authenticationService: AuthenticationService, private router: Router) {
  }

  ngOnInit() {
    this.error = '';
  }

  register(username, password, passwordAgain, email) {
    if (password !== passwordAgain) {
      this.error = 'Passwords are not equal.';
      return;
    }
    this.authenticationService.register({ 'username': username, 'password': password, 'email': email }).subscribe((res) => {
      this.router.navigate(['login']);
    },
    (err: Response) => {
      this.error = err.statusText;
    });
  }

  gotoLogin() {
    this.router.navigate(['login']);
  }

}
