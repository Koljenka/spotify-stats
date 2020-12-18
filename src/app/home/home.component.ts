import {Component, OnInit} from '@angular/core';
import {CookieService} from '../cookie.service';
import {HttpClient} from '@angular/common/http';
import {ApiConnectionService} from '../api-connection.service';
import {ActivatedRoute, Router} from '@angular/router';
import {environment} from '../../environments/environment';
import PlaylistObjectSimplified = SpotifyApi.PlaylistObjectSimplified;
import {Title} from '@angular/platform-browser';
import {StorageService} from '../storage.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  playlists: SpotifyApi.PlaylistObjectSimplified[];


  constructor(private route: ActivatedRoute, private api: ApiConnectionService, private titleService: Title,
              public http: HttpClient, public cookie: CookieService, private router: Router) {
  }

  ngOnInit(): void {
    this.titleService.setTitle('Home - SpotifyStats');
    if (this.cookie.isLoggedIn()) {
      if (this.api.userId == null) {
        this.getTopSongs();
        this.api.getApi().getMe().then(user => {
          this.api.getApi().getUserPlaylists(user.id, {limit: 50}).then(value => {
            this.playlists = value.items;
          });
        });
      } else {
        this.api.getApi().getUserPlaylists(this.api.userId, {limit: 50}).then(value => {
          this.playlists = value.items;
        });
      }
    }
  }

  getTopSongs(): void {
    this.http.post('https://kolkie.de/spotify-playback-api/top', {access_token: StorageService.accessToken}).subscribe(value => {
    });
  }


  authorize(): void {
    const scopes = 'ugc-image-upload%20user-read-playback-state%20user-modify-playback-state%20user-read-currently-playing%20streaming%20app-remote-control%20user-read-email' +
      '%20user-read-private%20playlist-read-collaborative%20playlist-modify-public%20playlist-read-private%20playlist-modify-private%20user-library-modify%20user-library-read%20' +
      'user-top-read%20user-read-playback-position%20user-read-recently-played%20user-follow-read%20user-follow-modify';
    window.location.href = 'https://accounts.spotify.com/authorize?response_type=code&redirect_uri=' +
      environment.APP_SETTINGS.redirectUri + '&client_id=7dc889b5812346ab848cadbe75a9d90f&scope=' + scopes;
  }
}
