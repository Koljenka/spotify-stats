/// <reference lib="webworker" />
import SpotifyWebApi from 'spotify-web-api-js';

addEventListener('message', ({data}) => {
  const api: SpotifyWebApi.SpotifyWebApiJs = new SpotifyWebApi();
  api.setAccessToken(data.token);

  const tracks: any[] = data.tracks;

  const getTopAlbums = async (): Promise<void> => {
    const allAlbumIds = tracks.map(track => track.album.id);
    const uniqueAlbums: { albumId: string; c: number }[] = [];
    allAlbumIds.forEach(id => {
      const albumIndex = uniqueAlbums.findIndex(a => a.albumId === id);
      if (albumIndex === -1) {
        uniqueAlbums.push({albumId: id, c: 1});
      } else {
        uniqueAlbums[albumIndex].c++;
      }
    });
    const topAlbums = [];
    const topFive = uniqueAlbums.sort((a, b) => b.c - a.c).slice(0, 5);
    await api.getAlbums(topFive.map(album => album.albumId), {}, (error, value) => {
      const albums = value;
      topFive.forEach(entry => {
        const album = albums.albums.find(al => al.id === entry.albumId);
        topAlbums.push({obj: album, count: entry.c});
      });
      topAlbums.sort((a, b) => b.count - a.count);
      postMessage(topAlbums);
    });
    return Promise.resolve();
  };

  return getTopAlbums();
});
