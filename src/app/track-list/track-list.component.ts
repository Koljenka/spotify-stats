import {AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {ContextObjectFull, DataSharingService} from '../data-sharing.service';
import {HttpClient} from '@angular/common/http';
import {ApiConnectionService} from '../api-connection.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';
import {Title} from '@angular/platform-browser';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, Sort} from '@angular/material/sort';
import {PlayHistoryObjectFull} from '../track-history/track-history.component';
import PlaylistTrackObject = SpotifyApi.PlaylistTrackObject;
import SavedTrackObject = SpotifyApi.SavedTrackObject;
import {Observable} from 'rxjs';
import {AlbumTrackObject} from '../album-track-list/album-track-list.component';

@Component({
  selector: 'app-track-list',
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.css']
})
export class TrackListComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() displayedColumns: string[];
  @Input() showSpinner = true;
  @Input() initialSort = 'played_at';
  data = new Observable<(PlaylistTrackObject | SavedTrackObject | PlayHistoryObjectFull | AlbumTrackObject)[]>();

  trackList: (PlaylistTrackObject | SavedTrackObject | PlayHistoryObjectFull| AlbumTrackObject)[] = [];
  dataSource: MatTableDataSource<PlaylistTrackObject | SavedTrackObject | PlayHistoryObjectFull | AlbumTrackObject> =
    new MatTableDataSource<PlaylistTrackObject | SavedTrackObject | PlayHistoryObjectFull | AlbumTrackObject>();
  didLoadFirstContent = false;
  private s = '';
  private p = '';


  constructor(private dataSharing: DataSharingService, private http: HttpClient, private api: ApiConnectionService,
              private route: ActivatedRoute, private router: Router, private location: Location,
              private cdRef: ChangeDetectorRef, private titleService: Title) {
  }

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @Input() search = '';

  ngOnInit(): void {
    this.s = this.route.snapshot.queryParams.s;
    this.p = this.route.snapshot.queryParams.p;
  }

  ngAfterViewInit(): void {
    this.data.toPromise().then(value => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.trackList = value;
      this.dataSource.data = this.trackList;
      this.didLoadFirstContent = this.trackList.length > 0;

      setTimeout(() => {
        this.recreatePageFromQuery(this.p, this.s);

      }, 50);
    });
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

  ngOnDestroy(): void {
    this.didLoadFirstContent = false;
  }

  private recreatePageFromQuery(page: string, search: string): void {
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

  private updateQuery(page: string, search: string): void {
    const url = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: {s: search, p: page}
    }).toString();
    this.s = search;
    this.p = page;
    this.location.replaceState(url);
  }

  onRowClick(trackId: string, context: ContextObjectFull): void {
    const commands = ['track', trackId];
    if (context?.contextUri != null) {
      commands.push(context?.contextUri);
    }
    this.router.navigate(commands);
  }

  getArtists(track: SavedTrackObject | PlaylistTrackObject | PlayHistoryObjectFull | AlbumTrackObject): string {
    // @ts-ignore
    return track.track.artists.map(value => value.name).join(', ');
  }

  getFormattedDate(dateString: string, isNumber: boolean): string {
    const date = isNumber ? parseInt(dateString, 10) : dateString;
    return new Date(date).toLocaleDateString('de-DE', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }) + ', ' + new Date(date).toLocaleTimeString();
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
      this.dataSource.data = this.trackList;
      this.updateQuery(this.p, null);
    } else {
      this.updateQuery(this.p, searchString);

      this.dataSource.data = this.trackList.filter(value => {
        return value.track.name.toLowerCase().includes(searchString) ||
          // @ts-ignore
          value.track.album.name.toLowerCase().includes(searchString) ||
          // @ts-ignore
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
        // @ts-ignore
        this.dataSource.data.sort((a, b) => a.track.album.name.toLowerCase().localeCompare(b.track.album.name.toLowerCase()) * factor);
        break;
      case 'artist':
        // @ts-ignore
        this.dataSource.data.sort((a, b) => a.track.artists[0].name.toLowerCase()
          // @ts-ignore
          .localeCompare(b.track.artists[0].name.toLowerCase()) * factor);
        break;
      case 'length':
        this.dataSource.data.sort((a, b) => (a.track.duration_ms > b.track.duration_ms) ? factor : -factor);
        break;
      case 'played_at':
        // @ts-ignore
        this.dataSource.data.sort((a, b) => (parseInt(a.added_at, 10) - parseInt(b.added_at, 10)) * factor);
        break;
    }
    this.paginator.firstPage();
  }

  getContextType(context: ContextObjectFull): string {
    if (context.content == null) {
      return 'Single';
    }
    return context.content.name;
  }

  getContextIcon(context: ContextObjectFull): string {
    switch (context.contextType) {
      case 'album':
        return 'album';
      case 'artist':
        return 'person';
      case 'playlist':
        return 'music_note';
      case null:
      default:
        return 'play_circle_outline';
    }
  }

  public setTitle(title: string): void {
    this.titleService.setTitle(title);
  }


}
