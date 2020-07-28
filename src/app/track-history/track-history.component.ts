import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {ApiConnectionService} from '../api-connection.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatTableDataSource} from '@angular/material/table';
import SavedTrackObject = SpotifyApi.SavedTrackObject;
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, Sort} from '@angular/material/sort';
import {TokenService} from '../token.service';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-track-history',
  templateUrl: './track-history.component.html',
  styleUrls: ['./track-history.component.css']
})
export class TrackHistoryComponent implements OnInit {

  displayedColumns: string[] = ['title', 'album', 'artist', 'length', 'played_at'];
  savedTracks: SavedTrackObject[] = [];
  dataSource: MatTableDataSource<SavedTrackObject> = new MatTableDataSource<SavedTrackObject>();
  didLoadFirstContent = false;


  constructor(private http: HttpClient, private api: ApiConnectionService, private route: ActivatedRoute, private router: Router) {
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @Input() search: string;

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;

    this.dataSource.sort = this.sort;
    this.getPlaybackHistory();
  }

  getPlaybackHistory(): void {
    this.http.get('https://kolkie.de/spotify-playback-api/', {params: {access_token: TokenService.accessToken}}).subscribe(value => {
      const playbackHistory = value as PlaybackHistory[];
      playbackHistory.reverse();
      this.savedTracks.push(...playbackHistory.map(item => {
        return {added_at: item.played_at * 1000, track: {id: item.trackid}} as unknown as SavedTrackObject;
      }));
      for (let i = 0; i <= Math.ceil(this.savedTracks.length / 50); i++) {
        const trackIds = this.savedTracks.map(value2 => value2.track.id).slice(i * 50, (i + 1) * 50);
        if (trackIds.length > 0) {
          this.getTracks(trackIds);
        }
      }
    });
  }

  getTracks(ids: string[]): void {
    this.api.getApi().getTracks(ids).then(value => {
      value.tracks.forEach(value1 => {
        this.savedTracks.filter(track => track.track.id === value1.id).forEach(track2 => track2.track = value1);
      });
      this.didLoadFirstContent = true;
      this.dataSource.data = this.savedTracks;
      this.dataSource._updateChangeSubscription();
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
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
    if (event.direction === '') {
      event.direction = 'desc';
      event.active = 'added_at';
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
      case 'added_at':
        this.dataSource.data.sort((a, b) => (new Date(a.added_at).getTime() - new Date(b.added_at).getTime()) * factor);
        break;
    }
    this.paginator.firstPage();
  }
}

export interface PlaybackHistory {
  trackid: string;
  played_at: number;
}
