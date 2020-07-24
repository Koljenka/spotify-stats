import {Component, OnInit} from '@angular/core';
import {CookieService} from '../cookie.service';
import {HttpClient} from '@angular/common/http';
import {ApiConnectionService} from '../api-connection.service';
import {Router} from '@angular/router';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  username = '';
  playlists: SpotifyApi.PlaylistObjectSimplified[];


  constructor(private api: ApiConnectionService, public http: HttpClient, public cookie: CookieService, private router: Router) {
  }

  ngOnInit(): void {
    if (this.cookie.isLoggedIn()) {
      this.api.getApi().getUserPlaylists(this.api.userId).then(value => {
        this.playlists = value.items;
      }).catch(this.api.handleError);
    }
  }

  authorize(): void {
    const scopes = 'ugc-image-upload%20user-read-playback-state%20user-modify-playback-state%20user-read-currently-playing%20streaming%20app-remote-control%20user-read-email' +
      '%20user-read-private%20playlist-read-collaborative%20playlist-modify-public%20playlist-read-private%20playlist-modify-private%20user-library-modify%20user-library-read%20' +
      'user-top-read%20user-read-playback-position%20user-read-recently-played%20user-follow-read%20user-follow-modify';
    window.location.href = 'https://accounts.spotify.com/authorize?response_type=code&redirect_uri=http://localhost:4200/callback&client_id=7dc889b5812346ab848cadbe75a9d90f&scope=' + scopes;
  }

  onCardClick(playlist: SpotifyApi.PlaylistObjectSimplified): void {
    this.router.navigate(['playlist-track-list', playlist.id]);
  }
}
