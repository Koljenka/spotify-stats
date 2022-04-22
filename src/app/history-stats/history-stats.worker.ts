/// <reference lib="webworker" />


import SpotifyWebApi from 'spotify-web-api-js';

const add = (a, b) => a + b;

addEventListener('message', ({data}) => {
  const api: SpotifyWebApi.SpotifyWebApiJs = new SpotifyWebApi();
  api.setAccessToken(data.token);

  const timeframe = data.timeframe;
  data.playHistory = data.playHistory.filter(val => val.audioFeatures != null);
  const playbackHistory: any[] = data.playHistory.filter(
    v => new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() >= timeframe.start &&
      new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() <= timeframe.end);

  const getAverageFeaturesOverTime = (): any[] => {
    const result = [];
    for (const item of playbackHistory) {
      if (result.map(v => v.date).includes(new Date(parseInt(item.added_at, 10)).toDateString())) {
        continue;
      }
      const tempList = playbackHistory.filter(v => new Date(parseInt(item.added_at, 10)).toDateString() ===
        new Date(parseInt(v.added_at, 10)).toDateString());
      result.push({
        date: new Date(parseInt(item.added_at, 10)).toDateString(),
        valence: getAverageHappiness(tempList),
        energy: getAverageEnergy(tempList),
        danceability: getAverageDanceability(tempList)
      });
    }
    result.sort((a, b) => new Date(a.date).valueOf() - new Date(b.date).valueOf());
    return result.map(v => ({
      date: new Date(v.date).toLocaleDateString(),
      valence: v.valence,
      energy: v.energy,
      danceability: v.danceability
    }));
  };

  const getAverageFeaturesOverMonth = (): any[] => {
    const result = [];
    for (const item of playbackHistory) {
      if (result.map(v => JSON.stringify(v.date)).includes(JSON.stringify({
        month: new Date(parseInt(item.added_at, 10)).getMonth(),
        year: new Date(parseInt(item.added_at, 10)).getFullYear()
      }))) {
        continue;
      }
      const tempList = playbackHistory.filter(v =>
        new Date(parseInt(item.added_at, 10)).getMonth() === new Date(parseInt(v.added_at, 10)).getMonth() &&
        new Date(parseInt(item.added_at, 10)).getFullYear() === new Date(parseInt(v.added_at, 10)).getFullYear()
      );
      result.push({
        date: {
          month: new Date(parseInt(item.added_at, 10)).getMonth(),
          year: new Date(parseInt(item.added_at, 10)).getFullYear()
        },
        valence: getAverageHappiness(tempList),
        energy: getAverageEnergy(tempList),
        danceability: getAverageDanceability(tempList)
      });
    }
    result.sort((a, b) => {
      if (a.date.year - b.date.year !== 0) {
        return a.date.year - b.date.year;
      }
      return a.date.month - b.date.month;
    });
    return result.map(v => ({
      date: (v.date.month + 1) + '.' + v.date.year,
      valence: v.valence,
      energy: v.energy,
      danceability: v.danceability
    }));
  };

  const getGraphs = async (): Promise<void> => {
    const xAxisData = [];
    const valence = [];
    const energy = [];
    const danceability = [];
    const dataSet = (timeframe.end - timeframe.start <= 2678400000) ? getAverageFeaturesOverTime() : getAverageFeaturesOverMonth();
    dataSet.forEach(item => {
      xAxisData.push(item.date);
      valence.push(item.valence);
      energy.push(item.energy);
      danceability.push(item.danceability);
    });

    const options = {
      backgroundColor: '#00000000',
      title: {
        text: 'Audio Features over time'
      },
      legend: {
        top: 25,
        data: ['Happiness', 'Energy', 'Danceability'],
        align: 'left',
      },
      tooltip: {
        trigger: 'axis'
      },
      toolbox: {
        show: true,
        feature: {
          saveAsImage: {title: 'Save as Image'}
        }
      },
      xAxis: {
        data: xAxisData,
        silent: false,
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: 'Happiness',
          type: 'line',
          data: valence,
          lineStyle: {
            width: 4
          }
        },
        {
          name: 'Energy',
          type: 'line',
          data: energy,
          lineStyle: {
            width: 4
          }
        },
        {
          name: 'Danceability',
          type: 'line',
          data: danceability,
          lineStyle: {
            width: 4
          }
        },
      ],
      animationEasing: 'elasticOut',
    };
    postMessage({type: 'graph', content: options});

    return Promise.resolve();
  };

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
        topArtists.push({artist, timesPlayed: entry.c});
      });
      topArtists.sort((a, b) => b.timesPlayed - a.timesPlayed);
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
        topAlbums.push({album, timesPlayed: entry.c});
      });
      topAlbums.sort((a, b) => b.timesPlayed - a.timesPlayed);
      postMessage({type: 'topAlbums', content: topAlbums});
    });
    return Promise.resolve();
  };

  const getTopSongs = async (): Promise<void> => {
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
    return Promise.resolve();
  };

  const getTopContexts = async (): Promise<void> => {
    const uniqueContexts: any[] = [];
    for (const context of playbackHistory.map(value => value.context)) {
      if (context.content == null) {
        continue;
      }
      if (!uniqueContexts.map(value => value.context.content.uri).includes(context.content.uri)) {
        uniqueContexts.push({context, timesPlayed: 1});
      } else {
        const index = uniqueContexts.map(value => value.context.content.uri).indexOf(context.content.uri);
        uniqueContexts[index].timesPlayed++;
      }
    }
    const topContexts = uniqueContexts.sort((a, b) => b.timesPlayed - a.timesPlayed).slice(0, 5);
    postMessage({type: 'topContexts', content: topContexts});
    return Promise.resolve();
  };

  const getAverageHappiness = (history: any[]): number => {
    if (history.length === 0) {
      return NaN;
    }
    return Math.round(history.map(v => v.audioFeatures.valence).reduce(add) * 100 / history.length);
  };

  const getAverageEnergy = (history: any[]): number => {
    if (history.length === 0) {
      return NaN;
    }
    return Math.round(history.map(v => v.audioFeatures.energy).reduce(add) * 100 / history.length);
  };

  const getAverageDanceability = (history: any[]): number => {
    if (history.length === 0) {
      return NaN;
    }
    return Math.round(history.map(v => v.audioFeatures.danceability).reduce(add) * 100 / history.length);
  };

  return Promise.all([
    getTopSongs(),
    getTopContexts(),
    getTopArtists(),
    getTopAlbums(),
    getGraphs(),
  ]);
});
