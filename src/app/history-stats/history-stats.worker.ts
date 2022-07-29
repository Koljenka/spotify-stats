/// <reference lib="webworker" />
import SpotifyWebApi from 'spotify-web-api-js';

addEventListener('message', ({data}) => {
  const api: SpotifyWebApi.SpotifyWebApiJs = new SpotifyWebApi();
  api.setAccessToken(data.token);

  const timeframe = data.timeframe;
  data.playHistory = data.playHistory.filter(val => val.audioFeatures != null);
  const playbackHistory: any[] = data.playHistory.filter(
    v => new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() >= timeframe.start &&
      new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() <= timeframe.end);

  const getTopArtists = async (): Promise<void> => {
    const uniqueArtists: { artistId: string; c: number }[] = [];
    playbackHistory.map(value => value.track.artists[0]).forEach(artist => {
      if (!uniqueArtists.map(value => value.artistId).includes(artist.id)) {
        uniqueArtists.push({artistId: artist.id, c: 1});
      } else {
        const index = uniqueArtists.map(value => value.artistId).indexOf(artist.id);
        uniqueArtists[index].c++;
      }
    });
    const topFive = uniqueArtists.sort((a, b) => b.c - a.c).slice(0, 5);
    const topArtists = [];
    await api.getArtists(topFive.map(artist => artist.artistId), {}, (error, artists) => {
      // @ts-ignore
      topFive.forEach(entry => {
        const artist = artists.artists.find(ar => ar.id === entry.artistId);
        topArtists.push({obj: artist, count: entry.c});
      });
      topArtists.sort((a, b) => b.count - a.count);
      postMessage({type: 'topArtists', content: topArtists});
    });
    return Promise.resolve();
  };

  const getTopAlbums = async (): Promise<void> => {
    const allAlbums = playbackHistory.map(value => value.track.album);
    const uniqueAlbums: { albumId: string; c: number }[] = [];
    allAlbums.forEach(album => {
      if (!uniqueAlbums.map(countedAlbum => countedAlbum.albumId).includes(album.id)) {
        uniqueAlbums.push({albumId: album.id, c: 1});
      } else {
        const index = uniqueAlbums.map(countedAlbum => countedAlbum.albumId).indexOf(album.id);
        uniqueAlbums[index].c++;
      }
    });
    const topFive = uniqueAlbums.sort((a, b) => b.c - a.c).slice(0, 5);
    const topAlbums = [];
    await api.getAlbums(topFive.map(album => album.albumId), {}, (error, albums) => {
      // @ts-ignore
      topFive.forEach(entry => {
        const album = albums.albums.find(al => al.id === entry.albumId);
        topAlbums.push({obj: album, count: entry.c});
      });
      topAlbums.sort((a, b) => b.count - a.count);
      postMessage({type: 'topAlbums', content: topAlbums});
    });
    return Promise.resolve();
  };

  const getTopSongs = async (): Promise<void> => {
    const uniqueTracks: any[] = [];
    playbackHistory.map(value => value.track).forEach(track => {
      if (!uniqueTracks.map(value => value.obj.id).includes(track.id)) {
        uniqueTracks.push({obj: track, count: 1});
      } else {
        const index = uniqueTracks.map(value => value.obj.id).indexOf(track.id);
        uniqueTracks[index].count++;
      }
    });
    const topTracks = uniqueTracks.sort((a, b) => b.count - a.count).slice(0, 5);
    postMessage({type: 'topTracks', content: topTracks});
    return Promise.resolve();
  };

  const getTopContexts = async (): Promise<void> => {
    const uniqueContexts: any[] = [];
    for (const context of playbackHistory.map(value => value.context)) {
      if (context.content == null) {
        continue;
      }
      if (!uniqueContexts.map(value => value.obj.content.uri).includes(context.content.uri)) {
        uniqueContexts.push({obj: context, count: 1});
      } else {
        const index = uniqueContexts.map(value => value.obj.content.uri).indexOf(context.content.uri);
        uniqueContexts[index].count++;
      }
    }
    const topContexts = uniqueContexts.sort((a, b) => b.count - a.count).slice(0, 5);
    postMessage({type: 'topContexts', content: topContexts});
    return Promise.resolve();
  };

  return Promise.all([
    getTopSongs(),
    getTopContexts(),
    getTopArtists(),
    getTopAlbums(),
  ]);
});
