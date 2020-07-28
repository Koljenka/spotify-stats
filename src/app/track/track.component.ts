import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ApiConnectionService} from '../api-connection.service';
import TrackObjectFull = SpotifyApi.TrackObjectFull;
import AudioFeaturesObject = SpotifyApi.AudioFeaturesObject;

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

  constructor(private api: ApiConnectionService, private route: ActivatedRoute) {
    this.trackId = this.route.snapshot.params.trackId;
  }

  ngOnInit(): void {
    this.api.getApi().getTrack(this.trackId).then(value => {
      this.track = value;
      this.didLoadTrack = true;
    });
    this.api.getApi().getAudioFeaturesForTrack(this.trackId).then(value => this.trackAudioFeatures = value);
  }

}
