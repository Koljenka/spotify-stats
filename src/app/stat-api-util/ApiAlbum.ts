import AlbumObjectFull = SpotifyApi.AlbumObjectFull;
import {ApiTrack} from './ApiTrack';

// noinspection JSMismatchedCollectionQueryUpdate
export class ApiAlbum {
  private albumType: string;
  private id: string;
  private name: string;
  private label: string;
  private popularity: number;
  private releaseDate: string;
  private totalTracks: number;
  private tracks: ApiTrack[];


  constructor(albumType: string, id: string, name: string, label: string, popularity: number, releaseDate: string, totalTracks: number) {
    this.albumType = albumType;
    this.id = id;
    this.name = name;
    this.label = label;
    this.popularity = popularity;
    this.releaseDate = releaseDate;
    this.totalTracks = totalTracks;
  }


  public static fromSpotifyAlbum(album: AlbumObjectFull): ApiAlbum {

    // @ts-ignore
    const apiAlbum = new ApiAlbum(album.album_type, album.id, album.name, album.label, album.popularity,
      // @ts-ignore
      album.release_date, album.total_tracks);
    apiAlbum.tracks = album.tracks.items.map(t => ApiTrack.fromSpotifyTrack(t));
    return apiAlbum;
  }
}
