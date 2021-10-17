import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ContextObjectFull, DataSharingService} from '../data-sharing.service';
import {BehaviorSubject} from 'rxjs';
import SavedTrackObject = SpotifyApi.SavedTrackObject;
import AudioFeaturesObject = SpotifyApi.AudioFeaturesObject;
import {Title} from '@angular/platform-browser';

@Component({
  selector: 'app-track-history',
  templateUrl: './track-history.component.html',
  styleUrls: ['./track-history.component.css']
})
export class TrackHistoryComponent implements OnInit, AfterViewInit {
  playbackHistorySource = new BehaviorSubject(new Array<PlayHistoryObjectFull>());
  didLoadTracks = false;

  constructor(public dataSharing: DataSharingService, private titleService: Title) {
  }

  ngOnInit(): void {
    this.titleService.setTitle('Playback History - SpotifyStats');
  }

  ngAfterViewInit(): void {
    this.dataSharing.playbackHistory.toPromise().then(() => {
      this.playbackHistorySource.next(this.dataSharing.getSavedTracks());
      this.didLoadTracks = true;
      this.playbackHistorySource.complete();
    });
  }
}

export interface PlaybackHistory {
  trackid: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  played_at: number;
  contexturi: string;
}

export interface PlayHistoryObjectFull extends SavedTrackObject {
  context: ContextObjectFull;
  audioFeatures: AudioFeaturesObject;
}
