import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ApiConnectionService} from '../api-connection.service';
import TrackObjectFull = SpotifyApi.TrackObjectFull;
import AudioFeaturesObject = SpotifyApi.AudioFeaturesObject;
import ArtistObjectSimplified = SpotifyApi.ArtistObjectSimplified;
import {DomSanitizer, Meta, Title} from '@angular/platform-browser';
import {KeyHelper} from '../key-helper';

@Component({
  selector: 'app-track-view',
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.css']
})
export class TrackComponent implements OnInit {
  track: TrackObjectFull;
  trackAudioFeatures: AudioFeaturesObject;
  trackId: string;
  didLoadTrack = false;
  didLoadAudioFeatures = false;

  constructor(private api: ApiConnectionService, private route: ActivatedRoute, public sanitizer: DomSanitizer, private titleService: Title, private meta: Meta) {
    this.trackId = this.route.snapshot.params.trackId;
  }

  public getArtists(artists: ArtistObjectSimplified[]): string {
    return artists.map(a => a.name).join(', ');
  }

  ngOnInit(): void {
    this.api.getApi().getTrack(this.trackId).then(value => {
      this.track = value;
      this.didLoadTrack = true;
      this.titleService.setTitle(this.track.name + ' - SpotifyStats');
      this.meta.updateTag({property: 'og:description', content: this.track.name + ' by ' + this.track.artists[0].name});
      this.meta.updateTag({property: 'og:image', content: this.track.album.images[0].url});
      this.meta.updateTag({property: 'og:title', content: this.track.name + ' - SpotifyStats'});

    });
    this.api.getApi().getAudioFeaturesForTrack(this.trackId).then(value => {
      this.trackAudioFeatures = value;
      this.didLoadAudioFeatures = true;
    });
  }

  public getKey(value: number): string {
    return KeyHelper.getKey(value);
  }

  public getMode(value: number): string {
    return value === 1 ? 'Major' : 'Minor';
  }

  public isSmallScreen(): boolean {
    return window.screen.width < 800;
  }

}
