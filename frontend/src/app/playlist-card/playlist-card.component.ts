import {Component, Input, OnInit} from '@angular/core';
import PlaylistBaseObject = SpotifyApi.PlaylistBaseObject;
import {Router} from '@angular/router';
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-playlist-card',
  templateUrl: './playlist-card.component.html',
  styleUrls: ['./playlist-card.component.css']
})
export class PlaylistCardComponent implements OnInit {

  @Input() playlist: PlaylistBaseObject;

  constructor(private router: Router) {
  }

  ngOnInit(): void {
  }

  getImageForPlaylist(): string {
    if (this.playlist.images.length > 0) {
      return this.playlist.images[0].url;
    } else {
      return environment.APP_SETTINGS.assetsBasePath + 'placeholder.png';
    }
  }

  onCardClick(): void {
    this.router.navigate(['playlist-track-list', this.playlist.id]);
  }

}
