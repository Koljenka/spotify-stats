import {Component, OnInit} from '@angular/core';
import {DataSharingService} from '../data-sharing.service';
import SavedTrackObject = SpotifyApi.SavedTrackObject;
import {Title} from '@angular/platform-browser';

@Component({
  selector: 'app-history-stats',
  templateUrl: './history-stats.component.html',
  styleUrls: ['./history-stats.component.css']
})
export class HistoryStatsComponent implements OnInit {
  playbackHistory: SavedTrackObject[];
  didLoadTracks = false;

  constructor(public dataSharing: DataSharingService, private titleService: Title) {
  }

  ngOnInit(): void {
    this.titleService.setTitle('History Statistics - SpotifyStats');
    this.dataSharing.playbackHistory.subscribe(value => {
      this.playbackHistory = value;
      this.didLoadTracks = this.dataSharing.didFinishLoadingHistory;
    });
  }

  getTotalsPlays(): number {
    return this.playbackHistory.length;
  }

}
