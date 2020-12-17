import {AfterViewInit, ChangeDetectorRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {ApiConnectionService} from '../api-connection.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, Sort} from '@angular/material/sort';
import PlaylistTrackObject = SpotifyApi.PlaylistTrackObject;
import TrackObjectFull = SpotifyApi.TrackObjectFull;
import {MatTableDataSource} from '@angular/material/table';
import UserObjectPublic = SpotifyApi.UserObjectPublic;
import {Location} from '@angular/common';

// noinspection DuplicatedCode
@Component({
  selector: 'app-track-list',
  templateUrl: './playlist-track-list.component.html',
  styleUrls: ['./playlist-track-list.component.css']
})
export class PlaylistTrackListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['title', 'album', 'artist', 'length', 'added_at', 'added_by'];
  tracks: { added_at: string, added_by: UserObjectPublic, track: TrackObjectFull }[] = [];
  dataSource: MatTableDataSource<{ added_at: string, added_by: UserObjectPublic, track: TrackObjectFull }> =
    new MatTableDataSource<{ added_at: string, added_by: UserObjectPublic, track: TrackObjectFull }>();
  playlistId: string;
  json = JSON;
  private s = '';
  private p = '';

  constructor(private api: ApiConnectionService, private route: ActivatedRoute, private router: Router, private location: Location,
              private cdRef: ChangeDetectorRef) {
    this.playlistId = this.route.snapshot.params.playlistId;
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @Input() search = '';

  ngOnInit(): void {
    this.s = this.route.snapshot.queryParams.s;
    this.p = this.route.snapshot.queryParams.p;
    this.getSimpleTracks(0, 50).then(() => {
      this.recreatePageFromQuery(this.p, this.s);
    });
  }

  ngAfterViewInit(): void{
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.paginator.page.subscribe(next => {
      if (next.pageIndex + '' !== this.p) {
        let s = this.s;
        if (s === '') {
          s = null;
        }
        this.updateQuery(next.pageIndex + '', s);
      }
    });
  }


  recreatePageFromQuery(page: string, search: string): void {
    if (search !== null && search !== undefined && search.length > 0) {
      this.search = search;
      this.cdRef.detectChanges();
      this.filterData(search);
    }
    if (page !== null && page !== undefined && page.length > 0) {
      this.paginator.pageIndex = parseInt(page, 10);
      this.dataSource.paginator.page.next({
        pageIndex: parseInt(page, 10),
        pageSize: this.dataSource.paginator.pageSize,
        length: this.dataSource.paginator.length
      });
    }

  }

  updateQuery(page: string, search: string): void {
    const url = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: {s: search, p: page}
    }).toString();
    this.s = search;
    this.p = page;
    this.location.go(url);
  }

  async getSimpleTracks(offset: number, limit: number): Promise<void> {
    await this.api.getApi().getPlaylistTracks(this.playlistId, {offset, limit}).then(value => {
      this.getFullTracks(value.items);
      this.recreatePageFromQuery(this.p, this.s);
      if (value.next != null) {
        const parts = value.next.split(/=|&|\?/);
        return this.getSimpleTracks(parseInt(parts[parts.indexOf('offset') + 1], 10), parseInt(parts[parts.indexOf('limit') + 1], 10));
      } else {
        return Promise.resolve();
      }
    });
  }

  getFullTracks(tracks: Array<PlaylistTrackObject>): void {
    this.api.getApi().getTracks(tracks.map(value => value.track.id)).then(value => {
      const customTracks: { added_at: string, added_by: UserObjectPublic, track: TrackObjectFull }[] = [];
      tracks.forEach(playListTrack => {
        const track = value.tracks.find(tr => tr.id === playListTrack.track.id);
        customTracks.push({added_at: playListTrack.added_at, added_by: playListTrack.added_by, track});
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
    this.filterData(searchString);
  }

  filterData(searchString: string): void {
    if (searchString === '') {
      this.dataSource.data = this.tracks;
      this.updateQuery(this.p, null);
    } else {
      this.updateQuery(this.p, searchString);

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
