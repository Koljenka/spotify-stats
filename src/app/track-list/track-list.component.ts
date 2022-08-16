import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {ContextObjectFull, PlayHistoryObjectFull} from '../data-sharing.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, Sort} from '@angular/material/sort';
import {BehaviorSubject, Observable} from 'rxjs';
import {AlbumTrackObject} from '../album-track-list/album-track-list.component';
import PlaylistTrackObject = SpotifyApi.PlaylistTrackObject;
import SavedTrackObject = SpotifyApi.SavedTrackObject;
import {StyleManagerService} from '../style-manager.service';
import {Option} from '../option.model';

@Component({
  selector: 'app-track-list',
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.css']
})
export class TrackListComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() displayedColumns: string[];
  @Input() showSpinner = true;
  @Input() scrollContent = true;
  @Input() initialSort = 'played_at';
  @Input() data = new Observable<(PlaylistTrackObject | SavedTrackObject | PlayHistoryObjectFull | AlbumTrackObject)[]>();
  @Input() search = '';

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  trackList: (PlaylistTrackObject | SavedTrackObject | PlayHistoryObjectFull | AlbumTrackObject)[] = [];
  dataSource: MatTableDataSource<PlaylistTrackObject | SavedTrackObject | PlayHistoryObjectFull | AlbumTrackObject> =
    new MatTableDataSource<PlaylistTrackObject | SavedTrackObject | PlayHistoryObjectFull | AlbumTrackObject>();
  didLoadFirstContent = false;
  actualColumns: string[];
  public innerWidth: any;

  private s = '';
  private p = '';
  private theme: Option;
  private backgroundColorSource = new BehaviorSubject<string>('unset');
  private headerBackgroundColorSource = new BehaviorSubject<string>('inherit');
  // eslint-disable-next-line @typescript-eslint/member-ordering
  backgroundColor = this.backgroundColorSource.asObservable();
  // eslint-disable-next-line @typescript-eslint/member-ordering
  headerBackgroundColor = this.headerBackgroundColorSource.asObservable();

  constructor(private route: ActivatedRoute, private router: Router, private location: Location,
              private cdRef: ChangeDetectorRef, private styleService: StyleManagerService) {
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.innerWidth = window.innerWidth;
    this.removeColumnsIfNeeded();
  }

  ngOnInit(): void {
    this.innerWidth = window.innerWidth;
    this.s = this.route.snapshot.queryParams.s;
    this.p = this.route.snapshot.queryParams.p;
    this.styleService.currentTheme.subscribe(value => {
      this.theme = value;
      this.calculateBackgroundColor();
    });
    this.removeColumnsIfNeeded();
  }

  public calculateBackgroundColor(): void {
    this.backgroundColorSource.next(this.theme.backgroundColor + (this.styleService.isDarkStyleActive() ? '80' : '8'));
    this.headerBackgroundColorSource.next(this.theme.backgroundColor);
  }

  ngAfterViewInit(): void {
    this.data.subscribe(value => {
      this.trackList.push(...value);
    });
    this.data.toPromise().then(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.dataSource.data = this.trackList;
      this.didLoadFirstContent = this.trackList.length > 0;

      const observer = new IntersectionObserver(
        ([e]) => {
          if (e.intersectionRatio < 1) {
            e.target.parentElement.parentElement.setAttribute('style', 'background: ' + this.theme.backgroundColor);
          } else {
            e.target.parentElement.parentElement.setAttribute('style', 'background: inherit' );
          }
        },
        {threshold: [1]}
      );

      const header = document.getElementsByClassName('mat-table-sticky')[0];
      observer.observe(header);

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

  onRowClick(trackId: string, context: ContextObjectFull): void {
    const commands = ['track', trackId];
    if (context?.content?.uri != null) {
      commands.push(context?.content?.uri);
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
      if (searchString.includes(';')) {
        const parts = searchString.split(';').slice(0, -1);
        let filteredData = this.trackList;
        for (const item of parts) {
          if (!item.includes('=')) {
            continue;
          }
          const key = item.split('=')[0];
          const val = item.split('=')[1].toLowerCase();
          switch (key) {
            case 'title':
              filteredData = filteredData.filter(entry => entry.track.name.toLowerCase().includes(val));
              break;
            case 'title!':
              filteredData = filteredData.filter(entry => !entry.track.name.toLowerCase().includes(val));
              break;
            case 'album':
              // @ts-ignore
              filteredData = filteredData.filter(entry => entry.track.album?.name.toLowerCase().includes(val));
              break;
            case 'album!':
              // @ts-ignore
              filteredData = filteredData.filter(entry => !entry.track.album?.name.toLowerCase().includes(val));
              break;
            case 'artist':
              // @ts-ignore
              filteredData = filteredData.filter(entry => entry.track?.artists
                ?.filter(artist => artist.name.toLowerCase().includes(val)).length > 0);
              break;
            case 'artist!':
              // @ts-ignore
              filteredData = filteredData.filter(entry => entry.track?.artists
                ?.filter(artist => !artist.name.toLowerCase().includes(val)).length > 0);
              break;
            case 'context':
              // @ts-ignore
              filteredData = filteredData.filter(entry => entry.context?.content?.name.toLowerCase().includes(val));
              break;
            case 'context!':
              // @ts-ignore
              filteredData = filteredData.filter(entry => !entry.context?.content?.name.toLowerCase().includes(val));
          }
        }
        this.dataSource.data = filteredData;
      } else {
        this.dataSource.data = this.trackList.filter(value => value.track.name.toLowerCase().includes(searchString) ||
          // @ts-ignore
          value.track.album.name.toLowerCase().includes(searchString) ||
          // @ts-ignore
          value.track.artists.filter(artist => artist.name.toLowerCase().includes(searchString)).length > 0);
      }
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
        this.dataSource.data.sort((a, b) => (parseInt(a.playedAt, 10) - parseInt(b.playedAt, 10)) * factor);
        break;
      case 'context':
        this.dataSource.data.sort((a, b) => {
          // @ts-ignore
          if (a.context.content == null && b.context.content == null) {
            return 0;
            // @ts-ignore
          } else if (a.context.content == null && b.context.content != null) {
            return 1;
            // @ts-ignore
          } else if (a.context.content != null && b.context.content == null) {
            return -1;
          }
          // @ts-ignore
          return a.context.content?.name.toLowerCase().localeCompare(b.context.content?.name.toLowerCase()) * factor;
        });
    }
    this.paginator.firstPage();
  }

  getContextType(context: ContextObjectFull): string {
    if (context?.content == null) {
      return 'Single';
    }
    return context.content.name;
  }

  getContextIcon(context: ContextObjectFull): string {
    switch (context?.contextType) {
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

  private removeColumnsIfNeeded(): void {
    this.actualColumns = this.displayedColumns.filter(column => {
      if (column === 'length') {
        return this.innerWidth >= 850;
      }
      if (column === 'album') {
        return this.innerWidth >= 800;
      }
      if (column === 'contextUri') {
        return this.innerWidth >= 700;
      }
      if (column === 'artist') {
        return this.innerWidth >= 500;
      }
      return true;
    });
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
}
