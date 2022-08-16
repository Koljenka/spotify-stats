/// <reference lib="webworker" />
import SpotifyWebApi from 'spotify-web-api-js';
import {KeyHelper} from '../../key-helper';

const add = (a, b) => a + b;

addEventListener('message', ({data}) => {
  const api: SpotifyWebApi.SpotifyWebApiJs = new SpotifyWebApi();
  api.setAccessToken(data.token);

  const playbackHistory: any[] = data.playHistory.filter(val => val.audioFeatures != null);
  const toDate = (playedAt: number) => new Date(playedAt * 1000);

  const getAverageFeaturesOverTime = (): any[] => {
    const result = [];
    for (const item of playbackHistory) {
      if (result.map(v => v.date).includes(toDate(item.playedAt).toDateString())) {
        continue;
      }

      const tempList = playbackHistory.filter(v => toDate(item.playedAt).toDateString() === toDate(v.playedAt).toDateString());
      result.push({
        date: toDate(item.playedAt).toDateString(),
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
        month: toDate(item.playedAt).getMonth(),
        year: toDate(item.playedAt).getFullYear()
      }))) {
        continue;
      }
      const tempList = playbackHistory.filter(v =>
        toDate(item.playedAt).getMonth() === toDate(v.playedAt).getMonth() &&
        toDate(item.playedAt).getFullYear() === toDate(v.playedAt).getFullYear()
      );
      result.push({
        date: {
          month: toDate(item.playedAt).getMonth(),
          year: toDate(item.playedAt).getFullYear()
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

  const getAudioFeaturesOverTimeGraph = () => {
    const xAxisData = [];
    const valence = [];
    const energy = [];
    const danceability = [];
    const dataSet = (data.timeframe.end - data.timeframe.start <= 2678400) ?
      getAverageFeaturesOverTime() : getAverageFeaturesOverMonth();
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
    postMessage({type: 'audioFeaturesOverTime', content: options});

  };

  const getKeyDistribution = () => {
    const keyDist: { value: number; name: string }[] = [];
    for (let i = 0; i < 12; i++) {
      keyDist.push({value: 0, name: KeyHelper.getKey(i)});
    }

    playbackHistory.forEach(historyObject => {
      keyDist[historyObject.audioFeatures.key].value++;
    });

    postMessage({type: 'keyDistribution', content: keyDist});

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

  getAudioFeaturesOverTimeGraph();
  getKeyDistribution();
});
