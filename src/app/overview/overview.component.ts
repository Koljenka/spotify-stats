import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {CookieService} from '../cookie.service';
import {ApiConnectionService} from '../api-connection.service';
import options from '../../assets/options.json';
import {StorageService} from '../storage.service';
import {BreakpointObserver} from '@angular/cdk/layout';
import {Option} from '../option.model';
import {StyleManagerService} from '../style-manager.service';
import {environment} from '../../environments/environment';
import {version} from '../../../package.json';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit {
  title = 'Spotify Stats';
  version: string = version;
  username = '';
  requestedUsername = false;
  options: Array<Option> = options;
  selectedTheme: Option;

  constructor(private readonly styleManager: StyleManagerService, public breakpointObserver: BreakpointObserver,
              private api: ApiConnectionService, public router: Router, public cookie: CookieService) {
  }

  ngOnInit(): void {
    let theme = options.find(val => val.value = StorageService.theme);
    if (theme == null) {
      theme = options[0];
    }
    this.selectedTheme = theme;
    this.styleManager.setStyle(environment.APP_SETTINGS.assetsBasePath + StorageService.theme + '.css', theme.headingColor);
  }

  themeChangeHandler(themeToSet: Option): void {
    this.selectedTheme = themeToSet;
    StorageService.theme = themeToSet.value;
    this.styleManager.setStyle(`${environment.APP_SETTINGS.assetsBasePath}${themeToSet.value}.css`, themeToSet.headingColor);
  }

  getUserName(): string {
    return this.api.userId;
  }

  redirect(): void {
    this.router.navigate(['/home']);
  }

  logout(): void {
    StorageService.refreshToken = StorageService.accessToken = '';
    this.cookie.deleteCookie('isLoggedIn');
    this.redirect();
  }


}
