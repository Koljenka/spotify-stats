/// <reference lib="webworker" />


import SpotifyWebApi from 'spotify-web-api-js';

addEventListener('message', ({data}) => {
  const api: SpotifyWebApi.SpotifyWebApiJs = new SpotifyWebApi();
  api.setAccessToken(data.token);
  const playbackHistory: any[] = data.playHistory;
  getTopArtists();
  getTopAlbums();
  getTopSongs();
  getTopContexts();


  function getTopArtists(): void {
    const uniqueArtists: { artistId: string, c: number }[] = [];
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
    api.getArtists(topFive.map(artist => artist.artistId), {}, (error, artists) => {
      // @ts-ignore
      topFive.forEach(entry => {
        const artist = artists.artists.find(ar => ar.id === entry.artistId);
        topArtists.push({artist, timesPlayed: entry.c});
      });
      topArtists.sort((a, b) => b.timesPlayed - a.timesPlayed);
      postMessage({type: 'topArtists', content: topArtists});
    });
  }

  function getTopAlbums(): void {
    const allAlbums = playbackHistory.map(value => value.track.album);
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
    const topAlbums = [];
    api.getAlbums(topFive.map(album => album.albumId), {}, (error, albums) => {
      // @ts-ignore
      topFive.forEach(entry => {
        const album = albums.albums.find(al => al.id === entry.albumId);
        topAlbums.push({album, timesPlayed: entry.c});
      });
      topAlbums.sort((a, b) => b.timesPlayed - a.timesPlayed);
      postMessage({type: 'topAlbums', content: topAlbums});
    });
  }

  function getTopSongs(): void {
    const uniqueTracks: any[] = [];
    playbackHistory.map(value => value.track).forEach(track => {
      if (!uniqueTracks.map(value => value.track.id).includes(track.id)) {
        uniqueTracks.push({track, timesPlayed: 1});
      } else {
        const index = uniqueTracks.map(value => value.track.id).indexOf(track.id);
        uniqueTracks[index].timesPlayed++;
      }
    });
    const topTracks = uniqueTracks.sort((a, b) => b.timesPlayed - a.timesPlayed).slice(0, 5);
    postMessage({type: 'topTracks', content: topTracks});
  }

  function getTopContexts(): void {
    const uniqueContexts: any[] = [];
    for (const context of playbackHistory.map(value => value.context)) {
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
    const topContexts = uniqueContexts.sort((a, b) => b.timesPlayed - a.timesPlayed).slice(0, 5);
    postMessage({type: 'topContexts', content: topContexts});
  }

});