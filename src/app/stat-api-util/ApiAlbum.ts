import AlbumObjectFull = SpotifyApi.AlbumObjectFull;
import {ApiAlbum} from '@kn685832/spotify-api';
import AlbumTypeEnum = ApiAlbum.AlbumTypeEnum;
import {fromSpotifyTrack} from './ApiTrack';

// noinspection JSMismatchedCollectionQueryUpdate


export const fromSpotifyAlbum = (album: AlbumObjectFull): ApiAlbum => {

  const apiAlbum: ApiAlbum = {
    albumType: album.album_type as AlbumTypeEnum, id: album.id, name: album.name,
    releaseDate: album.release_date, totalTracks: album.tracks.total
  };
  apiAlbum.tracks = album.tracks.items.map(t => fromSpotifyTrack(t));
  return apiAlbum;
};

