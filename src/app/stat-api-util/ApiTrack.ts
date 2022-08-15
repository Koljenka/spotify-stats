import TrackObjectSimplified = SpotifyApi.TrackObjectSimplified;
import {ApiTrack} from '@kn685832/spotify-api';


export const fromSpotifyTrack = (track: TrackObjectSimplified): ApiTrack => ({
  id: track.id,
  name: track.name,
  duration: track.duration_ms,
  artist: track.artists[0].name
});

