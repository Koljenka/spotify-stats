import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {Router} from '@angular/router';
import {CookieService} from '../cookie.service';
import {ApiConnectionService} from '../api-connection.service';
import {DataSharingService} from '../data-sharing.service';
import {TokenService} from '../token.service';
import {BreakpointObserver} from '@angular/cdk/layout';
import {isPlatformBrowser} from '@angular/common';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit {
  title = 'Spotify Stats';
  username = '';
  requestedUsername = false;

  constructor(@Inject(PLATFORM_ID) private platformId: object, public breakpointObserver: BreakpointObserver, private api: ApiConnectionService, public router: Router, public cookie: CookieService) {
  }

  ngOnInit(): void {
  }

  getUserName(): string {
    return this.api.userId;
  }

  redirect(): void {
    this.router.navigate(['/home']);
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      TokenService.refreshToken = TokenService.accessToken = '';
      this.cookie.deleteCookie('isLoggedIn');
    }
    this.redirect();
  }


}
