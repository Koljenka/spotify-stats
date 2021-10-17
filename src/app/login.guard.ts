import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {CookieService} from './cookie.service';
import {StorageService} from './storage.service';
import {ApiConnectionService} from './api-connection.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  constructor(private cookie: CookieService, private router: Router, private api: ApiConnectionService) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.cookie.isLoggedIn()) {
      return this.api.waitForApi().then(() => Promise.resolve(true));
    }
    StorageService.redirect = state.url;
    return this.router.navigate(['home']);
  }

}
