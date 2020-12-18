import {Component, Input, OnInit, ViewChild, AfterViewInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import SavedTrackObject = SpotifyApi.SavedTrackObject;
import {ChangeDetectorRef} from '@angular/core';
import {ApiConnectionService} from '../api-connection.service';
import {Location} from '@angular/common';
import {MatSort, Sort} from '@angular/material/sort';
import {Title} from '@angular/platform-browser';

@Component({
  selector: 'app-track-list',
  templateUrl: './saved-track-list.component.html',
  styleUrls: ['./saved-track-list.component.css']
})
export class SavedTrackListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['title', 'album', 'artist', 'length', 'added_at'];
  savedTracks: SavedTrackObject[] = [];
  dataSource: MatTableDataSource<SavedTrackObject> = new MatTableDataSource<SavedTrackObject>();
  private s = '';
  private p = '';


  constructor(private api: ApiConnectionService, private route: ActivatedRoute, private router: Router, private location: Location,
              private cdRef: ChangeDetectorRef, private titleService: Title) {
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @Input() search = '';

  ngOnInit(): void {
    this.titleService.setTitle('My Library - SpotifyStats');
    this.s = this.route.snapshot.queryParams.s;
    this.p = this.route.snapshot.queryParams.p;
    this.getSavedTracks(0, 50).then(() => {
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
    this.location.replaceState(url);
  }

  async getSavedTracks(offset: number, limit: number): Promise<void> {
    await this.api.getApi().getMySavedTracks({offset, limit}).then(value => {
      this.savedTracks.push(...value.items);
      this.dataSource.data = this.savedTracks;
      this.dataSource._updateChangeSubscription();
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.recreatePageFromQuery(this.p, this.s);
      if (value.next != null) {
        const parts = value.next.split(/=|&|\?/);
        return this.getSavedTracks(parseInt(parts[parts.indexOf('offset') + 1], 10), parseInt(parts[parts.indexOf('limit') + 1], 10));
      } else {
        return Promise.resolve();
      }
    });
  }

  onRowClick(trackId: string): void {
    this.router.navigate(['track', trackId]);
  }

  getArtists(track: SavedTrackObject): string {
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
      this.dataSource.data = this.savedTracks;
      this.updateQuery(this.p, null);
    } else {
      this.updateQuery(this.p, searchString);

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

