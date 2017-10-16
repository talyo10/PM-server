import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../shared/services/authentication.service';
import { Router } from '@angular/router';
import { Response } from '@angular/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  public currentPanel: number = 0;
  public error: string = '';

  constructor(private authenticationService: AuthenticationService, private router: Router) {
  }

  ngOnInit() {
    this.error = '';
  }

  login(username, password) {
    this.authenticationService.login(username, password).subscribe((res) => {
      console.log('login clicked returned');
      this.router.navigate(['']);
    },
    (err: Response) => {
      if (err.status === 400) {
        this.error = 'Wrong username or password';
      } else {
        this.error = 'Something went wrong at the server';
      }
    });
  }

  gotoRegister() {
    this.router.navigate(['register']);
  }

}
