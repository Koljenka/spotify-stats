import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {CookieService} from '../cookie.service';
import {ApiConnectionService} from '../api-connection.service';
import {DataSharingService} from '../data-sharing.service';
import {TokenService} from '../token.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit {

  title = 'Spotify Stats';
  username = '';
  requestedUsername = false;

  constructor(private api: ApiConnectionService, public router: Router, public cookie: CookieService, private dataSharingService: DataSharingService) {

  }

  ngOnInit(): void {
  }

  getUserName(): string {
    if (this.username === '') {
      this.updateUsername();
    }
    return this.username;
  }

  updateUsername(): void {
    if (this.cookie.isLoggedIn() && !this.requestedUsername) {
      this.requestedUsername = true;
      this.api.getApi().getMe().then(value => {
        this.username = value.display_name;
      });
    }
  }

  redirect(): void {
    this.router.navigate(['/home']);
  }

  logout(): void {
    TokenService.refreshToken = TokenService.accessToken = '';
    this.cookie.deleteCookie('isLoggedIn');
    this.redirect();
  }


}
