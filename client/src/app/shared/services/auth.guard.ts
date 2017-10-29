import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { AuthenticationService } from './authentication.service'

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor (private authService: AuthenticationService, private route: Router) {}

  canActivateChild(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(next, state)
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.isLoggedIn()
      .then((r) => {
        return true;
      })
      .catch((err) => {
        this.route.navigate(['/login']);
        return false;
      }
    );
  }
}
