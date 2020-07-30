import { Component, OnInit } from '@angular/core';
import {DataSharingService} from '../data-sharing.service';
import SavedTrackObject = SpotifyApi.SavedTrackObject;

@Component({
  selector: 'app-history-stats',
  templateUrl: './history-stats.component.html',
  styleUrls: ['./history-stats.component.css']
})
export class HistoryStatsComponent implements OnInit {
  playbackHistory: SavedTrackObject[];
  tiles: Tile[] = [
    {text: 'One', cols: 1, rows: 1},
    {text: 'Two', cols: 3, rows: 2},
    {text: 'Three', cols: 1, rows: 1},
    {text: 'Four', cols: 1, rows: 1},
    {text: 'Five', cols: 3, rows: 2},
    {text: 'Six', cols: 1, rows: 1},

  ];
  constructor(public dataSharing: DataSharingService) {
  }

  ngOnInit(): void {
    this.dataSharing.playbackHistory.subscribe(value => this.playbackHistory = value);
  }

}

export interface Tile {
  cols: number;
  rows: number;
  text: string;
}
