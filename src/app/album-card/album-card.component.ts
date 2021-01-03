import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import AlbumObjectSimplified = SpotifyApi.AlbumObjectSimplified;
import AlbumObjectFull = SpotifyApi.AlbumObjectFull;
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-album-card',
  templateUrl: './album-card.component.html',
  styleUrls: ['./album-card.component.css']
})
export class AlbumCardComponent implements OnInit {

  @Input() album: AlbumObjectFull;

  constructor(private router: Router) {
  }

  ngOnInit(): void {
  }

  getImageForAlbum(): string {
    if (this.album.images.length > 0) {
      return this.album.images[0].url;
    } else {
      return environment.APP_SETTINGS.assetsBasePath + 'placeholder.png';
    }
  }

  onCardClick(): void {
    this.router.navigate(['album-track-list', this.album.id]);
  }
}
