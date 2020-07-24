import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {ApiConnectionService} from '../api-connection.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, Sort} from '@angular/material/sort';
import PlaylistTrackObject = SpotifyApi.PlaylistTrackObject;
import TrackObjectFull = SpotifyApi.TrackObjectFull;
import {MatTableDataSource} from '@angular/material/table';
import UserObjectPublic = SpotifyApi.UserObjectPublic;

@Component({
  selector: 'app-track-list',
  templateUrl: './playlist-track-list.component.html',
  styleUrls: ['./playlist-track-list.component.css']
})
export class PlaylistTrackListComponent implements OnInit {
  displayedColumns: string[] = ['title', 'album', 'artist', 'length', 'added_at', 'added_by'];
  tracks: { added_at: string, added_by: UserObjectPublic, track: TrackObjectFull }[] = [];
  dataSource: MatTableDataSource<{ added_at: string, added_by: UserObjectPublic, track: TrackObjectFull }> =
    new MatTableDataSource<{ added_at: string, added_by: UserObjectPublic, track: TrackObjectFull }>();
  playlistId: string;
  json = JSON;

  constructor(private api: ApiConnectionService, private route: ActivatedRoute, private router: Router) {
    this.playlistId = this.route.snapshot.params.playlistId;
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @Input() search: string;

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.getSimpleTracks(0, 50);
  }

  getSimpleTracks(offset: number, limit: number): void {
    this.api.getApi().getPlaylistTracks(this.playlistId, {offset, limit}).then(value => {
      this.getFullTracks(value.items);
      if (value.next != null) {
        const parts = value.next.split(/=|&|\?/);
        this.getSimpleTracks(parseInt(parts[parts.indexOf('offset') + 1], 10), parseInt(parts[parts.indexOf('limit') + 1], 10));
      }
    });
  }

  getFullTracks(tracks: Array<PlaylistTrackObject>): void {
    this.api.getApi().getTracks(tracks.map(value => value.track.id)).then(value => {
      const customTracks: { added_at: string, added_by: UserObjectPublic, track: TrackObjectFull }[] = [];
      tracks.forEach(playListTrack => {
        value.tracks.forEach(fullTrack => {
          if (playListTrack.track.id === fullTrack.id) {
            customTracks.push({added_at: playListTrack.added_at, added_by: playListTrack.added_by, track: fullTrack});
          }
        });
      });
      this.tracks.push(...customTracks);
      this.dataSource.data = this.tracks;
      this.dataSource._updateChangeSubscription();
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  onRowClick(trackId: string): void {
    this.router.navigate(['track', trackId]);
  }

  getArtists(track: { added_at: string, added_by: UserObjectPublic, track: TrackObjectFull }): string {
    return track.track.artists.map(value => value.name).join(', ');
  }

  getFormattedDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('de-DE', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }) + ', ' + new Date(dateString).toLocaleTimeString();
  }

  getFormattedDuration(duration: number): string {
    return String(new Date(duration).getMinutes()).padStart(2, '0') + ':'
      + String(new Date(duration).getSeconds()).padStart(2, '0');
  }

  onSearchChanged(e: Event): void {
    // @ts-ignore
    const searchString = e.target.value.trim().toLowerCase();
    if (searchString === '') {
      this.dataSource.data = this.tracks;
    } else {
      this.dataSource.data = this.tracks.filter(value => {
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
      case 'added_by':
        this.dataSource.data.sort((a, b) => a.added_by.id.toLowerCase().localeCompare(b.added_by.id.toLowerCase()) * factor);
        break;
    }
    this.paginator.firstPage();
  }
}
