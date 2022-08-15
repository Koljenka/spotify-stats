import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ContextObjectFull, DataSharingService} from '../data-sharing.service';
import SavedTrackObject = SpotifyApi.SavedTrackObject;
import AudioFeaturesObject = SpotifyApi.AudioFeaturesObject;
import {Title} from '@angular/platform-browser';
import {BehaviorSubject} from 'rxjs';

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
    this.dataSharing.playbackHistory
      .then(history => this.dataSharing.getHistoryObjectFull(history, true))
      .then(val => {
        this.playbackHistorySource.next(val);
        this.didLoadTracks = true;
        this.playbackHistorySource.complete();
      });
  }
}
export interface PlayHistoryObjectFull extends SavedTrackObject {
  context: ContextObjectFull;
  audioFeatures: AudioFeaturesObject;
}
