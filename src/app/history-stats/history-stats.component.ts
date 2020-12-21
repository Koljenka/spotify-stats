import {AfterViewInit, Component, OnInit} from '@angular/core';
import {DataSharingService} from '../data-sharing.service';
import SavedTrackObject = SpotifyApi.SavedTrackObject;
import {Title} from '@angular/platform-browser';
import {PlayHistoryObjectFull} from '../track-history/track-history.component';

@Component({
  selector: 'app-history-stats',
  templateUrl: './history-stats.component.html',
  styleUrls: ['./history-stats.component.css']
})
export class HistoryStatsComponent implements OnInit {
  playbackHistory: PlayHistoryObjectFull[];
  didLoadTracks = false;

  constructor(public dataSharing: DataSharingService, private titleService: Title) {
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
  }

  getTotalsPlays(): number {
    return this.playbackHistory.length;
  }

}
