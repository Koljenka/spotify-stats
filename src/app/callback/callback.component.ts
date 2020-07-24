import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {CookieService} from '../cookie.service';
import {TokenService} from '../token.service';
import {ApiConnectionService} from '../api-connection.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.css']
})
export class CallbackComponent implements OnInit {
  code: string;
  private options = {headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')};

  constructor(private api: ApiConnectionService, private activatedRoute: ActivatedRoute, public http: HttpClient, public router: Router, public cookie: CookieService) {
    this.activatedRoute.queryParams.subscribe(params => {
      this.code = params.code;
    });
  }

  authorize(): void {
    this.http.post('https://accounts.spotify.com/api/token?client_id=7dc889b5812346ab848cadbe75a9d90f&client_secret=945d302ea7f24ca78caa5b55655cb862&grant_type=authorization_code&code=' +
      this.code + '&redirect_uri=http://localhost:4200/callback', '', this.options).toPromise()
      .then((response) => this.onFulFilled(response))
      .catch(console.log);
  }

  onFulFilled(response): void {
    TokenService.accessToken = response.access_token;
    TokenService.refreshToken = response.refresh_token;
    this.cookie.setCookie('isLoggedIn', 'true', 1 / 12, '');
    this.api.getApi();
    this.router.navigate(['/home']);
  }


  ngOnInit(): void {
    this.authorize();
  }

}
