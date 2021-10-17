/// <reference lib="webworker" />


import SpotifyWebApi from 'spotify-web-api-js';
import {Util} from '../util';

const add = (a, b) => a + b;

addEventListener('message', ({data}) => {
  const api: SpotifyWebApi.SpotifyWebApiJs = new SpotifyWebApi();
  api.setAccessToken(data.token);

  const timeframe = data.timeframe;
  const prevTimeframe = data.prevTimeframe;
  data.playHistory = data.playHistory.filter(val => val.audioFeatures != null);
  const playbackHistory: any[] = data.playHistory.filter(
    v => new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() >= timeframe.start &&
      new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() <= timeframe.end);
  const prevPlaybackHistory: any[] = data.playHistory.filter(
    v => new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() >= prevTimeframe.start &&
      new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() <= prevTimeframe.end);

  async function getSmallCardStats(): Promise<void> {
    async function getTotalTracks(): Promise<void> {
      postMessage({
        type: 'new_smallCardStats', content:
          {
            id: 0,
            heading: 'Total Tracks',
            icon: 'music_note',
            stat: {value: playbackHistory.length, prevTimeframe, prevValue: 'vs. ' + prevPlaybackHistory.length}
          }
      });
      return Promise.resolve();
    }

    async function getUniqueTracks(): Promise<void> {
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
      postMessage({
          type: 'new_smallCardStats', content:
            {
              id: 1,
              heading: 'Unique Tracks',
              icon: 'music_note',
              stat: {value: uniqueTracks.length, prevTimeframe, prevValue: 'vs. ' + prevUniqueTracks.length}
            }
        }
      );
      return Promise.resolve();
    }

    async function getUniqueArtists(): Promise<void> {
      const uniqueArtists = [];
      playbackHistory.map(value => value.track.artists[0].id).forEach(artistId => {
        if (!uniqueArtists.includes(artistId)) {
          uniqueArtists.push(artistId);
        }
      });
      const prevUniqueArtists = [];
      prevPlaybackHistory.map(value => value.track.artists[0].id).forEach(artistId => {
        if (!prevUniqueArtists.includes(artistId)) {
          prevUniqueArtists.push(artistId);
        }
      });
      postMessage({
        type: 'new_smallCardStats', content:
          {
            id: 2,
            heading: 'Unique Artists',
            icon: 'person',
            stat: {value: uniqueArtists.length, prevTimeframe, prevValue: 'vs. ' + prevUniqueArtists.length}
          }
      });
      return Promise.resolve();
    }

    async function getListeningTimeStat(): Promise<void> {
      const listeningTime = getListeningTime(playbackHistory);
      const prevListeningTime = getListeningTime(prevPlaybackHistory);
      postMessage({
        type: 'new_smallCardStats', content: {
          id: 3,
          heading: 'Listening Time',
          icon: 'schedule',
          stat: {
            value: Util.toHoursMinutesSeconds(listeningTime / 1000),
            prevTimeframe,
            prevValue: 'vs. ' + Util.toHoursMinutesSeconds(prevListeningTime / 1000)
          }
        }
      });
      postMessage({
        type: 'new_smallCardStats', content: {
          id: 4,
          heading: 'Time spent listening',
          icon: 'data_usage',
          stat: {
            value: Math.floor((listeningTime / (timeframe.end - timeframe.start)) * 100) + '%',
            prevTimeframe,
            prevValue: 'vs. ' + Math.floor((prevListeningTime / (prevTimeframe.end - prevTimeframe.start)) * 100) + '%'
          }
        }
      });
      return Promise.resolve();
    }

    async function getMostActiveDayStat(): Promise<void> {
      const mostActiveDay = getMostActiveDay(playbackHistory);
      const prevMostActiveDay = getMostActiveDay(prevPlaybackHistory);
      postMessage({
        type: 'new_smallCardStats', content: {
          id: 5,
          heading: 'Most Active Day',
          icon: 'event',
          stat: {
            value: mostActiveDay.date.toLocaleDateString() + ' (' + mostActiveDay.plays + ')',
            prevTimeframe,
            prevValue: 'vs. ' + prevMostActiveDay.date.toLocaleDateString() + ' (' + prevMostActiveDay.plays + ')'
          }
        }
      });
      return Promise.resolve();
    }

    async function getAverageHappinessStat(): Promise<void> {
      postMessage({
        type: 'new_smallCardStats', content: {
          id: 6,
          heading: 'Average Happiness',
          icon: 'sentiment_very_satisfied',
          stat: {
            value: getAverageHappiness(playbackHistory) + '%',
            prevTimeframe,
            prevValue: 'vs. ' + getAverageHappiness(prevPlaybackHistory) + '%'
          }
        }
      });
      return Promise.resolve();
    }

    async function getAverageEnergyStat(): Promise<void> {
      postMessage({
        type: 'new_smallCardStats', content: {
          id: 7,
          heading: 'Average Energy',
          icon: 'flash_on',
          stat: {
            value: getAverageEnergy(playbackHistory) + '%',
            prevTimeframe,
            prevValue: 'vs. ' + getAverageEnergy(prevPlaybackHistory) + '%'
          }
        }
      });
      return Promise.resolve();
    }

    async function getAverageDanceabilityStat(): Promise<void> {
      postMessage({
        type: 'new_smallCardStats', content: {
          id: 8,
          heading: 'Average Danceability',
          icon: 'emoji_people',
          stat: {
            value: getAverageDanceability(playbackHistory) + '%',
            prevTimeframe,
            prevValue: 'vs. ' + getAverageDanceability(prevPlaybackHistory) + '%'
          }
        }
      });
      return Promise.resolve();
    }

    function getListeningTime(history: any[]): number {
      if (history.length === 0) {
        return 0;
      }
      return Math.round(history.map(v => v.track.duration_ms).reduce(add));
    }

    function getMostActiveDay(history: any[]): { date: Date; plays: number } {
      if (history.length <= 0) {
        return {date: new Date(0), plays: NaN};
      }
      const days: { date: Date; plays: number }[] = [];
      for (const item of history) {
        if (days.map(v => v.date.toDateString()).includes(new Date(parseInt(item.added_at, 10)).toDateString())) {
          continue;
        }
        const tempList = history.filter(v =>
          new Date(parseInt(item.added_at, 10)).toDateString() === new Date(parseInt(v.added_at, 10)).toDateString());
        days.push({date: new Date(new Date(parseInt(item.added_at, 10)).toDateString()), plays: tempList.length});
      }
      let top = days[0];
      days.forEach(v => {
        if (v.plays > top.plays) {
          top = v;
        }
      });
      return top;
    }

    return Promise.all([
      getTotalTracks(),
      getUniqueTracks(),
      getUniqueArtists(),
      getListeningTimeStat(),
      getMostActiveDayStat(),
      getAverageHappinessStat(),
      getAverageEnergyStat(),
      getAverageDanceabilityStat()
    ]).then(() => Promise.resolve());
  }

  async function getGraphs(): Promise<void> {
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

    function getAverageFeaturesOverTime(): any[] {
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
    }

    function getAverageFeaturesOverMonth(): any[] {
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
    }

    return Promise.resolve();
  }

  async function getTopArtists(): Promise<void> {
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
  }

  async function getTopAlbums(): Promise<void> {
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
  }

  async function getTopSongs(): Promise<void> {
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
  }

  async function getTopContexts(): Promise<void> {
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
  }

  function getAverageHappiness(history: any[]): number {
    if (history.length === 0) {
      return NaN;
    }
    return Math.round(history.map(v => v.audioFeatures.valence).reduce(add) * 100 / history.length);
  }

  function getAverageEnergy(history: any[]): number {
    if (history.length === 0) {
      return NaN;
    }
    return Math.round(history.map(v => v.audioFeatures.energy).reduce(add) * 100 / history.length);
  }

  function getAverageDanceability(history: any[]): number {
    if (history.length === 0) {
      return NaN;
    }
    return Math.round(history.map(v => v.audioFeatures.danceability).reduce(add) * 100 / history.length);
  }

  return Promise.all([
    getTopSongs(),
    getTopContexts(),
    getTopArtists(),
    getTopAlbums(),
    getGraphs(),
    getSmallCardStats()
  ]);
});
