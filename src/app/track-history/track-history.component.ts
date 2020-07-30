import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ApiConnectionService} from '../api-connection.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatTableDataSource} from '@angular/material/table';
import SavedTrackObject = SpotifyApi.SavedTrackObject;
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, Sort} from '@angular/material/sort';
import {HttpClient} from '@angular/common/http';
import {DataSharingService} from '../data-sharing.service';

@Component({
  selector: 'app-track-history',
  templateUrl: './track-history.component.html',
  styleUrls: ['./track-history.component.css']
})
export class TrackHistoryComponent implements OnInit, OnDestroy {

  displayedColumns: string[] = ['title', 'album', 'artist', 'length', 'played_at'];
  savedTracks: SavedTrackObject[] = [];
  dataSource: MatTableDataSource<SavedTrackObject> = new MatTableDataSource<SavedTrackObject>();
  didLoadFirstContent = false;


  constructor(private dataSharing: DataSharingService, private http: HttpClient, private api: ApiConnectionService,
              private route: ActivatedRoute, private router: Router) {
  }

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @Input() search: string;

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSharing.playbackHistory.subscribe(history => {
      this.savedTracks = history;
      this.dataSource.data = this.savedTracks;

      this.didLoadFirstContent = this.savedTracks.length > 0;
    });
  }

  ngOnDestroy(): void {
    this.didLoadFirstContent = false;
  }

  onRowClick(trackId: string): void {
    this.router.navigate(['track', trackId]);
  }

  getArtists(track: SavedTrackObject): string {
    return track.track.artists.map(value => value.name).join(', ');
  }

  getFormattedDate(dateString: string): string {
    return new Date(parseInt(dateString, 10)).toLocaleDateString('de-DE', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }) + ', ' + new Date(parseInt(dateString, 10)).toLocaleTimeString();
  }

  getFormattedDuration(duration: number): string {
    return String(new Date(duration).getMinutes()).padStart(2, '0') + ':'
      + String(new Date(duration).getSeconds()).padStart(2, '0');
  }

  onSearchChanged(e: Event): void {
    // @ts-ignore
    const searchString = e.target.value.trim().toLowerCase();
    if (searchString === '') {
      this.dataSource.data = this.savedTracks;
    } else {
      this.dataSource.data = this.savedTracks.filter(value => {
        return value.track.name.toLowerCase().includes(searchString) ||
          value.track.album.name.toLowerCase().includes(searchString) ||
          value.track.artists.filter(artist => artist.name.toLowerCase().includes(searchString)).length > 0;
      });
    }
  }

  sortData(event: Sort): void {
    if (this.paginator === undefined) {
      return;
    }
    if (event.direction === '') {
      event.direction = 'desc';
      event.active = 'played_at';
    }
    const factor = event.direction === 'asc' ? 1 : -1;
    switch (event.active) {
      case 'title':
        this.dataSource.data.sort((a, b) => a.track.name.toLowerCase().localeCompare(b.track.name.toLowerCase()) * factor);
        break;
      case 'album':
        this.dataSource.data.sort((a, b) => a.track.album.name.toLowerCase().localeCompare(b.track.album.name.toLowerCase()) * factor);
        break;
      case 'artist':
        this.dataSource.data.sort((a, b) => a.track.artists[0].name.toLowerCase()
          .localeCompare(b.track.artists[0].name.toLowerCase()) * factor);
        break;
      case 'length':
        this.dataSource.data.sort((a, b) => (a.track.duration_ms > b.track.duration_ms) ? factor : -factor);
        break;
      case 'played_at':
        this.dataSource.data.sort((a, b) => (parseInt(a.added_at, 10) - parseInt(b.added_at, 10)) * factor);
        break;
    }
    this.paginator.firstPage();
  }
}

export interface PlaybackHistory {
  trackid: string;
  played_at: number;
}
