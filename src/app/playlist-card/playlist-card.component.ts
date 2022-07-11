import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {environment} from '../../environments/environment';
import {ApiConnectionService} from '../api-connection.service';
import {KeyValue} from '@angular/common';
import PlaylistObjectSimplified = SpotifyApi.PlaylistObjectSimplified;
import PlaylistObjectFull = SpotifyApi.PlaylistObjectFull;
import {DataSharingService} from '../data-sharing.service';
import {Util} from '../util';
import {StorageService} from '../storage.service';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-playlist-card',
  templateUrl: './playlist-card.component.html',
  styleUrls: ['./playlist-card.component.css']
})
export class PlaylistCardComponent implements OnInit {

  @Input() playlist: PlaylistObjectSimplified;
  playlistFull: PlaylistObjectFull;
  stats: KeyValue<string, string>[] = [];

  constructor(private router: Router, private api: ApiConnectionService, private http: HttpClient) {
  }

  ngOnInit(): void {
    this.stats.push({key: 'Tracks', value: `${this.playlist.tracks.total}`});
    this.getPlaylist().then(value => {
      this.playlistFull = value;
      this.createStats();
    });
  }

  getImageForPlaylist(): string {
    if (this.playlist.images.length > 0) {
      return this.playlist.images[0].url;
    } else {
      return environment.APP_SETTINGS.assetsBasePath + 'placeholder.png';
    }
  }

  async onCardClick(): Promise<void> {
    await this.router.navigate(['playlist-track-list', this.playlist.id]);
  }

  private createStats() {
    this.stats.push({key: 'Length', value: this.getPlaylistLength()});
    this.getPlayedCount().then(count => {
      this.stats.push({key: 'Times played', value: count.toLocaleString('de-DE')});
    });
    this.stats.push({key: 'Followers', value: this.playlistFull.followers.total.toLocaleString('de-DE')});
  }

  private getPlaylistLength(): string {
    return Util.toHoursMinutesSeconds(this.playlistFull.tracks.items.map(t => t.track?.duration_ms ?? 0)
      .reduce((a, b) => a + b) / 1000, false);
  }

  private async getPlayedCount(): Promise<number> {
    const response = await this.http.post(`${environment.APP_SETTINGS.playbackApiBasePath}/contextPlayedCount`, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      access_token: StorageService.accessToken,
      contextUri: this.playlist.uri
    }).toPromise();
    return response[0]?.count ?? 0;
  }

  private async getPlaylist(): Promise<PlaylistObjectFull> {
    try {
      return await this.api.getApi().getPlaylist(this.playlist.id) as PlaylistObjectFull;
    } catch (reason) {
      if (reason.status === 429) {
        await DataSharingService.delay(reason.getResponseHeader('Retry-After'));
        return await this.getPlaylist();
      }
    }
  }
}
