/// <reference lib="webworker" />


import SpotifyWebApi from 'spotify-web-api-js';

addEventListener('message', ({data}) => {
  const api: SpotifyWebApi.SpotifyWebApiJs = new SpotifyWebApi();
  api.setAccessToken(data.token);

  const timeframe = data.timeframe;
  const prevTimeframe = data.prevTimeframe;
  const playbackHistory: any[] = data.playHistory.filter(
    v => new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() >= timeframe.start &&
      new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() <= timeframe.end);
  const prevPlaybackHistory: any[] = data.playHistory.filter(
    v => new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() >= prevTimeframe.start &&
      new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() <= prevTimeframe.end);

  getSmallCardStats();
  getTopArtists();
  getTopAlbums();
  getTopSongs();
  getTopContexts();

  function getSmallCardStats(): void {
    const response = [];
    response.push({
      heading: 'Total Tracks',
      icon: 'music_note',
      stat: {value: playbackHistory.length, prevTimeframe, prevValue: prevPlaybackHistory.length}
    });
    const uniqueTracks = [];
    playbackHistory.map(value => value.track.id).forEach(trackId => {
      if (!uniqueTracks.includes(trackId)) {
        uniqueTracks.push(trackId);
      }
    });
    const prevUniqueTracks = [];
    prevPlaybackHistory.map(value => value.track.id).forEach(trackId => {
      if (!prevUniqueTracks.includes(trackId)) {
        prevUniqueTracks.push(trackId);
      }
    });
    response.push({
      heading: 'Unique Tracks',
      icon: 'music_note',
      stat: {value: uniqueTracks.length, prevTimeframe, prevValue: prevUniqueTracks.length}
    });
    const listeningTime = getListeningTime(playbackHistory);
    const prevListeningTime = getListeningTime(prevPlaybackHistory);
    response.push({
      heading: 'Listening Time',
      icon: 'schedule',
      stat: {
        value: toHoursMinutesSeconds(listeningTime / 1000),
        prevTimeframe,
        prevValue: toHoursMinutesSeconds(prevListeningTime / 1000)
      }
    });
    response.push({
      heading: 'Time spent listening',
      icon: 'data_usage',
      stat: {
        value: Math.floor((listeningTime / (timeframe.end - timeframe.start)) * 100) + '%',
        prevTimeframe,
        prevValue: Math.floor((prevListeningTime / (prevTimeframe.end - prevTimeframe.start)) * 100) + '%'
      }
    });

    response.push({
      heading: 'Time spent listening',
      icon: 'sentiment_very_satisfied',
      stat: {
        value: Math.floor((listeningTime / (timeframe.end - timeframe.start)) * 100) + '%',
        prevTimeframe,
        prevValue: Math.floor((prevListeningTime / (prevTimeframe.end - prevTimeframe.start)) * 100) + '%'
      }
    });

    postMessage({type: 'smallCardStats', content: response});


    function getListeningTime(history: any[]): number {
      if (history.length === 0) {
        return 0;
      }
      return Math.round(history.map(v => v.track.duration_ms).reduce((a, b) => a + b));
    }
  }


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

  function toHoursMinutesSeconds(totalSeconds): string {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    let result = `${minutes
      .toString()
      .padStart(1, '0')}:${seconds.toString().padStart(2, '0')}`;
    if (!!hours) {
      result = `${hours.toString()}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    if (!!days) {
      result = `${days} ${days > 1 ? 'days' : 'day'}, ${hours}  ${hours > 1 ? 'hours' : 'hour'}`;
    }
    return result;
  }

});
