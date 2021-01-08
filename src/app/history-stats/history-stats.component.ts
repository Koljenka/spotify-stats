import {Component, OnInit} from '@angular/core';
import {ContextObjectFull, DataSharingService} from '../data-sharing.service';
import {Title} from '@angular/platform-browser';
import {PlayHistoryObjectFull} from '../track-history/track-history.component';
import {HttpClient} from '@angular/common/http';
import {ApiConnectionService} from '../api-connection.service';
import {environment} from '../../environments/environment';
import TrackObjectFull = SpotifyApi.TrackObjectFull;
import AlbumObjectFull = SpotifyApi.AlbumObjectFull;
import ArtistObjectFull = SpotifyApi.ArtistObjectFull;

@Component({
  selector: 'app-history-stats',
  templateUrl: './history-stats.component.html',
  styleUrls: ['./history-stats.component.css']
})
export class HistoryStatsComponent implements OnInit {
  playbackHistory: PlayHistoryObjectFull[];
  didLoadTracks = false;
  topArtists: CountedArtistObject[] = [];
  topAlbums: CountedAlbumObject[] = [];
  topTracks: CountedTrackObject[] = [];
  topContexts: CountedContextObject[] = [];
  topArtistAvgColor: RGBColor;
  topAlbumAvgColor: RGBColor;
  topTrackAvgColor: RGBColor;
  topContextAvgColor: RGBColor;


  constructor(private http: HttpClient, public dataSharing: DataSharingService,
              private titleService: Title, private api: ApiConnectionService) {
  }

  ngOnInit(): void {
    this.titleService.setTitle('History Statistics - SpotifyStats');
    this.dataSharing.playbackHistory.toPromise().then(() => {
      this.playbackHistory = this.dataSharing.getSavedTracks();
      this.didLoadTracks = this.dataSharing.didFinishLoadingHistory;
      this.getTopArtists();
      this.getTopAlbums();
      this.getTopSongs();
      this.getTopContexts();
    });
  }

  getTopArtists(): void {
    const uniqueArtists: { artistId: string, c: number }[] = [];
    this.playbackHistory.map(value => value.track.artists[0]).forEach(artist => {
      if (!uniqueArtists.map(value => value.artistId).includes(artist.id)) {
        uniqueArtists.push({artistId: artist.id, c: 1});
      } else {
        const index = uniqueArtists.map(value => value.artistId).indexOf(artist.id);
        uniqueArtists[index].c++;
      }
    });
    const topFive = uniqueArtists.sort((a, b) => b.c - a.c).slice(0, 5);

    this.api.getApi().getArtists(topFive.map(artist => artist.artistId)).then(artists => {
      // @ts-ignore
      topFive.forEach(entry => {
        const artist = artists.artists.find(ar => ar.id === entry.artistId);
        this.topArtists.push({artist, timesPlayed: entry.c});
      });
      this.topArtists.sort((a, b) => b.timesPlayed - a.timesPlayed);
      this.getTopArtistAvgColor();
    });
  }

  getTopArtistAvgColor(): void {
    this.http.get(environment.APP_SETTINGS.avgColorApiBasePath + '?img=' + this.topArtists[0].artist.images[0].url).subscribe(value => {
      // @ts-ignore
      this.topArtistAvgColor = value;
    });
  }

  getTopAlbums(): void {
    const allAlbums = this.playbackHistory.map(value => value.track.album);
    const uniqueAlbums: { albumId: string, c: number }[] = [];
    allAlbums.forEach(album => {
      if (!uniqueAlbums.map(countedAlbum => countedAlbum.albumId).includes(album.id)) {
        uniqueAlbums.push({albumId: album.id, c: 1});
      } else {
        const index = uniqueAlbums.map(countedAlbum => countedAlbum.albumId).indexOf(album.id);
        uniqueAlbums[index].c++;
      }
    });
    const topFive = uniqueAlbums.sort((a, b) => b.c - a.c).slice(0, 5);
    this.api.getApi().getAlbums(topFive.map(album => album.albumId)).then(albums => {
      // @ts-ignore
      topFive.forEach(entry => {
        const album = albums.albums.find(al => al.id === entry.albumId);
        this.topAlbums.push({album, timesPlayed: entry.c});
      });
      this.topAlbums.sort((a, b) => b.timesPlayed - a.timesPlayed);
      this.getTopAlbumAvgColor();
    });
  }

  getTopAlbumAvgColor(): void {
    this.http.get(environment.APP_SETTINGS.avgColorApiBasePath + '?img=' + this.topAlbums[0].album.images[0].url).subscribe(value => {
      // @ts-ignore
      this.topAlbumAvgColor = value;
    });
  }

  getTopSongs(): void {
    const uniqueTracks: CountedTrackObject[] = [];
    this.playbackHistory.map(value => value.track).forEach(track => {
      if (!uniqueTracks.map(value => value.track.id).includes(track.id)) {
        uniqueTracks.push({track, timesPlayed: 1});
      } else {
        const index = uniqueTracks.map(value => value.track.id).indexOf(track.id);
        uniqueTracks[index].timesPlayed++;
      }
    });
    this.topTracks = uniqueTracks.sort((a, b) => b.timesPlayed - a.timesPlayed).slice(0, 5);
    this.getTopTrackAvgColor();
  }

  getTopTrackAvgColor(): void {
    this.http.get(environment.APP_SETTINGS.avgColorApiBasePath + '?img=' + this.topTracks[0].track.album.images[0].url).subscribe(value => {
      // @ts-ignore
      this.topTrackAvgColor = value;
    });
  }

  getTopContexts(): void {
    const uniqueContexts: CountedContextObject[] = [];
    for (const context of this.playbackHistory.map(value => value.context)) {
      if (context.contextUri == null) {
        continue;
      }
      if (!uniqueContexts.map(value => value.context.contextUri).includes(context.contextUri)) {
        uniqueContexts.push({context, timesPlayed: 1});
      } else {
        const index = uniqueContexts.map(value => value.context.contextUri).indexOf(context.contextUri);
        uniqueContexts[index].timesPlayed++;
      }
    }
    this.topContexts = uniqueContexts.sort((a, b) => b.timesPlayed - a.timesPlayed).slice(0, 5);
    this.getTopContextAvgColor();
  }

  getTopContextAvgColor(): void {
    this.http.get(environment.APP_SETTINGS.avgColorApiBasePath + '?img=' + this.topContexts[0].context.content.images[0].url)
      .subscribe(value => {
        // @ts-ignore
        this.topContextAvgColor = value;
      });
  }

  getContextRouterLink(context: ContextObjectFull): string[] {
    const contextId = context.contextUri.match(/(?<=spotify:\w*:).*/)[0];
    switch (context.contextType) {
      case 'playlist':
        return ['/playlist-track-list', contextId];
      case 'album':
        return ['/album-track-list', contextId];
      case 'artist':
      default:
        return [];
    }

  }

  getTotalsPlays(): number {
    return this.playbackHistory.length;
  }

}

export interface CountedTrackObject {
  timesPlayed: number;
  track: TrackObjectFull;
}

export interface CountedAlbumObject {
  timesPlayed: number;
  album: AlbumObjectFull;
}

export interface CountedArtistObject {
  timesPlayed: number;
  artist: ArtistObjectFull;
}

export interface CountedContextObject {
  timesPlayed: number;
  context: ContextObjectFull;
}


export interface RGBColor {
  r: number;
  g: number;
  b: number;
}
