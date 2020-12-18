import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import AlbumObjectSimplified = SpotifyApi.AlbumObjectSimplified;
import AlbumObjectFull = SpotifyApi.AlbumObjectFull;

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

  getImageForPlaylist(): string {
    if (this.album.images.length > 0) {
      return this.album.images[0].url;
    } else {
      return '/assets/placeholder.png';
    }
  }

  onCardClick(): void {
    this.router.navigate(['playlist-track-list', this.album.id]);
  }
}
