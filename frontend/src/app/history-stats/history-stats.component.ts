import { Component, OnInit} from '@angular/core';
import {DataSharingService} from '../data-sharing.service';
import {Title} from '@angular/platform-browser';
import {PlayHistoryObjectFull} from '../track-history/track-history.component';
import {StorageService} from '../storage.service';
import {HttpClient} from '@angular/common/http';
import {ApiConnectionService} from '../api-connection.service';
import TrackObjectFull = SpotifyApi.TrackObjectFull;

@Component({
  selector: 'app-history-stats',
  templateUrl: './history-stats.component.html',
  styleUrls: ['./history-stats.component.css']
})
export class HistoryStatsComponent implements OnInit {
  playbackHistory: PlayHistoryObjectFull[];
  didLoadTracks = false;
  topTrack: CountedTrackObject;


  constructor(private http: HttpClient, public dataSharing: DataSharingService,
              private titleService: Title, private api: ApiConnectionService) {
  }

  ngOnInit(): void {
    this.titleService.setTitle('History Statistics - SpotifyStats');
    if (this.dataSharing.didFinishLoadingHistory) {
      this.playbackHistory = this.dataSharing.getSavedTracks();
      this.didLoadTracks = true;
    } else {
      this.dataSharing.playbackHistory.subscribe(value => {
        this.playbackHistory = value;
        this.didLoadTracks = this.dataSharing.didFinishLoadingHistory;
      });
    }
    this.getTopSongs();
  }

  getTopSongs(): void {
    this.http.post('https://kolkie.de/spotify-playback-api/top', {access_token: StorageService.accessToken}).subscribe(value => {
      this.api.getApi().getTrack(value[0].trackid).then(topTrack => {
        this.topTrack = {track: topTrack, timesPlayed: value[0].c};
      });
    });
  }

  getTotalsPlays(): number {
    return this.playbackHistory.length;
  }

}

export interface CountedTrackObject {
  timesPlayed: number;
  track: TrackObjectFull;
}
